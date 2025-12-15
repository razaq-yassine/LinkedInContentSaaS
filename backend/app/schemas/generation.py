from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

class PostGenerationRequest(BaseModel):
    message: str
    options: Dict[str, Any]
    attachments: Optional[List[Dict[str, Any]]] = None
    conversation_id: Optional[str] = None

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
    created_at: datetime
    
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
    
    class Config:
        from_attributes = True

class UpdateGenerationRequest(BaseModel):
    content: str


