from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime

from ..database import get_db
from ..routers.auth import get_current_user_id
from ..services.cloudflare_ai import generate_image, generate_image_from_post
from ..models import GeneratedPost, GeneratedImage

router = APIRouter()

class ImageGenerationRequest(BaseModel):
    prompt: str
    guidance: Optional[float] = 4.5
    num_steps: Optional[int] = None
    seed: Optional[int] = None
    height: Optional[int] = 1120
    width: Optional[int] = 1120
    post_id: Optional[str] = None  # If provided, saves to post and marks as current

class ImageFromPostRequest(BaseModel):
    post_id: str
    custom_prompt: Optional[str] = None
    auto_generate: Optional[bool] = False  # Auto-generate on post creation

class ImageGenerationResponse(BaseModel):
    image_id: str
    image: str  # base64 encoded
    format: str
    prompt: str
    model: str
    metadata: dict
    post_id: Optional[str] = None
    is_current: bool = False

class ImageHistoryItem(BaseModel):
    id: str
    image: str  # base64 encoded
    prompt: str
    model: Optional[str]
    is_current: bool
    created_at: datetime

class ImageHistoryResponse(BaseModel):
    images: List[ImageHistoryItem]
    current_image_id: Optional[str] = None

@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image_endpoint(
    request: ImageGenerationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generate an image from a text prompt using Cloudflare Workers AI
    If post_id is provided, saves to database and marks as current
    """
    try:
        result = await generate_image(
            prompt=request.prompt,
            guidance=request.guidance or 4.5,
            num_steps=request.num_steps,
            seed=request.seed,
            height=request.height or 1120,
            width=request.width or 1120
        )
        
        image_id = str(uuid.uuid4())
        is_current = False
        
        # If post_id provided, save to database
        if request.post_id:
            # Verify post exists and belongs to user
            post = db.query(GeneratedPost).filter(
                GeneratedPost.id == request.post_id,
                GeneratedPost.user_id == user_id
            ).first()
            
            if not post:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Post not found"
                )
            
            # Mark all other images for this post as not current
            db.query(GeneratedImage).filter(
                GeneratedImage.post_id == request.post_id
            ).update({"is_current": False})
            
            # Save new image
            generated_image = GeneratedImage(
                id=image_id,
                post_id=request.post_id,
                user_id=user_id,
                image_data=result["image"],
                prompt=request.prompt,
                model=result["metadata"]["model"],
                image_metadata=result["metadata"],
                is_current=True
            )
            db.add(generated_image)
            db.commit()
            is_current = True
        
        return ImageGenerationResponse(
            image_id=image_id,
            image=result["image"],
            format=result["format"],
            prompt=request.prompt,
            model=result["metadata"]["model"],
            metadata=result["metadata"],
            post_id=request.post_id,
            is_current=is_current
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image generation failed: {str(e)}"
        )

@router.post("/generate/{post_id}", response_model=ImageGenerationResponse)
async def generate_image_for_post(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generate an image for a specific LinkedIn post by ID
    Automatically saves to database and marks as current
    """
    # Get the post
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    try:
        # Get image prompt from post options
        image_prompt = None
        if post.generation_options:
            image_prompt = post.generation_options.get("image_prompt")
        
        if not image_prompt:
            # Generate a default prompt based on post content
            image_prompt = f"Professional LinkedIn post illustration: {post.content[:200]}"
        
        result = await generate_image_from_post(
            post_content=post.content,
            image_prompt=image_prompt,
            post_format=post.format.value if post.format else "text"
        )
        
        # Mark all other images for this post as not current
        db.query(GeneratedImage).filter(
            GeneratedImage.post_id == post_id
        ).update({"is_current": False})
        
        # Save new image
        image_id = str(uuid.uuid4())
        generated_image = GeneratedImage(
            id=image_id,
            post_id=post_id,
            user_id=user_id,
            image_data=result["image"],
            prompt=result["metadata"]["prompt"],
            model=result["metadata"]["model"],
            image_metadata=result["metadata"],
            is_current=True
        )
        db.add(generated_image)
        db.commit()
        
        return ImageGenerationResponse(
            image_id=image_id,
            image=result["image"],
            format=result["format"],
            prompt=result["metadata"]["prompt"],
            model=result["metadata"]["model"],
            metadata=result["metadata"],
            post_id=post_id,
            is_current=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image generation failed: {str(e)}"
        )

@router.get("/history/{post_id}", response_model=ImageHistoryResponse)
async def get_image_history(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get image history for a post
    """
    # Verify post exists and belongs to user
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Get all images for this post
    images = db.query(GeneratedImage).filter(
        GeneratedImage.post_id == post_id
    ).order_by(GeneratedImage.created_at.desc()).all()
    
    current_image_id = None
    for img in images:
        if img.is_current:
            current_image_id = img.id
            break
    
    return ImageHistoryResponse(
        images=[
            ImageHistoryItem(
                id=img.id,
                image=img.image_data,
                prompt=img.prompt,
                model=img.model,
                is_current=img.is_current,
                created_at=img.created_at
            )
            for img in images
        ],
        current_image_id=current_image_id
    )

@router.get("/current/{post_id}")
async def get_current_image(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get the current image for a post
    """
    # Verify post exists and belongs to user
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Get current image
    current_image = db.query(GeneratedImage).filter(
        GeneratedImage.post_id == post_id,
        GeneratedImage.is_current == True
    ).first()
    
    if not current_image:
        return {"image": None, "image_id": None}
    
    return {
        "image_id": current_image.id,
        "image": current_image.image_data,
        "prompt": current_image.prompt,
        "model": current_image.model,
        "created_at": current_image.created_at.isoformat()
    }

@router.put("/set-current/{image_id}")
async def set_current_image(
    image_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Set an image as the current one for its post
    """
    # Get image and verify ownership
    image = db.query(GeneratedImage).filter(
        GeneratedImage.id == image_id,
        GeneratedImage.user_id == user_id
    ).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Mark all images for this post as not current
    db.query(GeneratedImage).filter(
        GeneratedImage.post_id == image.post_id
    ).update({"is_current": False})
    
    # Mark this image as current
    image.is_current = True
    db.commit()
    
    return {
        "success": True,
        "message": "Image set as current",
        "image_id": image_id,
        "post_id": image.post_id
    }

@router.get("/test-connection")
async def test_cloudflare_connection_endpoint(
    user_id: str = Depends(get_current_user_id)
):
    """
    Test if Cloudflare Workers AI is configured correctly
    """
    from ..services.cloudflare_ai import test_cloudflare_connection
    
    success = await test_cloudflare_connection()
    
    if success:
        return {
            "success": True,
            "message": "Cloudflare Workers AI is configured correctly"
        }
    else:
        return {
            "success": False,
            "message": "Cloudflare Workers AI configuration failed. Check your credentials."
        }
