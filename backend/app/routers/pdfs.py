from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid
from datetime import datetime
import asyncio

from ..database import get_db
from ..routers.auth import get_current_user_id
from ..services.cloudflare_ai import generate_image
from ..services.pdf_service import create_carousel_pdf
from ..services.usage_tracking_service import log_image_generation
from ..models import GeneratedPost, GeneratedPDF, GeneratedImage

router = APIRouter()

# In-memory progress tracking (in production, use Redis or similar)
pdf_generation_progress: Dict[str, Dict] = {}

class CarouselPDFGenerationRequest(BaseModel):
    post_id: str
    prompts: List[str]  # Array of prompts for each slide
    slide_indices: Optional[List[int]] = None  # Optional: indices of slides to regenerate

class PDFGenerationResponse(BaseModel):
    pdf_id: str
    pdf: str  # base64 encoded
    slide_images: Optional[List[str]] = None  # Array of base64 slide images for preview
    format: str
    slide_count: int
    prompts: List[str]
    model: str
    post_id: str
    is_current: bool = False
    cloudflare_cost: Optional[dict] = None  # Updated Cloudflare cost after regeneration

class PDFHistoryItem(BaseModel):
    id: str
    pdf: str  # base64 encoded
    slide_images: Optional[List[str]] = None  # Array of base64 slide images
    slide_count: int
    prompts: List[str]
    is_current: bool
    created_at: datetime

class PDFHistoryResponse(BaseModel):
    pdfs: List[PDFHistoryItem]
    current_pdf_id: Optional[str] = None

