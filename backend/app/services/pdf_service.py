"""
PDF Generation Service
Creates PDFs from multiple images for carousel posts
"""

import base64
import io
from typing import List
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader

async def create_pdf_from_images(image_base64_list: List[str], slide_prompts: List[str]) -> str:
    """
    Create a PDF from multiple base64-encoded images
    
    Args:
        image_base64_list: List of base64-encoded image strings
        slide_prompts: List of prompts used for each slide (for metadata)
    
    Returns:
        Base64-encoded PDF string
    """
    if not image_base64_list:
        raise ValueError("At least one image is required to create PDF")
    
    if len(image_base64_list) == 0:
        raise ValueError("Image list is empty")
    
    # Validate all images are present
    for i, img in enumerate(image_base64_list):
        if not img or not isinstance(img, str):
            raise ValueError(f"Invalid image data at index {i}")
        if len(img) < 100:  # Basic validation - base64 images should be longer
            raise ValueError(f"Image data too short at index {i} (likely invalid)")
    
    # Create PDF buffer
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    
    # LinkedIn carousel dimensions (optimized for mobile)
    # Standard LinkedIn carousel: 1080x1080px (square)
    # We'll use letter size but scale images to fit
    page_width, page_height = letter
    
    for i, image_base64 in enumerate(image_base64_list):
        try:
            # Decode base64 image
            if not image_base64 or not isinstance(image_base64, str):
                raise ValueError(f"Invalid image data for slide {i + 1}: not a string")
            
            # Remove data URL prefix if present
            if image_base64.startswith('data:image'):
                image_base64 = image_base64.split(',')[1]
            
            # Validate base64 string length
            if len(image_base64) < 100:
                raise ValueError(f"Image data too short for slide {i + 1} (likely invalid base64)")
            
            try:
                image_data = base64.b64decode(image_base64, validate=True)
            except Exception as decode_error:
                raise ValueError(f"Failed to decode base64 image data for slide {i + 1}: {str(decode_error)}")
            
            if not image_data or len(image_data) < 100:
                raise ValueError(f"Decoded image data is empty or too small for slide {i + 1}")
            
            image = Image.open(io.BytesIO(image_data))
            
            # Convert RGBA to RGB if needed
            if image.mode == 'RGBA':
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[3])
                image = rgb_image
            elif image.mode not in ('RGB', 'L'):
                image = image.convert('RGB')
            
            # Calculate dimensions to fit page while maintaining aspect ratio
            img_width, img_height = image.size
            if img_width == 0 or img_height == 0:
                raise ValueError(f"Invalid image dimensions for slide {i + 1}")
            
            aspect_ratio = img_width / img_height
            
            # Scale to fit page (with margins)
            margin = 20
            max_width = page_width - (margin * 2)
            max_height = page_height - (margin * 2)
            
            if aspect_ratio > 1:
                # Landscape
                width = min(max_width, img_width)
                height = width / aspect_ratio
            else:
                # Portrait or square
                height = min(max_height, img_height)
                width = height * aspect_ratio
            
            # Center image on page
            x = (page_width - width) / 2
            y = (page_height - height) / 2
            
            # Add image to PDF
            img_reader = ImageReader(image)
            pdf.drawImage(img_reader, x, y, width=width, height=height, preserveAspectRatio=True)
            
            # Add page number (optional, small text at bottom)
            pdf.setFont("Helvetica", 8)
            pdf.setFillColorRGB(0.5, 0.5, 0.5)
            pdf.drawString(margin, margin, f"Slide {i + 1} of {len(image_base64_list)}")
            
            # Start new page for next image (except last one)
            if i < len(image_base64_list) - 1:
                pdf.showPage()
        
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error processing image {i + 1}: {str(e)}")
            print(f"Traceback: {error_trace}")
            raise Exception(f"Error processing image {i + 1}: {str(e)}")
    
    # Save PDF
    try:
        pdf.save()
        buffer.seek(0)
        
        # Convert to base64
        pdf_bytes = buffer.read()
        if not pdf_bytes:
            raise ValueError("PDF buffer is empty after save")
        
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        buffer.close()
        
        return pdf_base64
    except Exception as e:
        buffer.close()
        import traceback
        error_trace = traceback.format_exc()
        print(f"PDF save error: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise

async def create_carousel_pdf(
    slide_images: List[str],
    slide_prompts: List[str],
    model: str = "cloudflare"
) -> dict:
    """
    Create a carousel PDF from slide images
    
    Args:
        slide_images: List of base64-encoded image strings (one per slide)
        slide_prompts: List of prompts used for each slide
        model: Model used for generation
    
    Returns:
        Dict with 'pdf' (base64 string), 'slide_images' (array), and 'metadata'
    """
    if len(slide_images) != len(slide_prompts):
        raise ValueError("Number of images must match number of prompts")
    
    pdf_base64 = await create_pdf_from_images(slide_images, slide_prompts)
    
    return {
        "pdf": pdf_base64,
        "slide_images": slide_images,  # Return slide images for preview
        "format": "pdf",
        "slide_count": len(slide_images),
        "metadata": {
            "model": model,
            "prompts": slide_prompts,
            "created_at": None  # Will be set by caller
        }
    }

