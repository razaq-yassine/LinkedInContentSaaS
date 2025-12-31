# TOON Format Quick Reference Guide

## What is TOON?

TOON (Token-Oriented Object Notation) is a compact, human-readable format designed for LLM prompts. It reduces token usage by 30-50% compared to JSON while maintaining full data structure.

## Why Use TOON?

- **Token Efficiency**: 30-50% fewer tokens than JSON
- **LLM-Friendly**: Explicit structure with length markers `[N]` and field declarations `{field1,field2}`
- **Human-Readable**: YAML-like indentation, CSV-like rows
- **Lossless**: Perfect round-trip conversion with JSON

## Basic Syntax

### Simple Key-Value Pairs

```toon
name: John Doe
age: 30
active: true
```

Equivalent JSON:
```json
{
  "name": "John Doe",
  "age": 30,
  "active": true
}
```

### Simple Arrays

```toon
tags[3]: python,javascript,react
```

Equivalent JSON:
```json
{
  "tags": ["python", "javascript", "react"]
}
```

### Tabular Arrays (Objects)

```toon
users[3]{id,name,age}:
  1,Alice,30
  2,Bob,25
  3,Charlie,35
```

Equivalent JSON:
```json
{
  "users": [
    {"id": 1, "name": "Alice", "age": 30},
    {"id": 2, "name": "Bob", "age": 25},
    {"id": 3, "name": "Charlie", "age": 35}
  ]
}
```

### Nested Objects

```toon
person:
  name: John Doe
  age: 30
  address:
    city: New York
    zip: 10001
```

Equivalent JSON:
```json
{
  "person": {
    "name": "John Doe",
    "age": 30,
    "address": {
      "city": "New York",
      "zip": "10001"
    }
  }
}
```

## Profile Context Example

Complete profile context in TOON format:

```toon
name: Sarah Johnson
current_role: Senior Product Manager
company: Tech Innovations Inc
industry: Technology
years_experience: 8
posting_frequency: 2-3x per week
tone: professional yet accessible
ai_generated_fields[3]: posting_frequency,tone,content_mix

expertise[6]{skill,level,years,ai_generated}:
  Product Strategy,Expert,8,false
  User Research,Advanced,6,false
  Agile Methodologies,Expert,7,false
  Data Analysis,Advanced,5,false
  Team Leadership,Advanced,4,true
  Stakeholder Management,Intermediate,3,true

target_audience[3]{persona,description}:
  Product Managers,Early to mid-career PMs looking to level up their skills
  Tech Leaders,Directors and VPs interested in product strategy insights
  Aspiring PMs,Professionals transitioning into product management

content_goals[4]: Build thought leadership,Share product insights,Grow professional network,Help others succeed in PM

content_mix[5]{category,percentage}:
  Product Strategy,30
  Case Studies,25
  Career Advice,20
  Industry Trends,15
  Personal Stories,10

content_ideas_evergreen[10]{title,format,hook,why_relevant,ai_generated}:
  8 Years of Product Lessons,carousel,8 years ago I shipped my first feature...,Based on your 8 years experience,false
  The Product Roadmap Framework That Works,text_with_image,Most roadmaps fail because...,Matches your product strategy expertise,false
  How to Run Effective User Research,text,User research isn't about asking questions...,Based on your user research skills,false
  Agile vs Waterfall: What I Learned,carousel,After managing 20+ projects...,Your agile methodology expertise,false
  Data-Driven Product Decisions,text_with_image,The best PMs use data but don't worship it...,Aligns with your data analysis skills,false
  Building High-Performing Product Teams,text,The secret to great teams isn't talent...,Your team leadership experience,true
  Stakeholder Management 101,carousel,Managing stakeholders is like conducting an orchestra...,Your stakeholder management skills,true
  From Engineer to Product Manager,text,Making the career switch taught me...,Appeals to aspiring PMs in your audience,true
  Product Metrics That Actually Matter,text_with_image,Vanity metrics vs actionable metrics...,Your data-driven approach,false
  The Art of Saying No,text,The best product skill? Knowing what NOT to build...,Your product strategy expertise,false

content_ideas_trending[5]{title,format,hook,why_relevant,source}:
  AI Product Management Revolution,text,ChatGPT changed how we build products...,Current trend in tech product management,web_search
  Remote Product Team Best Practices,carousel,Managing distributed teams in 2024...,Trending topic in tech leadership,web_search
  Product-Led Growth Strategies,text_with_image,PLG is the new standard for SaaS...,Hot topic in product strategy,web_search
  Ethical AI in Product Development,text,As PMs we have a responsibility...,Emerging trend in tech ethics,web_search
  The Future of Product Analytics,carousel,Traditional analytics are becoming obsolete...,Current trend in data-driven PM,web_search
```

