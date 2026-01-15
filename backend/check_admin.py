#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Admin

db = SessionLocal()
try:
    admin = db.query(Admin).filter(Admin.email == 'postinai.inc@gmail.com').first()
    if admin:
        print(f"✅ Admin found:")
        print(f"   Email: {admin.email}")
        print(f"   Name: {admin.name}")
        print(f"   Active: {admin.is_active}")
        print(f"   Password Hash: {'Set' if admin.password_hash else 'None (passwordless)'}")
        print(f"   Current Code: {admin.email_code}")
        print(f"   Code Expires: {admin.email_code_expires_at}")
    else:
        print("❌ Admin not found!")
        print("   Run: python database/seed_admin.py")
finally:
    db.close()
