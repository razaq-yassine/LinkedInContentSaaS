#!/usr/bin/env python3
"""Create admin account in MySQL database"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Admin, AdminRole
from datetime import datetime
import uuid

db = SessionLocal()

try:
    admin_email = "postinai.inc@gmail.com"
    
    # Check if admin already exists
    existing_admin = db.query(Admin).filter(Admin.email == admin_email).first()
    
    if existing_admin:
        print(f"✓ Admin already exists: {admin_email}")
        print(f"  ID: {existing_admin.id}")
        print(f"  Role: {existing_admin.role}")
        print(f"  Active: {existing_admin.is_active}")
        
        # Ensure it's active and passwordless
        existing_admin.is_active = True
        existing_admin.password_hash = None
        db.commit()
        print(f"✓ Admin updated - Active and passwordless login enabled")
    else:
        # Create admin
        print(f"Creating admin account: {admin_email}")
        admin = Admin(
            id=str(uuid.uuid4()),
            email=admin_email,
            password_hash=None,
            name="Admin",
            role=AdminRole.SUPER_ADMIN,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"✓ Admin created successfully!")
        print(f"  Email: {admin_email}")
        print(f"  ID: {admin.id}")
        print(f"  Role: {admin.role}")
        print(f"  Authentication: Passwordless (email code)")
        
except Exception as e:
    print(f"✗ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
