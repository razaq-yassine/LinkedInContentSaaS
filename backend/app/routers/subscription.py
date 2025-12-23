from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Subscription, SubscriptionPlanConfig
from ..routers.auth import get_current_user

router = APIRouter()

class CheckoutRequest(BaseModel):
    plan: str
    billing_cycle: str

@router.get("/plans")
async def get_public_subscription_plans(db: Session = Depends(get_db)):
    """Get all active subscription plans (public endpoint)"""
    plans = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.is_active == True
    ).order_by(SubscriptionPlanConfig.sort_order).all()
    
    return [
        {
            "id": plan.id,
            "plan_name": plan.plan_name,
            "display_name": plan.display_name,
            "description": plan.description,
            "price_monthly": plan.price_monthly,
            "price_yearly": plan.price_yearly,
            "posts_limit": plan.posts_limit,
            "features": plan.features,
            "is_active": plan.is_active,
            "sort_order": plan.sort_order,
            "created_at": plan.created_at,
            "updated_at": plan.updated_at
        }
        for plan in plans
    ]

@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a checkout session for subscription upgrade"""
    plan_config = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == request.plan,
        SubscriptionPlanConfig.is_active == True
    ).first()
    
    if not plan_config:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="User subscription not found")
    
    if subscription.plan == request.plan:
        raise HTTPException(status_code=400, detail="You are already subscribed to this plan")
    
    price = plan_config.price_monthly if request.billing_cycle == "monthly" else plan_config.price_yearly
    
    checkout_url = f"https://checkout.stripe.com/demo?plan={request.plan}&cycle={request.billing_cycle}&price={price}"
    
    return {
        "checkout_url": checkout_url,
        "plan": request.plan,
        "billing_cycle": request.billing_cycle,
        "price": price
    }

@router.post("/webhook")
async def stripe_webhook(db: Session = Depends(get_db)):
    """Handle Stripe webhook events"""
    return {"status": "webhook received"}
