"""
Prompt templates for different content types
"""

# Template for carousel posts
CAROUSEL_TEMPLATE = """Generate a LinkedIn carousel post.

IMPORTANT: You need to generate TWO separate things:

1. POST CONTENT: The actual LinkedIn post text that users will read.
   - This should be a normal LinkedIn post (not structured as slides)
   - Write it as a standalone post
   - Do NOT include slide descriptions or prompts in the post text

2. SLIDE IMAGE PROMPTS: An array of image generation prompts for AI diffusion models (one per slide).
   - NEVER include text, words, letters, or numbers in any prompt — text overlays are added programmatically later
   - Describe ONLY visual scenes, objects, people, colors, lighting, composition
   - ALL slides MUST use the SAME color palette, visual style, and composition approach
   - Typically 4-8 slides, each illustrating ONE point from the post
   - Format: 1200×1200px square per slide

The post_content and image_prompts are COMPLETELY SEPARATE."""

# Template for text + image posts
TEXT_IMAGE_TEMPLATE = """Generate TWO separate things:

1. POST CONTENT: The LinkedIn post text (following all formatting rules)
   - This is what users will READ on LinkedIn
   - Write it as a normal LinkedIn post
   - Do NOT include image descriptions or prompts in the post text

2. IMAGE PROMPT: A prompt for AI diffusion model image generation (NOT shown to users)
   - NEVER include text, words, letters, or numbers — diffusion models render text poorly
   - Describe ONLY: visual scene, composition, style, colors, lighting, mood
   - Format: 1200×1200px square, professional, high-resolution
   - Structure: [Style], [Scene/subject], [Visual elements], [Color palette], [Lighting], [Mood]

IMPORTANT: post_content and image_prompt are COMPLETELY SEPARATE. image_prompt describes a visual scene only (no text in image)."""

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
        "video_script": """Generate a comprehensive LinkedIn video script as a SINGLE FORMATTED TEXT STRING.

CRITICAL: Output the script as readable text, NOT as a dictionary or structured object.

STRUCTURE (format as readable text with section markers):
[Hook - 3-5 seconds]
Your attention-grabbing opening line here. Make it conversational and engaging.

[Introduction - 10-15 seconds]
Set up the topic and why it matters. Brief background or personal connection. Establish credibility.

[Main Content - 40-60 seconds]
Break down into 2-3 key points:

Point 1: [Brief point title]
[Visual cue: what to show/do]
Your script text here with natural pauses and conversational flow. Include pacing notes like [pause] or [emphasize].

Point 2: [Brief point title]
[Visual cue: what to show/do]
Your script text here.

Point 3: [Brief point title]
[Visual cue: what to show/do]
Your script text here.

[Summary - 10-15 seconds]
Reinforce the key takeaway. One clear message viewers should remember. Tie back to the hook if possible.

[CTA - 5-10 seconds]
Clear call-to-action. Ask a question, request comments, or suggest follow-up action. Keep it natural.

TOTAL DURATION: 60-90 seconds

WRITING STYLE:
- Write as a SINGLE CONTINUOUS TEXT STRING
- Conversational and natural (as if speaking, not reading)
- Include visual cues in brackets: [show screen], [gesture], [pause]
- Use short sentences and natural pauses
- Format sections clearly with [Section Name] markers
- Make it engaging and valuable

OUTPUT FORMAT: Return ONLY the formatted script text as a string in the "post_content" field. Do NOT return a dictionary or structured object."""
    }
    
    return instructions.get(format_type, instructions["text"])


