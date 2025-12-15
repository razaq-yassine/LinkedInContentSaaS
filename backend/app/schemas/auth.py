from pydantic import BaseModel, EmailStr
from typing import Optional

class MockLoginRequest(BaseModel):
    email: EmailStr

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: Optional[str] = None
    onboarding_completed: bool = False

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    linkedin_id: Optional[str]
    account_type: str
    onboarding_completed: bool
    
    class Config:
        from_attributes = True


