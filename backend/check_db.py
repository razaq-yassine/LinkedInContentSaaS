import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models import SubscriptionPlanConfig
from sqlalchemy import inspect, text

db = SessionLocal()

print("\n" + "="*70)
print("DATABASE INSPECTION")
print("="*70)

# Check database connection
print(f"\nDatabase URL: {engine.url}")

# Check tables
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nTables in database: {len(tables)}")
for table in sorted(tables):
    print(f"  - {table}")

# Check subscription_plan_configs table
if 'subscription_plan_configs' in tables:
    print("\n" + "-"*70)
    print("SUBSCRIPTION_PLAN_CONFIGS TABLE")
    print("-"*70)
    
    # Get column info
    columns = inspector.get_columns('subscription_plan_configs')
    print(f"\nColumns: {len(columns)}")
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")
    
    # Count rows
    result = db.execute(text("SELECT COUNT(*) FROM subscription_plan_configs"))
    count = result.scalar()
    print(f"\nTotal rows: {count}")
    
    # Query using ORM
    plans = db.query(SubscriptionPlanConfig).all()
    print(f"Plans via ORM: {len(plans)}")
    
    if plans:
        print("\nPlans found:")
        for plan in plans:
            print(f"\n  {plan.plan_name}:")
            print(f"    Display: {plan.display_name}")
            print(f"    Monthly: ${plan.price_monthly/100:.2f}")
            print(f"    Credits: {plan.credits_limit}")
else:
    print("\n❌ Table 'subscription_plan_configs' does not exist!")

db.close()
print("\n" + "="*70 + "\n")
