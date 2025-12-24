"""
Seed subscription plans.
This script is idempotent - safe to run multiple times.
"""
import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models import SubscriptionPlanConfig
import uuid


def seed_subscription_plans():
    """Seed subscription plans"""
    db = SessionLocal()
    
    try:
        plans_data = [
            {
                "plan_name": "free",
                "display_name": "Free Plan",
                "description": "Perfect for getting started with LinkedIn content generation",
                "price_monthly": 0,
                "price_yearly": 0,
                "posts_limit": 5,
                "features": ["5 posts per month", "Basic AI generation", "Text-only posts", "Email support"],
                "is_active": True,
                "sort_order": 1
            },
            {
                "plan_name": "pro",
                "display_name": "Pro Plan",
                "description": "For professionals who want to scale their LinkedIn presence",
                "price_monthly": 2900,
                "price_yearly": 29000,
                "posts_limit": 50,
                "features": ["50 posts per month", "Advanced AI generation", "All post formats (text, image, carousel, video)", "Priority support", "Custom writing style", "Analytics dashboard"],
                "is_active": True,
                "sort_order": 2
            },
            {
                "plan_name": "agency",
                "display_name": "Agency Plan",
                "description": "For agencies managing multiple clients",
                "price_monthly": 9900,
                "price_yearly": 99000,
                "posts_limit": 500,
                "features": ["500 posts per month", "Premium AI generation", "All post formats", "Dedicated support", "Multi-user access", "White-label options", "API access", "Custom integrations"],
                "is_active": True,
                "sort_order": 3
            }
        ]
        
        for plan_data in plans_data:
            # Check if plan already exists
            existing = db.query(SubscriptionPlanConfig).filter(
                SubscriptionPlanConfig.plan_name == plan_data["plan_name"]
            ).first()
            
            if existing:
                # Update existing plan
                for key, value in plan_data.items():
                    if key != "plan_name":  # Don't update the primary key
                        setattr(existing, key, value)
                print(f"✅ Updated subscription plan: {plan_data['plan_name']}")
            else:
                # Create new plan
                plan = SubscriptionPlanConfig(
                    id=str(uuid.uuid4()),
                    **plan_data
                )
                db.add(plan)
                print(f"✅ Added subscription plan: {plan_data['plan_name']}")
        
        db.commit()
        print("✅ Subscription plans seeding completed")
        
    except Exception as e:
        print(f"❌ Error seeding subscription plans: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_subscription_plans()

