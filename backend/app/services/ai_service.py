from openai import OpenAI
import google.generativeai as genai
from typing import Dict, List, Optional
from ..config import get_settings

settings = get_settings()

# Initialize OpenAI client
openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

# Initialize Gemini client
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
    # Use model from settings (default: gemini-2.5-flash)
    gemini_model = genai.GenerativeModel(settings.gemini_model)
else:
    gemini_model = None

async def generate_completion(
    system_prompt: str,
    user_message: str,
    model: Optional[str] = None,
    temperature: float = 0.7
) -> str:
    """
    Generate a completion using either OpenAI or Gemini based on AI_PROVIDER setting
    Model parameter is optional - uses settings.openai_model or settings.gemini_model by default
    """
    provider = settings.ai_provider.lower()
    
    if provider == "gemini":
        return await _generate_with_gemini(system_prompt, user_message, temperature)
    elif provider == "openai":
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
    temperature: float = 0.7
) -> str:
    """
    Generate a completion using Google Gemini API
    """
    if not gemini_model:
        raise Exception("Gemini API key not configured")
    
    try:
        # Gemini doesn't have separate system/user roles in the same way
        # Combine system prompt with user message
        combined_prompt = f"{system_prompt}\n\n{user_message}"
        
        # Configure generation
        generation_config = genai.types.GenerationConfig(
            temperature=temperature,
        )
        
        response = gemini_model.generate_content(
            combined_prompt,
            generation_config=generation_config
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

