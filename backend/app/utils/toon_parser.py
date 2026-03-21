"""
TOON (Token-Oriented Object Notation) Parser and Serializer
Lightweight implementation for converting between Python dicts and TOON format
"""

from typing import Dict, List, Any, Union
import re
import json


def parse_toon_to_dict(toon_string: str) -> Dict[str, Any]:
    """
    Parse TOON format string into Python dictionary
    
    Args:
        toon_string: TOON formatted string
        
    Returns:
        Dictionary representation of TOON data
    """
    result = {}
    lines = toon_string.strip().split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i].rstrip()
        
        # Skip empty lines
        if not line.strip():
            i += 1
            continue
            
        # Check if this is a tabular array declaration (e.g., "expertise[5]{skill,level}:")
        # AI may use [N] as either a row COUNT or an INDEX — handle both cases
        tabular_match = re.match(r'^(\w+)\[(\d+)\]\{([^}]+)\}:\s*$', line)
        if tabular_match:
            field_name = tabular_match.group(1)
            fields = [f.strip() for f in tabular_match.group(3).split(',')]
            
            # Read data rows until we hit a non-data line (empty line, new section header,
            # or unindented non-data line). Ignore the [N] count — AI uses it inconsistently.
            rows = []
            i += 1
            while i < len(lines):
                row_line = lines[i].strip()
                if not row_line:
                    break
                
                # Stop if we hit a new tabular declaration for a DIFFERENT field
                next_tab = re.match(r'^(\w+)\[\d+\]\{[^}]+\}:\s*$', row_line)
                if next_tab and next_tab.group(1) != field_name:
                    break
                
                # If it's another declaration for the SAME field (indexed entries), skip header
                if next_tab and next_tab.group(1) == field_name:
                    i += 1
                    continue
                
                # Stop if we hit an unindented key-value or section header
                if re.match(r'^[A-Za-z_]\w*:', row_line) and not lines[i].startswith(' '):
                    break
                    
                # Parse the data row — handle excess commas by merging into last field
                values = _split_csv_line(row_line)
                if len(values) == len(fields):
                    row_dict = {f: _parse_value(v) for f, v in zip(fields, values)}
                    rows.append(row_dict)
                elif len(values) > len(fields) and len(fields) >= 2:
                    # Merge excess values into the last field (for descriptions with commas)
                    merged = values[:len(fields) - 1]
                    merged.append(','.join(values[len(fields) - 1:]))
                    row_dict = {f: _parse_value(v) for f, v in zip(fields, merged)}
                    rows.append(row_dict)
                i += 1
            
            # Append to existing list if field was already seen (indexed entries)
            if field_name in result and isinstance(result[field_name], list):
                result[field_name].extend(rows)
            else:
                result[field_name] = rows
            continue
        
        # Check if this is a simple indexed array (e.g., "content_goals[0]: value")
        # AI outputs content_goals[0], content_goals[1], etc. as individual entries
        simple_array_match = re.match(r'^(\w+)\[(\d+)\]:\s*(.+)$', line)
        if simple_array_match:
            field_name = simple_array_match.group(1)
            values_str = simple_array_match.group(3)
            # Check if this is a multi-value array or single indexed entry
            values = [_parse_value(v.strip()) for v in _split_csv_line(values_str)]
            # Append to existing list if field already exists (indexed entries)
            if field_name in result and isinstance(result[field_name], list):
                result[field_name].extend(values)
            else:
                result[field_name] = values
            i += 1
            continue
        
        # Check if this is a simple key-value pair (e.g., "name: John Doe")
        kv_match = re.match(r'^(\w+):\s*(.+)$', line)
        if kv_match:
            key = kv_match.group(1)
            value = kv_match.group(2).strip()
            result[key] = _parse_value(value)
            i += 1
            continue
        
        # Check if this is a nested object start (key with colon but no value)
        nested_match = re.match(r'^(\w+):\s*$', line)
        if nested_match:
            key = nested_match.group(1)
            # Parse nested lines (indented)
            nested_lines = []
            i += 1
            while i < len(lines) and lines[i].startswith('  '):
                nested_lines.append(lines[i][2:])  # Remove 2-space indent
                i += 1
            if nested_lines:
                result[key] = parse_toon_to_dict('\n'.join(nested_lines))
            continue
        
        i += 1
    
    # Post-processing: consolidate numbered keys (e.g., expertise1, expertise2 → expertise list)
    result = _consolidate_numbered_keys(result)
    
    return result


