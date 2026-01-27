"""
Credit purchase service
Handles purchasing credits separate from subscriptions
"""
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import json
import uuid
import stripe

from ..models import User, Subscription, SubscriptionPlan, CreditPurchase, CreditPurchaseStatus, PurchasedCreditsBalance, AdminSetting
from ..config import get_settings
from fastapi import HTTPException
from ..logging_config import get_logger
from ..services.notification_service import send_notification
from ..services.credit_service import add_purchased_credits

settings = get_settings()
stripe.api_key = settings.stripe_secret_key
logger = get_logger(__name__)


def get_credit_pricing(db: Session) -> Dict:
    """
    Get credit pricing configuration from admin settings
    
    Returns:
        Dict with pricing, steps, discounts, max purchase, enabled status
    """
    def get_setting(key: str, default):
        setting = db.query(AdminSetting).filter(AdminSetting.key == key).first()
        return json.loads(setting.value) if setting and setting.value else default
    
    price_per_unit = float(get_setting("credit_price_per_unit", "10"))  # cents per credit
    purchase_steps = get_setting("credit_purchase_steps", [10, 25, 50, 100, 250, 500])
    bulk_discounts = get_setting("credit_bulk_discounts", [{"min": 100, "discount": 0.1}, {"min": 250, "discount": 0.15}])
    max_purchase = int(get_setting("credit_max_purchase", 1000))
    enabled = get_setting("credit_purchase_enabled", True)
    
    return {
        "price_per_unit": price_per_unit,
        "purchase_steps": purchase_steps,
        "bulk_discounts": bulk_discounts,
        "max_purchase": max_purchase,
        "enabled": enabled
    }


def calculate_bulk_discount(credits: float, base_price: float, discounts: List[Dict]) -> Dict:
    """
    Calculate price with bulk discounts applied
    
    Args:
        credits: Number of credits
        base_price: Base price per credit
        discounts: List of discount tiers [{"min": 100, "discount": 0.1}, ...]
    
    Returns:
        Dict with final_price, discount_amount, discount_percentage
    """
    # Sort discounts by min amount (descending)
    sorted_discounts = sorted(discounts, key=lambda x: x["min"], reverse=True)
    
    applicable_discount = 0.0
    for discount_tier in sorted_discounts:
        if credits >= discount_tier["min"]:
            applicable_discount = discount_tier["discount"]
            break
    
    subtotal = credits * base_price
    discount_amount = subtotal * applicable_discount
    final_price = subtotal - discount_amount
    
    return {
        "subtotal": subtotal,
        "discount_percentage": applicable_discount * 100,
        "discount_amount": discount_amount,
        "final_price": int(final_price)  # Round to cents
    }


