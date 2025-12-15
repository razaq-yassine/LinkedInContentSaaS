from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int
    last_message_preview: Optional[str] = None
    
    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: str
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime
    format: Optional[str] = None  # Only for assistant messages
    post_id: Optional[str] = None  # Post ID for assistant messages
    image_prompt: Optional[str] = None
    image_prompts: Optional[List[str]] = None  # For carousel posts
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse]
    
    class Config:
        from_attributes = True

class CreateConversationRequest(BaseModel):
    initial_message: str
    options: Optional[dict] = {}

class UpdateConversationTitleRequest(BaseModel):
    title: str

