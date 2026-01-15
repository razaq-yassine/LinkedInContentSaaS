"""
Notification endpoints for push subscriptions
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..routers.auth import get_current_user_id
from ..schemas.notifications import (
    PushSubscriptionRequest,
    PushSubscriptionResponse,
    NotificationLogResponse
)
from ..services.push_service import (
    register_push_subscription,
    unregister_push_subscription,
    get_user_subscriptions
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/push/subscribe", response_model=dict)
async def subscribe_to_push(
    request: PushSubscriptionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Register a push notification subscription for the current user.
    """
    result = register_push_subscription(
        db=db,
        user_id=user_id,
        subscription_data={
            "endpoint": request.endpoint,
            "keys": request.keys
        },
        user_agent=request.user_agent
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to register subscription"))
    
    return {"success": True, "action": result.get("action")}


@router.post("/push/unsubscribe", response_model=dict)
async def unsubscribe_from_push(
    request: dict,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Remove a push notification subscription.
    """
    endpoint = request.get("endpoint")
    if not endpoint:
        raise HTTPException(status_code=400, detail="Endpoint is required")
    
    result = unregister_push_subscription(
        db=db,
        user_id=user_id,
        endpoint=endpoint
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Subscription not found"))
    
    return {"success": True}


@router.get("/push/subscriptions", response_model=List[PushSubscriptionResponse])
async def list_push_subscriptions(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all push notification subscriptions for the current user.
    """
    subscriptions = get_user_subscriptions(db=db, user_id=user_id)
    
    return [
        PushSubscriptionResponse(
            id=sub["id"],
            endpoint=sub["endpoint"],
            user_agent=sub.get("user_agent"),
            created_at=sub.get("created_at")
        )
        for sub in subscriptions
    ]