def create_credit_purchase_checkout(
    db: Session,
    user: User,
    credits_amount: float
) -> Dict:
    """
    Create Stripe checkout session for credit purchase
    
    Args:
        db: Database session
        user: User object
        credits_amount: Number of credits to purchase
    
    Returns:
        Dict with checkout_url and session details
    
    Raises:
        HTTPException: If user is on free plan, exceeds max purchase, or feature disabled
    """
    # Check if feature is enabled
    pricing = get_credit_pricing(db)
    if not pricing["enabled"]:
        raise HTTPException(status_code=403, detail="Credit purchases are currently disabled")
    
    # Verify user has paid plan (not free)
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription.plan == SubscriptionPlan.FREE:
        raise HTTPException(
            status_code=403,
            detail="Credit purchases are only available for paid plan subscribers"
        )
    
    # Check max purchase limit
    if credits_amount > pricing["max_purchase"]:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum purchase limit is {pricing['max_purchase']} credits per transaction"
        )
    
    if credits_amount <= 0:
        raise HTTPException(status_code=400, detail="Credits amount must be greater than 0")
    
    # Calculate price with bulk discounts
    price_info = calculate_bulk_discount(
        credits_amount,
        pricing["price_per_unit"],
        pricing["bulk_discounts"]
    )
    
    # Get or create Stripe customer, handling case where customer doesn't exist in Stripe
    customer_id = None
    if subscription.stripe_customer_id:
        # Verify customer exists in Stripe
        try:
            stripe.Customer.retrieve(subscription.stripe_customer_id)
            customer_id = subscription.stripe_customer_id
        except stripe.error.InvalidRequestError:
            # Customer doesn't exist in Stripe, create a new one
            logger.warning(f"Customer {subscription.stripe_customer_id} not found in Stripe, creating new customer")
            from ..services.stripe_service import create_customer
            customer_id = create_customer(user)
            subscription.stripe_customer_id = customer_id
            db.commit()
    else:
        # No customer ID stored, create one
        from ..services.stripe_service import create_customer
        customer_id = create_customer(user)
        subscription.stripe_customer_id = customer_id
        db.commit()
    
    # Create pending purchase record
    purchase = CreditPurchase(
        id=str(uuid.uuid4()),
        user_id=user.id,
        credits_purchased=credits_amount,
        amount_paid_cents=price_info["final_price"],
        status=CreditPurchaseStatus.PENDING,
        purchase_date=datetime.utcnow()
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    
    # Create Stripe Checkout Session (one-time payment)
    try:
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"{int(credits_amount)} Credits",
                        "description": f"Purchase {int(credits_amount)} credits for content generation"
                    },
                    "unit_amount": price_info["final_price"]
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=f"{settings.frontend_url}/billing/success?purchase_id={purchase.id}",
            cancel_url=f"{settings.frontend_url}/billing/canceled",
            metadata={
                "user_id": user.id,
                "purchase_id": purchase.id,
                "credits_amount": str(credits_amount),
                "type": "credit_purchase"
            }
        )
        
        # Update purchase with checkout session ID
        purchase.stripe_checkout_session_id = checkout_session.id
        db.commit()
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "purchase_id": purchase.id,
            "credits_amount": credits_amount,
            "price_info": price_info
        }
    
    except stripe.error.StripeError as e:
        # Mark purchase as failed
        purchase.status = CreditPurchaseStatus.REFUNDED  # Use refunded as failed state
        db.commit()
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")


def handle_credit_purchase_completed(
    db: Session,
    payment_intent_id: Optional[str] = None,
    checkout_session_id: Optional[str] = None
) -> Dict:
    """
    Handle successful credit purchase completion
    
    Args:
        db: Database session
        payment_intent_id: Stripe payment intent ID
        checkout_session_id: Stripe checkout session ID
    
    Returns:
        Dict with purchase completion details
    """
    # Find purchase record
    purchase = None
    if checkout_session_id:
        purchase = db.query(CreditPurchase).filter(
            CreditPurchase.stripe_checkout_session_id == checkout_session_id
        ).first()
    elif payment_intent_id:
        purchase = db.query(CreditPurchase).filter(
            CreditPurchase.stripe_payment_intent_id == payment_intent_id
        ).first()
    
    if not purchase:
        return {"status": "skipped", "reason": "Purchase not found"}
    
    if purchase.status == CreditPurchaseStatus.COMPLETED:
        return {"status": "already_processed", "purchase_id": purchase.id}
    
    # Update purchase status
    purchase.status = CreditPurchaseStatus.COMPLETED
    if payment_intent_id:
        purchase.stripe_payment_intent_id = payment_intent_id
    purchase.updated_at = datetime.utcnow()
    
    # Add credits to purchased balance
    add_purchased_credits(
        db=db,
        user_id=purchase.user_id,
        amount=purchase.credits_purchased,
        purchase_id=purchase.id,
        description=f"Credit purchase: {purchase.credits_purchased} credits"
    )
    
    db.commit()
    db.refresh(purchase)
    
    # Send notification
    try:
        send_notification(
            db=db,
            action_code="credits_purchased",
            user_id=purchase.user_id,
            data={
                "credits_purchased": purchase.credits_purchased,
                "amount_paid": purchase.amount_paid_cents / 100.0
            }
        )
    except Exception as e:
        logger.error(f"Failed to send credit purchase notification: {str(e)}")
    
    return {
        "status": "completed",
        "purchase_id": purchase.id,
        "user_id": purchase.user_id,
        "credits_added": purchase.credits_purchased
    }
