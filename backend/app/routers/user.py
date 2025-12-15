from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..database import get_db
from ..models import UserProfile
from ..routers.auth import get_current_user_id
from ..schemas.user import UserPreferences, UserProfileResponse, UpdatePreferencesRequest

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


