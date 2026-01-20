"""
Check if admin account exists and verify database structure
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Admin
from sqlalchemy import inspect

def check_admin_account():
    print("=" * 60)
    print("Admin Account Check")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Check table structure
        inspector = inspect(db.bind)
        if 'admins' not in inspector.get_table_names():
            print("\n❌ 'admins' table does not exist!")
            print("   Run database migrations or recreate database")
            return
        
        columns = [col['name'] for col in inspector.get_columns('admins')]
        print("\n1. Table Structure:")
        print(f"   Columns: {', '.join(columns)}")
        
        # Check required columns for passwordless login
        required_cols = ['email_code', 'email_code_expires_at']
        missing_cols = [col for col in required_cols if col not in columns]
        
        if missing_cols:
            print(f"\n   ⚠️  Missing columns: {', '.join(missing_cols)}")
            print("   Run: python recreate_sqlite_db.py")
        else:
            print("   ✅ All required columns present")
        
        # Check admin accounts
        admins = db.query(Admin).all()
        print(f"\n2. Admin Accounts ({len(admins)} total):")
        
        if not admins:
            print("   ❌ No admin accounts found!")
            print("\n   Create admin account:")
            print("   python -c \"from app.database import SessionLocal; from app.models import Admin; from passlib.context import CryptContext; db = SessionLocal(); pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto'); admin = Admin(email='postinai.inc@gmail.com', name='Admin', role='super_admin', password_hash=None); db.add(admin); db.commit(); print('Admin created')\"")
            return
        
        for admin in admins:
            print(f"\n   📧 {admin.email}")
            print(f"      Name: {admin.name}")
            print(f"      Role: {admin.role}")
            print(f"      Active: {'✅' if admin.is_active else '❌'}")
            print(f"      Password: {'Set' if admin.password_hash else 'Not set (passwordless)'}")
            print(f"      Last Login: {admin.last_login or 'Never'}")
            
            if hasattr(admin, 'email_code') and admin.email_code:
                print(f"      🔑 Active Code: {admin.email_code}")
                print(f"      ⏰ Expires: {admin.email_code_expires_at}")
        
        # Check for specific admin
        target_email = "postinai.inc@gmail.com"
        admin = db.query(Admin).filter(Admin.email == target_email).first()
        
        print(f"\n3. Target Admin ({target_email}):")
        if admin:
            print("   ✅ Account exists")
            print(f"   Active: {'✅ Yes' if admin.is_active else '❌ No (INACTIVE!)'}")
            if not admin.is_active:
                print("\n   ⚠️  Account is INACTIVE - login codes won't be sent!")
                print("   Activate account:")
                print(f"   python -c \"from app.database import SessionLocal; from app.models import Admin; db = SessionLocal(); admin = db.query(Admin).filter(Admin.email=='{target_email}').first(); admin.is_active = True; db.commit(); print('Activated')\"")
        else:
            print("   ❌ Account does not exist!")
            print("\n   Create account:")
            print(f"   python -c \"from app.database import SessionLocal; from app.models import Admin; db = SessionLocal(); admin = Admin(email='{target_email}', name='Admin', role='super_admin', password_hash=None); db.add(admin); db.commit(); print('Created')\"")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_admin_account()
