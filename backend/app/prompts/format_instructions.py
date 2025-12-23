"""
Format-specific instructions for different post types
"""

# Image Post Instructions
IMAGE_POST_INSTRUCTIONS = """## TEXT + IMAGE POST

Generate TWO separate fields:

1. post_content: LinkedIn post text (users read this)
   - Normal post, small statements with spacing
   - NO image descriptions/prompts in content

2. image_prompt: Image generation prompt (REQUIRED, for AI only)
   - If content is specific (mentions tools/platforms/concrete scenarios): Use real-world visuals (dashboards, offices, devices, professional photos)
   - If content is general/abstract/conceptual: Use friendly cartoon/illustration style with characters doing actions that match the post's message
   - For before/after comparisons: Use split-screen with cartoon characters or illustrations showing the transformation
   - Characters should be diverse, professional, and doing actions that directly represent the post's concepts
   - LinkedIn-optimized: 1200×628px, professional, engaging, mobile-friendly
   - Output ONLY the final prompt text - no explanations

Keep them SEPARATE but image_prompt must create concrete visuals matching post content."""

# Carousel Post Instructions
CAROUSEL_POST_INSTRUCTIONS = """## TEXT + CAROUSEL POST

Generate TWO separate fields:

1. post_content: LinkedIn post text (users read this)
   - Normal post, NOT structured as slides
   - NO slide descriptions/prompts in content

2. image_prompts: Array of 4-8 image prompts (REQUIRED, for AI only)
   - CRITICAL: ALL slides must use SAME color palette, SAME visual style, SAME composition
   - Choose ONE visual style for entire carousel:
     * If content is specific: Real-world visuals (photography, dashboards, devices)
     * If content is general/abstract: Cartoon/illustration style with characters
   - Break down post into logical sections (one per slide)
   - Each slide represents ONE specific point from post
   - Visual progression: slides build like a story (not random images)
   - If using characters: They should be diverse, professional, doing actions matching each slide's point
   - Create cohesive series with consistent theming
   - Output ONLY JSON array - no explanations

Keep them SEPARATE but image_prompts must create consistent visual story matching post structure."""

# JSON Format Templates
CAROUSEL_JSON_FORMAT = """{
    "post_content": "The actual LinkedIn post text that users will read. This is a normal LinkedIn post, NOT slide descriptions. Do NOT include slide prompts or mention slides here.",
    "format_type": "carousel",
    "image_prompts": [
        "Slide 1: Detailed prompt with consistent theme - represents first point/concept from post. Include exact colors/style that will be used for ALL slides.",
        "Slide 2: Detailed prompt with SAME theme/colors/style - represents second point/concept, builds on slide 1 visually",
        "Slide 3: Detailed prompt with SAME theme/colors/style - represents third point/concept, continues visual story",
        "Continue for 4-8 slides total. CRITICAL: All slides must use SAME color palette, SAME style, SAME visual elements. Each slide represents ONE specific point from post. Slides should build a visual narrative, not be random images."
    ],
    "metadata": {
        "hashtags": ["tag1", "tag2", "tag3"],
        "tone": "professional|casual|thought-leader|educator",
        "estimated_engagement": "low|medium|high"
    }
}

CRITICAL: post_content is the LinkedIn post text (what users see). image_prompts must create a cohesive visual story with consistent theming across ALL slides."""

IMAGE_JSON_FORMAT = """{
    "post_content": "The actual LinkedIn post text that users will read. This is a normal LinkedIn post. Use small statements with blank lines between them. Do NOT include image descriptions or prompts here.",
    "format_type": "image",
    "image_prompt": "Detailed image generation prompt. If post mentions specific tools/platforms: use real-world visuals (dashboards, offices, devices). If post is general/abstract: use friendly cartoon/illustration style with diverse professional characters doing actions that match the post's message. For before/after comparisons: use split-screen with cartoon characters showing transformation. Include: visual style (realistic photography OR cartoon illustration), specific color palette, composition, concrete visual elements. LinkedIn-friendly, professional, engaging, 1200x628px. This is ONLY for AI image generation, NOT shown in the post.",
    "metadata": {
        "hashtags": ["tag1", "tag2", "tag3"],
        "tone": "professional|casual|thought-leader|educator",
        "estimated_engagement": "low|medium|high"
    }
}

CRITICAL: post_content is the LinkedIn post text (what users see). image_prompt must create a concrete visual - use cartoon/illustration characters when content is general/abstract, use real-world visuals when content is specific."""

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
## Response Format
Respond with ONLY valid JSON (no markdown blocks).

Rules:
- post_content: Normal LinkedIn post text (what users read)
- image_prompt/image_prompts: SEPARATE from post_content (for generation only)
- Write post_content as standalone post, independent of image prompts"""

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



