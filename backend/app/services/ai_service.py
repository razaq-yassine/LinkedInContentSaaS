from openai import OpenAI
from google import genai
from google.genai import types
from typing import Dict, List, Optional
from ..config import get_settings

settings = get_settings()

# Initialize OpenAI client
openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

# Initialize Gemini client (new SDK)
gemini_client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None

async def generate_completion(
    system_prompt: str,
    user_message: str,
    model: Optional[str] = None,
    temperature: float = 0.7,
    use_search: bool = False
) -> str:
    """
    Generate a completion using either OpenAI or Gemini based on AI_PROVIDER setting
    
    Args:
        system_prompt: System instructions
        user_message: User query
        model: Optional model override (uses settings default if not provided)
        temperature: Generation temperature
        use_search: Enable web search (only supported by Gemini)
    """
    provider = settings.ai_provider.lower()
    
    if provider == "gemini":
        return await _generate_with_gemini(system_prompt, user_message, temperature, use_search)
    elif provider == "openai":
        if use_search:
            # OpenAI doesn't have built-in search, fall back to standard completion
            print("Warning: Web search not supported by OpenAI, using standard completion")
        # Use model from settings if not explicitly provided
        openai_model = model or settings.openai_model
        return await _generate_with_openai(system_prompt, user_message, openai_model, temperature)
    else:
        raise Exception(f"Unknown AI provider: {provider}")

async def _generate_with_openai(
    system_prompt: str,
    user_message: str,
    model: str = "gpt-4o",
    temperature: float = 0.7
) -> str:
    """
    Generate a completion using OpenAI API
    """
    if not openai_client:
        raise Exception("OpenAI API key not configured")
    
    try:
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=temperature
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")

async def _generate_with_gemini(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.7,
    use_search: bool = False
) -> str:
    """
    Generate a completion using Google Gemini API (new google-genai SDK)
    
    Args:
        system_prompt: System instructions
        user_message: User query
        temperature: Generation temperature
        use_search: Enable Google Search grounding for web searches
    """
    if not gemini_client:
        raise Exception("Gemini API key not configured")
    
    try:
        # Combine system prompt with user message
        combined_prompt = f"{system_prompt}\n\n{user_message}"
        
        # Prepare configuration
        config_params = {
            "temperature": temperature,
        }
        
        # Add Google Search tool if requested
        if use_search:
            config_params["tools"] = [types.Tool(google_search=types.GoogleSearch())]
        
        config = types.GenerateContentConfig(**config_params)
        
        # Generate content using new SDK
        response = gemini_client.models.generate_content(
            model=settings.gemini_model,
            contents=combined_prompt,
            config=config,
        )
        
        return response.text
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

async def generate_profile_from_cv(cv_text: str) -> str:
    """
    Generate profile.md from CV text
    """
    system_prompt = """You are a profile analyzer. Extract key information from a CV and create a structured profile in markdown format.

Create a profile following this structure:

# [Full Name]

## Professional Summary
[2-3 sentence elevator pitch highlighting their key strengths and current role]

## Core Expertise
- [Expertise area 1]
- [Expertise area 2]
- [Expertise area 3]
- [etc.]

## Career Highlights
- [Achievement with specific metric]
- [Major project or milestone]
- [Recognition or awards]

## Industry Focus
[Primary industry/sector]

## Target Audience
- [Who they create content for - e.g., "Software developers"]
- [Another audience segment]

## Content Themes
1. [Theme 1 - e.g., "Best practices in software development"]
2. [Theme 2]
3. [Theme 3]

## Personal Brand Keywords
[Comma-separated keywords that define their brand: innovation, leadership, technical-excellence, etc.]

Extract actual information from the CV. Be specific and use real data points."""

    return await generate_completion(system_prompt, cv_text)

async def analyze_writing_style(posts: List[str]) -> str:
    """
    Analyze writing style from sample posts
    """
    system_prompt = """You are a writing style analyst. Analyze these LinkedIn posts and create a detailed writing style guide.

Create a guide following this structure:

# Writing Style Guide

## Tone & Voice
[Description of their tone: professional, casual, thought-leader, educator, etc.]

## Sentence Structure
- [Describe their sentence patterns: short punchy, flowing, etc.]
- Average sentence length: [X words]
- Paragraph style: [Single-line breaks vs longer paragraphs]

## Formatting Preferences
- Line breaks: [How they use white space]
- Emoji usage: [None / Occasional / Strategic]
- Hashtag strategy: [End of post / Inline / Specific count]
- Bold/Italic: [How they emphasize]

## Common Phrases & Patterns
- "[Example phrase they often use]"
- "[Another pattern]"
- [List any recurring expressions]

## Content Structure
[How they typically structure posts: Hook → Story → Insight → CTA, etc.]

## Key Characteristics
[What makes their writing unique and recognizable]

Be specific and use examples from the posts provided."""

    posts_text = "\n\n---POST---\n\n".join(posts)
    return await generate_completion(system_prompt, f"Analyze these posts:\n\n{posts_text}")

