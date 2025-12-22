from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from ..database import get_db
from ..models import UserProfile
from ..routers.auth import get_current_user_id
from ..schemas.user import UserPreferences, UserProfileResponse, UpdatePreferencesRequest
from ..services.ai_service import find_trending_topics, generate_evergreen_content_ideas

router = APIRouter()

@router.get("/preferences")
async def get_user_preferences(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get user's generation preferences
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {
        "preferences": profile.preferences or {},
        "context": profile.context_json or {}
    }

@router.put("/preferences")
async def update_user_preferences(
    request: UpdatePreferencesRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update user's generation preferences
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.preferences = request.preferences
    db.commit()
    
    return {
        "success": True,
        "message": "Preferences updated successfully",
        "preferences": profile.preferences
    }

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get complete user profile
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return UserProfileResponse(
        user_id=profile.user_id,
        profile_md=profile.profile_md,
        writing_style_md=profile.writing_style_md,
        context_json=profile.context_json,
        preferences=profile.preferences,
        onboarding_step=profile.onboarding_step,
        onboarding_completed=profile.onboarding_completed
    )

@router.put("/profile/custom-instructions")
async def update_custom_instructions(
    instructions: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update custom instructions
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.custom_instructions = instructions
    db.commit()
    
    return {
        "success": True,
        "message": "Custom instructions updated"
    }

@router.post("/refresh-trending-topics")
async def refresh_trending_topics(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Refresh trending topics for the user's profile context
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    try:
        # Extract expertise areas and industry from context
        context_json = profile.context_json or {}
        expertise_areas = []
        
        if 'expertise' in context_json:
            expertise_areas = [e.get('skill', '') for e in context_json['expertise'] if e.get('skill')]
        elif 'expertise_tags' in context_json:
            expertise_areas = context_json['expertise_tags']
        
        industry = context_json.get('industry', 'General')
        
        if not expertise_areas:
            raise HTTPException(status_code=400, detail="No expertise areas found in profile")
        
        # Find new trending topics using web search
        trending_topics = await find_trending_topics(expertise_areas, industry)
        
        # Update context with new trending topics
        context_json['content_ideas_trending'] = trending_topics
        profile.context_json = context_json
        
        # Regenerate TOON if needed
        if profile.custom_instructions and profile.custom_instructions.startswith("TOON_CONTEXT:"):
            from ..utils.toon_parser import dict_to_toon
            try:
                toon_context = dict_to_toon(context_json)
                profile.custom_instructions = f"TOON_CONTEXT:\n{toon_context}"
            except Exception as e:
                print(f"Warning: Could not regenerate TOON: {str(e)}")
        
        db.commit()
        
        return {
            "success": True,
            "trending_topics": trending_topics,
            "message": f"Refreshed {len(trending_topics)} trending topics"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to refresh trending topics: {str(e)}")

@router.post("/generate-content-ideas")
async def generate_content_ideas(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generate more evergreen content ideas for the user
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    try:
        # Extract data from profile
        context_json = profile.context_json or {}
        cv_text = profile.cv_text or ""
        
        expertise_areas = []
        if 'expertise' in context_json:
            expertise_areas = [e.get('skill', '') for e in context_json['expertise'] if e.get('skill')]
        elif 'expertise_tags' in context_json:
            expertise_areas = context_json['expertise_tags']
        
        industry = context_json.get('industry', 'General')
        
        if not expertise_areas:
            raise HTTPException(status_code=400, detail="No expertise areas found in profile")
        
        # Generate new evergreen content ideas
        new_ideas = await generate_evergreen_content_ideas(
            cv_text=cv_text,
            expertise_areas=expertise_areas,
            industry=industry
        )
        
        return {
            "success": True,
            "content_ideas": new_ideas,
            "message": f"Generated {len(new_ideas)} new content ideas"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate content ideas: {str(e)}")


