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
                "credits_limit": 5,
                "features": ["5 credits per month (~2-10 posts)", "All post formats", "Email support"],
                "stripe_product_id": None,
                "stripe_price_id_monthly": None,
                "stripe_price_id_yearly": None,
                "is_active": True,
                "sort_order": 1
            },
            {
                "plan_name": "starter",
                "display_name": "Starter Plan",
                "description": "Perfect for professionals getting started",
                "price_monthly": 1200,
                "price_yearly": 12000,
                "credits_limit": 40,
                "features": ["40 credits per month (~16-80 posts)", "All post formats (text, image, carousel, video)", "Priority support", "Unlimited regenerations", "AI research included"],
                "stripe_product_id": None,
                "stripe_price_id_monthly": None,
                "stripe_price_id_yearly": None,
                "is_active": True,
                "sort_order": 2
            },
            {
                "plan_name": "pro",
                "display_name": "Pro Plan",
                "description": "For creators who post frequently",
                "price_monthly": 2500,
                "price_yearly": 25000,
                "credits_limit": 100,
                "features": ["100 credits per month (~40-200 posts)", "All post formats", "Priority support", "Unlimited regenerations", "AI research included", "Advanced analytics"],
                "stripe_product_id": None,
                "stripe_price_id_monthly": None,
                "stripe_price_id_yearly": None,
                "is_active": True,
                "sort_order": 3
            },
            {
                "plan_name": "unlimited",
                "display_name": "Unlimited Plan",
                "description": "Unlimited content creation for power users",
                "price_monthly": 5000,
                "price_yearly": 50000,
                "credits_limit": -1,
                "features": ["Unlimited credits", "Unlimited posts", "All post formats", "Priority support", "Dedicated account manager", "Custom integrations", "API access", "White-label options"],
                "stripe_product_id": None,
                "stripe_price_id_monthly": None,
                "stripe_price_id_yearly": None,
                "is_active": True,
                "sort_order": 4
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

