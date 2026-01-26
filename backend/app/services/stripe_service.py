"""
Stripe integration service
Handles all Stripe operations including checkout, subscriptions, and webhooks
"""
from typing import Dict, Optional, Tuple, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import stripe

from ..config import get_settings
from ..models import User, Subscription, SubscriptionPlanConfig, SubscriptionPlan, BillingCycle, SubscriptionStatus
from .credit_service import reset_subscription_credits, apply_plan_upgrade_credits
from .notification_service import send_notification
from ..logging_config import get_logger
from fastapi import HTTPException

logger = get_logger(__name__)

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


def can_switch_yearly_to_monthly(
    subscription: Subscription,
    new_billing_cycle: str
) -> Tuple[bool, Optional[str], Optional[int]]:
    """
    Check if user can switch from yearly to monthly subscription.
    
    Yearly subscriptions can only be switched to monthly within the last 30 days
    of the subscription period. This prevents users from losing paid time.
    
    Args:
        subscription: Current subscription object
        new_billing_cycle: Target billing cycle ('monthly' or 'yearly')
    
    Returns:
        Tuple of (can_switch: bool, error_message: Optional[str], days_remaining: Optional[int])
    """
    # Only restrict yearly → monthly transitions
    if subscription.billing_cycle == BillingCycle.YEARLY and new_billing_cycle == "monthly":
        if not subscription.current_period_end:
            return False, "Cannot determine subscription end date. Please contact support.", None
        
        # Calculate days remaining
        days_remaining = (subscription.current_period_end - datetime.utcnow()).days
        
        # If period end is in the past, allow switch (edge case)
        if days_remaining < 0:
            return True, None, days_remaining
        
        # Block if more than 30 days remaining
        if days_remaining > 30:
            error_message = (
                f"Yearly subscriptions cannot be switched to monthly until the last 30 days. "
                f"Your subscription ends in {days_remaining} days. "
                f"Consider purchasing credits instead to get immediate access."
            )
            return False, error_message, days_remaining
    
    return True, None, None


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
    
    # Check if this is an upgrade (user has existing paid subscription)
    is_upgrade = (
        subscription.stripe_subscription_id and 
        subscription.stripe_subscription_id != stripe_subscription_id and
        subscription.plan != SubscriptionPlan.FREE
    )
    
    # Apply upgrade credit preservation logic using shared function
    upgrade_details = apply_plan_upgrade_credits(
        subscription=subscription,
        new_plan_config=plan_config,
        is_upgrade=is_upgrade
    )
    
    # Convert billing_cycle to uppercase to match enum values
    billing_cycle_upper = billing_cycle.upper()
    subscription.billing_cycle = BillingCycle(billing_cycle_upper)
    subscription.subscription_status = SubscriptionStatus.ACTIVE
    subscription.stripe_subscription_id = stripe_subscription_id
    subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
    subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
    
    db.commit()
    db.refresh(subscription)
    
    # Send notification
    try:
        if is_upgrade:
            send_notification(
                db=db,
                action_code="subscription_upgraded",
                user_id=user_id,
                data={
                    "old_plan": upgrade_details["old_limit"],
                    "new_plan": plan_name,
                    "credits_limit": plan_config.credits_limit,
                    "credits_preserved": upgrade_details["credits_preserved"]
                }
            )
        else:
            send_notification(
                db=db,
                action_code="subscription_activated",
                user_id=user_id,
                data={
                    "plan": plan_name,
                    "credits_limit": plan_config.credits_limit
                }
            )
    except Exception as e:
        print(f"Failed to send subscription notification: {str(e)}")
    
    return {
        "user_id": user_id,
        "plan": plan_name,
        "credits_limit": plan_config.credits_limit,
        "status": "upgraded" if is_upgrade else "activated"
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
    
    # Reset subscription credits (not purchased credits)
    from ..services.credit_service import reset_subscription_credits
    reset_subscription_credits(db, subscription.user_id)
    
    # Update period dates from Stripe
    stripe_subscription = stripe.Subscription.retrieve(subscription_id)
    subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
    subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
    subscription.subscription_status = SubscriptionStatus.ACTIVE
    
    db.commit()
    
    # Send notification
    try:
        send_notification(
            db=db,
            action_code="subscription_renewed",
            user_id=subscription.user_id,
            data={
                "plan": subscription.plan.value,
                "credits_reset": True
            }
        )
    except Exception as e:
        print(f"Failed to send subscription renewal notification: {str(e)}")
    
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
    
    # Send notification
    try:
        send_notification(
            db=db,
            action_code="payment_failed",
            user_id=subscription.user_id,
            data={
                "plan": subscription.plan.value,
                "invoice_id": invoice.id
            }
        )
    except Exception as e:
        print(f"Failed to send payment failure notification: {str(e)}")
    
    return {
        "user_id": subscription.user_id,
        "status": "past_due"
    }


def handle_upgrade(
    db: Session,
    user: User,
    new_plan_name: str,
    billing_cycle: str
) -> Dict:
    """
    Handle subscription upgrade (paid → higher paid plan)
    Cancels old subscription, creates new one, preserves credits
    
    Args:
        db: Database session
        user: User object
        new_plan_name: New plan name
        billing_cycle: Monthly or yearly
    
    Returns:
        Dict with upgrade details
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription.plan == SubscriptionPlan.FREE:
        raise HTTPException(status_code=400, detail="Cannot upgrade from free plan using this method")
    
    # Get new plan config
    plan_config = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == new_plan_name,
        SubscriptionPlanConfig.is_active == True
    ).first()
    
    if not plan_config:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    old_plan = subscription.plan
    
    # Cancel old Stripe subscription immediately
    if subscription.stripe_subscription_id:
        try:
            stripe.Subscription.delete(subscription.stripe_subscription_id)
        except stripe.error.StripeError as e:
            logger.error(f"Error canceling old subscription: {str(e)}")
    
    # Create new Stripe subscription
    customer_id = subscription.stripe_customer_id
    if not customer_id:
        customer_id = create_customer(user)
        subscription.stripe_customer_id = customer_id
    
    # Get price ID for new plan
    if billing_cycle == "monthly":
        price_id = plan_config.stripe_price_id_monthly
    else:
        price_id = plan_config.stripe_price_id_yearly
    
    if not price_id:
        price_id = create_or_get_stripe_price(db, plan_config, billing_cycle)
    
    # Create new subscription
    new_stripe_subscription = stripe.Subscription.create(
        customer=customer_id,
        items=[{"price": price_id}],
        metadata={
            "user_id": user.id,
            "plan_name": new_plan_name,
            "billing_cycle": billing_cycle
        }
    )
    
    # Apply upgrade credit preservation logic using shared function
    upgrade_details = apply_plan_upgrade_credits(
        subscription=subscription,
        new_plan_config=plan_config,
        is_upgrade=True  # This is always an upgrade when called from handle_upgrade
    )
    # Convert billing_cycle to uppercase to match enum values
    billing_cycle_upper = billing_cycle.upper()
    subscription.billing_cycle = BillingCycle(billing_cycle_upper)
    subscription.subscription_status = SubscriptionStatus.ACTIVE
    subscription.stripe_subscription_id = new_stripe_subscription.id
    subscription.current_period_start = datetime.fromtimestamp(new_stripe_subscription.current_period_start)
    subscription.current_period_end = datetime.fromtimestamp(new_stripe_subscription.current_period_end)
    
    db.commit()
    db.refresh(subscription)
    
    # Send notification
    try:
        send_notification(
            db=db,
            action_code="subscription_upgraded",
            user_id=user.id,
            data={
                "old_plan": old_plan.value,
                "new_plan": new_plan_name,
                "credits_limit": plan_config.credits_limit,
                "credits_preserved": upgrade_details["credits_preserved"]
            }
        )
    except Exception as e:
        logger.error(f"Failed to send upgrade notification: {str(e)}")
    
    return {
        "user_id": user.id,
        "old_plan": old_plan.value,
        "new_plan": new_plan_name,
        "credits_limit": plan_config.credits_limit,
        "status": "upgraded"
    }


def handle_downgrade_to_free(db: Session, user: User) -> Dict:
    """
    Handle downgrade to free plan
    Schedules downgrade at period end, keeps premium access until then
    
    Args:
        db: Database session
        user: User object
    
    Returns:
        Dict with downgrade scheduling details
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription.plan == SubscriptionPlan.FREE:
        raise HTTPException(status_code=400, detail="Already on free plan")
    
    # Get free plan config
    free_plan = db.query(SubscriptionPlanConfig).filter(
        SubscriptionPlanConfig.plan_name == "free",
        SubscriptionPlanConfig.is_active == True
    ).first()
    
    if not free_plan:
        raise HTTPException(status_code=404, detail="Free plan not found")
    
    # Schedule downgrade at period end
    subscription.scheduled_downgrade_plan = "free"
    subscription.scheduled_downgrade_date = subscription.current_period_end
    
    # Cancel Stripe subscription at period end (keeps access until then)
    if subscription.stripe_subscription_id:
        try:
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True
            )
        except stripe.error.StripeError as e:
            logger.error(f"Error scheduling subscription cancellation: {str(e)}")
    
    db.commit()
    db.refresh(subscription)
    
    # Send notification
    try:
        send_notification(
            db=db,
            action_code="subscription_downgrade_scheduled",
            user_id=user.id,
            data={
                "current_plan": subscription.plan.value,
                "scheduled_plan": "free",
                "effective_date": subscription.current_period_end.isoformat() if subscription.current_period_end else None
            }
        )
    except Exception as e:
        logger.error(f"Failed to send downgrade notification: {str(e)}")
    
    return {
        "user_id": user.id,
        "status": "downgrade_scheduled",
        "current_plan": subscription.plan.value,
        "scheduled_plan": "free",
        "effective_date": subscription.current_period_end.isoformat() if subscription.current_period_end else None
    }