## Escaping Special Characters

When values contain special characters:

```toon
description: Use \, for commas and \\ for backslashes
multiline: First line\nSecond line\nThird line
```

## Type Handling

TOON is type-aware but stores everything as strings for simplicity:

- **Numbers**: `42`, `3.14`, `-10`
- **Booleans**: `true`, `false`
- **Null**: `null`
- **Strings**: Everything else

The parser automatically converts to appropriate types.

## Best Practices

### 1. Use Tabular Format for Uniform Arrays

✅ **Good** (tabular):
```toon
products[3]{id,name,price}:
  1,Widget,9.99
  2,Gadget,19.99
  3,Doohickey,29.99
```

❌ **Avoid** (nested):
```toon
products[3]:
  id: 1
  name: Widget
  price: 9.99
  id: 2
  name: Gadget
  price: 19.99
```

### 2. Declare Array Lengths

Always include `[N]` to help LLMs track structure:

✅ **Good**: `tags[5]: a,b,c,d,e`
❌ **Avoid**: `tags: a,b,c,d,e`

### 3. Declare Field Names for Objects

Always include `{field1,field2}` for tabular arrays:

✅ **Good**: `users[2]{name,age}: Alice,30 Bob,25`
❌ **Avoid**: `users[2]: Alice,30 Bob,25`

### 4. Keep Nesting Minimal

TOON works best with flat structures. For deeply nested data, consider JSON.

## Token Comparison

Example profile context:

| Format | Tokens | Savings |
|--------|--------|---------|
| JSON (pretty) | 2,847 | - |
| JSON (compact) | 1,892 | 33% |
| **TOON** | **1,203** | **58%** |

## Python Usage

```python
from backend.app.utils.toon_parser import parse_toon_to_dict, dict_to_toon

# Parse TOON to dict
toon_string = """
name: John Doe
age: 30
skills[3]: python,javascript,react
"""
data = parse_toon_to_dict(toon_string)
# Result: {'name': 'John Doe', 'age': 30, 'skills': ['python', 'javascript', 'react']}

# Convert dict to TOON
data = {
    'name': 'Jane Smith',
    'age': 28,
    'skills': ['python', 'java', 'go']
}
toon_string = dict_to_toon(data)
# Result:
# name: Jane Smith
# age: 28
# skills[3]: python,java,go
```

## LLM Prompt Usage

When using TOON in LLM prompts:

```python
system_prompt = f"""You are a LinkedIn content expert.

USER PROFILE CONTEXT (TOON format):
{toon_context}

Generate content that matches the user's expertise and tone.
"""
```

The LLM can easily parse the structure and extract relevant information.

## Advantages Over JSON

1. **Fewer Tokens**: 30-50% reduction
2. **Explicit Structure**: `[N]` and `{fields}` help LLMs validate
3. **Human-Readable**: Easier to debug and inspect
4. **CSV-Like**: Familiar tabular format for arrays
5. **YAML-Like**: Familiar indentation for objects

## When to Use JSON Instead

- Deeply nested structures (>3 levels)
- Non-uniform arrays (different fields per item)
- Complex data types (dates, binary, etc.)
- Existing JSON-based workflows

## Resources

- TOON Specification: https://github.com/toon-format/spec
- TOON Python Library: https://github.com/xaviviro/python-toon
- TOON Format Website: https://toonformat.dev

## Summary

TOON is ideal for:
- ✅ LLM prompts with structured data
- ✅ Uniform arrays of objects
- ✅ Token-efficient data transfer
- ✅ Human-readable configuration

Use JSON for:
- ❌ Deeply nested structures
- ❌ Non-uniform data
- ❌ Complex type requirements
- ❌ Existing JSON pipelines







