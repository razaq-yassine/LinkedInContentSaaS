#!/usr/bin/env python3
"""
Database migration helper script.
Run migrations and seeds for the LinkedIn Content SaaS backend.

Usage:
    python migrate.py upgrade        # Run all pending migrations
    python migrate.py downgrade -1   # Rollback last migration
    python migrate.py current       # Show current migration version
    python migrate.py history       # Show migration history
    python migrate.py seeds         # Run seed scripts
    python migrate.py init          # Initialize database (migrations + seeds)
"""
import sys
import os
import subprocess
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))


def run_alembic_command(*args):
    """Run alembic command"""
    cmd = ["alembic"] + list(args)
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=backend_dir)
    return result.returncode


def run_seeds():
    """Run all seed scripts"""
    print("\n🌱 Running database seeds...")
    print("-" * 50)
    
    seed_script = backend_dir / "migrations" / "seeds" / "run_all_seeds.py"
    if not seed_script.exists():
        print(f"❌ Seed script not found: {seed_script}")
        return 1
    
    result = subprocess.run([sys.executable, str(seed_script)], cwd=backend_dir)
    return result.returncode


def init_database():
    """Initialize database: run migrations and seeds"""
    print("🚀 Initializing database...")
    print("=" * 50)
    
    # Run migrations
    print("\n📦 Running migrations...")
    if run_alembic_command("upgrade", "head") != 0:
        print("❌ Migration failed")
        return 1
    
    # Run seeds
    if run_seeds() != 0:
        print("❌ Seeding failed")
        return 1
    
    print("\n" + "=" * 50)
    print("✅ Database initialization completed!")
    return 0


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    
    command = sys.argv[1]
    
    if command == "init":
        return init_database()
    elif command == "seeds":
        return run_seeds()
    elif command == "upgrade":
        # Default to "head" if no revision specified
        args = sys.argv[2:] if len(sys.argv) > 2 else ["head"]
        return run_alembic_command("upgrade", *args)
    elif command in ["downgrade", "current", "history", "revision", "stamp"]:
        return run_alembic_command(*sys.argv[1:])
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        return 1


if __name__ == "__main__":
    sys.exit(main())

