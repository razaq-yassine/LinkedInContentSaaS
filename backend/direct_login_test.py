import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Admin
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test direct database login
db = SessionLocal()

try:
    # Get admin
    admin = db.query(Admin).filter(Admin.email == "admin@linkedincontent.com").first()
    
    if admin:
        print(f"✅ Admin found: {admin.email}")
        print(f"   Name: {admin.name}")
        print(f"   Role: {admin.role}")
        print(f"   Active: {admin.is_active}")
        
        # Test password
        password = "Admin@123456"
        is_valid = pwd_context.verify(password, admin.password_hash)
        print(f"   Password valid: {is_valid}")
        
        # Check role type
        print(f"   Role type: {type(admin.role)}")
        print(f"   Has value attr: {hasattr(admin.role, 'value')}")
        
        if hasattr(admin.role, 'value'):
            print(f"   Role value: {admin.role.value}")
        else:
            print(f"   Role (string): {admin.role}")
            
    else:
        print("❌ Admin not found!")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
