from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from .ai_service import (
    generate_profile_from_cv,
    analyze_writing_style,
    generate_context_json,
    generate_default_preferences,
    find_trending_topics,
    generate_profile_context_toon,
    generate_evergreen_content_ideas
)
from ..models import UserProfile
from ..utils.toon_parser import parse_toon_to_dict, dict_to_toon
import json

async def build_user_profile(
    user_id: str,
    cv_text: str,
    writing_samples: List[str],
    style_choice: str,
    db: Session
) -> Dict:
    """
    Build complete user profile from CV and writing samples using TOON format.
    Returns dict with profile_md, writing_style_md, context_toon, context_json, preferences
    """
    
    print(f"🚀 Building user profile with TOON context for user {user_id}...")
    
    # Step 1: Generate TOON-based profile context with intelligent defaults
    print(f"📝 Generating TOON profile context...")
    try:
        toon_context, metadata = await generate_profile_context_toon(cv_text)
        print(f"✅ Generated TOON context with {len(metadata.get('ai_generated_fields', []))} AI-generated fields")
    except Exception as e:
        print(f"❌ Error generating TOON context: {str(e)}")
        # Fallback to legacy approach
        return await build_user_profile_legacy(user_id, cv_text, writing_samples, style_choice, db)
    
    # Step 2: Parse TOON to get structured data
    try:
        parsed_context = parse_toon_to_dict(toon_context)
        print(f"✅ Parsed TOON context successfully")
    except Exception as e:
        print(f"⚠️  Error parsing TOON: {str(e)}, using metadata parsed_data")
        parsed_context = metadata.get('parsed_data', {})
    
    # Step 3: Extract key info for content generation
    expertise_areas = []
    if 'expertise' in parsed_context:
        expertise_areas = [e.get('skill', '') for e in parsed_context['expertise'] if e.get('skill')]
    
    industry = parsed_context.get('industry', 'General')
    
    # Step 4: Generate evergreen content ideas
    print(f"💡 Generating evergreen content ideas...")
    try:
        evergreen_ideas = await generate_evergreen_content_ideas(
            cv_text=cv_text,
            expertise_areas=expertise_areas,
            industry=industry
        )
        print(f"✅ Generated {len(evergreen_ideas)} evergreen content ideas")
    except Exception as e:
        print(f"❌ Error generating evergreen ideas: {str(e)}")
        evergreen_ideas = []
    
    # Step 5: Find trending topics using web search
    print(f"🔍 Finding trending topics using web search...")
    try:
        if expertise_areas:
            trending_ideas = await find_trending_topics(expertise_areas, industry)
            print(f"✅ Found {len(trending_ideas)} trending topics")
        else:
            print("⚠️  No expertise areas found, skipping trending topics")
            trending_ideas = []
    except Exception as e:
        print(f"❌ Error finding trending topics: {str(e)}")
        trending_ideas = []
    
    # Step 6: Add content ideas to TOON context
    parsed_context['content_ideas_evergreen'] = evergreen_ideas
    parsed_context['content_ideas_trending'] = trending_ideas
    
    # Step 6.5: Initialize additional_context as empty (user-editable, not AI-generated)
    parsed_context['additional_context'] = ""
    
    # Step 7: Regenerate complete TOON with content ideas
    try:
        complete_toon = dict_to_toon(parsed_context)
        print(f"✅ Generated complete TOON context")
    except Exception as e:
        print(f"⚠️  Error serializing complete TOON: {str(e)}, using partial")
        complete_toon = toon_context
    
    # Step 8: Analyze writing style (only if user chose "my_style" and provided samples)
    writing_style_md = None
    if style_choice == "my_style" and writing_samples:
        print(f"✍️  Analyzing writing style from {len(writing_samples)} samples...")
        writing_style_md = await analyze_writing_style(writing_samples)
    else:
        # Use top creator format as default
        writing_style_md = """# Writing Style Guide

## Tone & Voice
Professional yet accessible, thought-leader focused on providing value

## Sentence Structure
- Short, punchy sentences for clarity
- Average sentence length: 10-12 words
- Single-line formatting for mobile readability

## Formatting Preferences
- Line breaks: One thought per line
- Emoji usage: Minimal, strategic only
- Hashtag strategy: 3-5 at end of post
- White space: Generous for scannability

## Content Structure
Hook → Context → Insight → Takeaway

## Key Characteristics
- Leads with bold hooks
- Data-driven insights
- Clear takeaways
- Mobile-first formatting
"""
    
    # Step 9: Generate legacy profile.md for display
    print(f"📄 Generating profile markdown...")
    profile_md = await generate_profile_from_cv(cv_text)
    
    # Step 10: Generate preferences based on style choice
    print(f"⚙️  Setting up preferences for style: {style_choice}...")
    preferences = await generate_default_preferences(style_choice)
    
    print(f"✅ Profile build complete!")
    
    return {
        "profile_md": profile_md,
        "writing_style_md": writing_style_md,
        "context_toon": complete_toon,  # TOON format for LLM consumption
        "context_json": parsed_context,  # Parsed structure for UI/editing
        "preferences": preferences,
        "ai_generated_fields": metadata.get('ai_generated_fields', [])
    }


