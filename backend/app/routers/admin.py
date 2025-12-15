from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import User, UserProfile, AdminSetting, GeneratedPost, GeneratedComment
from ..routers.auth import get_current_user_id

router = APIRouter()

# TODO: Add admin role checking middleware
# For now, all authenticated users can access admin endpoints (development only)

class UserListResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    account_type: str
    onboarding_completed: bool
    created_at: datetime
    posts_count: int
    comments_count: int

class AdminRulesResponse(BaseModel):
    system_prompt: str
    content_format_guidelines: str
    comment_worthiness_rubric: str
    default_preferences: str
    trending_topics: str

class UpdateRulesRequest(BaseModel):
    key: str
    value: str

@router.get("/users", response_model=List[UserListResponse])
async def get_all_users(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all users with stats
    """
    users = db.query(User).all()
    
    result = []
    for user in users:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        posts_count = db.query(GeneratedPost).filter(GeneratedPost.user_id == user.id).count()
        comments_count = db.query(GeneratedComment).filter(GeneratedComment.user_id == user.id).count()
        
        result.append(UserListResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            account_type=user.account_type.value,
            onboarding_completed=profile.onboarding_completed if profile else False,
            created_at=user.created_at,
            posts_count=posts_count,
            comments_count=comments_count
        ))
    
    return result

@router.get("/rules", response_model=AdminRulesResponse)
async def get_admin_rules(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all AI rules and settings
    """
    settings = db.query(AdminSetting).all()
    settings_dict = {s.key: s.value for s in settings}
    
    return AdminRulesResponse(
        system_prompt=settings_dict.get("system_prompt", ""),
        content_format_guidelines=settings_dict.get("content_format_guidelines", ""),
        comment_worthiness_rubric=settings_dict.get("comment_worthiness_rubric", ""),
        default_preferences=settings_dict.get("default_preferences", "{}"),
        trending_topics=settings_dict.get("trending_topics", "[]")
    )

@router.put("/rules")
async def update_admin_rules(
    request: UpdateRulesRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update specific AI rule/setting
    """
    setting = db.query(AdminSetting).filter(AdminSetting.key == request.key).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    setting.value = request.value
    db.commit()
    
    return {
        "success": True,
        "message": f"Updated {request.key} successfully"
    }

@router.post("/users/{target_user_id}/reset")
async def reset_user_onboarding(
    target_user_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Reset user's onboarding status
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == target_user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    profile.onboarding_completed = False
    profile.onboarding_step = 1
    db.commit()
    
    return {
        "success": True,
        "message": "User onboarding reset successfully"
    }

@router.get("/stats")
async def get_system_stats(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get system-wide statistics
    """
    total_users = db.query(User).count()
    completed_onboarding = db.query(UserProfile).filter(
        UserProfile.onboarding_completed == True
    ).count()
    total_posts = db.query(GeneratedPost).count()
    total_comments = db.query(GeneratedComment).count()
    
    # Average ratings
    from sqlalchemy import func
    avg_post_rating = db.query(func.avg(GeneratedPost.user_rating)).filter(
        GeneratedPost.user_rating.isnot(None)
    ).scalar()
    
    return {
        "total_users": total_users,
        "completed_onboarding": completed_onboarding,
        "total_posts_generated": total_posts,
        "total_comments_generated": total_comments,
        "average_post_rating": round(avg_post_rating, 2) if avg_post_rating else 0
    }

@router.delete("/users/{target_user_id}")
async def delete_user(
    target_user_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete a user and all their data
    """
    user = db.query(User).filter(User.id == target_user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # SQLAlchemy cascade will handle deleting related records
    db.delete(user)
    db.commit()
    
    return {
        "success": True,
        "message": "User deleted successfully"
    }
