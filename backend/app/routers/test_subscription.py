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
from app.services.credit_service import apply_plan_upgrade_credits

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
    old_credits_limit = subscription.subscription_credits_limit
    old_credits_used = subscription.subscription_credits_used
    
    # Check if this is an upgrade (user has existing paid subscription)
    is_upgrade = (
        subscription.stripe_subscription_id and
        subscription.plan != SubscriptionPlan.FREE and
        request.plan_name != "FREE"
    )
    
    # Apply upgrade credit preservation logic using shared function
    upgrade_details = apply_plan_upgrade_credits(
        subscription=subscription,
        new_plan_config=plan_config,
        is_upgrade=is_upgrade
    )
    
    # Convert billing_cycle to uppercase to match enum values
    billing_cycle_upper = request.billing_cycle.upper()
    subscription.billing_cycle = BillingCycle(billing_cycle_upper)
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
    
    # Calculate credits remaining
    credits_remaining = (
        subscription.subscription_credits_limit - subscription.subscription_credits_used
        if subscription.subscription_credits_limit != -1
        else "unlimited"
    )
    
    return {
        "success": True,
        "message": "Subscription activated successfully (TEST MODE)",
        "previous": {
            "plan": old_plan.value if hasattr(old_plan, 'value') else str(old_plan),
            "credits_limit": old_credits_limit,
            "credits_used": old_credits_used,
            "credits_remaining": old_credits_limit - old_credits_used if old_credits_limit != -1 else "unlimited"
        },
        "current": {
            "plan": subscription.plan.value if hasattr(subscription.plan, 'value') else str(subscription.plan),
            "credits_limit": subscription.subscription_credits_limit,
            "credits_used": subscription.subscription_credits_used,
            "credits_remaining": credits_remaining,
            "billing_cycle": subscription.billing_cycle.value if hasattr(subscription.billing_cycle, 'value') else str(subscription.billing_cycle),
            "status": subscription.subscription_status.value if hasattr(subscription.subscription_status, 'value') else str(subscription.subscription_status),
            "period_start": subscription.current_period_start.isoformat() if subscription.current_period_start else None,
            "period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None
        },
        "upgrade_details": upgrade_details if is_upgrade else None,
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
        SubscriptionPlanConfig.plan_name == "FREE"
    ).first()
    
    if not free_plan:
        raise HTTPException(status_code=404, detail="Free plan not found")
    
    # Reset to free plan
    old_plan = subscription.plan
    subscription.plan = SubscriptionPlan.FREE
    subscription.subscription_credits_limit = free_plan.credits_limit
    subscription.subscription_credits_used = 0.0
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
            "credits_limit": subscription.subscription_credits_limit,
            "credits_used": subscription.subscription_credits_used
        }
    }


