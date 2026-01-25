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
    """Run all seed scripts using master_seed"""
    try:
        from migrations.seeds.master_seed import run_master_seed
        run_master_seed()
        
    except Exception as e:
        print(f"❌ Error running seeds: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run_all_seeds()

