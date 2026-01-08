from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel
import stripe

from ..database import get_db
from ..models import User, Subscription, SubscriptionPlanConfig
from ..routers.auth import get_current_user
from ..services import stripe_service, credit_service
from ..config import get_settings

settings = get_settings()
stripe.api_key = settings.stripe_secret_key

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
    
    # Create Stripe Checkout Session
    checkout_session = stripe_service.create_checkout_session(
        db=db,
        user=current_user,
        plan_name=request.plan,
        billing_cycle=request.billing_cycle
    )
    
    return {
        "checkout_url": checkout_session["checkout_url"],
        "session_id": checkout_session.get("session_id"),
        "plan": request.plan,
        "billing_cycle": request.billing_cycle
    }

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
    
    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        result = stripe_service.handle_subscription_deleted(db, subscription)
        return {"status": "success", "event": "customer.subscription.deleted", "result": result}
    
    else:
        return {"status": "ignored", "event_type": event.type}
