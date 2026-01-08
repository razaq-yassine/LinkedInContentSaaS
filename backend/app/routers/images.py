from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime

from ..database import get_db
from ..routers.auth import get_current_user_id
from ..services.cloudflare_ai import generate_image, generate_image_from_post
from ..services.usage_tracking_service import log_image_generation
from ..services import credit_service
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
    cloudflare_cost: Optional[dict] = None  # Updated Cloudflare cost after regeneration

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
    
    # Check if user has sufficient credits for image regeneration (0.2 credits)
    credits_needed = 0.2
    if not credit_service.check_sufficient_credits(db, user_id, credits_needed):
        credits_info = credit_service.get_user_credits(db, user_id)
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient credits. You have {credits_info['credits_remaining']} credits but need {credits_needed} for image regeneration."
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
        
        # Calculate Cloudflare cost for this image generation
        from ..utils.cost_calculator import calculate_cloudflare_image_cost
        from ..config import get_settings
        cloudflare_settings = get_settings()
        
        # Extract image dimensions and steps from metadata or use defaults
        image_metadata = result.get("metadata", {})
        height = image_metadata.get("height", 1200)
        width = image_metadata.get("width", 1200)
        num_steps = image_metadata.get("num_steps", 25)
        model = image_metadata.get("model", cloudflare_settings.cloudflare_image_model if cloudflare_settings else None)
        
        cloudflare_cost = calculate_cloudflare_image_cost(
            image_count=1,
            height=height,
            width=width,
            num_steps=num_steps,
            model=model
        )
        
        # Update post's token_usage to append Cloudflare costs
        if post.generation_options:
            gen_options = post.generation_options if isinstance(post.generation_options, dict) else {}
            token_usage = gen_options.get("token_usage", {})
            
            # Initialize or update cloudflare_cost
            if "cloudflare_cost" in token_usage:
                # Append to existing costs
                existing_cost = token_usage["cloudflare_cost"]
                existing_image_count = existing_cost.get("image_count", 0)
                existing_total_cost = existing_cost.get("total_cost", 0.0)
                
                print(f"DEBUG: Updating cloudflare_cost - existing: count={existing_image_count}, cost={existing_total_cost}, new cost={cloudflare_cost['total_cost']}")
                
                token_usage["cloudflare_cost"] = {
                    "total_cost": round(existing_total_cost + cloudflare_cost["total_cost"], 8),
                    "cost_per_image": cloudflare_cost["cost_per_image"],
                    "image_count": existing_image_count + 1,
                    "tiles_per_image": cloudflare_cost.get("tiles_per_image"),
                    "steps_per_image": cloudflare_cost.get("steps_per_image")
                }
                print(f"DEBUG: Updated cloudflare_cost - new: count={token_usage['cloudflare_cost']['image_count']}, cost={token_usage['cloudflare_cost']['total_cost']}")
            else:
                # First image generation
                print(f"DEBUG: First cloudflare_cost - count={cloudflare_cost.get('image_count', 1)}, cost={cloudflare_cost['total_cost']}")
                token_usage["cloudflare_cost"] = cloudflare_cost
            
            gen_options["token_usage"] = token_usage
            post.generation_options = gen_options
            # Mark the JSON field as modified so SQLAlchemy detects the change
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(post, "generation_options")
            db.commit()
            db.refresh(post)  # Refresh to get the latest data
        
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
        
        # Deduct credits for image regeneration
        try:
            credit_service.deduct_credits(
                db=db,
                user_id=user_id,
                amount=credits_needed,
                action_type="image_regeneration",
                description="Regenerated image for post",
                post_id=post_id
            )
        except Exception as e:
            print(f"Warning: Failed to deduct credits: {str(e)}")
        
        # Log image generation usage
        try:
            log_image_generation(
                db=db,
                user_id=user_id,
                post_id=post_id,
                image_count=1,
                height=result["metadata"].get("height", 1120),
                width=result["metadata"].get("width", 1120),
                num_steps=result["metadata"].get("num_steps", 25),
                model=result["metadata"]["model"]
            )
        except Exception as e:
            print(f"Warning: Failed to log image generation usage: {str(e)}")
        
        # Get updated cloudflare_cost from post after commit
        # Re-query the post to ensure we have the latest data
        db.refresh(post)
        updated_cloudflare_cost = None
        if post.generation_options:
            gen_options = post.generation_options if isinstance(post.generation_options, dict) else {}
            token_usage = gen_options.get("token_usage", {})
            updated_cloudflare_cost = token_usage.get("cloudflare_cost")
            print(f"DEBUG: Retrieved cloudflare_cost from post: {updated_cloudflare_cost}")
        else:
            print(f"DEBUG: post.generation_options is None or empty")
        
        # If we updated it above but didn't get it, use the one we just set
        if not updated_cloudflare_cost and 'token_usage' in locals():
            updated_cloudflare_cost = token_usage.get("cloudflare_cost") if 'token_usage' in locals() else None
            print(f"DEBUG: Using local token_usage cloudflare_cost: {updated_cloudflare_cost}")
        
        print(f"DEBUG: Returning ImageGenerationResponse with cloudflare_cost: {updated_cloudflare_cost}")
        
        return ImageGenerationResponse(
            image_id=image_id,
            image=result["image"],
            format=result["format"],
            prompt=result["metadata"]["prompt"],
            model=result["metadata"]["model"],
            metadata=result["metadata"],
            post_id=post_id,
            is_current=True,
            cloudflare_cost=updated_cloudflare_cost
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image generation failed: {str(e)}"
        )

