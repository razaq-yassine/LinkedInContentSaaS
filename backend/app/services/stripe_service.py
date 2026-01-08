"""
Stripe integration service
Handles all Stripe operations including checkout, subscriptions, and webhooks
"""
from typing import Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import stripe

from ..config import get_settings
from ..models import User, Subscription, SubscriptionPlanConfig, SubscriptionPlan, BillingCycle, SubscriptionStatus
from .credit_service import reset_monthly_credits
from fastapi import HTTPException

settings = get_settings()

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


def create_customer(user: User) -> str:
    """
    Create a Stripe customer for the user
    
    Args:
        user: User object
    
    Returns:
        Stripe customer ID
    """
    try:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.name,
            metadata={
                "user_id": user.id
            }
        )
        return customer.id
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")


def create_or_get_stripe_price(
    db: Session,
    plan_config: SubscriptionPlanConfig,
    billing_cycle: str
) -> str:
    """
    Create or get Stripe product and price for a plan.
    Used when price IDs are not configured (dev mode).
    
    Args:
        db: Database session
        plan_config: Plan configuration
        billing_cycle: 'monthly' or 'yearly'
    
    Returns:
        Stripe price ID
    """
    try:
        # Check if we already have a price ID
        if billing_cycle == "monthly":
            if plan_config.stripe_price_id_monthly:
                return plan_config.stripe_price_id_monthly
            price_amount = plan_config.price_monthly
        else:
            if plan_config.stripe_price_id_yearly:
                return plan_config.stripe_price_id_yearly
            price_amount = plan_config.price_yearly
        
        # Create or get product
        product_name = f"{plan_config.display_name} - {billing_cycle.capitalize()}"
        
        # Try to find existing product by name
        products = stripe.Product.list(limit=100)
        product = None
        for p in products.data:
            if p.name == product_name:
                product = p
                break
        
        # Create product if it doesn't exist
        if not product:
            product = stripe.Product.create(
                name=product_name,
                description=plan_config.description or f"{plan_config.display_name} subscription",
                metadata={
                    "plan_name": plan_config.plan_name,
                    "billing_cycle": billing_cycle
                }
            )
        
        # Create price
        interval = "month" if billing_cycle == "monthly" else "year"
        price = stripe.Price.create(
            product=product.id,
            unit_amount=price_amount,  # Amount in cents
            currency="usd",
            recurring={
                "interval": interval
            },
            metadata={
                "plan_name": plan_config.plan_name,
                "billing_cycle": billing_cycle
            }
        )
        
        # Save price ID to database
        if billing_cycle == "monthly":
            plan_config.stripe_price_id_monthly = price.id
        else:
            plan_config.stripe_price_id_yearly = price.id
        
        db.commit()
        
        return price.id
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Stripe price: {str(e)}")


