"""
Credit management service
Handles all credit operations including deductions, grants, and tracking
Supports dual credit system: subscription credits (monthly reset) + purchased credits (permanent)
"""
from typing import Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from ..models import Subscription, CreditTransaction, User, PurchasedCreditsBalance, SubscriptionPlan, SubscriptionPlanConfig
from fastapi import HTTPException
from ..logging_config import get_logger, log_credit_transaction
from ..services.notification_service import send_notification

logger = get_logger(__name__)


def get_purchased_credits_balance(db: Session, user_id: str) -> PurchasedCreditsBalance:
    """
    Get or create purchased credits balance for a user
    
    Returns:
        PurchasedCreditsBalance object
    """
    balance = db.query(PurchasedCreditsBalance).filter(
        PurchasedCreditsBalance.user_id == user_id
    ).first()
    
    if not balance:
        balance = PurchasedCreditsBalance(
            user_id=user_id,
            balance=0.0,
            last_updated=datetime.utcnow()
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)
    
    return balance


def get_total_credits(db: Session, user_id: str) -> float:
    """
    Get total available credits (subscription + purchased)
    
    Returns:
        Total credits available
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Unlimited credits
    if subscription.subscription_credits_limit == -1:
        return -1
    
    subscription_available = subscription.subscription_credits_limit - subscription.subscription_credits_used
    purchased_balance = get_purchased_credits_balance(db, user_id)
    
    return subscription_available + purchased_balance.balance


def get_credit_breakdown(db: Session, user_id: str) -> Dict:
    """
    Get detailed credit breakdown showing both pools
    
    Returns:
        Dict with subscription and purchased credit details
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    purchased_balance = get_purchased_credits_balance(db, user_id)
    
    subscription_available = subscription.subscription_credits_limit - subscription.subscription_credits_used
    if subscription.subscription_credits_limit == -1:
        subscription_available = -1
    
    total_available = subscription_available
    if subscription_available != -1:
        total_available += purchased_balance.balance
    
    return {
        "subscription": {
            "limit": subscription.subscription_credits_limit,
            "used": subscription.subscription_credits_used,
            "available": subscription_available
        },
        "purchased": {
            "balance": purchased_balance.balance
        },
        "total_available": total_available
    }


def get_user_credits(db: Session, user_id: str) -> Dict:
    """
    Get current credit balance for a user (backward compatible)
    
    Returns:
        Dict with credits_limit, credits_used, credits_remaining (total)
    """
    breakdown = get_credit_breakdown(db, user_id)
    subscription = breakdown["subscription"]
    
    return {
        "credits_limit": subscription["limit"],
        "credits_used": subscription["used"],
        "credits_remaining": breakdown["total_available"],
        "breakdown": breakdown  # Include detailed breakdown
    }


def check_sufficient_credits(db: Session, user_id: str, required_credits: float) -> bool:
    """
    Check if user has sufficient credits for an action (checks total: subscription + purchased)
    
    Args:
        db: Database session
        user_id: User ID
        required_credits: Credits needed for action
    
    Returns:
        True if user has sufficient credits, False otherwise
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        return False
    
    # Unlimited credits
    if subscription.subscription_credits_limit == -1:
        return True
    
    total_available = get_total_credits(db, user_id)
    return total_available >= required_credits


def deduct_credits_v2(
    db: Session,
    user_id: str,
    amount: float,
    action_type: str,
    description: Optional[str] = None,
    post_id: Optional[str] = None
) -> Dict:
    """
    Deduct credits using dual credit system: subscription credits first, then purchased credits
    
    Args:
        db: Database session
        user_id: User ID
        amount: Credits to deduct
        action_type: Type of action (e.g., 'text_post', 'image_generation')
        description: Optional description
        post_id: Optional post ID
    
    Returns:
        Dict with transaction details
    
    Raises:
        HTTPException: If insufficient credits
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Unlimited credits - no deduction needed
    if subscription.subscription_credits_limit == -1:
        return {
            "transaction_id": None,
            "credits_deducted": 0,
            "credits_remaining": -1,
            "action_type": action_type,
            "source": "unlimited"
        }
    
    purchased_balance = get_purchased_credits_balance(db, user_id)
    
    # Calculate available credits
    subscription_available = subscription.subscription_credits_limit - subscription.subscription_credits_used
    total_available = subscription_available + purchased_balance.balance
    
    if total_available < amount:
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient credits. You have {total_available} credits but need {amount}"
        )
    
    credits_before_total = total_available
    source = "subscription"
    
    # Use subscription credits first
    if subscription_available >= amount:
        # All from subscription
        subscription.subscription_credits_used += amount
        credits_after_total = (subscription.subscription_credits_limit - subscription.subscription_credits_used) + purchased_balance.balance
    else:
        # Use subscription + purchased
        remaining = amount - subscription_available
        subscription.subscription_credits_used = subscription.subscription_credits_limit
        purchased_balance.balance -= remaining
        credits_after_total = purchased_balance.balance
        source = "mixed"
    
    # Log transaction
    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        post_id=post_id,
        action_type=action_type,
        credits_used=-amount,  # Negative for deduction
        credits_before=int(credits_before_total),
        credits_after=int(credits_after_total),
        description=description or f"Deducted {amount} credits for {action_type} (from {source})",
        created_at=datetime.utcnow()
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(subscription)
    db.refresh(purchased_balance)
    
    # Log credit transaction
    log_credit_transaction(
        user_id=user_id,
        action="deduct",
        credits_before=credits_before_total,
        credits_after=credits_after_total,
        credits_changed=-amount,
        description=description
    )
    logger.info(f"Deducted {amount} credits from user {user_id} for {action_type} (from {source})")
    
    # Check and notify about credit levels
    check_and_notify_credits(db, user_id)
    
    return {
        "transaction_id": transaction.id,
        "credits_deducted": amount,
        "credits_remaining": credits_after_total,
        "action_type": action_type,
        "source": source
    }