@router.get("/progress/{post_id}")
async def get_pdf_generation_progress(
    post_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get progress of PDF generation for a post
    """
    progress = pdf_generation_progress.get(post_id, {})
    if not progress:
        return {
            "status": "not_started",
            "current": 0,
            "total": 0
        }
    
    return {
        "status": progress.get("status", "generating"),
        "current": progress.get("current", 0),
        "total": progress.get("total", 0),
        "completed": progress.get("status") == "completed"
    }

@router.post("/generate-carousel", response_model=PDFGenerationResponse)
async def generate_carousel_pdf(
    request: CarouselPDFGenerationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generate a carousel PDF by:
    1. Generating images for each prompt
    2. Merging them into a PDF
    3. Storing in database
    """
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
    
    if post.format.value != 'carousel':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post must be a carousel type"
        )
    
    # Check if this is a partial regeneration
    is_partial_regeneration = request.slide_indices is not None and len(request.slide_indices) > 0
    
    # Get existing PDF if partial regeneration
    existing_slide_images = []
    existing_prompts = []
    if is_partial_regeneration:
        current_pdf = db.query(GeneratedPDF).filter(
            GeneratedPDF.post_id == request.post_id,
            GeneratedPDF.is_current == True
        ).first()
        
        if not current_pdf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No current PDF found for partial regeneration"
            )
        
        existing_slide_images = current_pdf.slide_images if current_pdf.slide_images else []
        existing_prompts = current_pdf.prompts if current_pdf.prompts else []
        
        # Validate slide indices
        max_index = len(existing_slide_images) - 1
        for idx in request.slide_indices:
            if idx < 0 or idx > max_index:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid slide index: {idx}. Valid range: 0-{max_index}"
                )
        
        # Validate prompts match slide indices
        if len(request.prompts) != len(request.slide_indices):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Number of prompts ({len(request.prompts)}) must match number of slide indices ({len(request.slide_indices)})"
            )
    
    # Initialize progress tracking
    total_slides = len(request.prompts) if not is_partial_regeneration else len(request.slide_indices)
    pdf_generation_progress[request.post_id] = {
        "status": "generating",
        "current": 0,
        "total": total_slides
    }
    
    try:
        # Validate prompts
        if not request.prompts or len(request.prompts) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one prompt is required for carousel generation"
            )
        
        # Generate images for prompts (either all or selected slides)
        new_slide_images = []
        model_used = None
        total_cloudflare_cost = 0.0
        images_generated = 0
        
        # Import cost calculator
        from ..utils.cost_calculator import calculate_cloudflare_image_cost
        from ..config import get_settings
        cloudflare_settings = get_settings()
        
        prompts_to_process = request.prompts
        if is_partial_regeneration:
            # Only process prompts for selected slides
            prompts_to_process = request.prompts
        
        for i, prompt in enumerate(prompts_to_process):
            # Retry logic for rate limit errors
            max_retries = 3
            retry_delay = 2  # Start with 2 seconds
            result = None
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    # Update progress
                    pdf_generation_progress[request.post_id]["current"] = i + 1
                    
                    # Generate images at LinkedIn's exact carousel dimensions
                    # Square format: 1080x1080 (most common and recommended)
                    result = await generate_image(
                        prompt=prompt,
                        guidance=7.5,
                        num_steps=25,
                        height=1080,
                        width=1080
                    )
                    # Success - break out of retry loop
                    break
                    
                except Exception as e:
                    error_message = str(e)
                    is_rate_limit = "429" in error_message or "Capacity temporarily exceeded" in error_message or "rate limit" in error_message.lower()
                    
                    if is_rate_limit and attempt < max_retries - 1:
                        # Rate limit error - retry with exponential backoff
                        wait_time = retry_delay * (2 ** attempt)  # 2s, 4s, 8s
                        print(f"Rate limit hit for slide {i + 1}, attempt {attempt + 1}/{max_retries}. Waiting {wait_time}s before retry...")
                        await asyncio.sleep(wait_time)
                        last_error = e
                        continue
                    else:
                        # Not a rate limit or max retries reached - raise immediately
                        raise
            
            # If we exhausted retries, raise the last error
            if result is None:
                error_message = str(last_error) if last_error else f"Failed to generate image for slide {i + 1} after {max_retries} attempts"
                pdf_generation_progress[request.post_id]["status"] = "error"
                is_rate_limit = "429" in error_message or "Capacity temporarily exceeded" in error_message or "rate limit" in error_message.lower()
                
                if is_rate_limit:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Cloudflare API rate limit exceeded after {max_retries} retries. Please wait a moment and try again. Error: {error_message}"
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to generate image for slide {i + 1}: {error_message}"
                    )
            
            # Validate image result
            try:
                if not result or "image" not in result:
                    raise ValueError(f"No image data returned for slide {i + 1}")
                
                image_data = result["image"]
                if not image_data or len(image_data) < 100:  # Basic validation
                    raise ValueError(f"Invalid image data for slide {i + 1}")
                
                new_slide_images.append(image_data)
                if not model_used:
                    model_used = result.get("metadata", {}).get("model", "cloudflare")
                
                # Calculate cost for this image
                image_metadata = result.get("metadata", {})
                height = image_metadata.get("height", 1080)
                width = image_metadata.get("width", 1080)
                num_steps = image_metadata.get("num_steps", 25)
                model = image_metadata.get("model", cloudflare_settings.cloudflare_image_model if cloudflare_settings else None)
                
                image_cost = calculate_cloudflare_image_cost(
                    image_count=1,
                    height=height,
                    width=width,
                    num_steps=num_steps,
                    model=model
                )
                total_cloudflare_cost += image_cost["total_cost"]
                images_generated += 1
            except HTTPException:
                raise
            except Exception as e:
                pdf_generation_progress[request.post_id]["status"] = "error"
                import traceback
                error_trace = traceback.format_exc()
                error_message = str(e)
                print(f"Image validation error for slide {i + 1}: {error_message}")
                print(f"Traceback: {error_trace}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to process image for slide {i + 1}: {error_message}"
                )
        
        # Validate we have images
        if not new_slide_images or len(new_slide_images) == 0:
            pdf_generation_progress[request.post_id]["status"] = "error"
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No images were generated successfully"
            )
        
        # Update post's token_usage to append Cloudflare costs
        if post.generation_options and images_generated > 0:
            gen_options = post.generation_options if isinstance(post.generation_options, dict) else {}
            token_usage = gen_options.get("token_usage", {})
            
            # Calculate cost per image
            cost_per_image = total_cloudflare_cost / images_generated if images_generated > 0 else 0.0
            
            # Initialize or update cloudflare_cost
            if "cloudflare_cost" in token_usage:
                # Append to existing costs
                existing_cost = token_usage["cloudflare_cost"]
                existing_image_count = existing_cost.get("image_count", 0)
                existing_total_cost = existing_cost.get("total_cost", 0.0)
                
                token_usage["cloudflare_cost"] = {
                    "total_cost": round(existing_total_cost + total_cloudflare_cost, 8),
                    "cost_per_image": round(cost_per_image, 8),
                    "image_count": existing_image_count + images_generated,
                    "tiles_per_image": existing_cost.get("tiles_per_image", 9),
                    "steps_per_image": existing_cost.get("steps_per_image", 25)
                }
            else:
                # First image generation
                token_usage["cloudflare_cost"] = {
                    "total_cost": round(total_cloudflare_cost, 8),
                    "cost_per_image": round(cost_per_image, 8),
                    "image_count": images_generated,
                    "tiles_per_image": 9,  # 1200x1200 = 9 tiles
                    "steps_per_image": 25
                }
            
            gen_options["token_usage"] = token_usage
            post.generation_options = gen_options
            # Mark the JSON field as modified so SQLAlchemy detects the change
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(post, "generation_options")
            db.commit()
            db.refresh(post)  # Refresh to get the latest data
        
        # Merge slides if partial regeneration
        if is_partial_regeneration:
            # Create a copy of existing slides
            merged_slide_images = existing_slide_images.copy()
            merged_prompts = existing_prompts.copy()
            
            # Replace slides at specified indices
            for i, slide_idx in enumerate(request.slide_indices):
                merged_slide_images[slide_idx] = new_slide_images[i]
                merged_prompts[slide_idx] = request.prompts[i]
            
            slide_images = merged_slide_images
            final_prompts = merged_prompts
        else:
            slide_images = new_slide_images
            final_prompts = request.prompts
        
        # Update progress: merging PDF
        pdf_generation_progress[request.post_id]["status"] = "merging"
        
        # Create PDF from images
        try:
            # Create PDF with LinkedIn's exact square format (1080x1080)
            # Create PDF with LinkedIn's exact square format (1080x1080)
            pdf_result = await create_carousel_pdf(
                slide_images=slide_images,
                slide_prompts=final_prompts,
                model=model_used or "cloudflare",
                format="square"  # LinkedIn square format: 1080x1080 pixels
            )
        except Exception as pdf_error:
            pdf_generation_progress[request.post_id]["status"] = "error"
            import traceback
            error_trace = traceback.format_exc()
            print(f"PDF creation error: {str(pdf_error)}")
            print(f"Traceback: {error_trace}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create PDF: {str(pdf_error)}"
            )
        
        # Mark all other PDFs for this post as not current
        db.query(GeneratedPDF).filter(
            GeneratedPDF.post_id == request.post_id
        ).update({"is_current": False})
        
        # Save PDF to database (including slide images for preview)
        pdf_id = str(uuid.uuid4())
        generated_pdf = GeneratedPDF(
            id=pdf_id,
            post_id=request.post_id,
            user_id=user_id,
            pdf_data=pdf_result["pdf"],
            slide_images=pdf_result.get("slide_images", []),  # Store slide images for preview
            slide_count=pdf_result["slide_count"],
            prompts=final_prompts,
            model=model_used or "cloudflare",
            pdf_metadata=pdf_result["metadata"],
            is_current=True
        )
        db.add(generated_pdf)
        db.commit()
        
        # Log image generation usage for carousel slides
        try:
            if images_generated > 0:
                # Assuming default dimensions for carousel images
                log_image_generation(
                    db=db,
                    user_id=user_id,
                    post_id=request.post_id,
                    image_count=images_generated,
                    height=1200,
                    width=1200,
                    num_steps=25,
                    model=model_used or "cloudflare"
                )
        except Exception as e:
            print(f"Warning: Failed to log PDF/carousel generation usage: {str(e)}")
        
        # Mark as completed
        pdf_generation_progress[request.post_id]["status"] = "completed"
        pdf_generation_progress[request.post_id]["current"] = total_slides
        
        # Clean up progress after 5 minutes
        asyncio.create_task(cleanup_progress(request.post_id))
        
        # Get updated cloudflare_cost from post
        updated_cloudflare_cost = None
        if post.generation_options:
            gen_options = post.generation_options if isinstance(post.generation_options, dict) else {}
            token_usage = gen_options.get("token_usage", {})
            updated_cloudflare_cost = token_usage.get("cloudflare_cost")
        
        return PDFGenerationResponse(
            pdf_id=pdf_id,
            pdf=pdf_result["pdf"],
            slide_images=pdf_result.get("slide_images", []),
            format=pdf_result["format"],
            slide_count=pdf_result["slide_count"],
            prompts=final_prompts,
            model=model_used or "cloudflare",
            post_id=request.post_id,
            is_current=True,
            cloudflare_cost=updated_cloudflare_cost
        )
    
    except HTTPException:
        raise
    except Exception as e:
        pdf_generation_progress[request.post_id]["status"] = "error"
        import traceback
        error_trace = traceback.format_exc()
        print(f"PDF generation error: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF generation failed: {str(e)}"
        )

