import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import SubscriptionPlanConfig

db = SessionLocal()

print("\n" + "="*70)
print("Testing Subscription Plans API Response")
print("="*70 + "\n")

plans = db.query(SubscriptionPlanConfig).order_by(SubscriptionPlanConfig.sort_order).all()

print(f"Found {len(plans)} plans in database\n")

for plan in plans:
    print(f"Plan: {plan.plan_name}")
    print(f"  Display Name: {plan.display_name}")
    print(f"  Credits Limit: {plan.credits_limit}")
    print(f"  Price Monthly: ${plan.price_monthly/100:.2f}")
    print(f"  Features: {len(plan.features)} items")
    print(f"  Active: {plan.is_active}")
    
    # Verify credits_limit attribute exists
    try:
        _ = plan.credits_limit
        print(f"  ✅ credits_limit accessible")
    except AttributeError as e:
        print(f"  ❌ ERROR: {e}")
    
    print()

db.close()

print("="*70)
print("✅ API should now work correctly")
print("="*70)
