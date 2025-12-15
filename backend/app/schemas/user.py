from pydantic import BaseModel
from typing import Optional, Dict, List, Any

class UserPreferences(BaseModel):
    post_type_distribution: Dict[str, int]
    content_mix: Dict[str, int]
    tone: str
    hashtag_count: int
    emoji_usage: str
    sentence_max_length: int
    hook_style: str

class UserProfileResponse(BaseModel):
    user_id: str
    profile_md: Optional[str]
    writing_style_md: Optional[str]
    context_json: Optional[Dict[str, Any]]
    preferences: Optional[Dict[str, Any]]
    onboarding_step: int
    onboarding_completed: bool
    
    class Config:
        from_attributes = True

class UpdatePreferencesRequest(BaseModel):
    preferences: Dict[str, Any]


