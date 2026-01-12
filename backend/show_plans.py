import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import SubscriptionPlanConfig
import json

db = SessionLocal()
plans = db.query(SubscriptionPlanConfig).order_by(SubscriptionPlanConfig.sort_order).all()

print("\n" + "="*70)
print("📊 SUBSCRIPTION PLANS IN DATABASE")
print("="*70)

for plan in plans:
    print(f"\n🎯 {plan.display_name.upper()}")
    print(f"   ID: {plan.plan_name}")
    print(f"   💰 Pricing:")
    print(f"      - Monthly: ${plan.price_monthly/100:.2f}")
    print(f"      - Yearly: ${plan.price_yearly/100:.2f}")
    print(f"   ⚡ Credit Limit: {plan.credits_limit if plan.credits_limit != -1 else 'Unlimited'}")
    print(f"   📝 Description: {plan.description}")
    print(f"   ✨ Features:")
    for feature in plan.features:
        print(f"      • {feature}")
    print(f"   🔧 Active: {'✅ Yes' if plan.is_active else '❌ No'}")
    print(f"   📊 Sort Order: {plan.sort_order}")
    if plan.stripe_product_id:
        print(f"   💳 Stripe Product ID: {plan.stripe_product_id}")

db.close()
print("\n" + "="*70)
print(f"✅ Total Plans: {len(plans)}")
print("="*70 + "\n")
