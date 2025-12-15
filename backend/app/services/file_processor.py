import os
from typing import Tuple
import base64
from PIL import Image
from io import BytesIO
import PyPDF2

async def extract_text_from_pdf(pdf_data: bytes) -> str:
    """
    Extract text content from PDF file
    """
    try:
        pdf_file = BytesIO(pdf_data)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

async def save_upload_file(file_data: bytes, filename: str, upload_dir: str = "uploads") -> str:
    """
    Save uploaded file to disk and return file path
    """
    try:
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        return file_path
    except Exception as e:
        raise Exception(f"Failed to save file: {str(e)}")

async def process_image_upload(image_data: str, upload_dir: str = "uploads") -> str:
    """
    Process base64 encoded image or image file path
    Returns file path to saved image
    """
    try:
        # Check if it's base64 encoded
        if image_data.startswith("data:image"):
            # Extract base64 data
            base64_data = image_data.split(",")[1]
            image_bytes = base64.b64decode(base64_data)
            
            # Save image
            import uuid
            filename = f"{uuid.uuid4()}.png"
            file_path = await save_upload_file(image_bytes, filename, upload_dir)
            return file_path
        else:
            # Assume it's already a file path
            return image_data
    except Exception as e:
        raise Exception(f"Failed to process image: {str(e)}")

async def compress_image(image_path: str, max_size: Tuple[int, int] = (1024, 1024)) -> str:
    """
    Compress image to reduce file size
    """
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            # Resize if larger than max_size
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save compressed image
            img.save(image_path, "JPEG", quality=85, optimize=True)
        
        return image_path
    except Exception as e:
        raise Exception(f"Failed to compress image: {str(e)}")


