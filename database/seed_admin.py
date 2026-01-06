import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.app.database import SessionLocal, engine, Base
from backend.app.models import Admin, AdminRole
from passlib.context import CryptContext
from datetime import datetime
import uuid

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Import all models to ensure they're registered
print("Creating all tables...")
Base.metadata.create_all(bind=engine)

# Create session
db = SessionLocal()

try:
    # Check if admin already exists
    existing_admin = db.query(Admin).filter(Admin.email == "admin@linkedincontent.com").first()
    
    if existing_admin:
        print(f"\n⚠️  Admin user already exists with email: admin@linkedincontent.com")
        print(f"   ID: {existing_admin.id}")
        print(f"   Role: {existing_admin.role}")
        print(f"   Active: {existing_admin.is_active}")
        response = input("\nDo you want to update the password? (y/n): ")
        if response.lower() == 'y':
            existing_admin.password_hash = get_password_hash("Admin@123456")
            db.commit()
            print("✓ Password updated successfully")
        else:
            print("Skipping password update")
    else:
        # Create admin user
        print("\nCreating admin user...")
        admin = Admin(
            id=str(uuid.uuid4()),
            email="admin@linkedincontent.com",
            password_hash=get_password_hash("Admin@123456"),
            name="Admin",
            role=AdminRole.SUPER_ADMIN,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✓ Admin user created successfully!")
        print(f"   Email: admin@linkedincontent.com")
        print(f"   Password: Admin@123456")
        print(f"   Role: super_admin")
        print(f"   ID: {admin.id}")
    
    print("\n✓ Admin setup complete!")
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()

