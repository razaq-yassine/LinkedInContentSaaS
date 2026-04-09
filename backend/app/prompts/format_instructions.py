"""
Format-specific instructions for different post types
"""

from .carousel_instructions import CAROUSEL_AI_INSTRUCTIONS

# Image Post Instructions
IMAGE_POST_INSTRUCTIONS = """## TEXT + IMAGE POST

Generate TWO separate fields:

1. post_content: LinkedIn post text (users read this)
   - Normal post, small statements with spacing
   - NO image descriptions/prompts in content

2. image_prompt: Prompt for AI diffusion model image generation (REQUIRED)
   - NEVER include text, words, letters, or numbers — diffusion models render text poorly
   - Describe ONLY visual scenes, objects, people, colors, lighting, composition
   - Style decision: specific tools/platforms → photorealistic | abstract concepts → modern flat illustration
   - Format: 1200×1200px square, professional, high-resolution
   - Structure: [Style], [Scene/subject], [Visual elements], [Color palette], [Lighting], [Mood]
   - Output ONLY the final prompt text — no explanations

Keep them SEPARATE. image_prompt describes a visual scene only (no text/words in image)."""

# Carousel Post Instructions — sourced from carousel_instructions.py
CAROUSEL_POST_INSTRUCTIONS = CAROUSEL_AI_INSTRUCTIONS["format_rules"]

# Video Script Post Instructions
VIDEO_SCRIPT_INSTRUCTIONS = """## VIDEO SCRIPT POST

Generate a comprehensive video script for LinkedIn:

1. post_content: Complete video script (what users will read/follow)
   - Hook (first 3-5 seconds): Attention-grabbing opening that makes viewers want to watch
   - Main content: Structured in clear sections with natural transitions
   - Key points: Break down main message into digestible segments
   - Visual cues: Include brief notes on what to show/do during each section
   - CTA ending: Clear call-to-action that encourages engagement
   - Duration guidance: Aim for 60-90 seconds (optimal LinkedIn video length)
   - Natural language: Write as if speaking, not reading (conversational tone)
   - Pacing notes: Include pauses, emphasis points, and transitions

2. Structure:
   - Opening Hook (3-5 seconds)
   - Introduction/Context (10-15 seconds)
   - Main Content Points (40-60 seconds)
   - Summary/Key Takeaway (10-15 seconds)
   - Call-to-Action (5-10 seconds)

The script should be engaging, valuable, and optimized for LinkedIn video format."""

# JSON Format Templates (Optimized for token efficiency - minimal fields only)
CAROUSEL_JSON_FORMAT = CAROUSEL_AI_INSTRUCTIONS["json_format"]

IMAGE_JSON_FORMAT = """{
    "title": "Concise title (3-8 words)",
    "post_content": "LinkedIn post text with hashtags at end",
    "image_prompt": "[Style], [scene/subject], [visual elements], [color palette], [lighting], [mood]. NO text/words in image. 1200x1200 square.",
    "hashtags": ["#tag1", "#tag2", "#tag3"]
}

Rules: 
- image_prompt must NEVER contain text/words/letters — visual scene only
- Include hashtags in post_content AND as separate array"""

VIDEO_SCRIPT_JSON_FORMAT = """{
    "title": "A concise, descriptive title for this post (3-8 words, captures the main topic)",
    "post_content": "Complete video script formatted as readable text:\n\n[Hook - 3-5 seconds]\nYour attention-grabbing opening line here. Make it conversational and engaging.\n\n[Introduction - 10-15 seconds]\nSet up the context and why this topic matters. Establish credibility.\n\n[Main Content - 40-60 seconds]\nBreak down your main points:\n\nPoint 1: [Brief description]\n[Visual cue: what to show]\nYour script text here with natural pauses and conversational flow.\n\nPoint 2: [Brief description]\n[Visual cue: what to show]\nYour script text here.\n\nPoint 3: [Brief description]\n[Visual cue: what to show]\nYour script text here.\n\n[Summary - 10-15 seconds]\nReinforce the key takeaway. Tie back to the hook if possible.\n\n[CTA - 5-10 seconds]\nClear call-to-action that encourages engagement.\n\nTotal duration: 60-90 seconds. Write naturally as if speaking, not reading.",
    "hashtags": ["tag1", "tag2", "tag3"]
}

CRITICAL: 
- post_content MUST be a single formatted string, NOT a dictionary or structured object"""

TEXT_JSON_FORMAT = """{
    "title": "Concise title (3-8 words)",
    "post_content": "Post content with hashtags at end",
    "hashtags": ["#tag1", "#tag2", "#tag3"]
}

Rules: 
- Include hashtags in post_content AND as separate array
- Return ONLY these fields (no format_type, no tone, no estimated_engagement, no image_prompt, no metadata wrapper)"""

# Response Format Requirements
RESPONSE_FORMAT_REQUIREMENTS = """
## Response Format
Respond with ONLY valid JSON (no markdown blocks, no explanations).

REQUIRED FIELDS:
- title: Concise title (3-8 words) for conversation title
- post_content: LinkedIn post text with hashtags included
- hashtags: Array of hashtags (exact count requested, default: 4)
- image_prompt: Only for image posts (single string)
- image_prompts: Only for carousel posts (array of strings, 4-15 slides)

CRITICAL: hashtags MUST be an array with the exact number requested (default: 4). Only use empty array if user explicitly requested zero hashtags."""

def get_format_instructions(post_type: str) -> str:
    """Get format-specific instructions"""
    if post_type == 'image':
        return IMAGE_POST_INSTRUCTIONS
    elif post_type == 'carousel':
        return CAROUSEL_POST_INSTRUCTIONS
    elif post_type == 'video_script':
        return VIDEO_SCRIPT_INSTRUCTIONS
    return ""

def get_json_format(post_type: str) -> str:
    """Get JSON format template for post type"""
    if post_type == 'carousel':
        return CAROUSEL_JSON_FORMAT
    elif post_type == 'image' or post_type == 'text_with_image':
        return IMAGE_JSON_FORMAT
    elif post_type == 'video_script':
        return VIDEO_SCRIPT_JSON_FORMAT
    return TEXT_JSON_FORMAT



