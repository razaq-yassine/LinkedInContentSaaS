"""
Seed notification actions and preferences.
This script is idempotent - safe to run multiple times.
"""
import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models import NotificationAction, NotificationPreference
import uuid


def seed_notification_actions():
    """Seed notification actions and default preferences"""
    db = SessionLocal()
    
    try:
        # Define all notification actions
        actions_data = [
            # Post lifecycle
            {
                "action_code": "post_published",
                "action_name": "Post Published",
                "description": "When a post is successfully published to LinkedIn",
                "category": "post"
            },
            {
                "action_code": "post_failed",
                "action_name": "Post Failed",
                "description": "When publishing a post to LinkedIn fails",
                "category": "post"
            },
            {
                "action_code": "post_scheduled",
                "action_name": "Post Scheduled",
                "description": "When a post is scheduled for future publishing",
                "category": "post"
            },
            
            # Subscription
            {
                "action_code": "subscription_activated",
                "action_name": "Subscription Activated",
                "description": "When user subscribes to a new plan",
                "category": "subscription"
            },
            {
                "action_code": "subscription_renewed",
                "action_name": "Subscription Renewed",
                "description": "When subscription is renewed",
                "category": "subscription"
            },
            {
                "action_code": "subscription_canceled",
                "action_name": "Subscription Canceled",
                "description": "When subscription is canceled",
                "category": "subscription"
            },
            {
                "action_code": "payment_failed",
                "action_name": "Payment Failed",
                "description": "When a payment fails",
                "category": "subscription"
            },
            
            # Credits
            {
                "action_code": "credits_low",
                "action_name": "Credits Low",
                "description": "When user has less than 20% credits remaining",
                "category": "account"
            },
            {
                "action_code": "credits_exhausted",
                "action_name": "Credits Exhausted",
                "description": "When user runs out of credits",
                "category": "account"
            },
            {
                "action_code": "credits_reset",
                "action_name": "Credits Reset",
                "description": "When monthly credits are reset",
                "category": "account"
            },
            
            # LinkedIn
            {
                "action_code": "linkedin_connected",
                "action_name": "LinkedIn Connected",
                "description": "When LinkedIn account is successfully connected",
                "category": "account"
            },
            {
                "action_code": "linkedin_token_expired",
                "action_name": "LinkedIn Token Expired",
                "description": "When LinkedIn token expires and needs reconnection",
                "category": "account"
            },
            
            # Admin
            {
                "action_code": "admin_error_critical",
                "action_name": "Critical Error",
                "description": "Critical system errors for admins",
                "category": "error"
            },
            {
                "action_code": "admin_payment_failed",
                "action_name": "Payment Processing Failed",
                "description": "Payment processing failures for admins",
                "category": "error"
            }
        ]
        
        # Create or update actions and preferences
        for action_data in actions_data:
            # Check if action already exists
            existing_action = db.query(NotificationAction).filter(
                NotificationAction.action_code == action_data["action_code"]
            ).first()
            
            if not existing_action:
                # Create new action
                action = NotificationAction(
                    id=str(uuid.uuid4()),
                    action_code=action_data["action_code"],
                    action_name=action_data["action_name"],
                    description=action_data["description"],
                    category=action_data["category"]
                )
                db.add(action)
                db.flush()  # Flush to get the action ID
                
                # Create default preference (both enabled)
                preference = NotificationPreference(
                    id=str(uuid.uuid4()),
                    action_id=action.id,
                    email_enabled=True,
                    push_enabled=True
                )
                db.add(preference)
                print(f"Created notification action: {action_data['action_code']}")
            else:
                # Update existing action if needed
                updated = False
                if existing_action.action_name != action_data["action_name"]:
                    existing_action.action_name = action_data["action_name"]
                    updated = True
                if existing_action.description != action_data["description"]:
                    existing_action.description = action_data["description"]
                    updated = True
                if existing_action.category != action_data["category"]:
                    existing_action.category = action_data["category"]
                    updated = True
                
                if updated:
                    print(f"Updated notification action: {action_data['action_code']}")
                
                # Ensure preference exists
                existing_preference = db.query(NotificationPreference).filter(
                    NotificationPreference.action_id == existing_action.id
                ).first()
                
                if not existing_preference:
                    preference = NotificationPreference(
                        id=str(uuid.uuid4()),
                        action_id=existing_action.id,
                        email_enabled=True,
                        push_enabled=True
                    )
                    db.add(preference)
                    print(f"Created preference for action: {action_data['action_code']}")
        
        db.commit()
        print("Notification actions and preferences seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding notification actions: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_notification_actions()
