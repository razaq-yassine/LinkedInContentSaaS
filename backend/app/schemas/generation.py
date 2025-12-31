from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

class PostGenerationRequest(BaseModel):
    message: str
    options: Dict[str, Any]
    attachments: Optional[List[Dict[str, Any]]] = None
    conversation_id: Optional[str] = None

class TokenUsage(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int
    model: Optional[str] = None
    provider: Optional[str] = None
    details: Optional[Dict[str, Dict[str, int]]] = None  # Breakdown by call type
    # Cost information (calculated, not from API)
    cost: Optional[Dict[str, float]] = None  # {"input_cost": float, "output_cost": float, "total_cost": float}
    # Image generation token usage (separate provider - OpenAI/Gemini for prompt generation)
    image_prompt_tokens: Optional[Dict[str, int]] = None  # {"input_tokens": int, "output_tokens": int, "total_tokens": int}
    image_prompt_cost: Optional[Dict[str, float]] = None  # {"input_cost": float, "output_cost": float, "total_cost": float}
    image_prompt_provider: Optional[str] = None  # Provider used for image prompt generation
    image_prompt_model: Optional[str] = None  # Model used for image prompt generation
    # Cloudflare image generation cost (separate from prompt generation)
    cloudflare_cost: Optional[Dict[str, float]] = None  # {"total_cost": float, "cost_per_image": float, "image_count": int}
    cloudflare_model: Optional[str] = None  # Cloudflare model used (e.g., "@cf/leonardo/phoenix-1.0")

class PostMetadata(BaseModel):
    hashtags: Optional[List[str]] = []
    tone: Optional[str] = "professional"
    estimated_engagement: Optional[str] = "medium"

class PostGenerationResponse(BaseModel):
    id: str
    post_content: str
    format_type: str
    image_prompt: Optional[str] = None
    image_prompts: Optional[List[str]] = None  # For carousel posts
    metadata: Optional[PostMetadata] = None
    conversation_id: Optional[str] = None
    title: Optional[str] = None  # Title for the conversation
    created_at: datetime
    token_usage: Optional[TokenUsage] = None
    
    class Config:
        from_attributes = True

class CommentEvaluationRequest(BaseModel):
    screenshot: str  # Base64 encoded image or file path

class CommentEvaluationResponse(BaseModel):
    score: int
    reasoning: str
    recommendation: str  # COMMENT or SKIP
    extracted_post_text: str

class CommentGenerationRequest(BaseModel):
    screenshot: str
    context: Optional[Dict[str, Any]] = None

class CommentGenerationResponse(BaseModel):
    id: str
    content: str
    worthiness_score: int
    recommendation: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class GenerationHistoryResponse(BaseModel):
    id: str
    content: str
    format: Optional[str]
    topic: Optional[str]
    created_at: datetime
    user_rating: Optional[int]
    published_to_linkedin: Optional[bool] = False
    conversation_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    generation_options: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class UpdateGenerationRequest(BaseModel):
    content: str

class SchedulePostRequest(BaseModel):
    scheduled_at: datetime  # UTC datetime
    timezone: Optional[str] = None  # User's timezone for display purposes

class ScheduledPostResponse(BaseModel):
    id: str
    content: str
    format: Optional[str]
    scheduled_at: datetime
    conversation_id: Optional[str] = None
    generation_options: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class ScheduledPostsListResponse(BaseModel):
    posts: List[ScheduledPostResponse]
    
    class Config:
        from_attributes = True


