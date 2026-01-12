import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import SubscriptionPlanConfig

db = SessionLocal()
plans = db.query(SubscriptionPlanConfig).order_by(SubscriptionPlanConfig.sort_order).all()

print("\n" + "="*60)
print("📊 SUBSCRIPTION PLANS IN DATABASE")
print("="*60 + "\n")

for plan in plans:
    print(f"🎯 {plan.display_name} ({plan.plan_name})")
    print(f"   💰 Price: ${plan.price_monthly/100:.2f}/month | ${plan.price_yearly/100:.2f}/year")
    print(f"   ⚡ Credits: {plan.credits_limit if plan.credits_limit != -1 else 'Unlimited'}")
    print(f"   ✨ Features: {', '.join(plan.features[:3])}{'...' if len(plan.features) > 3 else ''}")
    print(f"   📝 Active: {'Yes' if plan.is_active else 'No'}")
    print()

db.close()
print("="*60)
