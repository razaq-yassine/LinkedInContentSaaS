"""
Cloudflare Workers AI Service
Handles text-to-image generation using Cloudflare's AI models
"""

import httpx
import base64
from typing import Optional, Dict, Any
from ..config import get_settings

settings = get_settings()

async def generate_image(
    prompt: str,
    guidance: float = 4.5,
    num_steps: Optional[int] = None,
    seed: Optional[int] = None,
    height: int = 1120,
    width: int = 1120
) -> Dict[str, Any]:
    """
    Generate an image using Cloudflare Workers AI (Lucid Origin)
    
    Args:
        prompt: Text description of the image to generate (required)
        guidance: How closely to follow the prompt (0-10, default 4.5)
        num_steps: Number of diffusion steps (1-40, higher = better quality but slower)
        seed: Random seed for reproducibility (0+, optional)
        height: Image height in pixels (0-2500, default 1120)
        width: Image width in pixels (0-2500, default 1120)
    
    Returns:
        Dict with 'image' (base64 string) and 'metadata'
    
    Raises:
        Exception: If generation fails
    """
    if not settings.cloudflare_account_id or not settings.cloudflare_api_token:
        raise Exception("Cloudflare credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env")
    
    # Cloudflare Workers AI endpoint
    url = f"https://api.cloudflare.com/client/v4/accounts/{settings.cloudflare_account_id}/ai/run/{settings.cloudflare_image_model}"
    
    headers = {
        "Authorization": f"Bearer {settings.cloudflare_api_token}",
        "Content-Type": "application/json"
    }
    
    # Build request payload according to Lucid Origin API schema
    payload: Dict[str, Any] = {
        "prompt": prompt,
        "guidance": max(0, min(10, guidance)),  # Clamp to 0-10
        "height": max(0, min(2500, height)),      # Clamp to 0-2500
        "width": max(0, min(2500, width))        # Clamp to 0-2500
    }
    
    # Add num_steps if provided (1-40)
    if num_steps is not None:
        payload["num_steps"] = max(1, min(40, num_steps))
    
    # Add seed if provided (0+)
    if seed is not None:
        payload["seed"] = max(0, seed)
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Cloudflare returns base64 image in result.image
            if not data.get("success"):
                error_msg = data.get("errors", ["Unknown error"])[0]
                raise Exception(f"Cloudflare AI error: {error_msg}")
            
            image_base64 = data["result"]["image"]
            
            return {
                "image": image_base64,
                "format": "png",
                "metadata": {
                    "model": settings.cloudflare_image_model,
                    "prompt": prompt,
                    "guidance": guidance,
                    "num_steps": num_steps,
                    "seed": seed,
                    "height": height,
                    "width": width
                }
            }
    
    except httpx.HTTPStatusError as e:
        error_detail = e.response.text if hasattr(e, 'response') else str(e)
        raise Exception(f"Cloudflare API HTTP error: {e.response.status_code} - {error_detail}")
    except httpx.RequestError as e:
        raise Exception(f"Cloudflare API request error: {str(e)}")
    except Exception as e:
        raise Exception(f"Image generation failed: {str(e)}")


async def generate_image_from_post(
    post_content: str,
    image_prompt: Optional[str] = None,
    post_format: str = "image"
) -> Dict[str, Any]:
    """
    Generate an image for a LinkedIn post
    
    Args:
        post_content: The LinkedIn post text
        image_prompt: Optional custom image prompt (if not provided, uses post_content as basis)
        post_format: Type of post (image, carousel, etc.)
    
    Returns:
        Dict with generated image data
    """
    # Use the provided image prompt, or create one from post content
    if not image_prompt:
        # Extract key concepts from post for image generation
        # In a real scenario, you might want to use AI to create a better prompt
        image_prompt = f"Professional LinkedIn image for: {post_content[:200]}"
    
    # Add style guidance for professional LinkedIn images
    enhanced_prompt = f"{image_prompt}. Professional, high-quality, business-appropriate, clean design, modern aesthetic."
    
    # Generate with good quality settings for LinkedIn (square format, high quality)
    result = await generate_image(
        prompt=enhanced_prompt,
        guidance=7.5,      # Good balance for professional images
        num_steps=25,      # Good quality (25-30 is sweet spot)
        height=1200,       # LinkedIn-optimized square format
        width=1200         # LinkedIn-optimized square format
    )
    
    return result


async def test_cloudflare_connection() -> bool:
    """
    Test if Cloudflare Workers AI is configured correctly
    
    Returns:
        True if connection works, False otherwise
    """
    try:
        # Simple test generation with minimal steps for speed
        result = await generate_image(
            prompt="A simple blue square",
            guidance=4.5,
            num_steps=10,  # Minimal steps for quick test
            height=512,    # Small size for quick test
            width=512
        )
        return bool(result.get("image"))
    except Exception as e:
        print(f"Cloudflare connection test failed: {str(e)}")
        return False