def deduct_credits(
    db: Session,
    user_id: str,
    amount: float,
    action_type: str,
    description: Optional[str] = None,
    post_id: Optional[str] = None
) -> Dict:
    """
    Deduct credits (wrapper for backward compatibility, uses new v2 logic)
    """
    return deduct_credits_v2(db, user_id, amount, action_type, description, post_id)


def add_purchased_credits(
    db: Session,
    user_id: str,
    amount: float,
    purchase_id: Optional[str] = None,
    description: Optional[str] = None
) -> Dict:
    """
    Add credits to purchased credits balance
    
    Args:
        db: Database session
        user_id: User ID
        amount: Credits to add
        purchase_id: Optional purchase ID
        description: Optional description
    
    Returns:
        Dict with transaction details
    """
    purchased_balance = get_purchased_credits_balance(db, user_id)
    credits_before = purchased_balance.balance
    
    purchased_balance.balance += amount
    purchased_balance.last_updated = datetime.utcnow()
    credits_after = purchased_balance.balance
    
    # Log transaction
    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action_type="credit_purchase",
        credits_used=amount,  # Positive for addition
        credits_before=int(credits_before),
        credits_after=int(credits_after),
        description=description or f"Purchased {amount} credits",
        created_at=datetime.utcnow()
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(purchased_balance)
    
    logger.info(f"Added {amount} purchased credits to user {user_id}: {description}")
    
    return {
        "transaction_id": transaction.id,
        "credits_added": amount,
        "credits_remaining": credits_after,
        "description": description
    }


def add_credits(
    db: Session,
    user_id: str,
    amount: float,
    description: str,
    admin_id: Optional[str] = None
) -> Dict:
    """
    Add credits to user's account (for refunds or admin grants)
    Adds to subscription credits by reducing used amount
    
    Args:
        db: Database session
        user_id: User ID
        amount: Credits to add
        description: Description/reason
        admin_id: Optional admin ID if this is an admin grant
    
    Returns:
        Dict with transaction details
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    credits_before = subscription.subscription_credits_limit - subscription.subscription_credits_used
    
    # Add credits by reducing used credits (can go negative to allow bonus credits)
    subscription.subscription_credits_used = max(0.0, subscription.subscription_credits_used - amount)
    credits_after = subscription.subscription_credits_limit - subscription.subscription_credits_used
    
    # Log transaction
    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        admin_id=admin_id,
        action_type="credit_grant" if admin_id else "credit_refund",
        credits_used=amount,  # Positive for addition
        credits_before=int(credits_before),
        credits_after=int(credits_after),
        description=description,
        created_at=datetime.utcnow()
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(subscription)
    
    # Log credit transaction
    log_credit_transaction(
        user_id=user_id,
        action="add",
        credits_before=credits_before,
        credits_after=credits_after,
        credits_changed=amount,
        description=description
    )
    logger.info(f"Added {amount} credits to user {user_id}: {description}")
    
    return {
        "transaction_id": transaction.id,
        "credits_added": amount,
        "credits_remaining": credits_after,
        "description": description
    }


def admin_grant_credits(
    db: Session,
    user_id: str,
    amount: float,
    admin_id: str,
    reason: str
) -> Dict:
    """
    Admin manually grants credits to a user
    
    Args:
        db: Database session
        user_id: User ID
        amount: Credits to grant
        admin_id: Admin ID
        reason: Reason for grant
    
    Returns:
        Dict with grant details
    """
    return add_credits(
        db=db,
        user_id=user_id,
        amount=amount,
        description=f"Admin grant: {reason}",
        admin_id=admin_id
    )


def reset_subscription_credits(db: Session, user_id: str) -> Dict:
    """
    Reset subscription credits at period renewal (does not affect purchased credits)
    
    Args:
        db: Database session
        user_id: User ID
    
    Returns:
        Dict with reset details
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    old_used = subscription.subscription_credits_used
    subscription.subscription_credits_used = 0.0
    
    db.commit()
    db.refresh(subscription)
    
    # Send notification about credits reset
    try:
        send_notification(
            db=db,
            action_code="subscription_credits_reset",
            user_id=user_id,
            data={
                "credits_limit": subscription.subscription_credits_limit
            }
        )
    except Exception as e:
        logger.error(f"Failed to send credits reset notification: {str(e)}")
    
    return {
        "user_id": user_id,
        "credits_reset": True,
        "previous_used": old_used,
        "credits_available": subscription.subscription_credits_limit
    }