def create_checkout_session(
    db: Session,
    user: User,
    plan_name: str,
    billing_cycle: str
) -> Dict:
    """
    Create a Stripe Checkout Session
    
    Args:
        db: Database session
        user: User object
        plan_name: Plan name (e.g., 'pro')
        billing_cycle: 'monthly' or 'yearly'
    
    Returns:
        Dict with checkout_url and session details
    """
    # Get plan config
    plan_config = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == plan_name,
        SubscriptionPlanConfig.is_active == True
    ).first()
    
    if not plan_config:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if Stripe is configured
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured. Please set STRIPE_SECRET_KEY.")
    
    # Get or create Stripe customer
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get or create customer, handling case where customer doesn't exist in Stripe
    customer_id = None
    if subscription.stripe_customer_id:
        # Verify customer exists in Stripe
        try:
            stripe.Customer.retrieve(subscription.stripe_customer_id)
            customer_id = subscription.stripe_customer_id
        except stripe.error.InvalidRequestError:
            # Customer doesn't exist in Stripe, create a new one
            customer_id = create_customer(user)
            subscription.stripe_customer_id = customer_id
            db.commit()
    else:
        # No customer ID stored, create one
        customer_id = create_customer(user)
        subscription.stripe_customer_id = customer_id
        db.commit()
    
    # Determine price ID
    if billing_cycle == "monthly":
        price_id = plan_config.stripe_price_id_monthly
        price = plan_config.price_monthly
    else:
        price_id = plan_config.stripe_price_id_yearly
        price = plan_config.price_yearly
    
    # If price ID is missing, create it on the fly (for dev mode / Stripe CLI)
    if not price_id:
        # Create price on the fly for Stripe CLI testing
        price_id = create_or_get_stripe_price(db, plan_config, billing_cycle)
    
    try:
        # Create Checkout Session with enhanced configuration
        session_params = {
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [
                {
                    "price": price_id,
                    "quantity": 1,
                },
            ],
            "mode": "subscription",
            "success_url": f"{settings.frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": f"{settings.frontend_url}/billing/canceled",
            # Collect customer billing address for tax calculation
            "billing_address_collection": "required",
            # Allow customers to apply promotion codes
            "allow_promotion_codes": True,
            # Customer email prefill
            "customer_update": {
                "address": "auto",
                "name": "auto"
            },
            "metadata": {
                "user_id": user.id,
                "plan_name": plan_name,
                "billing_cycle": billing_cycle
            }
        }
        
        # Enable automatic tax if configured in Stripe
        # Note: This requires Stripe Tax to be enabled in your Stripe Dashboard
        try:
            session_params["automatic_tax"] = {"enabled": True}
        except:
            # If tax is not configured, continue without it
            pass
        
        checkout_session = stripe.checkout.Session.create(**session_params)
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")


def create_subscription(customer_id: str, price_id: str) -> stripe.Subscription:
    """
    Create a Stripe subscription
    
    Args:
        customer_id: Stripe customer ID
        price_id: Stripe price ID
    
    Returns:
        Stripe Subscription object
    """
    try:
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
        )
        return subscription
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")


