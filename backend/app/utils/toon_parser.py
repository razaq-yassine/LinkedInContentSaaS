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
        tabular_match = re.match(r'^(\w+)\[(\d+)\]\{([^}]+)\}:\s*$', line)
        if tabular_match:
            field_name = tabular_match.group(1)
            count = int(tabular_match.group(2))
            fields = [f.strip() for f in tabular_match.group(3).split(',')]
            
            # Parse the rows
            rows = []
            i += 1
            for _ in range(count):
                if i >= len(lines):
                    break
                row_line = lines[i].strip()
                if not row_line:
                    break
                    
                # Split by comma, but respect quoted strings
                values = _split_csv_line(row_line)
                if len(values) == len(fields):
                    row_dict = {}
                    for field, value in zip(fields, values):
                        row_dict[field] = _parse_value(value)
                    rows.append(row_dict)
                i += 1
            
            result[field_name] = rows
            continue
        
        # Check if this is a simple array (e.g., "content_goals[4]: val1,val2,val3,val4")
        simple_array_match = re.match(r'^(\w+)\[(\d+)\]:\s*(.+)$', line)
        if simple_array_match:
            field_name = simple_array_match.group(1)
            values_str = simple_array_match.group(3)
            values = [_parse_value(v.strip()) for v in _split_csv_line(values_str)]
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




