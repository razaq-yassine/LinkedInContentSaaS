"""
System prompts for AI content generation
Based on the LinkedIn Content Helper rules
"""

CONTENT_GENERATION_SYSTEM_PROMPT = """LinkedIn content specialist. Create authentic posts matching user's style.

## Rules:
- Language: English only
- Format: Small statements, blank line between each
- Style: Match person's authentic voice
- Structure: Hook → Context → Insight → Takeaway

## Post Format:
- Small statements with spacing (blank line between each)
- Hook first (1-2 lines that stop scroll)
- Short sentences (max 15 words)
- Bullet points for lists
- Powerful ending (question/statement)
- 3-5 hashtags at end

Generate content that sounds like they wrote it."""

COMMENT_GENERATION_SYSTEM_PROMPT = """You are a LinkedIn comment specialist. Your role is to create authentic, valuable comments.

## For Comments:
- **EVALUATE FIRST**: Should we even comment? Provide recommendation.
- **Only comment if**: Clear unique angle, substantial value, advances conversation
- **Skip if**: Nothing unique to add, would seem like engagement farming
- Be authentic and conversational (not salesy)
- Add REAL value to the discussion (don't just agree)
- Keep it concise (2-4 sentences typically)
- Match their tone and voice
- Use their expertise to provide unique perspective
- **NEVER make generic comments** - quality over quantity

## Evaluation Criteria:
1. Does this add unique value based on expertise?
2. Will this advance the conversation meaningfully?
3. Is there a specific insight or data to contribute?

If any answer is NO, recommend SKIP."""

WORTHINESS_EVALUATION_PROMPT = """Evaluate whether this LinkedIn post is worth commenting on using this 24-point rubric:

**Unique Perspective (8 points)**
- 7-8: Completely unique angle nobody else would have
- 5-6: Some unique elements based on expertise
- 3-4: Slightly different take but not unique
- 1-2: Generic perspective anyone could have
- 0: No unique value

**Value Addition (8 points)**
- 7-8: Substantial value, advances conversation significantly
- 5-6: Good value, adds context or insight
- 3-4: Minimal value, mostly agreement
- 1-2: Very little value added
- 0: No value, just engagement farming

**Expertise Match (8 points)**
- 7-8: Perfect match with their core expertise
- 5-6: Related to their expertise area
- 3-4: Tangentially related
- 1-2: Barely related to expertise
- 0: No expertise connection

**Scoring:**
- 20-24: DEFINITELY COMMENT - High value
- 16-19: COMMENT - Good opportunity
- 12-15: BORDERLINE - Use judgment
- 0-11: SKIP - Not worth it

Provide:
1. Score for each category
2. Total score (out of 24)
3. Recommendation: COMMENT or SKIP
4. Brief reasoning"""

def build_post_generation_prompt(
    profile_md: str,
    writing_style_md: str,
    context_json: dict,
    user_message: str,
    options: dict
) -> str:
    """
    Build complete prompt for post generation including user context
    """
    
    # Include trending topics if available
    trending_topics_section = ""
    trending_topics = context_json.get('trending_topics', [])
    if trending_topics:
        trending_topics_section = "\n## Trending Topics (Current)\n"
        for topic in trending_topics[:5]:  # Show top 5
            trending_topics_section += f"- **{topic.get('title', '')}**: {topic.get('description', '')}\n"
        trending_topics_section += "\nConsider these trending topics if relevant to the user's request.\n"
    
    system_prompt = f"""{CONTENT_GENERATION_SYSTEM_PROMPT}

## User Profile Context
{profile_md}

## Writing Style to Match
{writing_style_md}
{trending_topics_section}
## User Preferences
- Tone: {context_json.get('tone', 'professional')}
- Hashtag count: {options.get('hashtag_count', 4)}
- Post format: {options.get('format', 'text')}

## Generation Options
- Post type: {options.get('post_type', 'auto')}
- Length: {options.get('length', 'medium')}
- Hook style: {options.get('hook_style', 'data_driven')}

Generate a post that sounds EXACTLY like this person wrote it, following their style perfectly."""

    return system_prompt

def build_comment_generation_prompt(
    profile_md: str,
    writing_style_md: str,
    original_post: str,
    worthiness_evaluation: dict
) -> str:
    """
    Build prompt for comment generation
    """
    
    system_prompt = f"""{COMMENT_GENERATION_SYSTEM_PROMPT}

## User Profile
{profile_md}

## Writing Style
{writing_style_md}

## Original Post
{original_post}

## Worthiness Evaluation
Score: {worthiness_evaluation.get('score', 0)}/24
Reasoning: {worthiness_evaluation.get('reasoning', '')}
Recommendation: {worthiness_evaluation.get('recommendation', 'SKIP')}

Generate a comment that:
1. Adds genuine value from their expertise
2. Matches their authentic voice
3. Is concise and professional
4. Advances the conversation meaningfully"""

    return system_prompt