def cancel_subscription(subscription_id: str) -> Dict:
    """
    Cancel a Stripe subscription
    
    Args:
        subscription_id: Stripe subscription ID
    
    Returns:
        Dict with cancellation details
    """
    try:
        subscription = stripe.Subscription.delete(subscription_id)
        return {
            "status": "canceled",
            "canceled_at": datetime.fromtimestamp(subscription.canceled_at) if subscription.canceled_at else None
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")


def get_subscription_status(subscription_id: str) -> Dict:
    """
    Get Stripe subscription status
    
    Args:
        subscription_id: Stripe subscription ID
    
    Returns:
        Dict with subscription details
    """
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        return {
            "status": subscription.status,
            "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
            "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
            "cancel_at_period_end": subscription.cancel_at_period_end
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")


def sync_subscription_from_stripe(
    db: Session,
    stripe_subscription: stripe.Subscription,
    user_id: str
) -> Subscription:
    """
    Sync subscription data from Stripe to database
    
    Args:
        db: Database session
        stripe_subscription: Stripe Subscription object
        user_id: User ID
    
    Returns:
        Updated Subscription object
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get plan name from metadata
    plan_name = stripe_subscription.metadata.get("plan_name", "pro")
    
    # Update subscription
    subscription.stripe_subscription_id = stripe_subscription.id
    subscription.plan = SubscriptionPlan(plan_name)
    subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
    subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
    
    # Map Stripe status to our status
    if stripe_subscription.status == "active":
        subscription.subscription_status = SubscriptionStatus.ACTIVE
    elif stripe_subscription.status == "past_due":
        subscription.subscription_status = SubscriptionStatus.PAST_DUE
    elif stripe_subscription.status == "canceled":
        subscription.subscription_status = SubscriptionStatus.CANCELED
    
    db.commit()
    db.refresh(subscription)
    
    return subscription


def handle_checkout_completed(db: Session, session: stripe.checkout.Session) -> Dict:
    """
    Handle successful checkout completion
    
    Args:
        db: Database session
        session: Stripe Checkout Session
    
    Returns:
        Dict with activation details
    """
    user_id = session.metadata.get("user_id")
    plan_name = session.metadata.get("plan_name")
    billing_cycle = session.metadata.get("billing_cycle", "monthly")
    
    if not user_id or not plan_name:
        raise HTTPException(status_code=400, detail="Missing metadata in session")
    
    # Get subscription
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get plan config
    plan_config = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == plan_name
    ).first()
    
    if not plan_config:
        raise HTTPException(status_code=404, detail="Plan config not found")
    
    # Retrieve Stripe subscription
    stripe_subscription_id = session.subscription
    stripe_subscription = stripe.Subscription.retrieve(stripe_subscription_id)
    
    # Update subscription
    subscription.plan = SubscriptionPlan(plan_name)
    subscription.credits_limit = plan_config.credits_limit
    subscription.credits_used_this_month = 0  # Reset credits
    subscription.billing_cycle = BillingCycle(billing_cycle)
    subscription.subscription_status = SubscriptionStatus.ACTIVE
    subscription.stripe_subscription_id = stripe_subscription_id
    subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
    subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "user_id": user_id,
        "plan": plan_name,
        "credits_limit": plan_config.credits_limit,
        "status": "activated"
    }


def handle_invoice_paid(db: Session, invoice: stripe.Invoice) -> Dict:
    """
    Handle successful invoice payment (renewal)
    
    Args:
        db: Database session
        invoice: Stripe Invoice object
    
    Returns:
        Dict with renewal details
    """
    subscription_id = invoice.subscription
    
    if not subscription_id:
        return {"status": "skipped", "reason": "No subscription ID"}
    
    # Find subscription by Stripe ID
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_id
    ).first()
    
    if not subscription:
        return {"status": "skipped", "reason": "Subscription not found"}
    
    # Reset monthly credits
    reset_monthly_credits(db, subscription.user_id)
    
    # Update period dates from Stripe
    stripe_subscription = stripe.Subscription.retrieve(subscription_id)
    subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
    subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
    subscription.subscription_status = SubscriptionStatus.ACTIVE
    
    db.commit()
    
    return {
        "user_id": subscription.user_id,
        "status": "renewed",
        "credits_reset": True
    }


def handle_invoice_failed(db: Session, invoice: stripe.Invoice) -> Dict:
    """
    Handle failed invoice payment
    
    Args:
        db: Database session
        invoice: Stripe Invoice object
    
    Returns:
        Dict with failure details
    """
    subscription_id = invoice.subscription
    
    if not subscription_id:
        return {"status": "skipped", "reason": "No subscription ID"}
    
    # Find subscription by Stripe ID
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_id
    ).first()
    
    if not subscription:
        return {"status": "skipped", "reason": "Subscription not found"}
    
    # Mark as past due
    subscription.subscription_status = SubscriptionStatus.PAST_DUE
    
    db.commit()
    
    return {
        "user_id": subscription.user_id,
        "status": "past_due"
    }


def handle_subscription_deleted(db: Session, stripe_subscription: stripe.Subscription) -> Dict:
    """
    Handle subscription cancellation
    
    Args:
        db: Database session
        stripe_subscription: Stripe Subscription object
    
    Returns:
        Dict with cancellation details
    """
    subscription_id = stripe_subscription.id
    
    # Find subscription by Stripe ID
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_id
    ).first()
    
    if not subscription:
        return {"status": "skipped", "reason": "Subscription not found"}
    
    # Mark as canceled and downgrade to free
    subscription.subscription_status = SubscriptionStatus.CANCELED
    subscription.plan = SubscriptionPlan.FREE
    subscription.credits_limit = 5
    subscription.billing_cycle = BillingCycle.MONTHLY
    
    db.commit()
    
    return {
        "user_id": subscription.user_id,
        "status": "canceled",
        "downgraded_to": "free"
    }

