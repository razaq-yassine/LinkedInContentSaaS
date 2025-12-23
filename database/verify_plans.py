import sqlite3
import json

# Database path
DB_PATH = "../backend/linkedin_content_saas.db"

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("🔍 Verifying Subscription Plans...\n")

# Get all plans
cursor.execute("""
    SELECT id, plan_name, display_name, description, price_monthly, price_yearly, 
           posts_limit, features, is_active, sort_order
    FROM subscription_plan_configs
    ORDER BY sort_order
""")

plans = cursor.fetchall()

if plans:
    print(f"✅ Found {len(plans)} subscription plan(s):\n")
    
    for plan in plans:
        plan_id, plan_name, display_name, description, price_monthly, price_yearly, posts_limit, features_json, is_active, sort_order = plan
        
        features = json.loads(features_json) if features_json else []
        
        print(f"{'='*60}")
        print(f"Plan: {display_name} ({plan_name})")
        print(f"{'='*60}")
        print(f"ID: {plan_id}")
        print(f"Description: {description}")
        print(f"Price: ${price_monthly/100:.2f}/month | ${price_yearly/100:.2f}/year")
        print(f"Posts Limit: {posts_limit} posts/month")
        print(f"Active: {'Yes' if is_active else 'No'}")
        print(f"Sort Order: {sort_order}")
        print(f"\nFeatures:")
        for feature in features:
            print(f"  ✓ {feature}")
        print()
else:
    print("❌ No subscription plans found!")
    print("   Run: python run_admin_migration.py")

conn.close()
