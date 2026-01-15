"""
Credit management service
Handles all credit operations including deductions, grants, and tracking
"""
from typing import Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from ..models import Subscription, CreditTransaction, User
from fastapi import HTTPException
from ..logging_config import get_logger, log_credit_transaction
from ..services.notification_service import send_notification

logger = get_logger(__name__)


def get_user_credits(db: Session, user_id: str) -> Dict:
    """
    Get current credit balance for a user
    
    Returns:
        Dict with credits_limit, credits_used, credits_remaining
    """
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    credits_remaining = subscription.credits_limit - subscription.credits_used_this_month
    
    return {
        "credits_limit": subscription.credits_limit,
        "credits_used": subscription.credits_used_this_month,
        "credits_remaining": credits_remaining
    }


def check_sufficient_credits(db: Session, user_id: str, required_credits: float) -> bool:
    """
    Check if user has sufficient credits for an action
    
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
    
    # Unlimited credits (credits_limit == -1)
    if subscription.credits_limit == -1:
        return True
    
    credits_info = get_user_credits(db, user_id)
    return credits_info["credits_remaining"] >= required_credits


def deduct_credits(
    db: Session,
    user_id: str,
    amount: float,
    action_type: str,
    description: Optional[str] = None,
    post_id: Optional[str] = None
) -> Dict:
    """
    Deduct credits from user's account and log transaction
    
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
    
    # Unlimited credits (credits_limit == -1) - no deduction needed
    if subscription.credits_limit == -1:
        return {
            "transaction_id": None,
            "credits_deducted": 0,
            "credits_remaining": -1,  # Unlimited
            "action_type": action_type
        }
    
    credits_before = subscription.credits_limit - subscription.credits_used_this_month
    
    if credits_before < amount:
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient credits. You have {credits_before} credits but need {amount}"
        )
    
    # Deduct credits
    subscription.credits_used_this_month += amount
    credits_after = subscription.credits_limit - subscription.credits_used_this_month
    
    # Log transaction
    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        post_id=post_id,
        action_type=action_type,
        credits_used=-amount,  # Negative for deduction
        credits_before=credits_before,
        credits_after=credits_after,
        description=description or f"Deducted {amount} credits for {action_type}",
        created_at=datetime.utcnow()
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(subscription)
    
    # Log credit transaction
    log_credit_transaction(
        user_id=user_id,
        action="deduct",
        credits_before=credits_before,
        credits_after=credits_after,
        credits_changed=-amount,
        description=description
    )
    logger.info(f"Deducted {amount} credits from user {user_id} for {action_type}")
    
    # Check and notify about credit levels
    check_and_notify_credits(db, user_id)
    
    return {
        "transaction_id": transaction.id,
        "credits_deducted": amount,
        "credits_remaining": credits_after,
        "action_type": action_type
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
    
    credits_before = subscription.credits_limit - subscription.credits_used_this_month
    
    # Add credits by reducing used credits (can go negative to allow bonus credits)
    subscription.credits_used_this_month = max(0.0, subscription.credits_used_this_month - amount)
    credits_after = subscription.credits_limit - subscription.credits_used_this_month
    
    # Log transaction
    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        admin_id=admin_id,
        action_type="credit_grant" if admin_id else "credit_refund",
        credits_used=amount,  # Positive for addition
        credits_before=credits_before,
        credits_after=credits_after,
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


def reset_monthly_credits(db: Session, user_id: str) -> Dict:
    """
    Reset monthly credits at period renewal
    
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
    
    old_used = subscription.credits_used_this_month
    subscription.credits_used_this_month = 0.0
    
    db.commit()
    db.refresh(subscription)
    
    # Send notification about credits reset
    try:
        send_notification(
            db=db,
            action_code="credits_reset",
            user_id=user_id,
            data={
                "credits_limit": subscription.credits_limit
            }
        )
    except Exception as e:
        logger.error(f"Failed to send credits reset notification: {str(e)}")
    
    return {
        "user_id": user_id,
        "credits_reset": True,
        "previous_used": old_used,
        "credits_available": subscription.credits_limit
    }


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
    
    Args:
        db: Database session
        user_id: User ID
    """
    try:
        credits_info = get_user_credits(db, user_id)
        credits_remaining = credits_info['credits_remaining']
        credits_limit = credits_info['credits_limit']
        
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
                    "credits_limit": credits_limit
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
                    "percentage": (credits_remaining / credits_limit) * 100
                }
            )
    except Exception as e:
        logger.error(f"Error checking credits for notifications: {str(e)}")