def apply_plan_upgrade_credits(
    subscription: Subscription,
    new_plan_config: SubscriptionPlanConfig,
    is_upgrade: bool = False
) -> Dict:
    """
    Apply plan upgrade credit preservation logic
    
    For upgrades (paid → higher paid):
    - Preserves remaining credits from old plan
    - Adds new plan's credits
    - Formula: available = new_limit - (-old_available) = new_limit + old_available
    
    For new subscriptions:
    - Resets credits to 0
    
    Args:
        subscription: Subscription object to update
        new_plan_config: New plan configuration
        is_upgrade: Whether this is an upgrade (True) or new subscription (False)
    
    Returns:
        Dict with upgrade details including old and new credit values
    """
    old_limit = subscription.subscription_credits_limit
    old_used = subscription.subscription_credits_used
    old_available = old_limit - old_used if old_limit != -1 else 0
    
    # Update plan and limit
    subscription.plan = SubscriptionPlan(new_plan_config.plan_name)
    subscription.subscription_credits_limit = new_plan_config.credits_limit
    
    if is_upgrade:
        # Handle upgrade: preserve remaining credits and append new plan credits
        # Requirement: "preserve current tokens and append new plan tokens"
        # Example: old limit=40, used=0 (40 available) → upgrade to limit=100
        # Expected: 40 (preserved) + 100 (new) = 140 total available
        # To achieve this: used = -(old_limit - old_used) = old_used - old_limit
        # So: available = new_limit - new_used = new_limit - (-old_available) = new_limit + old_available
        if new_plan_config.credits_limit != -1:  # Not unlimited
            # Set used to negative to preserve old_available + add new_limit
            subscription.subscription_credits_used = -old_available
        else:
            # Unlimited plan: preserve old_used
            subscription.subscription_credits_used = old_used
    else:
        # New subscription: reset credits
        subscription.subscription_credits_used = 0.0
    
    new_available = (
        subscription.subscription_credits_limit - subscription.subscription_credits_used
        if subscription.subscription_credits_limit != -1
        else float('inf')
    )
    
    return {
        "is_upgrade": is_upgrade,
        "old_limit": old_limit,
        "old_used": old_used,
        "old_available": old_available,
        "new_limit": subscription.subscription_credits_limit,
        "new_used": subscription.subscription_credits_used,
        "new_available": new_available,
        "credits_preserved": old_available if is_upgrade else 0
    }


def reset_monthly_credits(db: Session, user_id: str) -> Dict:
    """
    Reset monthly credits at period renewal (backward compatible wrapper)
    """
    return reset_subscription_credits(db, user_id)


def calculate_post_estimates(credits: int) -> Dict:
    """
    Calculate min/max posts possible with given credits
    
    Args:
        credits: Number of credits (-1 for unlimited)
    
    Returns:
        Dict with min, max, and display string
    """
    # Unlimited credits
    if credits == -1:
        return {
            "min": -1,
            "max": -1,
            "display": "Unlimited posts"
        }
    
    # Max posts = all text posts (cheapest at 0.5 credits)
    max_posts = int(credits / 0.5)
    
    # Min posts = all carousels (most expensive at 2.5 credits)
    min_posts = int(credits / 2.5)
    
    return {
        "min": min_posts,
        "max": max_posts,
        "display": f"~{min_posts}-{max_posts} posts"
    }


def get_credit_transactions(
    db: Session,
    user_id: str,
    limit: int = 50
) -> list:
    """
    Get credit transaction history for a user
    
    Args:
        db: Database session
        user_id: User ID
        limit: Maximum number of transactions to return
    
    Returns:
        List of credit transactions
    """
    transactions = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == user_id
    ).order_by(CreditTransaction.created_at.desc()).limit(limit).all()
    
    return transactions


def check_and_notify_credits(db: Session, user_id: str):
    """
    Check credit levels and send notifications if needed.
    Uses total credits (subscription + purchased) for notifications.
    
    Args:
        db: Database session
        user_id: User ID
    """
    try:
        breakdown = get_credit_breakdown(db, user_id)
        subscription = breakdown["subscription"]
        credits_remaining = breakdown["total_available"]
        credits_limit = subscription["limit"]
        
        # Skip if unlimited credits
        if credits_limit == -1:
            return
        
        # Check if credits exhausted
        if credits_remaining == 0:
            send_notification(
                db=db,
                action_code="credits_exhausted",
                user_id=user_id,
                data={
                    "credits_limit": credits_limit,
                    "breakdown": breakdown
                }
            )
        # Check if credits are low (< 20%)
        elif credits_limit > 0 and credits_remaining / credits_limit < 0.2:
            send_notification(
                db=db,
                action_code="credits_low",
                user_id=user_id,
                data={
                    "credits_remaining": credits_remaining,
                    "credits_limit": credits_limit,
                    "percentage": (credits_remaining / credits_limit) * 100,
                    "breakdown": breakdown
                }
            )
    except Exception as e:
        logger.error(f"Error checking credits for notifications: {str(e)}")