class CustomPromptImageRequest(BaseModel):
    custom_prompt: str

class RegeneratePromptResponse(BaseModel):
    image_prompt: str
    token_usage: Optional[dict] = None

@router.post("/generate-with-prompt/{post_id}", response_model=ImageGenerationResponse)
async def generate_image_with_custom_prompt(
    post_id: str,
    request: CustomPromptImageRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generate an image for a specific LinkedIn post using a custom prompt.
    Also updates the post's stored image_prompt.
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
        result = await generate_image_from_post(
            post_content=post.content,
            image_prompt=request.custom_prompt,
            post_format=post.format.value if post.format else "text"
        )
        
        # Update the post's image_prompt in generation_options
        if post.generation_options:
            gen_options = post.generation_options if isinstance(post.generation_options, dict) else {}
        else:
            gen_options = {}
        gen_options["image_prompt"] = request.custom_prompt
        post.generation_options = gen_options
        
        # Calculate Cloudflare cost for this image generation
        from ..utils.cost_calculator import calculate_cloudflare_image_cost
        from ..config import get_settings
        cloudflare_settings = get_settings()
        
        image_metadata = result.get("metadata", {})
        height = image_metadata.get("height", 1200)
        width = image_metadata.get("width", 1200)
        num_steps = image_metadata.get("num_steps", 25)
        model = image_metadata.get("model", cloudflare_settings.cloudflare_image_model if cloudflare_settings else None)
        
        cloudflare_cost = calculate_cloudflare_image_cost(
            image_count=1,
            height=height,
            width=width,
            num_steps=num_steps,
            model=model
        )
        
        # Update token_usage with cloudflare costs
        token_usage = gen_options.get("token_usage", {})
        if "cloudflare_cost" in token_usage:
            existing_cost = token_usage["cloudflare_cost"]
            existing_image_count = existing_cost.get("image_count", 0)
            existing_total_cost = existing_cost.get("total_cost", 0.0)
            token_usage["cloudflare_cost"] = {
                "total_cost": round(existing_total_cost + cloudflare_cost["total_cost"], 8),
                "cost_per_image": cloudflare_cost["cost_per_image"],
                "image_count": existing_image_count + 1,
                "tiles_per_image": cloudflare_cost.get("tiles_per_image"),
                "steps_per_image": cloudflare_cost.get("steps_per_image")
            }
        else:
            token_usage["cloudflare_cost"] = cloudflare_cost
        
        gen_options["token_usage"] = token_usage
        post.generation_options = gen_options
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(post, "generation_options")
        db.commit()
        db.refresh(post)
        
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
            prompt=request.custom_prompt,
            model=result["metadata"]["model"],
            image_metadata=result["metadata"],
            is_current=True
        )
        db.add(generated_image)
        db.commit()
        
        updated_cloudflare_cost = token_usage.get("cloudflare_cost")
        
        return ImageGenerationResponse(
            image_id=image_id,
            image=result["image"],
            format=result["format"],
            prompt=request.custom_prompt,
            model=result["metadata"]["model"],
            metadata=result["metadata"],
            post_id=post_id,
            is_current=True,
            cloudflare_cost=updated_cloudflare_cost
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image generation failed: {str(e)}"
        )