def dict_to_toon(data: Dict[str, Any], indent: int = 0) -> str:
    """
    Convert Python dictionary to TOON format string
    
    Args:
        data: Dictionary to convert
        indent: Current indentation level (for nested objects)
        
    Returns:
        TOON formatted string
    """
    lines = []
    indent_str = '  ' * indent
    
    for key, value in data.items():
        if isinstance(value, dict):
            # Nested object
            lines.append(f"{indent_str}{key}:")
            lines.append(dict_to_toon(value, indent + 1))
        elif isinstance(value, list) and len(value) > 0:
            if isinstance(value[0], dict):
                # Tabular array
                fields = list(value[0].keys())
                field_str = ','.join(fields)
                lines.append(f"{indent_str}{key}[{len(value)}]{{{field_str}}}:")
                
                for item in value:
                    row_values = [_format_value(item.get(f, '')) for f in fields]
                    lines.append(f"{indent_str}  {','.join(row_values)}")
            else:
                # Simple array
                formatted_values = [_format_value(v) for v in value]
                lines.append(f"{indent_str}{key}[{len(value)}]: {','.join(formatted_values)}")
        else:
            # Simple key-value
            lines.append(f"{indent_str}{key}: {_format_value(value)}")
    
    return '\n'.join(lines)


def validate_toon_structure(toon_string: str) -> bool:
    """
    Validate TOON syntax
    
    Args:
        toon_string: TOON formatted string
        
    Returns:
        True if valid, False otherwise
    """
    try:
        parsed = parse_toon_to_dict(toon_string)
        # If parsing succeeds and result is not empty, it's valid
        return isinstance(parsed, dict)
    except Exception:
        return False


# Known field schemas for structured data in curly-brace format {val1,val2,...}
# Maps base key name → list of field names for parsing into dicts
_KNOWN_FIELD_SCHEMAS: Dict[str, List[str]] = {
    'expertise': ['skill', 'level', 'years', 'ai_generated'],
    'target_audience': ['persona', 'description'],
    'content_mix': ['category', 'percentage'],
}


