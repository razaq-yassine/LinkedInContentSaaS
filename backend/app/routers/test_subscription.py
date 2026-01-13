"""
Test endpoints for simulating Stripe subscription flow in development
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, Subscription, SubscriptionPlanConfig, SubscriptionPlan, BillingCycle, SubscriptionStatus
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/test", tags=["test"])


class TestSubscriptionRequest(BaseModel):
    plan_name: str
    billing_cycle: str = "monthly"


@router.post("/simulate-subscription")
async def simulate_subscription_completion(
    request: TestSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    TEST ONLY: Simulate a successful Stripe subscription completion
    
    This endpoint mimics what happens when Stripe sends a checkout.session.completed webhook.
    Use this to test the subscription flow without needing Stripe CLI.
    
    Args:
        plan_name: The plan to subscribe to (starter, pro, unlimited)
        billing_cycle: monthly or yearly
    """
    
    # Get user's subscription
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get plan config
    plan_config = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == request.plan_name
    ).first()
    
    if not plan_config:
        available_plans = db.query(SubscriptionPlanConfig).filter(
            SubscriptionPlanConfig.is_active == True
        ).all()
        plan_names = [p.plan_name for p in available_plans]
        raise HTTPException(
            status_code=404, 
            detail=f"Plan '{request.plan_name}' not found. Available plans: {', '.join(plan_names)}"
        )
    
    # Store old values for response
    old_plan = subscription.plan
    old_credits = subscription.credits_limit
    
    # Update subscription (simulate what the webhook handler does)
    subscription.plan = SubscriptionPlan(request.plan_name)
    subscription.credits_limit = plan_config.credits_limit
    subscription.credits_used_this_month = 0.0  # Reset credits on new subscription
    subscription.billing_cycle = BillingCycle(request.billing_cycle)
    subscription.subscription_status = SubscriptionStatus.ACTIVE
    
    # Set test Stripe IDs
    subscription.stripe_customer_id = f"cus_test_{current_user.id}"
    subscription.stripe_subscription_id = f"sub_test_{current_user.id}_{datetime.utcnow().timestamp()}"
    
    # Set subscription period (30 days for monthly, 365 for yearly)
    subscription.current_period_start = datetime.utcnow()
    if request.billing_cycle == "yearly":
        subscription.current_period_end = datetime.utcnow() + timedelta(days=365)
    else:
        subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "success": True,
        "message": "Subscription activated successfully (TEST MODE)",
        "previous": {
            "plan": old_plan,
            "credits_limit": old_credits
        },
        "current": {
            "plan": subscription.plan,
            "credits_limit": subscription.credits_limit,
            "credits_used": subscription.credits_used_this_month,
            "credits_remaining": subscription.credits_limit - subscription.credits_used_this_month if subscription.credits_limit != -1 else "unlimited",
            "billing_cycle": subscription.billing_cycle,
            "status": subscription.subscription_status,
            "period_start": subscription.current_period_start.isoformat(),
            "period_end": subscription.current_period_end.isoformat()
        },
        "stripe_test_ids": {
            "customer_id": subscription.stripe_customer_id,
            "subscription_id": subscription.stripe_subscription_id
        }
    }


@router.post("/reset-subscription")
async def reset_to_free_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    TEST ONLY: Reset user's subscription back to free plan
    
    Useful for testing the upgrade flow multiple times.
    """
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get free plan config
    free_plan = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == "free"
    ).first()
    
    if not free_plan:
        raise HTTPException(status_code=404, detail="Free plan not found")
    
    # Reset to free plan
    old_plan = subscription.plan
    subscription.plan = SubscriptionPlan.FREE
    subscription.credits_limit = free_plan.credits_limit
    subscription.credits_used_this_month = 0.0
    subscription.billing_cycle = BillingCycle.MONTHLY
    subscription.subscription_status = SubscriptionStatus.ACTIVE
    subscription.stripe_customer_id = None
    subscription.stripe_subscription_id = None
    subscription.current_period_start = None
    subscription.current_period_end = None
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "success": True,
        "message": "Subscription reset to free plan",
        "previous_plan": old_plan,
        "current": {
            "plan": subscription.plan,
            "credits_limit": subscription.credits_limit,
            "credits_used": subscription.credits_used_this_month
        }
    }


