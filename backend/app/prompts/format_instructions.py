"""
Format-specific instructions for different post types
"""

# Image Post Instructions
IMAGE_POST_INSTRUCTIONS = """## CRITICAL: Format Enforcement - TEXT + IMAGE POST

You MUST generate a TEXT + IMAGE post with SEPARATE fields:

1. post_content: The actual LinkedIn post text that will be displayed.
   - This is what users will READ on LinkedIn
   - DO NOT include image descriptions or prompts here
   - DO NOT mention 'image' or 'visual' in the post content
   - Write it as a normal LinkedIn post

2. image_prompt: A DETAILED image generation prompt (REQUIRED - cannot be null)
   - This is ONLY for AI image generation, NOT shown to users
   - Describe what the image should look like
   - Include style, colors, composition, elements
   - Even if the user's request doesn't mention images, you MUST create an appropriate image prompt

IMPORTANT: post_content and image_prompt are COMPLETELY SEPARATE. The post_content should be a normal LinkedIn post, and image_prompt is metadata for image generation."""

# Carousel Post Instructions
CAROUSEL_POST_INSTRUCTIONS = """## CRITICAL: Format Enforcement - TEXT + CAROUSEL POST

You MUST generate a TEXT + CAROUSEL post with SEPARATE fields:

1. post_content: The actual LinkedIn post text that will be displayed.
   - This is what users will READ on LinkedIn
   - DO NOT include slide prompts, slide descriptions, or image prompts here
   - DO NOT list slides or mention 'slide 1', 'slide 2', etc.
   - Write it as a normal LinkedIn post (not structured as slides)
   - The post content is independent of the carousel slides

2. image_prompts: An ARRAY of detailed image generation prompts (REQUIRED - array with 4-8 prompts)
   - Each prompt describes ONE slide image
   - These are ONLY for AI image generation, NOT shown in post content
   - Each prompt should describe the visual for that specific slide
   - All prompts should have CONSISTENT THEMING (same color scheme, style, visual language)
   - Even if the user's request doesn't mention carousel, you MUST create multiple image prompts with consistent theming

IMPORTANT: post_content is the LinkedIn post text (shown to users). image_prompts is an array of slide image descriptions (used for generation only). They are COMPLETELY SEPARATE."""

# JSON Format Templates
CAROUSEL_JSON_FORMAT = """{
    "post_content": "The actual LinkedIn post text that users will read. This is a normal LinkedIn post, NOT slide descriptions. Do NOT include slide prompts or mention slides here.",
    "format_type": "carousel",
    "image_prompts": [
        "Detailed image generation prompt for slide 1 - describe visual style, colors, composition",
        "Detailed image generation prompt for slide 2 - describe visual style, colors, composition",
        "Detailed image generation prompt for slide 3 - describe visual style, colors, composition",
        "Continue for 4-8 slides total, all with consistent theming"
    ],
    "metadata": {
        "hashtags": ["tag1", "tag2", "tag3"],
        "tone": "professional|casual|thought-leader|educator",
        "estimated_engagement": "low|medium|high"
    }
}

CRITICAL: post_content is the LinkedIn post text (what users see). image_prompts is an array of slide image descriptions (for generation only). Keep them SEPARATE."""

IMAGE_JSON_FORMAT = """{
    "post_content": "The actual LinkedIn post text that users will read. This is a normal LinkedIn post. Do NOT include image descriptions or prompts here.",
    "format_type": "image",
    "image_prompt": "Detailed image generation prompt - describe what the image should look like, style, colors, composition, elements. This is ONLY for AI image generation, NOT shown in the post.",
    "metadata": {
        "hashtags": ["tag1", "tag2", "tag3"],
        "tone": "professional|casual|thought-leader|educator",
        "estimated_engagement": "low|medium|high"
    }
}

CRITICAL: post_content is the LinkedIn post text (what users see). image_prompt is the image description (for generation only). Keep them SEPARATE."""

TEXT_JSON_FORMAT = """{
    "post_content": "your post content here",
    "format_type": "text|carousel|image",
    "image_prompt": "detailed image prompt if format is image or carousel, otherwise null",
    "metadata": {
        "hashtags": ["tag1", "tag2", "tag3"],
        "tone": "professional|casual|thought-leader|educator",
        "estimated_engagement": "low|medium|high"
    }
}"""

# Response Format Requirements
RESPONSE_FORMAT_REQUIREMENTS = """
## CRITICAL: Response Format Requirements
You MUST respond with ONLY a valid JSON object in this exact format:

## Key Rules:
- post_content: This is what LinkedIn users will READ. It should be a normal LinkedIn post text.
- For image posts: image_prompt is SEPARATE from post_content. Do NOT mention image prompts in post_content.
- For carousel posts: image_prompts array is SEPARATE from post_content. Do NOT include slide descriptions in post_content.
- The post_content should be written as if it's a standalone LinkedIn post, independent of the image prompts.

Do NOT include any markdown code blocks or explanations. Output ONLY the JSON object."""

def get_format_instructions(post_type: str) -> str:
    """Get format-specific instructions"""
    if post_type == 'image':
        return IMAGE_POST_INSTRUCTIONS
    elif post_type == 'carousel':
        return CAROUSEL_POST_INSTRUCTIONS
    return ""

def get_json_format(post_type: str) -> str:
    """Get JSON format template for post type"""
    if post_type == 'carousel':
        return CAROUSEL_JSON_FORMAT
    elif post_type == 'image' or post_type == 'text_with_image':
        return IMAGE_JSON_FORMAT
    return TEXT_JSON_FORMAT



