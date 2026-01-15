"""
Notification service for sending notifications via multiple channels
"""
from typing import Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from ..models import NotificationAction, NotificationPreference, NotificationLog, User
from ..services.email_template_service import send_notification_email
from ..services.push_service import send_push_notification
from ..logging_config import get_logger

logger = get_logger(__name__)


def send_notification(
    db: Session,
    action_code: str,
    user_id: Optional[str],
    data: Dict
) -> Dict:
    """
    Main entry point for sending notifications.
    Checks preferences and sends via enabled channels.
    
    Args:
        db: Database session
        action_code: Code identifying the notification action
        user_id: User ID (None for admin notifications)
        data: Additional data for the notification
    
    Returns:
        Dict with notification results
    """
    try:
        # Get the action
        action = db.query(NotificationAction).filter(
            NotificationAction.action_code == action_code
        ).first()
        
        if not action:
            logger.warning(f"Notification action not found: {action_code}")
            return {"success": False, "error": "Action not found"}
        
        # Get preferences
        preference = db.query(NotificationPreference).filter(
            NotificationPreference.action_id == action.id
        ).first()
        
        if not preference:
            logger.warning(f"Notification preference not found for action: {action_code}")
            return {"success": False, "error": "Preference not found"}
        
        results = {
            "action_code": action_code,
            "email_sent": False,
            "push_sent": False,
            "email_error": None,
            "push_error": None
        }
        
        # Get user if user_id provided
        user = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"User not found: {user_id}")
                return {"success": False, "error": "User not found"}
        
        # Send email if enabled
        if preference.email_enabled and user:
            try:
                email_result = send_notification_email(
                    db=db,
                    user_id=user_id,
                    action_code=action_code,
                    data=data
                )
                results["email_sent"] = email_result.get("success", False)
                if not results["email_sent"]:
                    results["email_error"] = email_result.get("error")
                
                # Log email notification
                log_notification(
                    db=db,
                    action_id=action.id,
                    user_id=user_id,
                    channel="email",
                    status="sent" if results["email_sent"] else "failed",
                    error_message=results["email_error"]
                )
            except Exception as e:
                logger.error(f"Error sending email notification: {str(e)}")
                results["email_error"] = str(e)
                log_notification(
                    db=db,
                    action_id=action.id,
                    user_id=user_id,
                    channel="email",
                    status="failed",
                    error_message=str(e)
                )
        
        # Send push if enabled and user_id provided
        if preference.push_enabled and user_id:
            try:
                push_result = send_push_notification(
                    db=db,
                    user_id=user_id,
                    action_code=action_code,
                    data=data
                )
                results["push_sent"] = push_result.get("success", False)
                if not results["push_sent"]:
                    results["push_error"] = push_result.get("error")
                
                # Log push notification
                log_notification(
                    db=db,
                    action_id=action.id,
                    user_id=user_id,
                    channel="push",
                    status="sent" if results["push_sent"] else "failed",
                    error_message=results["push_error"]
                )
            except Exception as e:
                logger.error(f"Error sending push notification: {str(e)}")
                results["push_error"] = str(e)
                log_notification(
                    db=db,
                    action_id=action.id,
                    user_id=user_id,
                    channel="push",
                    status="failed",
                    error_message=str(e)
                )
        
        # Determine overall success
        results["success"] = results["email_sent"] or results["push_sent"]
        
        return results
        
    except Exception as e:
        logger.error(f"Error in send_notification: {str(e)}")
        return {"success": False, "error": str(e)}


def check_preference(db: Session, action_code: str, channel: str) -> bool:
    """
    Check if a notification action is enabled for a specific channel.
    
    Args:
        db: Database session
        action_code: Notification action code
        channel: Channel to check ("email" or "push")
    
    Returns:
        True if enabled, False otherwise
    """
    action = db.query(NotificationAction).filter(
        NotificationAction.action_code == action_code
    ).first()
    
    if not action:
        return False
    
    preference = db.query(NotificationPreference).filter(
        NotificationPreference.action_id == action.id
    ).first()
    
    if not preference:
        return False
    
    if channel == "email":
        return preference.email_enabled
    elif channel == "push":
        return preference.push_enabled
    
    return False


def log_notification(
    db: Session,
    action_id: str,
    user_id: Optional[str],
    channel: str,
    status: str,
    error_message: Optional[str] = None
):
    """
    Log a notification attempt to the database.
    
    Args:
        db: Database session
        action_id: Notification action ID
        user_id: User ID (optional)
        channel: Channel used ("email" or "push")
        status: Status ("sent", "failed", "pending")
        error_message: Error message if failed
    """
    try:
        log = NotificationLog(
            id=str(uuid.uuid4()),
            action_id=action_id,
            user_id=user_id,
            channel=channel,
            status=status,
            error_message=error_message,
            sent_at=datetime.utcnow() if status == "sent" else None,
            created_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Error logging notification: {str(e)}")
        db.rollback()
