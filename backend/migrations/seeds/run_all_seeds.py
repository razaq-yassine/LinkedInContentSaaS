"""
Run all seed scripts in order.
This script is idempotent - safe to run multiple times.
"""
import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, backend_dir)


def run_all_seeds():
    """Run all seed scripts"""
    print("🌱 Running all database seeds...")
    print("-" * 50)
    
    try:
        # Import seed functions
        from migrations.seeds.seed_admin_settings import seed_admin_settings
        from migrations.seeds.seed_subscription_plans import seed_subscription_plans
        from migrations.seeds.seed_notification_actions import seed_notification_actions
        
        seed_admin_settings()
        print()
        seed_subscription_plans()
        print()
        seed_notification_actions()
        
        print("-" * 50)
        print("✅ All seeds completed successfully!")
        
    except Exception as e:
        print(f"❌ Error running seeds: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_all_seeds()