def _consolidate_numbered_keys(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Consolidate numbered keys into lists.
    
    AI models often output numbered keys like expertise1, expertise2, etc.
    instead of the expected tabular array format. This function detects
    these patterns and merges them into proper lists.
    
    Also parses curly-brace wrapped values like {Salesforce,Expert,6,false}
    into structured dicts using known field schemas.
    """
    # Find all numbered key groups (e.g., expertise1, expertise2 → base "expertise")
    numbered_groups: Dict[str, Dict[int, Any]] = {}
    non_numbered_keys: Dict[str, Any] = {}
    
    for key, value in data.items():
        # Match keys ending with a number (e.g., expertise1, target_audience3)
        match = re.match(r'^(.+?)(\d+)$', key)
        if match:
            base_name = match.group(1)
            index = int(match.group(2))
            if base_name not in numbered_groups:
                numbered_groups[base_name] = {}
            numbered_groups[base_name][index] = value
        else:
            non_numbered_keys[key] = value
    
    # Start with non-numbered keys
    result = dict(non_numbered_keys)
    
    # Consolidate each numbered group into a list
    for base_name, indexed_values in numbered_groups.items():
        # Skip if the base key already exists as a proper list
        if base_name in result and isinstance(result[base_name], list) and len(result[base_name]) > 0:
            continue
        
        # Sort by index and extract values
        sorted_values = [v for _, v in sorted(indexed_values.items())]
        
        # Try to parse curly-brace wrapped values into structured dicts
        schema = _KNOWN_FIELD_SCHEMAS.get(base_name)
        if schema:
            parsed_list = []
            for val in sorted_values:
                parsed_item = _parse_curly_brace_value(val, schema)
                if parsed_item is not None:
                    parsed_list.append(parsed_item)
                else:
                    # Couldn't parse as structured — keep as-is
                    parsed_list.append(val)
            result[base_name] = parsed_list
        else:
            # Simple values (strings, numbers) — just collect into a list
            result[base_name] = sorted_values
    
    return result


def _parse_curly_brace_value(value: Any, field_names: List[str]) -> Union[Dict[str, Any], None]:
    """
    Parse a curly-brace wrapped value like {Salesforce,Expert,6,false}
    into a dict using the provided field names.
    
    Handles both plain commas and escaped commas (\\,) as delimiters inside braces,
    since the AI may escape commas to avoid conflicts with outer TOON CSV parsing.
    
    Returns None if the value can't be parsed in this format.
    """
    if not isinstance(value, str):
        return None
    
    val = value.strip()
    
    # Strip curly braces if present
    if val.startswith('{') and val.endswith('}'):
        val = val[1:-1]
    
    # Strategy 1: Split by comma using _split_csv_line (respects escape sequences)
    parts = _split_csv_line(val)
    
    if len(parts) == len(field_names):
        result = {}
        for field, part in zip(field_names, parts):
            result[field] = _parse_value(part.strip())
        return result
    
    # Strategy 2: If escape-aware split produced too few parts (e.g., \, was treated as literal),
    # un-escape \, back to , and split by plain comma
    if len(parts) < len(field_names) and '\\,' in val:
        unescaped = val.replace('\\,', ',')
        parts = [p.strip() for p in unescaped.split(',')]
    
    if len(parts) == len(field_names):
        result = {}
        for field, part in zip(field_names, parts):
            result[field] = _parse_value(part.strip())
        return result
    
    # Strategy 3: Too many parts — join excess into the last field (for descriptions with commas)
    if len(parts) > len(field_names) and len(field_names) >= 2:
        merged_parts = parts[:len(field_names) - 1]
        merged_parts.append(','.join(parts[len(field_names) - 1:]))
        result = {}
        for field, part in zip(field_names, merged_parts):
            result[field] = _parse_value(part.strip())
        return result
    
    return None


def _split_csv_line(line: str) -> List[str]:
    """
    Split a CSV line respecting quoted strings and escaped characters
    """
    values = []
    current = []
    in_quotes = False
    i = 0
    
    while i < len(line):
        char = line[i]
        
        if char == '\\' and i + 1 < len(line):
            # Escape sequence
            next_char = line[i + 1]
            if next_char == 'n':
                current.append('\n')
            elif next_char == 't':
                current.append('\t')
            elif next_char == '\\':
                current.append('\\')
            elif next_char == ',':
                current.append(',')
            else:
                current.append(next_char)
            i += 2
            continue
        
        if char == ',' and not in_quotes:
            values.append(''.join(current).strip())
            current = []
            i += 1
            continue
        
        current.append(char)
        i += 1
    
    if current:
        values.append(''.join(current).strip())
    
    return values


def _parse_value(value: str) -> Any:
    """
    Parse a string value into appropriate Python type
    """
    value = value.strip()
    
    # Check for boolean
    if value.lower() == 'true':
        return True
    if value.lower() == 'false':
        return False
    
    # Check for null/none
    if value.lower() in ('null', 'none', ''):
        return None
    
    # Try to parse as number
    try:
        if '.' in value:
            return float(value)
        return int(value)
    except ValueError:
        pass
    
    # Return as string
    return value


def _format_value(value: Any) -> str:
    """
    Format a Python value for TOON output
    """
    if value is None:
        return 'null'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    
    # String - escape commas and special characters
    s = str(value)
    s = s.replace('\\', '\\\\')
    s = s.replace('\n', '\\n')
    s = s.replace('\t', '\\t')
    # Only escape commas if needed (contains comma or starts with space)
    if ',' in s or s.startswith(' ') or s.endswith(' '):
        s = s.replace(',', '\\,')
    
    return s


def toon_to_json(toon_string: str) -> str:
    """
    Convert TOON string to JSON string
    """
    parsed = parse_toon_to_dict(toon_string)
    return json.dumps(parsed, indent=2)


def json_to_toon(json_string: str) -> str:
    """
    Convert JSON string to TOON format
    """
    data = json.loads(json_string)
    return dict_to_toon(data)