async def generate_context_json(cv_text: str, profile_md: str) -> Dict:
    """
    Generate context.json with structured metadata
    """
    system_prompt = """Extract structured information and output ONLY valid JSON (no markdown, no explanation).

Return a JSON object with this structure:
{
  "name": "Full Name",
  "current_role": "Job Title",
  "company": "Company Name",
  "industry": "Industry",
  "target_audience": ["audience1", "audience2"],
  "content_goals": ["goal1", "goal2"],
  "posting_frequency": "Nx per week",
  "tone": "professional/casual/etc",
  "expertise_tags": ["tag1", "tag2"],
  "content_mix": {
    "best_practices": 30,
    "tutorials": 25,
    "career_advice": 20,
    "trends": 15,
    "personal": 10
  }
}"""

    result = await generate_completion(
        system_prompt,
        f"CV:\n{cv_text}\n\nProfile:\n{profile_md}",
        temperature=0.3
    )
    
    # Parse JSON
    import json
    try:
        # Remove markdown code blocks if present
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        
        return json.loads(result.strip())
    except json.JSONDecodeError:
        # Return default structure if parsing fails
        return {
            "name": "User",
            "current_role": "Professional",
            "industry": "General",
            "target_audience": ["Professionals"],
            "content_goals": ["Build personal brand"],
            "posting_frequency": "2-3x per week",
            "tone": "professional",
            "expertise_tags": ["professional-development"],
            "content_mix": {
                "best_practices": 30,
                "tutorials": 25,
                "career_advice": 20,
                "trends": 15,
                "personal": 10
            }
        }

async def generate_default_preferences(style_choice: str) -> Dict:
    """
    Generate default preferences based on style choice
    """
    if style_choice == "top_creators":
        return {
            "post_type_distribution": {
                "text_only": 40,
                "text_with_image": 30,
                "carousel": 25,
                "video": 5
            },
            "content_mix": {
                "best_practices": 35,
                "technical_tutorials": 25,
                "career_advice": 15,
                "industry_trends": 15,
                "personal_journey": 10
            },
            "tone": "professional_yet_accessible",
            "hashtag_count": 4,
            "emoji_usage": "minimal",
            "sentence_max_length": 15,
            "hook_style": "data_driven"
        }
    else:  # my_style
        return {
            "post_type_distribution": {
                "text_only": 50,
                "text_with_image": 30,
                "carousel": 15,
                "video": 5
            },
            "content_mix": {
                "personal_insights": 40,
                "professional_tips": 30,
                "industry_commentary": 20,
                "career_stories": 10
            },
            "tone": "authentic_personal",
            "hashtag_count": 3,
            "emoji_usage": "moderate",
            "sentence_max_length": 20,
            "hook_style": "personal_story"
        }

async def generate_conversation_title(first_message: str) -> str:
    """
    Generate a concise 3-5 word title for a conversation based on the first message
    """
    system_prompt = """Generate a concise, descriptive title for a conversation based on the user's first message.

Rules:
- Keep it to 3-5 words maximum
- Use title case
- Focus on the main topic
- Be specific but concise
- No punctuation at the end

Examples:
"I want to write about AI in sales" → "AI in Sales Strategy"
"Help me with a post about remote work tips" → "Remote Work Best Practices"
"Need to create content on leadership" → "Leadership Content Ideas"

Output ONLY the title, nothing else."""

    try:
        title = await generate_completion(
            system_prompt=system_prompt,
            user_message=first_message,
            temperature=0.5
        )
        # Clean up the title
        title = title.strip().strip('"').strip("'")
        # Limit length just in case
        if len(title) > 50:
            title = title[:47] + "..."
        return title
    except:
        # Fallback to a simple truncation
        words = first_message.split()[:4]
        return " ".join(words).title()

async def find_trending_topics(expertise_areas: List[str], industry: str) -> List[Dict[str, str]]:
    """
    Find trending topics related to user's expertise and industry using web search
    
    Args:
        expertise_areas: List of expertise areas from CV
        industry: User's industry/sector
    
    Returns:
        List of trending topics with title and description
    """
    system_prompt = """You are a trend analyst. Using current web search results, identify 5-7 trending topics 
that are relevant to the user's expertise and industry.

For each topic, provide:
1. A concise title (3-5 words)
2. A brief description (1-2 sentences) explaining why it's trending and relevant
3. How it relates to their expertise

Format your response as a JSON array:
[
  {
    "title": "Topic Title",
    "description": "Why this topic is trending and relevant...",
    "relevance": "How it connects to their expertise..."
  }
]

Focus on:
- Current trends (last 3 months)
- Topics with high engagement potential
- Practical, actionable topics
- Mix of technical and strategic topics"""

    user_message = f"""Find trending topics for someone with this background:

Expertise Areas: {', '.join(expertise_areas)}
Industry: {industry}

Search for current trends, hot topics, and emerging discussions in their field that would make great LinkedIn content."""

    try:
        result = await generate_completion(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=0.7,
            use_search=True  # Enable web search
        )
        
        # Parse JSON
        import json
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        
        topics = json.loads(result.strip())
        return topics
    except Exception as e:
        print(f"Error finding trending topics: {str(e)}")
        # Return default topics if search fails
        return [
            {
                "title": "Industry Best Practices",
                "description": "Current best practices and methodologies in your field",
                "relevance": "Directly related to your expertise"
            },
            {
                "title": "Emerging Technologies",
                "description": "New technologies impacting your industry",
                "relevance": "Helps position you as forward-thinking"
            },
            {
                "title": "Professional Development",
                "description": "Career growth and skill development topics",
                "relevance": "Appeals to your target audience"
            }
        ]

async def research_topic_with_search(topic: str, context: str = "") -> str:
    """
    Research a specific topic using web search for current information
    
    Args:
        topic: The topic to research
        context: Optional context about the user's perspective or expertise
    
    Returns:
        Research summary with current insights
    """
    system_prompt = """You are a research assistant. Using current web search results, provide a comprehensive 
but concise summary of the given topic.

Include:
- Current state and recent developments
- Key statistics or data points
- Different perspectives or approaches
- Practical implications

Keep it focused and actionable for LinkedIn content creation."""

    user_message = f"Research this topic: {topic}"
    if context:
        user_message += f"\n\nContext: {context}"

    try:
        result = await generate_completion(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=0.7,
            use_search=True
        )
        return result
    except Exception as e:
        raise Exception(f"Failed to research topic: {str(e)}")
