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
   
   - CRITICAL FOR EDUCATIONAL/TUTORIAL CONTENT:
     * If post is educational (explains how to do something, teaches concepts, provides solutions):
       - Each slide MUST include TEXT OVERLAYS with clear explanations
       - Include step-by-step instructions in text if applicable
       - Add key concepts, solutions, or takeaways as text on the slide
       - Text should be readable, well-positioned, and complement visuals
       - For "how to" posts: Include numbered steps or sequential instructions in text overlays
       - For explanatory posts: Include definitions, concepts, or solutions in text overlays
       - Visuals support the text - slides cannot be images only
       - Example: "Slide showing [visual concept] with text overlay explaining: '[key explanation or step]'"
   
   - Output ONLY JSON array - no explanations

Keep them SEPARATE but image_prompts must create consistent visual story matching post structure. For educational content, ensure text overlays are included in prompts."""

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

# JSON Format Templates
CAROUSEL_JSON_FORMAT = """{
    "post_content": "The actual LinkedIn post text that users will read. This is a normal LinkedIn post, NOT slide descriptions. Do NOT include slide prompts or mention slides here. MUST include hashtags at the end like #tag1 #tag2 #tag3",
    "format_type": "carousel",
    "image_prompts": [
        "Slide 1: Detailed prompt with consistent theme - represents first point/concept from post. Include exact colors/style that will be used for ALL slides. If educational: Include text overlay with explanation/solution/step.",
        "Slide 2: Detailed prompt with SAME theme/colors/style - represents second point/concept, builds on slide 1 visually. If educational: Include text overlay with explanation/solution/step.",
        "Slide 3: Detailed prompt with SAME theme/colors/style - represents third point/concept, continues visual story. If educational: Include text overlay with explanation/solution/step.",
        "Continue for 4-8 slides total. CRITICAL: All slides must use SAME color palette, SAME style, SAME visual elements. Each slide represents ONE specific point from post. Slides should build a visual narrative, not be random images. If post is educational/tutorial/how-to: Each slide MUST include text overlays with explanations, steps, or solutions - slides cannot be images only."
    ],
    "metadata": {
        "hashtags": ["#tag1", "#tag2", "#tag3"],
        "tone": "professional|casual|thought-leader|educator",
        "estimated_engagement": "low|medium|high"
    }
}

CRITICAL: post_content is the LinkedIn post text (what users see). image_prompts must create a cohesive visual story with consistent theming across ALL slides.

EDUCATIONAL CONTENT REQUIREMENT: If the post is educational (explains how to do something, teaches concepts, provides solutions), each image_prompt MUST explicitly request text overlays with:
- Clear explanations of what is being taught
- Step-by-step instructions if applicable  
- Key solutions or takeaways
- Specific educational content that helps viewers understand

IMPORTANT: post_content MUST include hashtags at the end (e.g., "#tag1 #tag2 #tag3"). Hashtags should appear BOTH in post_content text AND in metadata.hashtags array."""

IMAGE_JSON_FORMAT = """{
    "post_content": "The actual LinkedIn post text that users will read. This is a normal LinkedIn post. Use small statements with blank lines between them. Do NOT include image descriptions or prompts here. MUST include hashtags at the end like #tag1 #tag2 #tag3",
    "format_type": "image",
    "image_prompt": "Detailed image generation prompt. If post mentions specific tools/platforms: use real-world visuals (dashboards, offices, devices). If post is general/abstract: use friendly cartoon/illustration style with diverse professional characters doing actions that match the post's message. For before/after comparisons: use split-screen with cartoon characters showing transformation. Include: visual style (realistic photography OR cartoon illustration), specific color palette, composition, concrete visual elements. LinkedIn-friendly, professional, engaging, 1200x628px. This is ONLY for AI image generation, NOT shown in the post.",
    "metadata": {
        "hashtags": ["#tag1", "#tag2", "#tag3"],
        "tone": "professional|casual|thought-leader|educator",
        "estimated_engagement": "low|medium|high"
    }
}

CRITICAL: post_content is the LinkedIn post text (what users see). image_prompt must create a concrete visual - use cartoon/illustration characters when content is general/abstract, use real-world visuals when content is specific.

IMPORTANT: post_content MUST include hashtags at the end (e.g., "#tag1 #tag2 #tag3"). Hashtags should appear BOTH in post_content text AND in metadata.hashtags array."""

VIDEO_SCRIPT_JSON_FORMAT = """{
    "post_content": "Complete video script formatted as readable text:\n\n[Hook - 3-5 seconds]\nYour attention-grabbing opening line here. Make it conversational and engaging.\n\n[Introduction - 10-15 seconds]\nSet up the context and why this topic matters. Establish credibility.\n\n[Main Content - 40-60 seconds]\nBreak down your main points:\n\nPoint 1: [Brief description]\n[Visual cue: what to show]\nYour script text here with natural pauses and conversational flow.\n\nPoint 2: [Brief description]\n[Visual cue: what to show]\nYour script text here.\n\nPoint 3: [Brief description]\n[Visual cue: what to show]\nYour script text here.\n\n[Summary - 10-15 seconds]\nReinforce the key takeaway. Tie back to the hook if possible.\n\n[CTA - 5-10 seconds]\nClear call-to-action that encourages engagement.\n\nTotal duration: 60-90 seconds. Write naturally as if speaking, not reading.",
    "format_type": "video_script",
    "metadata": {
        "hashtags": ["tag1", "tag2", "tag3"],
        "tone": "professional|casual|thought-leader|educator",
        "estimated_engagement": "low|medium|high"
    }
}

CRITICAL: post_content MUST be a single formatted string, NOT a dictionary or structured object. Format it as readable text with clear sections marked by brackets like [Hook], [Introduction], etc. Users will read this script when creating their video."""

TEXT_JSON_FORMAT = """{
    "post_content": "your post content here with hashtags at the end like #tag1 #tag2 #tag3",
    "format_type": "text|carousel|image|video_script",
    "image_prompt": "detailed image prompt if format is image or carousel, otherwise null",
    "metadata": {
        "hashtags": ["#tag1", "#tag2", "#tag3"],
        "tone": "professional|casual|thought-leader|educator",
        "estimated_engagement": "low|medium|high"
    }
}

CRITICAL: post_content MUST include the hashtags at the end of the text. Hashtags should appear BOTH in post_content (as text) AND in metadata.hashtags (as array)."""

# Response Format Requirements
RESPONSE_FORMAT_REQUIREMENTS = """
## Response Format
Respond with ONLY valid JSON (no markdown blocks).

Rules:
- post_content: Normal LinkedIn post text (what users read)
- image_prompt/image_prompts: SEPARATE from post_content (for generation only)
- Write post_content as standalone post, independent of image prompts
- CRITICAL: metadata.hashtags MUST be an array with the exact number of hashtags requested (default: 4)
- Hashtags should be relevant to the content and industry
- Only use empty array if user explicitly requested zero hashtags"""

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



