from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from .ai_service import (
    generate_profile_from_cv,
    analyze_writing_style,
    generate_context_json,
    generate_default_preferences
)
from ..models import UserProfile

async def build_user_profile(
    user_id: str,
    cv_text: str,
    writing_samples: List[str],
    style_choice: str,
    db: Session
) -> Dict:
    """
    Build complete user profile from CV and writing samples
    Returns dict with profile_md, writing_style_md, context_json, preferences
    """
    
    # Generate profile from CV
    print(f"Generating profile for user {user_id}...")
    profile_md = await generate_profile_from_cv(cv_text)
    
    # Analyze writing style (only if user chose "my_style" and provided samples)
    writing_style_md = None
    if style_choice == "my_style" and writing_samples:
        print(f"Analyzing writing style from {len(writing_samples)} samples...")
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
    
    # Generate context JSON
    print(f"Generating context metadata...")
    context_json = await generate_context_json(cv_text, profile_md)
    
    # Generate preferences based on style choice
    print(f"Setting up preferences for style: {style_choice}...")
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
    Update user profile in database with generated data
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
    profile.context_json = profile_data["context_json"]
    profile.preferences = profile_data["preferences"]
    profile.writing_samples = writing_samples
    
    db.commit()
    db.refresh(profile)
    
    return profile


