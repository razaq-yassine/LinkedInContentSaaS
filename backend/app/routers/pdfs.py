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
from ..models import GeneratedPost, GeneratedPDF, GeneratedImage

router = APIRouter()

# In-memory progress tracking (in production, use Redis or similar)
pdf_generation_progress: Dict[str, Dict] = {}

class CarouselPDFGenerationRequest(BaseModel):
    post_id: str
    prompts: List[str]  # Array of prompts for each slide

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
    
    # Initialize progress tracking
    total_slides = len(request.prompts)
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
        
        # Generate images for all prompts
        slide_images = []
        model_used = None
        
        for i, prompt in enumerate(request.prompts):
            try:
                # Update progress
                pdf_generation_progress[request.post_id]["current"] = i + 1
                
                result = await generate_image(
                    prompt=prompt,
                    guidance=7.5,
                    num_steps=25,
                    height=1200,
                    width=1200
                )
                
                # Validate image result
                if not result or "image" not in result:
                    raise ValueError(f"No image data returned for slide {i + 1}")
                
                image_data = result["image"]
                if not image_data or len(image_data) < 100:  # Basic validation
                    raise ValueError(f"Invalid image data for slide {i + 1}")
                
                slide_images.append(image_data)
                if not model_used:
                    model_used = result.get("metadata", {}).get("model", "cloudflare")
            except HTTPException:
                raise
            except Exception as e:
                pdf_generation_progress[request.post_id]["status"] = "error"
                import traceback
                error_trace = traceback.format_exc()
                print(f"Image generation error for slide {i + 1}: {str(e)}")
                print(f"Traceback: {error_trace}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate image for slide {i + 1}: {str(e)}"
                )
        
        # Validate we have images
        if not slide_images or len(slide_images) == 0:
            pdf_generation_progress[request.post_id]["status"] = "error"
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No images were generated successfully"
            )
        
        # Update progress: merging PDF
        pdf_generation_progress[request.post_id]["status"] = "merging"
        
        # Create PDF from images
        try:
            pdf_result = await create_carousel_pdf(
                slide_images=slide_images,
                slide_prompts=request.prompts,
                model=model_used or "cloudflare"
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
            prompts=request.prompts,
            model=model_used or "cloudflare",
            pdf_metadata=pdf_result["metadata"],
            is_current=True
        )
        db.add(generated_pdf)
        db.commit()
        
        # Mark as completed
        pdf_generation_progress[request.post_id]["status"] = "completed"
        pdf_generation_progress[request.post_id]["current"] = total_slides
        
        # Clean up progress after 5 minutes
        asyncio.create_task(cleanup_progress(request.post_id))
        
        return PDFGenerationResponse(
            pdf_id=pdf_id,
            pdf=pdf_result["pdf"],
            slide_images=pdf_result.get("slide_images", []),
            format=pdf_result["format"],
            slide_count=pdf_result["slide_count"],
            prompts=request.prompts,
            model=model_used or "cloudflare",
            post_id=request.post_id,
            is_current=True
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

