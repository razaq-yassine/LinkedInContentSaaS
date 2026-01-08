"""
Cost calculation service for AI services
Calculates costs for various AI providers and services
"""
from typing import Dict, Optional
from sqlalchemy.orm import Session
from ..models import AdminSetting


# Pricing in USD per 1M tokens (as of January 2025)
# Stored as cost per 1M tokens to avoid float precision issues
PRICING_TABLE = {
    # OpenAI Models
    "gpt-4o": {"input": 2.50, "output": 10.00},  # Per 1M tokens
    "gpt-4o-mini": {"input": 0.150, "output": 0.600},
    "gpt-4-turbo": {"input": 10.00, "output": 30.00},
    "gpt-4": {"input": 30.00, "output": 60.00},
    "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
    "o1-preview": {"input": 15.00, "output": 60.00},
    "o1-mini": {"input": 3.00, "output": 12.00},
    
    # Gemini Models
    "gemini-2.5-flash": {"input": 0.30, "output": 2.50},  # Latest as of Jan 2025
    "gemini-2.5-flash-lite": {"input": 0.10, "output": 0.40},
    "gemini-2.5-pro": {"input": 1.25, "output": 10.00},
    "gemini-2.0-flash-exp": {"input": 0.00, "output": 0.00},  # Free during preview
    "gemini-1.5-pro": {"input": 1.25, "output": 5.00},
    "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
    "gemini-1.0-pro": {"input": 0.50, "output": 1.50},
    
    # Claude Models (Anthropic)
    # Claude 4.5 models (latest as of Jan 2025)
    "claude-opus-4-5": {"input": 15.00, "output": 75.00},
    "claude-sonnet-4-5": {"input": 3.00, "output": 15.00},
    "claude-haiku-4-5": {"input": 0.80, "output": 4.00},
    # Claude 3.x models (legacy)
    "claude-3-5-sonnet-20241022": {"input": 3.00, "output": 15.00},
    "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.00},
    "claude-3-opus-20240229": {"input": 15.00, "output": 75.00},
    "claude-3-sonnet-20240229": {"input": 3.00, "output": 15.00},
    "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
}


def calculate_text_generation_cost(
    input_tokens: int,
    output_tokens: int,
    model: str
) -> float:
    """
    Calculate cost for text generation
    
    Args:
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        model: Model name
    
    Returns:
        Cost in USD (as float)
    """
    pricing = PRICING_TABLE.get(model.lower())
    if not pricing:
        # Unknown model, return 0 cost
        return 0.0
    
    input_cost = (input_tokens / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    
    return round(input_cost + output_cost, 8)


def calculate_cloudflare_image_cost(
    image_count: int = 1,
    height: int = 1120,
    width: int = 1120,
    num_steps: int = 25,
    model: Optional[str] = None
) -> Dict:
    """
    Calculate cost for Cloudflare Workers AI image generation
    
    Cloudflare pricing (phoenix-1.0 model):
    - $0.0058 per 512x512 tile (base cost)
    - $0.00011 per step (step cost)
    - 1 tile = 512x512 pixels
    - Total tiles = ceil(height/512) * ceil(width/512)
    - Cost per image = (tiles * $0.0058) + (steps * $0.00011)
    
    Free tier: 10,000 neurons per day (not calculated here)
    Paid tier: $0.011 per 1,000 neurons after free tier
    
    Args:
        image_count: Number of images generated
        height: Image height in pixels
        width: Image width in pixels
        num_steps: Number of diffusion steps
        model: Model name (optional)
    
    Returns:
        Dict with cost breakdown
    """
    import math
    
    COST_PER_TILE = 0.0058  # USD per tile (correct as of Jan 2025)
    COST_PER_STEP = 0.00011  # USD per step (correct as of Jan 2025)
    TILE_SIZE = 512
    
    # Calculate number of tiles
    tiles_height = math.ceil(height / TILE_SIZE)
    tiles_width = math.ceil(width / TILE_SIZE)
    total_tiles = tiles_height * tiles_width
    
    # Correct formula: (tiles * tile_cost) + (steps * step_cost)
    tile_cost = total_tiles * COST_PER_TILE
    step_cost = num_steps * COST_PER_STEP
    cost_per_image = tile_cost + step_cost
    total_cost = cost_per_image * image_count
    
    return {
        "total_cost": round(total_cost, 8),
        "cost_per_image": round(cost_per_image, 8),
        "image_count": image_count,
        "tiles_per_image": total_tiles,
        "steps_per_image": num_steps,
        "tile_cost": round(tile_cost, 8),
        "step_cost": round(step_cost, 8)
    }


def calculate_brave_search_cost(
    search_count: int,
    db: Session
) -> float:
    """
    Calculate cost for Brave Search API calls
    
    Cost is based on admin settings:
    - brave_search_pricing_tier: "free" or "paid"
    - brave_search_cost_per_1000: Cost per 1000 searches (USD)
    - brave_free_monthly_limit: Free tier monthly limit
    
    Args:
        search_count: Number of search API calls
        db: Database session to fetch pricing settings
    
    Returns:
        Estimated cost in USD
    """
    # Fetch pricing settings
    tier_setting = db.query(AdminSetting).filter(
        AdminSetting.key == "brave_search_pricing_tier"
    ).first()
    
    cost_setting = db.query(AdminSetting).filter(
        AdminSetting.key == "brave_search_cost_per_1000"
    ).first()
    
    tier = tier_setting.value if tier_setting else "free"
    cost_per_1000 = float(cost_setting.value) if cost_setting else 5.00
    
    if tier == "free":
        # Free tier doesn't incur costs
        return 0.0
    
    # Calculate cost for paid tier
    cost = (search_count / 1000) * cost_per_1000
    return round(cost, 8)


def calculate_total_cost(
    text_cost: float = 0.0,
    image_cost: float = 0.0,
    search_cost: float = 0.0
) -> float:
    """
    Calculate total cost across all services
    
    Args:
        text_cost: Cost for text generation
        image_cost: Cost for image generation
        search_cost: Cost for search API calls
    
    Returns:
        Total cost in USD
    """
    return round(text_cost + image_cost + search_cost, 8)


def cost_to_cents(cost_usd: float) -> int:
    """
    Convert USD cost to tenth-cents (for storage as integer with better precision)
    
    Stores as tenth-cents (0.1 cent = $0.001) to handle small AI costs.
    This gives us precision down to $0.0001 which is sufficient for per-request costs.
    
    Args:
        cost_usd: Cost in USD
    
    Returns:
        Cost in tenth-cents (integer) - multiply by 1000 instead of 100
    
    Examples:
        $0.002722 → 27 tenth-cents (displays as $0.0027)
        $1.50 → 15000 tenth-cents (displays as $1.50)
    """
    return int(round(cost_usd * 1000))


def cents_to_cost(cents: int) -> float:
    """
    Convert tenth-cents to USD cost
    
    Args:
        cents: Cost in tenth-cents (integer, stored as value × 1000)
    
    Returns:
        Cost in USD (float)
    """
    return cents / 1000

