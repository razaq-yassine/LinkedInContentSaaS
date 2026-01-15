"""
Push notification service for PWA push notifications
"""
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import json
import uuid

try:
    from pywebpush import webpush, WebPushException
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.backends import default_backend
    PYWEBPUSH_AVAILABLE = True
except ImportError:
    PYWEBPUSH_AVAILABLE = False

from ..models import PushSubscription, User, NotificationAction
from ..config import get_settings
from ..logging_config import get_logger

settings = get_settings()
logger = get_logger(__name__)


def generate_vapid_keys():
    """
    Generate VAPID keys for push notifications.
    
    Returns:
        Tuple of (public_key, private_key) in base64 URL-safe format
    """
    if not PYWEBPUSH_AVAILABLE:
        raise ImportError("pywebpush is not installed. Install it with: pip install pywebpush")
    
    try:
        from pywebpush import WebPusher
        # Generate keys using pywebpush's method
        # This creates a temporary WebPusher to generate keys
        import tempfile
        import os
        
        # Create temporary files for key storage
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem') as f:
            temp_key_file = f.name
        
        # Generate keys - pywebpush uses cryptography internally
        # We'll use the cryptography library directly with proper VAPID format
        private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        public_key = private_key.public_key()
        
        # Get public key numbers
        pub_numbers = public_key.public_numbers()
        
        # VAPID public key is uncompressed (0x04 + x + y, 65 bytes total)
        import base64
        x_bytes = pub_numbers.x.to_bytes(32, 'big')
        y_bytes = pub_numbers.y.to_bytes(32, 'big')
        public_key_bytes = b'\x04' + x_bytes + y_bytes
        
        # Private key is the raw 32-byte value
        private_key_bytes = private_key.private_numbers().private_value.to_bytes(32, 'big')
        
        # Base64 URL-safe encode (without padding)
        public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).decode('utf-8').rstrip('=')
        private_key_b64 = base64.urlsafe_b64encode(private_key_bytes).decode('utf-8').rstrip('=')
        
        # Clean up temp file
        try:
            os.unlink(temp_key_file)
        except:
            pass
        
        return public_key_b64, private_key_b64
        
    except Exception as e:
        logger.error(f"Error generating VAPID keys: {str(e)}")
        raise


def get_vapid_credentials():
    """
    Get or generate VAPID credentials.
    
    Returns:
        Tuple of (public_key, private_key, subject)
    """
    # Check if VAPID keys are configured
    if settings.vapid_public_key and settings.vapid_private_key:
        return settings.vapid_public_key, settings.vapid_private_key, settings.vapid_subject or settings.smtp_from_email or "mailto:admin@postinai.com"
    
    # Generate new keys if not configured
    logger.warning("VAPID keys not configured. Generating new keys. Please add them to your .env file.")
    public_key, private_key = generate_vapid_keys()
    subject = settings.vapid_subject or settings.smtp_from_email or "mailto:admin@postinai.com"
    
    logger.info(f"Generated VAPID keys. Add these to your .env file:")
    logger.info(f"VAPID_PUBLIC_KEY={public_key}")
    logger.info(f"VAPID_PRIVATE_KEY={private_key}")
    logger.info(f"VAPID_SUBJECT={subject}")
    
    return public_key, private_key, subject


def format_push_payload(action_code: str, data: Dict) -> Dict:
    """
    Format push notification payload based on action code and data.
    
    Args:
        action_code: Notification action code
        data: Notification data
    
    Returns:
        Push notification payload dict
    """
    from ..config import get_settings
    frontend_url = get_settings().frontend_url
    
    # Determine title and body
    titles = {
        "post_published": "Post Published!",
        "post_failed": "Post Failed",
        "post_scheduled": "Post Scheduled",
        "subscription_activated": "Subscription Activated",
        "subscription_renewed": "Subscription Renewed",
        "subscription_canceled": "Subscription Canceled",
        "payment_failed": "Payment Failed",
        "credits_low": "Low Credits Warning",
        "credits_exhausted": "Credits Exhausted",
        "credits_reset": "Credits Reset",
        "linkedin_connected": "LinkedIn Connected",
        "linkedin_token_expired": "LinkedIn Reconnection Required"
    }
    
    bodies = {
        "post_published": "Your post has been successfully published to LinkedIn",
        "post_failed": f"Failed to publish post: {data.get('error', 'Unknown error')}",
        "post_scheduled": f"Post scheduled for {data.get('scheduled_at', 'future')}",
        "subscription_activated": f"Welcome to {data.get('plan', 'your new plan')}!",
        "subscription_renewed": "Your subscription has been renewed",
        "subscription_canceled": "Your subscription has been canceled",
        "payment_failed": "Payment failed. Please update your payment method",
        "credits_low": f"Only {data.get('credits_remaining', 0)} credits remaining",
        "credits_exhausted": "You've used all your credits",
        "credits_reset": "Your monthly credits have been reset",
        "linkedin_connected": "LinkedIn account connected successfully",
        "linkedin_token_expired": "Please reconnect your LinkedIn account"
    }
    
    # Determine URL to navigate to
    urls = {
        "post_published": f"{frontend_url}/generate",
        "post_failed": f"{frontend_url}/generate",
        "post_scheduled": f"{frontend_url}/scheduled-posts",
        "subscription_activated": f"{frontend_url}/generate",
        "subscription_renewed": f"{frontend_url}/generate",
        "subscription_canceled": f"{frontend_url}/billing",
        "payment_failed": f"{frontend_url}/billing",
        "credits_low": f"{frontend_url}/billing",
        "credits_exhausted": f"{frontend_url}/billing",
        "credits_reset": f"{frontend_url}/generate",
        "linkedin_connected": f"{frontend_url}/generate",
        "linkedin_token_expired": f"{frontend_url}/settings"
    }
    
    title = titles.get(action_code, "Notification")
    body = bodies.get(action_code, "You have a new notification")
    url = urls.get(action_code, frontend_url)
    
    return {
        "title": title,
        "body": body,
        "icon": f"{frontend_url}/icons/android/android-launchericon-192-192.png",
        "badge": f"{frontend_url}/icons/android/android-launchericon-48-48.png",
        "data": {
            "action": action_code,
            "url": url,
            **data
        },
        "tag": f"{action_code}_{data.get('post_id', '')}" if data.get('post_id') else action_code,
        "requireInteraction": False
    }


