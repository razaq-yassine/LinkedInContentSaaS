"""
Cost calculation utility for AI API calls
Calculates estimated costs based on token usage and model pricing
"""

from typing import Dict, Optional

# Pricing per 1M tokens (in USD)
# Source: https://openai.com/api/pricing/ and https://ai.google.dev/gemini-api/docs/pricing
PRICING = {
    "openai": {
        "gpt-4o": {
            "input": 2.50,  # $2.50 per 1M input tokens
            "output": 10.00  # $10.00 per 1M output tokens
        },
        "gpt-4o-mini": {
            "input": 0.15,  # $0.15 per 1M input tokens
            "output": 0.60  # $0.60 per 1M output tokens
        },
        "gpt-4-turbo": {
            "input": 10.00,
            "output": 30.00
        },
        "gpt-3.5-turbo": {
            "input": 0.50,
            "output": 1.50
        },
        "default": {
            "input": 2.50,  # Default to gpt-4o pricing
            "output": 10.00
        }
    },
    "gemini": {
        "gemini-2.5-flash": {
            "input": 0.30,  # $0.30 per 1M input tokens (verified 2025)
            "output": 2.50  # $2.50 per 1M output tokens (verified 2025)
        },
        "gemini-2.5-flash-lite": {
            "input": 0.10,  # $0.10 per 1M input tokens
            "output": 0.40  # $0.40 per 1M output tokens
        },
        "gemini-2.5-pro": {
            "input": 1.25,  # $1.25 per 1M input tokens (for prompts <= 200k tokens)
            "output": 10.00  # $10.00 per 1M output tokens (for prompts <= 200k tokens)
        },
        "gemini-3-pro-preview": {
            "input": 2.00,  # $2.00 per 1M input tokens (for prompts <= 200k tokens)
            "output": 12.00  # $12.00 per 1M output tokens (for prompts <= 200k tokens)
        },
        "gemini-3-flash-preview": {
            "input": 0.50,
            "output": 3.00
        },
        "default": {
            "input": 0.30,  # Default to flash pricing
            "output": 2.50
        }
    },
    "cloudflare": {
        # Cloudflare Workers AI pricing for phoenix-1.0 model (@cf/leonardo/phoenix-1.0)
        # Pricing: $0.0058 per 512x512 tile, $0.00011 per step
        # Source: Cloudflare Workers AI model info page
        "phoenix-1.0": {
            "tile_price": 0.0058,  # $0.0058 per 512x512 tile
            "step_price": 0.00011,  # $0.00011 per step
            "default_steps": 25  # Default number of steps used
        },
        "@cf/leonardo/phoenix-1.0": {
            "tile_price": 0.0058,
            "step_price": 0.00011,
            "default_steps": 25
        },
        "@cf/leonardo/lucid-origin": {
            # Fallback pricing (may need to be updated)
            "tile_price": 0.0058,
            "step_price": 0.00011,
            "default_steps": 25
        },
        "default": {
            "tile_price": 0.0058,
            "step_price": 0.00011,
            "default_steps": 25
        }
    }
}


def calculate_cloudflare_image_cost(
    image_count: int,
    height: int = 1200,
    width: int = 1200,
    num_steps: int = 25,
    model: Optional[str] = None
) -> Dict[str, float]:
    """
    Calculate Cloudflare image generation cost based on Phoenix 1.0 pricing
    
    Pricing: $0.0058 per 512x512 tile, $0.00011 per step
    
    Args:
        image_count: Number of images to generate
        height: Image height in pixels (default 1200)
        width: Image width in pixels (default 1200)
        num_steps: Number of diffusion steps (default 25)
        model: Model name (defaults to phoenix-1.0)
    
    Returns:
        Dict with cost information
    """
    # Normalize model name (handle both @cf/leonardo/phoenix-1.0 and phoenix-1.0 formats)
    model_name = model or "phoenix-1.0"
    if model_name.startswith("@cf/"):
        # Extract just the model name part
        model_name = model_name.split("/")[-1]
    model_pricing = PRICING["cloudflare"].get(model_name, PRICING["cloudflare"].get("@cf/leonardo/" + model_name, PRICING["cloudflare"]["default"]))
    
    tile_price = model_pricing["tile_price"]
    step_price = model_pricing["step_price"]
    
    # Calculate number of 512x512 tiles needed
    # Each image requires ceil(height/512) * ceil(width/512) tiles
    tiles_per_image = ((height + 511) // 512) * ((width + 511) // 512)
    
    # Calculate cost per image
    tile_cost_per_image = tiles_per_image * tile_price
    step_cost_per_image = num_steps * step_price
    cost_per_image = tile_cost_per_image + step_cost_per_image
    
    # Total cost for all images
    total_cost = cost_per_image * image_count
    
    return {
        "input_cost": 0.0,
        "output_cost": 0.0,
        "total_cost": round(total_cost, 8),
        "image_cost": round(total_cost, 8),
        "cost_per_image": round(cost_per_image, 8),
        "tiles_per_image": tiles_per_image,
        "steps_per_image": num_steps,
        "image_count": image_count
    }


def calculate_cost(
    provider: str,
    model: Optional[str],
    input_tokens: int,
    output_tokens: int,
    image_count: Optional[int] = None,
    image_height: Optional[int] = None,
    image_width: Optional[int] = None,
    image_steps: Optional[int] = None
) -> Dict[str, float]:
    """
    Calculate estimated cost for API usage
    
    Args:
        provider: "openai", "gemini", or "cloudflare"
        model: Model name (e.g., "gpt-4o", "gemini-2.5-flash")
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        image_count: Number of images generated (for Cloudflare)
        image_height: Image height in pixels (for Cloudflare)
        image_width: Image width in pixels (for Cloudflare)
        image_steps: Number of diffusion steps (for Cloudflare)
    
    Returns:
        Dict with "input_cost", "output_cost", "total_cost" in USD
    """
    if provider == "cloudflare" and image_count:
        # Use detailed Cloudflare pricing calculation
        return calculate_cloudflare_image_cost(
            image_count=image_count,
            height=image_height or 1200,
            width=image_width or 1200,
            num_steps=image_steps or 25,
            model=model
        )
    
    # Get pricing for the specific model or use default
    provider_pricing = PRICING.get(provider, {})
    model_pricing = provider_pricing.get(model or "default", provider_pricing.get("default", {}))
    
    if not model_pricing:
        return {
            "input_cost": 0.0,
            "output_cost": 0.0,
            "total_cost": 0.0
        }
    
    # Calculate costs (pricing is per 1M tokens)
    input_cost = (input_tokens / 1_000_000) * model_pricing.get("input", 0)
    output_cost = (output_tokens / 1_000_000) * model_pricing.get("output", 0)
    total_cost = input_cost + output_cost
    
    return {
        "input_cost": round(input_cost, 8),  # More precision for small costs
        "output_cost": round(output_cost, 8),
        "total_cost": round(total_cost, 8)
    }


def calculate_token_usage_cost(token_usage: Dict[str, any]) -> Dict[str, float]:
    """
    Calculate cost from a token usage dictionary
    
    Args:
        token_usage: Dict with "provider", "model", "input_tokens", "output_tokens"
    
    Returns:
        Dict with cost information
    """
    provider = token_usage.get("provider", "unknown")
    model = token_usage.get("model")
    input_tokens = token_usage.get("input_tokens", 0)
    output_tokens = token_usage.get("output_tokens", 0)
    image_count = token_usage.get("image_count")
    
    return calculate_cost(provider, model, input_tokens, output_tokens, image_count)