@router.post("/regenerate-prompt/{post_id}", response_model=RegeneratePromptResponse)
async def regenerate_image_prompt(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Regenerate the image prompt for a specific post using AI.
    Updates the post's stored image_prompt and tracks token usage.
    """
    from .generation import generate_image_prompt
    from ..models import UserProfile
    from ..utils.cost_calculator import calculate_cost
    
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
        # Get user profile for context
        profile = db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        context = profile.context_json if profile and profile.context_json else {}
        
        # Generate new image prompt
        new_prompt, prompt_token_usage = await generate_image_prompt(post.content, context)
        
        # Calculate cost for this prompt generation
        prompt_cost = calculate_cost(
            prompt_token_usage.get("input_tokens", 0),
            prompt_token_usage.get("output_tokens", 0),
            prompt_token_usage.get("model"),
            prompt_token_usage.get("provider")
        )
        
        # Update the post's image_prompt and token_usage in generation_options
        if post.generation_options:
            gen_options = post.generation_options if isinstance(post.generation_options, dict) else {}
        else:
            gen_options = {}
        gen_options["image_prompt"] = new_prompt
        
        # Accumulate token usage for image prompt regeneration
        existing_token_usage = gen_options.get("token_usage", {})
        
        # Track image_prompt_tokens separately (accumulated)
        existing_prompt_tokens = existing_token_usage.get("image_prompt_tokens", {})
        existing_prompt_tokens = {
            "input_tokens": existing_prompt_tokens.get("input_tokens", 0) + prompt_token_usage.get("input_tokens", 0),
            "output_tokens": existing_prompt_tokens.get("output_tokens", 0) + prompt_token_usage.get("output_tokens", 0),
            "total_tokens": existing_prompt_tokens.get("total_tokens", 0) + prompt_token_usage.get("total_tokens", 0),
        }
        existing_token_usage["image_prompt_tokens"] = existing_prompt_tokens
        
        # Track image_prompt_cost separately (accumulated)
        existing_prompt_cost = existing_token_usage.get("image_prompt_cost", {})
        existing_prompt_cost = {
            "input_cost": existing_prompt_cost.get("input_cost", 0) + prompt_cost.get("input_cost", 0),
            "output_cost": existing_prompt_cost.get("output_cost", 0) + prompt_cost.get("output_cost", 0),
            "total_cost": existing_prompt_cost.get("total_cost", 0) + prompt_cost.get("total_cost", 0),
        }
        existing_token_usage["image_prompt_cost"] = existing_prompt_cost
        existing_token_usage["image_prompt_provider"] = prompt_token_usage.get("provider")
        existing_token_usage["image_prompt_model"] = prompt_token_usage.get("model")
        
        gen_options["token_usage"] = existing_token_usage
        post.generation_options = gen_options
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(post, "generation_options")
        db.commit()
        
        # Return the full accumulated token usage
        return RegeneratePromptResponse(
            image_prompt=new_prompt,
            token_usage=existing_token_usage
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image prompt regeneration failed: {str(e)}"
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