def send_push_notification(
    db: Session,
    user_id: str,
    action_code: str,
    data: Dict
) -> Dict:
    """
    Send push notification to all user's devices.
    
    Args:
        db: Database session
        user_id: User ID
        action_code: Notification action code
        data: Notification data
    
    Returns:
        Dict with success status
    """
    if not PYWEBPUSH_AVAILABLE:
        logger.error("pywebpush is not installed. Cannot send push notifications.")
        return {"success": False, "error": "Push notifications not available"}
    
    try:
        # Get user subscriptions
        subscriptions = db.query(PushSubscription).filter(
            PushSubscription.user_id == user_id
        ).all()
        
        if not subscriptions:
            return {"success": False, "error": "No push subscriptions found for user"}
        
        # Get VAPID credentials
        public_key, private_key, subject = get_vapid_credentials()
        
        # Format payload
        payload = format_push_payload(action_code, data)
        
        # Send to all subscriptions
        success_count = 0
        failed_count = 0
        errors = []
        
        for subscription in subscriptions:
            try:
                subscription_info = {
                    "endpoint": subscription.endpoint,
                    "keys": {
                        "p256dh": subscription.p256dh_key,
                        "auth": subscription.auth_key
                    }
                }
                
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload),
                    vapid_private_key=private_key,
                    vapid_claims={
                        "sub": subject
                    }
                )
                
                success_count += 1
                
            except WebPushException as e:
                failed_count += 1
                error_msg = str(e)
                errors.append(f"Subscription {subscription.id}: {error_msg}")
                
                # If subscription is invalid (410), remove it
                if e.response and e.response.status_code == 410:
                    logger.info(f"Removing invalid subscription {subscription.id}")
                    db.delete(subscription)
                    db.commit()
                
            except Exception as e:
                failed_count += 1
                error_msg = str(e)
                errors.append(f"Subscription {subscription.id}: {error_msg}")
        
        db.commit()
        
        if success_count > 0:
            return {"success": True, "sent": success_count, "failed": failed_count, "errors": errors}
        else:
            return {"success": False, "error": f"All push notifications failed: {', '.join(errors)}"}
        
    except Exception as e:
        logger.error(f"Error sending push notification: {str(e)}")
        return {"success": False, "error": str(e)}


def register_push_subscription(
    db: Session,
    user_id: str,
    subscription_data: Dict,
    user_agent: Optional[str] = None
) -> Dict:
    """
    Register a new push subscription for a user.
    
    Args:
        db: Database session
        user_id: User ID
        subscription_data: Push subscription data from browser
        user_agent: User agent string
    
    Returns:
        Dict with registration status
    """
    try:
        endpoint = subscription_data.get("endpoint")
        keys = subscription_data.get("keys", {})
        p256dh_key = keys.get("p256dh")
        auth_key = keys.get("auth")
        
        if not endpoint or not p256dh_key or not auth_key:
            return {"success": False, "error": "Invalid subscription data"}
        
        # Check if subscription already exists
        existing = db.query(PushSubscription).filter(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint == endpoint
        ).first()
        
        if existing:
            # Update existing subscription
            existing.p256dh_key = p256dh_key
            existing.auth_key = auth_key
            existing.user_agent = user_agent
            existing.updated_at = datetime.utcnow()
            db.commit()
            return {"success": True, "action": "updated"}
        else:
            # Create new subscription
            subscription = PushSubscription(
                id=str(uuid.uuid4()),
                user_id=user_id,
                endpoint=endpoint,
                p256dh_key=p256dh_key,
                auth_key=auth_key,
                user_agent=user_agent,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(subscription)
            db.commit()
            return {"success": True, "action": "created"}
        
    except Exception as e:
        logger.error(f"Error registering push subscription: {str(e)}")
        db.rollback()
        return {"success": False, "error": str(e)}


def unregister_push_subscription(
    db: Session,
    user_id: str,
    endpoint: str
) -> Dict:
    """
    Remove a push subscription.
    
    Args:
        db: Database session
        user_id: User ID
        endpoint: Subscription endpoint
    
    Returns:
        Dict with unregistration status
    """
    try:
        subscription = db.query(PushSubscription).filter(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint == endpoint
        ).first()
        
        if subscription:
            db.delete(subscription)
            db.commit()
            return {"success": True}
        else:
            return {"success": False, "error": "Subscription not found"}
        
    except Exception as e:
        logger.error(f"Error unregistering push subscription: {str(e)}")
        db.rollback()
        return {"success": False, "error": str(e)}


def get_user_subscriptions(db: Session, user_id: str) -> List[Dict]:
    """
    Get all push subscriptions for a user.
    
    Args:
        db: Database session
        user_id: User ID
    
    Returns:
        List of subscription dicts
    """
    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.user_id == user_id
    ).all()
    
    return [
        {
            "id": sub.id,
            "endpoint": sub.endpoint,
            "user_agent": sub.user_agent,
            "created_at": sub.created_at.isoformat() if sub.created_at else None
        }
        for sub in subscriptions
    ]