async def cleanup_progress(post_id: str):
    """Clean up progress tracking after 5 minutes"""
    await asyncio.sleep(300)  # 5 minutes
    if post_id in pdf_generation_progress:
        del pdf_generation_progress[post_id]

@router.get("/history/{post_id}", response_model=PDFHistoryResponse)
async def get_pdf_history(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get PDF history for a carousel post
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
    
    # Get all PDFs for this post
    pdfs = db.query(GeneratedPDF).filter(
        GeneratedPDF.post_id == post_id
    ).order_by(GeneratedPDF.created_at.desc()).all()
    
    current_pdf_id = None
    for pdf in pdfs:
        if pdf.is_current:
            current_pdf_id = pdf.id
            break
    
    return PDFHistoryResponse(
        pdfs=[
            PDFHistoryItem(
                id=pdf.id,
                pdf=pdf.pdf_data,
                slide_images=pdf.slide_images if pdf.slide_images else [],
                slide_count=pdf.slide_count,
                prompts=pdf.prompts,
                is_current=pdf.is_current,
                created_at=pdf.created_at
            )
            for pdf in pdfs
        ],
        current_pdf_id=current_pdf_id
    )

@router.get("/current/{post_id}")
async def get_current_pdf(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get the current PDF for a carousel post
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
    
    # Get current PDF
    current_pdf = db.query(GeneratedPDF).filter(
        GeneratedPDF.post_id == post_id,
        GeneratedPDF.is_current == True
    ).first()
    
    if not current_pdf:
        return {"pdf": None, "pdf_id": None}
    
    return {
        "pdf_id": current_pdf.id,
        "pdf": current_pdf.pdf_data,
        "slide_images": current_pdf.slide_images if current_pdf.slide_images else [],
        "slide_count": current_pdf.slide_count,
        "prompts": current_pdf.prompts,
        "created_at": current_pdf.created_at.isoformat()
    }

@router.put("/set-current/{pdf_id}")
async def set_current_pdf(
    pdf_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Set a PDF as the current one for its post
    """
    # Get PDF and verify ownership
    pdf = db.query(GeneratedPDF).filter(
        GeneratedPDF.id == pdf_id,
        GeneratedPDF.user_id == user_id
    ).first()
    
    if not pdf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF not found"
        )
    
    # Mark all PDFs for this post as not current
    db.query(GeneratedPDF).filter(
        GeneratedPDF.post_id == pdf.post_id
    ).update({"is_current": False})
    
    # Mark this PDF as current
    pdf.is_current = True
    db.commit()
    
    return {
        "success": True,
        "message": "PDF set as current",
        "pdf_id": pdf_id,
        "post_id": pdf.post_id
    }

