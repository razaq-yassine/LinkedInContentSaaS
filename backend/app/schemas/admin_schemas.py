from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str
    admin: "AdminResponse"


class AdminResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class CreateAdminRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "admin"


class UpdateAdminRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserDetailResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    account_type: str
    email_verified: bool
    linkedin_connected: bool
    created_at: datetime
    
    profile: Optional["UserProfileDetail"]
    subscription: Optional["UserSubscriptionDetail"]
    stats: "UserStatsDetail"

    class Config:
        from_attributes = True


class UserProfileDetail(BaseModel):
    onboarding_completed: bool
    onboarding_step: int
    cv_filename: Optional[str]
    has_writing_samples: bool
    has_custom_instructions: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class UserSubscriptionDetail(BaseModel):
    plan: str
    posts_this_month: int
    posts_limit: int
    stripe_customer_id: Optional[str]
    stripe_subscription_id: Optional[str]
    period_end: Optional[datetime]

    class Config:
        from_attributes = True


class UserStatsDetail(BaseModel):
    total_posts: int
    total_comments: int
    total_conversations: int
    avg_post_rating: Optional[float]
    last_post_date: Optional[datetime]


class SubscriptionPlanResponse(BaseModel):
    id: str
    plan_name: str
    display_name: str
    description: Optional[str]
    price_monthly: int
    price_yearly: int
    posts_limit: int
    features: List[str]
    is_active: bool
    sort_order: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreateSubscriptionPlanRequest(BaseModel):
    plan_name: str
    display_name: str
    description: Optional[str] = None
    price_monthly: int = 0
    price_yearly: int = 0
    posts_limit: int = 5
    features: List[str] = []
    is_active: bool = True
    sort_order: int = 0


class UpdateSubscriptionPlanRequest(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[int] = None
    price_yearly: Optional[int] = None
    posts_limit: Optional[int] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class GlobalSettingResponse(BaseModel):
    id: str
    key: str
    value: Optional[str]
    description: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateGlobalSettingRequest(BaseModel):
    value: str


class CreateGlobalSettingRequest(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    category: Optional[str] = "general"
    setting_type: Optional[str] = "text"  # text, boolean, number, json, select


class PublicSettingsResponse(BaseModel):
    maintenance_mode: bool
    maintenance_message: Optional[str]
    theme: str
    registration_enabled: bool
    app_name: str


class DashboardStatsResponse(BaseModel):
    total_users: int
    active_users_30d: int
    total_posts: int
    total_comments: int
    posts_this_month: int
    avg_post_rating: float
    subscription_breakdown: dict
    revenue_monthly: int
    revenue_yearly: int
