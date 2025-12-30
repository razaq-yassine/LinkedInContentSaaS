from openai import OpenAI
from google import genai
from google.genai import types
from typing import Dict, List, Optional, Any
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
    use_search: bool = False,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> tuple[str, Dict[str, Any]]:
    """
    Generate a completion using either OpenAI or Gemini based on AI_PROVIDER setting
    
    Args:
        system_prompt: System instructions
        user_message: User query
        model: Optional model override (uses settings default if not provided)
        temperature: Generation temperature
        use_search: Enable web search (only supported by Gemini)
        conversation_history: Optional list of previous messages in format [{"role": "user|assistant", "content": "..."}]
    
    Returns:
        Tuple of (response_text, token_usage_dict) where token_usage_dict contains:
        - input_tokens: int
        - output_tokens: int
        - total_tokens: int
        - model: str
        - provider: str
    """
    provider = settings.ai_provider.lower()
    
    if provider == "gemini":
        return await _generate_with_gemini(system_prompt, user_message, temperature, use_search, conversation_history)
    elif provider == "openai":
        if use_search:
            # OpenAI doesn't have built-in search, fall back to standard completion
            print("Warning: Web search not supported by OpenAI, using standard completion")
        # Use model from settings if not explicitly provided
        openai_model = model or settings.openai_model
        return await _generate_with_openai(system_prompt, user_message, openai_model, temperature, conversation_history)
    else:
        raise Exception(f"Unknown AI provider: {provider}")

async def _generate_with_openai(
    system_prompt: str,
    user_message: str,
    model: str = "gpt-4o",
    temperature: float = 0.7,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> tuple[str, Dict[str, Any]]:
    """
    Generate a completion using OpenAI API
    
    Args:
        system_prompt: System instructions
        user_message: Current user query
        model: Model name
        temperature: Generation temperature
        conversation_history: Optional list of previous messages [{"role": "user|assistant", "content": "..."}]
    
    Returns:
        Tuple of (response_text, token_usage_dict)
    """
    if not openai_client:
        raise Exception("OpenAI API key not configured")
    
    try:
        # Build messages array with system prompt, conversation history, and current user message
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                # Ensure role is valid (user or assistant)
                role = msg.get("role", "user")
                if role not in ["user", "assistant"]:
                    role = "user"
                messages.append({
                    "role": role,
                    "content": msg.get("content", "")
                })
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        response = openai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature
        )
        
        # Extract token usage
        usage = response.usage
        token_usage = {
            "input_tokens": usage.prompt_tokens if usage else 0,
            "output_tokens": usage.completion_tokens if usage else 0,
            "total_tokens": usage.total_tokens if usage else 0,
            "model": model,
            "provider": "openai"
        }
        
        return response.choices[0].message.content, token_usage
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")