def handle_subscription_updated(db: Session, stripe_subscription: stripe.Subscription) -> Dict:
    """
    Handle Stripe subscription update (plan changes, period updates)
    
    Args:
        db: Database session
        stripe_subscription: Stripe Subscription object
    
    Returns:
        Dict with update details
    """
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == stripe_subscription.id
    ).first()
    
    if not subscription:
        return {"status": "skipped", "reason": "Subscription not found"}
    
    # Check if subscription was canceled at period end and period has ended
    if stripe_subscription.cancel_at_period_end and stripe_subscription.status == "canceled":
        # Period ended, apply scheduled downgrade
        if subscription.scheduled_downgrade_plan:
            # Apply downgrade
            free_plan = db.query(SubscriptionPlanConfig).filter(
                SubscriptionPlanConfig.plan_name == subscription.scheduled_downgrade_plan,
                SubscriptionPlanConfig.is_active == True
            ).first()
            
            if free_plan:
                subscription.plan = SubscriptionPlan(free_plan.plan_name)
                subscription.subscription_credits_limit = free_plan.credits_limit
                subscription.subscription_status = SubscriptionStatus.CANCELED
                subscription.scheduled_downgrade_plan = None
                subscription.scheduled_downgrade_date = None
                
                db.commit()
                
                # Send notification
                try:
                    send_notification(
                        db=db,
                        action_code="subscription_downgraded",
                        user_id=subscription.user_id,
                        data={
                            "plan": free_plan.plan_name,
                            "credits_limit": free_plan.credits_limit
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to send downgrade notification: {str(e)}")
                
                return {
                    "user_id": subscription.user_id,
                    "status": "downgraded",
                    "plan": free_plan.plan_name
                }
    
    # Update period dates
    subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
    subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
    
    db.commit()
    
    return {
        "user_id": subscription.user_id,
        "status": "updated"
    }


def handle_subscription_deleted(db: Session, stripe_subscription: stripe.Subscription) -> Dict:
    """
    Handle subscription cancellation/deletion
    Checks if cancel_at_period_end was set - if so, applies downgrade
    
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
    
    # Check if this was a scheduled cancellation (cancel_at_period_end)
    # If period_end has passed, apply downgrade
    if subscription.scheduled_downgrade_plan and subscription.current_period_end:
        if datetime.utcnow() >= subscription.current_period_end:
            # Apply downgrade
            free_plan = db.query(SubscriptionPlanConfig).filter(
                SubscriptionPlanConfig.plan_name == subscription.scheduled_downgrade_plan,
                SubscriptionPlanConfig.is_active == True
            ).first()
            
            if free_plan:
                subscription.plan = SubscriptionPlan(free_plan.plan_name)
                subscription.subscription_credits_limit = free_plan.credits_limit
                subscription.subscription_status = SubscriptionStatus.CANCELED
                subscription.scheduled_downgrade_plan = None
                subscription.scheduled_downgrade_date = None
                
                db.commit()
                
                try:
                    send_notification(
                        db=db,
                        action_code="subscription_downgraded",
                        user_id=subscription.user_id,
                        data={
                            "plan": free_plan.plan_name,
                            "credits_limit": free_plan.credits_limit
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to send downgrade notification: {str(e)}")
                
                return {
                    "user_id": subscription.user_id,
                    "status": "downgraded",
                    "plan": free_plan.plan_name
                }
    
    # Immediate cancellation (not scheduled)
    subscription.subscription_status = SubscriptionStatus.CANCELED
    subscription.plan = SubscriptionPlan.FREE
    subscription.subscription_credits_limit = 5
    subscription.billing_cycle = BillingCycle.MONTHLY
    
    db.commit()
    
    # Send notification
    try:
        send_notification(
            db=db,
            action_code="subscription_canceled",
            user_id=subscription.user_id,
            data={
                "plan": subscription.plan.value
            }
        )
    except Exception as e:
        logger.error(f"Failed to send subscription cancellation notification: {str(e)}")
    
    return {
        "user_id": subscription.user_id,
        "status": "canceled",
        "downgraded_to": "free"
    }

