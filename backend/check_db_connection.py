#!/usr/bin/env python3
"""Check which database the backend is using"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.models import Admin
from app.config import get_settings
from sqlalchemy import text

settings = get_settings()

print("=" * 70)
print("DATABASE CONNECTION CHECK")
print("=" * 70)

print(f"\n[1] Configuration:")
print(f"    DATABASE_URL from settings: {settings.database_url}")
print(f"    Engine URL: {engine.url}")
print(f"    Database Type: {engine.url.drivername}")

print(f"\n[2] Testing connection...")
db = SessionLocal()
try:
    # Test the connection
    result = db.execute(text("SELECT 1")).fetchone()
    print(f"    ✓ Connection successful")
    
    # Count admins
    admin_count = db.query(Admin).count()
    print(f"\n[3] Admin accounts: {admin_count}")
    
    if admin_count > 0:
        print(f"    Existing admins:")
        admins = db.query(Admin).all()
        for admin in admins:
            print(f"      - {admin.email} (active: {admin.is_active}, role: {admin.role})")
    else:
        print(f"    No admin accounts found in this database!")
        print(f"\n    ACTION REQUIRED: Run the seed script for the correct database")
        
except Exception as e:
    print(f"    ✗ Connection failed: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

print("\n" + "=" * 70)
