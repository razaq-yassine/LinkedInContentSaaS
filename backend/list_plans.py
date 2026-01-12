import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import SubscriptionPlanConfig

def list_plans():
    db = SessionLocal()
    try:
        plans = db.query(SubscriptionPlanConfig).order_by(SubscriptionPlanConfig.sort_order).all()
        
        print("\n" + "="*70)
        print("SUBSCRIPTION PLANS IN DATABASE")
        print("="*70 + "\n")
        
        if not plans:
            print("No plans found in database")
            return
        
        for plan in plans:
            print(f"{plan.sort_order}. {plan.display_name} ({plan.plan_name})")
            print(f"   Monthly: ${plan.price_monthly/100:.2f} | Yearly: ${plan.price_yearly/100:.2f}")
            print(f"   Credits: {plan.credits_limit if plan.credits_limit != -1 else 'Unlimited'}")
            print(f"   Description: {plan.description}")
            print(f"   Features:")
            for feature in plan.features:
                print(f"      - {feature}")
            print(f"   Active: {'Yes' if plan.is_active else 'No'}")
            print()
        
        print("="*70)
        print(f"Total: {len(plans)} plans")
        print("="*70)
        
    finally:
        db.close()

if __name__ == "__main__":
    list_plans()
