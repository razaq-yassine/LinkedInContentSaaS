"""Analytics schemas for admin dashboard"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class UsageSummaryResponse(BaseModel):
    """Overall usage summary"""
    total_tokens: int
    total_cost: float
    total_requests: int
    total_monthly_revenue: float
    total_yearly_revenue: float
    net_profit_monthly: float
    net_profit_yearly: float
    service_breakdown: Dict[str, Any]
    model_breakdown: Dict[str, Any]


class ServiceBreakdownResponse(BaseModel):
    """Usage breakdown by service type"""
    service_type: str
    count: int
    tokens: int
    cost: float


class ModelBreakdownResponse(BaseModel):
    """Usage breakdown by AI model"""
    model: str
    provider: str
    count: int
    tokens: int
    cost: float


class TimelineDataPoint(BaseModel):
    """Time series data point"""
    date: str
    tokens: int
    cost: float
    requests: int


class TopUserResponse(BaseModel):
    """User ranking by usage"""
    user_id: str
    email: str
    name: Optional[str]
    total_tokens: int
    total_cost: float
    total_requests: int
    subscription_plan: str


class UserUsageDetailResponse(BaseModel):
    """Detailed user usage metrics"""
    user_id: str
    email: str
    name: Optional[str]
    total_tokens: int
    total_cost: float
    total_requests: int
    service_breakdown: Dict[str, Any]
    model_breakdown: Dict[str, Any]
    recent_usage: List[Dict[str, Any]]


class PostWithUsageResponse(BaseModel):
    """Post with calculated usage/cost"""
    id: str
    content: str
    format: str
    topic: Optional[str]
    created_at: datetime
    user_email: str
    user_name: Optional[str]
    total_tokens: int
    total_cost: float
    models_used: List[str]
    has_image: bool
    has_search: bool


class PostUsageDetailResponse(BaseModel):
    """Detailed breakdown of post costs"""
    post_id: str
    content: str
    format: str
    topic: Optional[str]
    created_at: datetime
    user_id: str
    user_email: str
    user_name: Optional[str]
    
    # Text generation
    text_generation_cost: float
    text_input_tokens: int
    text_output_tokens: int
    text_model: Optional[str]
    text_provider: Optional[str]
    
    # Image generation
    image_generation_cost: float
    image_count: int
    image_model: Optional[str]
    
    # Search
    search_cost: float
    search_count: int
    
    # Total
    total_cost: float
    total_tokens: int
    
    # Generation options
    generation_options: Optional[Dict[str, Any]]


class UsageTrackingRecord(BaseModel):
    """Usage tracking record"""
    id: str
    user_id: str
    post_id: Optional[str]
    service_type: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost: float
    model: Optional[str]
    provider: Optional[str]
    image_count: int
    search_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AnalyticsFilters(BaseModel):
    """Filters for analytics queries"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user_id: Optional[str] = None
    service_type: Optional[str] = None
    period: Optional[str] = "month"  # "today", "week", "month", "all"


class PostsListFilters(BaseModel):
    """Filters for posts list"""
    search: Optional[str] = None
    format: Optional[str] = None
    user_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    sort_by: Optional[str] = "cost"  # "cost", "tokens", "date"
    sort_order: Optional[str] = "desc"  # "asc", "desc"
    skip: int = 0
    limit: int = 20


class PostsListResponse(BaseModel):
    """Response for posts list with pagination"""
    posts: List[PostWithUsageResponse]
    total: int
    skip: int
    limit: int
    total_cost: float
    total_tokens: int
    avg_cost_per_post: float