async def build_user_profile_legacy(
    user_id: str,
    cv_text: str,
    writing_samples: List[str],
    style_choice: str,
    db: Session
) -> Dict:
    """
    Legacy profile builder (fallback if TOON generation fails)
    """
    print(f"⚠️  Using legacy profile builder...")
    
    # Generate profile from CV
    print(f"Generating profile for user {user_id}...")
    profile_md = await generate_profile_from_cv(cv_text)
    
    # Analyze writing style
    writing_style_md = None
    if style_choice == "my_style" and writing_samples:
        print(f"Analyzing writing style from {len(writing_samples)} samples...")
        writing_style_md = await analyze_writing_style(writing_samples)
    else:
        writing_style_md = """# Writing Style Guide

## Tone & Voice
Professional yet accessible, thought-leader focused on providing value

## Sentence Structure
- Short, punchy sentences for clarity
- Average sentence length: 10-12 words
- Single-line formatting for mobile readability

## Formatting Preferences
- Line breaks: One thought per line
- Emoji usage: Minimal, strategic only
- Hashtag strategy: 3-5 at end of post
- White space: Generous for scannability

## Content Structure
Hook → Context → Insight → Takeaway

## Key Characteristics
- Leads with bold hooks
- Data-driven insights
- Clear takeaways
- Mobile-first formatting
"""
    
    # Generate context JSON
    print(f"Generating context metadata...")
    context_json = await generate_context_json(cv_text, profile_md)
    
    # Find trending topics
    trending_topics = []
    try:
        expertise_areas = context_json.get("expertise_tags", [])
        industry = context_json.get("industry", "General")
        
        if expertise_areas:
            trending_topics = await find_trending_topics(expertise_areas, industry)
    except Exception as e:
        print(f"Error finding trending topics: {str(e)}")
    
    context_json["trending_topics"] = trending_topics
    
    # Generate preferences
    preferences = await generate_default_preferences(style_choice)
    
    return {
        "profile_md": profile_md,
        "writing_style_md": writing_style_md,
        "context_json": context_json,
        "preferences": preferences
    }

async def update_user_profile_in_db(
    user_id: str,
    profile_data: Dict,
    cv_data: bytes,
    cv_filename: str,
    cv_text: str,
    writing_samples: List[str],
    db: Session
) -> UserProfile:
    """
    Update user profile in database with generated data (including TOON context)
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
    
    # Update profile fields
    profile.cv_data = cv_data
    profile.cv_filename = cv_filename
    profile.cv_text = cv_text
    profile.profile_md = profile_data["profile_md"]
    profile.writing_style_md = profile_data["writing_style_md"]
    profile.context_json = profile_data.get("context_json", {})
    profile.preferences = profile_data["preferences"]
    profile.writing_samples = writing_samples
    
    # Store TOON context if available (for future use with LLM)
    if "context_toon" in profile_data:
        # Store TOON in custom_instructions field temporarily
        # (We can add a dedicated context_toon field in future migration)
        if not profile.custom_instructions:
            profile.custom_instructions = ""
        profile.custom_instructions = f"TOON_CONTEXT:\n{profile_data['context_toon']}"
    
    db.commit()
    db.refresh(profile)
    
    return profile


