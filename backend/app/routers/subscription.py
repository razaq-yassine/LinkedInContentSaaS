from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel
import stripe

from ..database import get_db
from ..models import User, Subscription, SubscriptionPlanConfig, SubscriptionPlan
from ..routers.auth import get_current_user
from ..services import stripe_service, credit_service
from ..config import get_settings
from pydantic import BaseModel as PydanticBaseModel

settings = get_settings()
stripe.api_key = settings.stripe_secret_key

router = APIRouter()

class CheckoutRequest(PydanticBaseModel):
    plan: str
    billing_cycle: str


class UpgradeRequest(PydanticBaseModel):
    plan: str
    billing_cycle: str


class DowngradeRequest(PydanticBaseModel):
    pass

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
            "credits_limit": plan.credits_limit,
            "estimated_posts": credit_service.calculate_post_estimates(plan.credits_limit),
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
    # Normalize plan name to uppercase to match enum values and SubscriptionPlanConfig.plan_name
    plan_name_upper = request.plan.upper()
    
    plan_config = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == plan_name_upper,
        SubscriptionPlanConfig.is_active == True
    ).first()
    
    if not plan_config:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="User subscription not found")
    
    # Compare enum value (uppercase) with normalized plan name
    if subscription.plan.value == plan_name_upper:
        raise HTTPException(status_code=400, detail="You are already subscribed to this plan")
    
    # Check yearly → monthly restriction
    can_switch, error_message, days_remaining = stripe_service.can_switch_yearly_to_monthly(
        subscription=subscription,
        new_billing_cycle=request.billing_cycle
    )
    
    if not can_switch:
        # Return structured error response
        raise HTTPException(
            status_code=400,
            detail=error_message
        )
    
    # Create Stripe Checkout Session
    checkout_session = stripe_service.create_checkout_session(
        db=db,
        user=current_user,
        plan_name=plan_name_upper,
        billing_cycle=request.billing_cycle
    )
    
    return {
        "checkout_url": checkout_session["checkout_url"],
        "session_id": checkout_session.get("session_id"),
        "plan": plan_name_upper,
        "billing_cycle": request.billing_cycle
    }


@router.post("/upgrade")
async def upgrade_subscription(
    request: UpgradeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Explicit upgrade endpoint - cancels old subscription and creates new one immediately"""
    try:
        # Normalize plan name to uppercase to match enum values and SubscriptionPlanConfig.plan_name
        plan_name_upper = request.plan.upper()
        
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).first()
        
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        if subscription.plan == SubscriptionPlan.FREE:
            raise HTTPException(status_code=400, detail="Cannot upgrade from free plan. Use /checkout instead.")
        
        # Compare enum value (uppercase) with normalized plan name
        if subscription.plan.value == plan_name_upper:
            raise HTTPException(status_code=400, detail="You are already subscribed to this plan")
        
        # Verify plan exists before proceeding
        plan_config = db.query(SubscriptionPlanConfig).filter(
            SubscriptionPlanConfig.plan_name == plan_name_upper,
            SubscriptionPlanConfig.is_active == True
        ).first()
        
        if not plan_config:
            raise HTTPException(
                status_code=400, 
                detail=f"Plan '{plan_name_upper}' not found or is not active. Available plans: {', '.join([p.plan_name for p in db.query(SubscriptionPlanConfig).filter(SubscriptionPlanConfig.is_active == True).all()])}"
            )
        
        # Check yearly → monthly restriction
        can_switch, error_message, days_remaining = stripe_service.can_switch_yearly_to_monthly(
            subscription=subscription,
            new_billing_cycle=request.billing_cycle
        )
        
        if not can_switch:
            # Return structured error response
            raise HTTPException(
                status_code=400,
                detail=error_message
            )
        
        # Use upgrade handler
        result = stripe_service.handle_upgrade(
            db=db,
            user=current_user,
            new_plan_name=plan_name_upper,
            billing_cycle=request.billing_cycle
        )
        
        return result
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log unexpected errors and return a proper error message
        import traceback
        print(f"Unexpected error in upgrade_subscription: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post("/downgrade")
async def downgrade_subscription(
    request: DowngradeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Schedule downgrade to free plan - keeps premium access until period end"""
    result = stripe_service.handle_downgrade_to_free(db=db, user=current_user)
    return result


@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel subscription (schedules downgrade to free at period end)"""
    result = stripe_service.handle_downgrade_to_free(db=db, user=current_user)
    return result


@router.get("/credits/breakdown")
async def get_credit_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed credit breakdown showing subscription and purchased credits"""
    breakdown = credit_service.get_credit_breakdown(db, current_user.id)
    return breakdown

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not settings.stripe_webhook_secret:
        # If webhook secret not configured, skip verification (dev mode)
        event = stripe.Event.construct_from(
            await request.json(), stripe.api_key
        )
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle different event types
    if event.type == "checkout.session.completed":
        session = event.data.object
        result = stripe_service.handle_checkout_completed(db, session)
        return {"status": "success", "event": "checkout.session.completed", "result": result}
    
    elif event.type == "invoice.payment_succeeded":
        invoice = event.data.object
        result = stripe_service.handle_invoice_paid(db, invoice)
        return {"status": "success", "event": "invoice.payment_succeeded", "result": result}
    
    elif event.type == "invoice.payment_failed":
        invoice = event.data.object
        result = stripe_service.handle_invoice_failed(db, invoice)
        return {"status": "success", "event": "invoice.payment_failed", "result": result}
    
    elif event.type == "customer.subscription.updated":
        subscription = event.data.object
        result = stripe_service.handle_subscription_updated(db, subscription)
        return {"status": "success", "event": "customer.subscription.updated", "result": result}
    
    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        result = stripe_service.handle_subscription_deleted(db, subscription)
        return {"status": "success", "event": "customer.subscription.deleted", "result": result}
    
    else:
        return {"status": "ignored", "event_type": event.type}