async def _generate_with_gemini(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.7,
    use_search: bool = False,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> tuple[str, Dict[str, Any]]:
    """
    Generate a completion using Google Gemini API (new google-genai SDK)
    
    Args:
        system_prompt: System instructions
        user_message: Current user query
        temperature: Generation temperature
        use_search: Enable Google Search grounding for web searches
        conversation_history: Optional list of previous messages [{"role": "user|assistant", "content": "..."}]
    
    Returns:
        Tuple of (response_text, token_usage_dict)
    """
    if not gemini_client:
        raise Exception("Gemini API key not configured")
    
    try:
        # Build conversation history string if provided
        history_text = ""
        if conversation_history:
            history_parts = []
            for msg in conversation_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    history_parts.append(f"User: {content}")
                elif role == "assistant":
                    history_parts.append(f"Assistant: {content}")
            if history_parts:
                history_text = "\n\n".join(history_parts) + "\n\n"
        
        # Combine system prompt, conversation history, and current user message
        combined_prompt = f"{system_prompt}\n\n{history_text}User: {user_message}"
        
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
        
        # Extract token usage from usage_metadata
        usage_metadata = getattr(response, 'usage_metadata', None)
        if usage_metadata:
            token_usage = {
                "input_tokens": getattr(usage_metadata, 'prompt_token_count', 0) or 0,
                "output_tokens": getattr(usage_metadata, 'candidates_token_count', 0) or 0,
                "total_tokens": getattr(usage_metadata, 'total_token_count', 0) or 0,
                "model": settings.gemini_model,
                "provider": "gemini"
            }
        else:
            # Fallback if usage_metadata is not available
            token_usage = {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "model": settings.gemini_model,
                "provider": "gemini"
            }
        
        return response.text, token_usage
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

async def generate_profile_from_cv(cv_text: str) -> tuple[str, Dict[str, Any]]:
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

    result, _ = await generate_completion(system_prompt, cv_text)
    return result

async def analyze_writing_style(posts: List[str]) -> tuple[str, Dict[str, Any]]:
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
    result, _ = await generate_completion(system_prompt, f"Analyze these posts:\n\n{posts_text}")
    return result

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

    result, _ = await generate_completion(
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

async def generate_profile_context_toon(
    cv_text: str, 
    industry_hint: str = None
) -> tuple[str, Dict[str, Any]]:
    """
    Generate comprehensive profile context in TOON format with intelligent defaults.
    Returns (toon_string, metadata_dict) where metadata includes which fields were AI-generated.
    
    Args:
        cv_text: Extracted CV text
        industry_hint: Optional industry hint from user
        
    Returns:
        Tuple of (TOON formatted string, metadata dict with ai_generated_fields)
    """
    system_prompt = """Extract comprehensive profile context from CV and generate intelligent defaults for missing fields.

Output TOON format with these sections:

1. PERSONAL INFO (extract from CV):
name: [Full Name]
current_role: [Job Title]
company: [Company or "Independent Professional"]
industry: [Specific industry]
years_experience: [Number]

2. EXPERTISE (extract skills/technologies with realistic assessment):
expertise[N]{skill,level,years,ai_generated}:
  [Skill],Expert|Advanced|Intermediate|Beginner,[Years],false|true
  
Levels: Expert (5+ years), Advanced (3-5), Intermediate (1-3), Beginner (<1)

3. TARGET AUDIENCE (infer from role and industry):
target_audience[N]{persona,description}:
  [Audience Type],[1-2 sentence description]

Examples:
- Software engineers → "Software Developers,Early to mid-career developers learning best practices"
- Marketing managers → "Marketing Professionals,Digital marketers looking to improve campaign performance"
- Executives → "Business Leaders,C-level executives and senior managers seeking strategic insights"

4. CONTENT STRATEGY (generate based on industry best practices):
content_goals[N]: [Goal1],[Goal2],[Goal3],[Goal4]
posting_frequency: [Recommended frequency based on industry]
tone: [Appropriate tone for industry and role]

Industry-specific tones:
- Tech/Engineering: technical yet accessible, educator mindset
- Marketing/Creative: engaging, storytelling-focused, visual
- Healthcare: professional, empathetic, evidence-based
- Finance/Legal: authoritative, data-driven, professional
- Leadership/Executive: strategic, visionary, thought-leader

5. CONTENT MIX (industry-appropriate percentages):
content_mix[5]{category,percentage}:
  [Category],[%]

Tech default: Best Practices,30 | Tutorials,25 | Career Advice,20 | Trends,15 | Personal,10
Marketing default: Case Studies,30 | Tips & Tricks,25 | Industry News,20 | Creative Ideas,15 | Personal,10
Healthcare default: Research Insights,30 | Best Practices,25 | Patient Stories,20 | Industry News,15 | Personal,10

6. AI-GENERATED TRACKING:
ai_generated_fields[N]: [field1],[field2],...

CRITICAL RULES:
1. NEVER leave any field empty
2. Mark fields as ai_generated:true if inferred (not directly in CV)
3. Be specific and realistic - no generic placeholders
4. Adjust all recommendations to industry context
5. Posting frequency defaults: Tech/Creative (2-3x/week), Healthcare/Finance (1-2x/week), Executive (1x/week)

Output only TOON format, no explanations."""

    result, token_usage = await generate_completion(
        system_prompt=system_prompt,
        user_message=f"CV Content:\n\n{cv_text}\n\n{f'Industry Hint: {industry_hint}' if industry_hint else ''}",
        temperature=0.5
    )
    
    # Parse metadata from the TOON result
    try:
        from ..utils.toon_parser import parse_toon_to_dict
        parsed = parse_toon_to_dict(result)
        
        # Extract AI-generated fields list
        ai_generated_fields = parsed.get('ai_generated_fields', [])
        
        metadata = {
            'ai_generated_fields': ai_generated_fields,
            'toon_format': result,
            'parsed_data': parsed,
            'token_usage': token_usage
        }
        
        return result, metadata
    except Exception as e:
        print(f"Error parsing TOON result: {str(e)}")
        # Return result anyway, let caller handle parsing
        return result, {'ai_generated_fields': [], 'toon_format': result, 'token_usage': token_usage}


async def generate_evergreen_content_ideas(
    cv_text: str,
    expertise_areas: List[str],
    industry: str,
    achievements: List[str] = None
) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Generate 10-15 evergreen content ideas based on CV achievements and expertise.
    
    Args:
        cv_text: Full CV text
        expertise_areas: List of expertise areas extracted from CV
        industry: User's industry
        achievements: Optional list of key achievements
        
    Returns:
        List of content idea dicts with title, format, hook, why_relevant, ai_generated
    """
    system_prompt = """Generate 10-15 evergreen content ideas based on the person's experience and achievements.

Each idea should be:
- Specific to their actual experience (use real numbers, projects, technologies from CV)
- Actionable and valuable for their target audience
- Varied in format (mix of carousel, text, text_with_image, video)
- Timeless (not trend-dependent)

For each idea, output JSON array with:
{
  "title": "Compelling title based on real experience",
  "format": "carousel|text|text_with_image|video",
  "hook": "Opening line that grabs attention (use specific numbers/details from CV)",
  "why_relevant": "Why this topic matters based on their unique experience",
  "ai_generated": false
}

Format distribution aim:
- Carousel: 40% (best for multi-point lessons, frameworks, before/after)
- Text: 30% (best for stories, opinions, quick insights)
- Text with image: 20% (best for single powerful concept with visual)
- Video: 10% (best for tutorials, demos, personal messages)

Examples of good hooks:
- "5 years ago, I made a mistake that cost $50K..." (use real timeframe/numbers)
- "After leading 15 teams, here's what nobody tells you about..."
- "The framework I used to go from X to Y in [timeframe]..."

Focus on their achievements, lessons learned, mistakes made, frameworks developed, and unique insights."""

    achievements_text = ""
    if achievements:
        achievements_text = f"\n\nKey Achievements:\n" + "\n".join(f"- {a}" for a in achievements)
    
    user_message = f"""Generate evergreen content ideas for this professional:

CV Excerpt:
{cv_text[:2000]}

Expertise Areas: {', '.join(expertise_areas)}
Industry: {industry}{achievements_text}

Create 10-15 unique, specific ideas based on their actual experience."""

    try:
        result, token_usage = await generate_completion(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=0.7
        )
        
        # Parse JSON array
        import json
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        
        ideas = json.loads(result.strip())
        
        # Ensure all ideas have required fields
        for idea in ideas:
            if 'ai_generated' not in idea:
                idea['ai_generated'] = False
                
        ideas_result = ideas[:15]  # Max 15 ideas
        return ideas_result, token_usage
        
    except Exception as e:
        print(f"Error generating evergreen ideas: {str(e)}")
        # Return minimal default ideas
        return [
            {
                "title": f"Lessons from {len(expertise_areas)} Years in {industry}",
                "format": "carousel",
                "hook": f"After working in {industry}, here's what I've learned...",
                "why_relevant": "Based on your professional experience",
                "ai_generated": True
            },
            {
                "title": f"Key Skills Every {industry} Professional Needs",
                "format": "text",
                "hook": "The skills that matter most in today's market...",
                "why_relevant": "Aligned with your expertise areas",
                "ai_generated": True
            }
        ], {
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "model": "unknown",
            "provider": "unknown"
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
        title, token_usage = await generate_completion(
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
    Find trending topics related to user's expertise and industry using web search.
    Returns content ideas in format compatible with TOON structure.
    
    Args:
        expertise_areas: List of expertise areas from CV
        industry: User's industry/sector
    
    Returns:
        List of trending content ideas with title, format, hook, why_relevant, source
    """
    system_prompt = """You are a trend analyst. Using current web search results, identify 5-10 trending topics 
that are relevant to the user's expertise and industry.

For each topic, provide:
1. A compelling title (5-8 words) that would work as a LinkedIn post
2. Suggested format (carousel, text, text_with_image, or video)
3. A hook - the opening line for the post
4. Why it's relevant to this specific professional
5. Mark source as "web_search"

Format your response as a JSON array:
[
  {
    "title": "Compelling Post Title About Trending Topic",
    "format": "carousel|text|text_with_image|video",
    "hook": "Opening line that references current trend...",
    "why_relevant": "Why this matters for their expertise/industry",
    "source": "web_search"
  }
]

Format selection guidelines:
- Carousel: Multi-point trends, comparisons, predictions
- Text: Opinion pieces, hot takes, analysis
- Text with image: Single powerful stat or insight
- Video: Demos, explanations, reactions

Focus on:
- Current trends (last 1-3 months)
- Topics with high engagement potential
- Practical, actionable topics
- Mix of technical and strategic topics"""

    user_message = f"""Find trending topics for someone with this background:

Expertise Areas: {', '.join(expertise_areas)}
Industry: {industry}

Search for current trends, hot topics, and emerging discussions in their field that would make great LinkedIn content."""

    try:
        result, token_usage = await generate_completion(
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
        
        # Ensure all topics have required fields
        for topic in topics:
            if 'source' not in topic:
                topic['source'] = 'web_search'
            if 'format' not in topic:
                topic['format'] = 'text'
                
        return topics[:10]  # Max 10 trending topics
        
    except Exception as e:
        print(f"Error finding trending topics: {str(e)}")
        # Return default topics if search fails
        return [
            {
                "title": "Current Best Practices in Your Industry",
                "format": "text",
                "hook": "The industry is evolving fast. Here's what's working now...",
                "why_relevant": "Directly related to your expertise",
                "source": "web_search"
            },
            {
                "title": "Emerging Technologies to Watch",
                "format": "carousel",
                "hook": "5 technologies that will change how we work...",
                "why_relevant": "Helps position you as forward-thinking",
                "source": "web_search"
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
        result, token_usage = await generate_completion(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=0.7,
            use_search=True
        )
        return result
    except Exception as e:
        raise Exception(f"Failed to research topic: {str(e)}")
