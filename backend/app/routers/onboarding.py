from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from ..database import get_db
from ..models import UserProfile
from ..routers.auth import get_current_user_id
from ..services.file_processor import extract_text_from_pdf
from ..services.profile_builder import build_user_profile, update_user_profile_in_db

router = APIRouter()

class OnboardingStartResponse(BaseModel):
    user_id: str
    current_step: int

class ImportPostsRequest(BaseModel):
    posts: List[str]
    style_choice: str  # "top_creators" or "my_style"

class ProcessRequest(BaseModel):
    style_choice: str

class OnboardingPreviewResponse(BaseModel):
    profile_md: Optional[str]
    writing_style_md: Optional[str]
    context_json: Optional[Dict[str, Any]]
    preferences: Optional[Dict[str, Any]]

class UpdatePreferencesRequest(BaseModel):
    preferences: Dict[str, Any]

@router.post("/start", response_model=OnboardingStartResponse)
async def start_onboarding(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Initialize onboarding process
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    if not profile:
        profile = UserProfile(user_id=user_id, onboarding_step=1)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return OnboardingStartResponse(
        user_id=user_id,
        current_step=profile.onboarding_step
    )

@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Upload and process CV file
    Step 2 of onboarding wizard
    """
    # Validate file type
    valid_extensions = ('.pdf', '.jpg', '.jpeg', '.png', '.webp')
    if not file.filename.lower().endswith(valid_extensions):
        raise HTTPException(status_code=400, detail="Only PDF and image files (JPG, PNG, WebP) are supported")
    
    # Read file data
    cv_data = await file.read()
    
    # Extract text based on file type
    try:
        if file.filename.lower().endswith('.pdf'):
            cv_text = await extract_text_from_pdf(cv_data)
        else:
            # For images, we'd use OCR here (placeholder for now)
            # In production, use pytesseract or similar
            cv_text = "[CV uploaded as image - OCR processing would extract text here]\n\nPlease provide manual context about your professional background in the custom instructions section."
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
    
    # Update profile with CV data (don't process yet, wait for writing samples)
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
    
    profile.cv_data = cv_data
    profile.cv_filename = file.filename
    profile.cv_text = cv_text
    profile.onboarding_step = 3  # Move to next step
    
    db.commit()
    
    return {
        "success": True,
        "filename": file.filename,
        "text_length": len(cv_text),
        "message": "CV uploaded and processed successfully"
    }

@router.post("/import-posts")
async def import_posts(
    request: ImportPostsRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Import writing samples (LinkedIn posts)
    Step 3 of onboarding wizard
    """
    if request.style_choice == "my_style" and len(request.posts) < 1:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least 1 writing sample"
        )
    
    # Store posts temporarily
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please upload CV first.")
    
    profile.writing_samples = request.posts
    profile.onboarding_step = 4  # Move to processing step
    
    db.commit()
    
    return {
        "success": True,
        "posts_count": len(request.posts),
        "style_choice": request.style_choice,
        "message": "Writing samples saved successfully"
    }

@router.post("/process")
async def process_onboarding(
    request: ProcessRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Process CV and writing samples to generate profile
    Step 4 - Main processing
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile or not profile.cv_text:
        raise HTTPException(status_code=400, detail="CV not found. Please upload CV first.")
    
    try:
        # Build user profile using AI
        profile_data = await build_user_profile(
            user_id=user_id,
            cv_text=profile.cv_text,
            writing_samples=profile.writing_samples or [],
            style_choice=request.style_choice,
            db=db
        )
        
        # Update profile in database
        updated_profile = await update_user_profile_in_db(
            user_id=user_id,
            profile_data=profile_data,
            cv_data=profile.cv_data,
            cv_filename=profile.cv_filename,
            cv_text=profile.cv_text,
            writing_samples=profile.writing_samples or [],
            db=db
        )
        
        # Move to preview step
        updated_profile.onboarding_step = 5
        db.commit()
        
        return {
            "success": True,
            "message": "Profile generated successfully",
            "profile": {
                "profile_md": profile_data["profile_md"],
                "writing_style_md": profile_data["writing_style_md"],
                "context_json": profile_data["context_json"],
                "preferences": profile_data["preferences"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile generation failed: {str(e)}")

@router.get("/preview", response_model=OnboardingPreviewResponse)
async def get_preview(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get preview of generated profile for review
    Step 5 - Preview
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return OnboardingPreviewResponse(
        profile_md=profile.profile_md,
        writing_style_md=profile.writing_style_md,
        context_json=profile.context_json,
        preferences=profile.preferences
    )

@router.put("/preferences")
async def update_preferences(
    request: UpdatePreferencesRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update user preferences during preview
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.preferences = request.preferences
    db.commit()
    
    return {
        "success": True,
        "message": "Preferences updated successfully"
    }

@router.post("/complete")
async def complete_onboarding(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Mark onboarding as complete
    Final step
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if not profile.profile_md:
        raise HTTPException(status_code=400, detail="Profile not generated. Please complete all steps.")
    
    profile.onboarding_completed = True
    profile.onboarding_step = 6  # Completed
    db.commit()
    
    return {
        "success": True,
        "message": "Onboarding completed successfully",
        "redirect": "/dashboard"
    }
