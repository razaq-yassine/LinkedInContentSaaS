"""
Pydantic schemas for notification endpoints
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class PushSubscriptionRequest(BaseModel):
    """Request schema for push subscription registration"""
    endpoint: str
    keys: Dict[str, str]
    user_agent: Optional[str] = None


class PushSubscriptionResponse(BaseModel):
    """Response schema for push subscription"""
    id: str
    endpoint: str
    user_agent: Optional[str] = None
    created_at: Optional[str] = None


class NotificationPreferenceResponse(BaseModel):
    """Response schema for notification preference"""
    id: str
    action_id: str
    action_code: str
    action_name: str
    description: Optional[str] = None
    category: str
    email_enabled: bool
    push_enabled: bool
    updated_at: datetime
    updated_by_admin_id: Optional[str] = None


class NotificationPreferenceUpdate(BaseModel):
    """Request schema for updating notification preference"""
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None


class NotificationLogResponse(BaseModel):
    """Response schema for notification log"""
    id: str
    action_id: Optional[str] = None
    action_code: Optional[str] = None
    action_name: Optional[str] = None
    user_id: Optional[str] = None
    channel: str
    status: str
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime


class NotificationLogsFilter(BaseModel):
    """Filter schema for notification logs"""
    action_code: Optional[str] = None
    user_id: Optional[str] = None
    channel: Optional[str] = None
    status: Optional[str] = None
    limit: int = 100
    offset: int = 0
