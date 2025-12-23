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
    
    # Build request payload based on model type
    model_name = settings.cloudflare_image_model.lower()
    
    # Different models have different parameter requirements
    if "phoenix" in model_name:
        # Phoenix models - may return binary image directly
        payload: Dict[str, Any] = {
            "prompt": prompt,
            "height": max(0, min(2500, height)),
            "width": max(0, min(2500, width))
        }
        # Phoenix may use different parameter names
        if num_steps is not None:
            payload["num_steps"] = max(1, min(40, num_steps))
        if guidance is not None:
            payload["guidance"] = max(0, min(10, guidance))
        if seed is not None:
            payload["seed"] = max(0, seed)
    elif "flux" in model_name:
        # Flux models use different parameters
        payload: Dict[str, Any] = {
            "prompt": prompt,
            "num_inference_steps": num_steps if num_steps is not None else 20,  # Flux uses num_inference_steps
            "height": max(0, min(2500, height)),
            "width": max(0, min(2500, width))
        }
        # Flux models may not support guidance or seed the same way
        if seed is not None:
            payload["seed"] = max(0, seed)
    elif "stable-diffusion" in model_name:
        # Stable Diffusion models
        payload: Dict[str, Any] = {
            "prompt": prompt,
            "num_inference_steps": num_steps if num_steps is not None else 20,
            "height": max(0, min(2500, height)),
            "width": max(0, min(2500, width))
        }
        if seed is not None:
            payload["seed"] = max(0, seed)
        # Stable Diffusion might use guidance_scale instead of guidance
        if guidance is not None:
            payload["guidance_scale"] = max(0, min(20, guidance * 2))  # Convert 0-10 to 0-20 scale
    else:
        # Default: Lucid Origin and similar models
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
            
            # Check content type to determine response format
            content_type = response.headers.get("content-type", "").lower()
            
            # Some models (like Phoenix) return binary image data directly
            if "image" in content_type or response.content[:4] == b'\xff\xd8\xff\xe0' or response.content[:8] == b'\x89PNG\r\n\x1a\n':
                # Response is binary image data - convert to base64
                image_bytes = response.content
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            else:
                # Response is JSON
                try:
                    data = response.json()
                except Exception as json_error:
                    # If JSON parsing fails, check if it's actually binary data
                    if response.content[:2] in [b'\xff\xd8', b'\x89P', b'\x89PN']:
                        # It's actually image data, convert to base64
                        image_bytes = response.content
                        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                    else:
                        raise Exception(f"Failed to parse response as JSON or image: {str(json_error)}")
                
                # Cloudflare returns base64 image in result.image
                if not data.get("success"):
                    error_msg = data.get("errors", ["Unknown error"])
                    if isinstance(error_msg, list) and len(error_msg) > 0:
                        error_msg = error_msg[0] if isinstance(error_msg[0], dict) else str(error_msg[0])
                    elif isinstance(error_msg, dict):
                        error_msg = error_msg.get("message", str(error_msg))
                    else:
                        error_msg = str(error_msg)
                    raise Exception(f"Cloudflare AI error: {error_msg}")
                
                # Handle different response formats for different models
                result_data = data.get("result", {})
                if isinstance(result_data, str):
                    # Some models return base64 string directly
                    image_base64 = result_data
                elif isinstance(result_data, dict):
                    # Most models return dict with image field
                    image_base64 = result_data.get("image") or result_data.get("data")
                    if not image_base64:
                        # Try alternative field names
                        image_base64 = result_data.get("output") or result_data.get("image_base64")
                else:
                    raise Exception(f"Unexpected response format from Cloudflare API: {type(result_data)}")
                
                if not image_base64:
                    raise Exception("No image data returned from Cloudflare API")
            
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
        error_detail = "Unknown error"
        try:
            if hasattr(e, 'response') and e.response:
                error_json = e.response.json()
                if isinstance(error_json, dict):
                    errors = error_json.get("errors", [])
                    if errors and len(errors) > 0:
                        error_detail = str(errors[0]) if not isinstance(errors[0], dict) else errors[0].get("message", str(errors[0]))
                    else:
                        error_detail = error_json.get("message", e.response.text)
                else:
                    error_detail = e.response.text
        except:
            error_detail = str(e) if hasattr(e, 'response') else str(e)
        raise Exception(f"Cloudflare API HTTP error ({e.response.status_code if hasattr(e, 'response') else 'unknown'}): {error_detail}. Model: {settings.cloudflare_image_model}")
    except httpx.RequestError as e:
        raise Exception(f"Cloudflare API request error: {str(e)}. Check your network connection and Cloudflare credentials.")
    except Exception as e:
        error_msg = str(e)
        if "Cloudflare" not in error_msg:
            error_msg = f"Image generation failed: {error_msg}. Model: {settings.cloudflare_image_model}"
        raise Exception(error_msg)


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

