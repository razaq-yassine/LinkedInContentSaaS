from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from ..database import get_db
from ..models import UserProfile, GeneratedComment
from ..routers.auth import get_current_user_id
from ..schemas.generation import (
    CommentEvaluationRequest,
    CommentEvaluationResponse,
    CommentGenerationRequest,
    CommentGenerationResponse
)
from ..services.worthiness_evaluator import evaluate_comment_worthiness, extract_post_from_screenshot
from ..services.ai_service import generate_completion
from ..services.file_processor import process_image_upload
from ..prompts.system_prompts import build_comment_generation_prompt

router = APIRouter()

@router.post("/evaluate", response_model=CommentEvaluationResponse)
async def evaluate_comment(
    request: CommentEvaluationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Evaluate worthiness of commenting on a post
    Uses 24-point rubric
    """
    # Get user profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile or not profile.onboarding_completed:
        raise HTTPException(status_code=400, detail="Please complete onboarding first")
    
    try:
        # Process screenshot/image
        screenshot_path = await process_image_upload(request.screenshot)
        
        # Extract text from screenshot (placeholder for now)
        # In production, use OCR
        post_text = await extract_post_from_screenshot(screenshot_path)
        
        # For MVP, we'll use a simplified approach:
        # If screenshot is actually text (for testing), use it directly
        if not request.screenshot.startswith("data:image"):
            post_text = request.screenshot
        
        # Get user expertise from profile
        context = profile.context_json or {}
        expertise = ", ".join(context.get("expertise_tags", ["professional"]))
        
        # Evaluate worthiness
        evaluation = await evaluate_comment_worthiness(
            original_post_text=post_text,
            user_expertise=expertise,
            user_profile=profile.profile_md or ""
        )
        
        return CommentEvaluationResponse(
            score=evaluation["total_score"],
            reasoning=evaluation["reasoning"],
            recommendation=evaluation["recommendation"],
            extracted_post_text=post_text
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.post("/generate", response_model=CommentGenerationResponse)
async def generate_comment(
    request: CommentGenerationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generate a comment for a post (after worthiness evaluation)
    """
    # Get user profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile or not profile.onboarding_completed:
        raise HTTPException(status_code=400, detail="Please complete onboarding first")
    
    try:
        # Process screenshot
        screenshot_path = await process_image_upload(request.screenshot)
        
        # Extract post text
        post_text = await extract_post_from_screenshot(screenshot_path)
        if not request.screenshot.startswith("data:image"):
            post_text = request.screenshot
        
        # Get expertise
        context = profile.context_json or {}
        expertise = ", ".join(context.get("expertise_tags", ["professional"]))
        
        # Evaluate worthiness first
        evaluation = await evaluate_comment_worthiness(
            original_post_text=post_text,
            user_expertise=expertise,
            user_profile=profile.profile_md or ""
        )
        
        # Check if should comment
        if evaluation["recommendation"] == "SKIP":
            return CommentGenerationResponse(
                id="",
                content="",
                worthiness_score=evaluation["total_score"],
                recommendation="SKIP",
                created_at=None
            )
        
        # Build comment generation prompt
        system_prompt = build_comment_generation_prompt(
            profile_md=profile.profile_md or "",
            writing_style_md=profile.writing_style_md or "",
            original_post=post_text,
            worthiness_evaluation=evaluation
        )
        
        # Generate comment
        comment_content = await generate_completion(
            system_prompt=system_prompt,
            user_message=f"Generate a valuable comment for this post, adding unique insight from my expertise:\n\n{post_text}",
            temperature=0.8
        )
        
        # Save to database
        comment_id = str(uuid.uuid4())
        comment = GeneratedComment(
            id=comment_id,
            user_id=user_id,
            original_post_screenshot=screenshot_path,
            original_post_text=post_text,
            worthiness_score=evaluation["total_score"],
            worthiness_reasoning=evaluation["reasoning"],
            recommendation=evaluation["recommendation"],
            content=comment_content
        )
        
        db.add(comment)
        db.commit()
        db.refresh(comment)
        
        return CommentGenerationResponse(
            id=comment.id,
            content=comment.content,
            worthiness_score=comment.worthiness_score,
            recommendation=comment.recommendation,
            created_at=comment.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comment generation failed: {str(e)}")

@router.get("/history")
async def get_comment_history(
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get user's comment generation history
    """
    comments = db.query(GeneratedComment).filter(
        GeneratedComment.user_id == user_id
    ).order_by(GeneratedComment.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": c.id,
            "content": c.content,
            "worthiness_score": c.worthiness_score,
            "recommendation": c.recommendation,
            "original_post_text": c.original_post_text[:200] + "..." if c.original_post_text else "",
            "created_at": c.created_at
        }
        for c in comments
    ]

@router.put("/{comment_id}")
async def update_comment(
    comment_id: str,
    content: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update/edit a generated comment
    """
    comment = db.query(GeneratedComment).filter(
        GeneratedComment.id == comment_id,
        GeneratedComment.user_id == user_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment.user_edited_content = content
    db.commit()
    
    return {
        "success": True,
        "message": "Comment updated successfully"
    }
