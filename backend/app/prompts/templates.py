"""
Prompt templates for different content types
"""

# Template for carousel posts
CAROUSEL_TEMPLATE = """Generate a LinkedIn carousel post.

IMPORTANT: You need to generate TWO separate things:

1. POST CONTENT: The actual LinkedIn post text that users will read.
   - This should be a normal LinkedIn post (not structured as slides)
   - Write it as a standalone post
   - Do NOT include slide descriptions or prompts
   - Do NOT mention "slide 1", "slide 2", etc.

2. SLIDE IMAGE PROMPTS: An array of image generation prompts (one per slide).
   - These describe what each slide image should look like
   - These are ONLY for image generation, NOT shown in the post
   - Typically 4-8 slides
   - All slides should have consistent theming (same colors, style, visual language)

The post_content and image_prompts are COMPLETELY SEPARATE."""

# Template for text + image posts
TEXT_IMAGE_TEMPLATE = """Generate TWO separate things:

1. POST CONTENT: The LinkedIn post text (following all formatting rules)
   - This is what users will READ on LinkedIn
   - Write it as a normal LinkedIn post
   - Do NOT include image descriptions or prompts in the post text
   - Do NOT mention "image" or "visual" in the post content

2. IMAGE PROMPT: An AI image generation prompt (for image generation only)
   - This is ONLY for AI image generation, NOT shown to users
   - Describe: Visual concept, composition, style, colors, key elements
   - Dimensions: 1200x628px (LinkedIn optimal)

IMPORTANT: post_content and image_prompt are COMPLETELY SEPARATE. The post_content should be a normal LinkedIn post, and image_prompt is metadata for image generation."""

# Template for analyzing post performance
PERFORMANCE_ANALYSIS_TEMPLATE = """Analyze why this post performed well/poorly:

Post:
{post_content}

Engagement:
- Likes: {likes}
- Comments: {comments}
- Shares: {shares}

Provide:
1. What worked (hook, structure, timing, topic)
2. What could be improved
3. Recommendations for future posts"""

# Template for topic suggestions
TOPIC_SUGGESTION_TEMPLATE = """Based on this profile and expertise, suggest 10 LinkedIn post topics that would:
1. Showcase their expertise
2. Provide value to their audience
3. Be timely and relevant
4. Have potential for high engagement

Profile:
{profile_md}

Recent content themes:
{recent_themes}

Format each as:
- Topic: [Title]
- Angle: [Unique perspective]
- Format: [Text/Carousel/Image/Video]
- Hook idea: [Opening line suggestion]"""

# Template for trending topic posts
TRENDING_TOPIC_TEMPLATE = """Create a post about this trending topic, connecting it to the user's expertise:

Trending: {trending_topic}

User expertise: {expertise_areas}

Requirements:
1. Strong hook tying trend to their expertise
2. Unique angle only they could provide
3. Actionable insights
4. Call-to-action"""

def get_format_specific_instructions(format_type: str) -> str:
    """
    Get format-specific instructions
    """
    instructions = {
        "text": "Plain text post with single-line formatting, no images.",
        "carousel": f"{CAROUSEL_TEMPLATE}",
        "image": f"{TEXT_IMAGE_TEMPLATE}",
        "video": "Create a video script with: Hook (first 3 seconds), Main content (structure in 3 parts), CTA ending."
    }
    
    return instructions.get(format_type, instructions["text"])


