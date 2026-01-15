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
# Note: Tables should be created via migrations, not here
# Base.metadata.create_all(bind=engine)  # Commented out - use migrations instead

# Create session
db = SessionLocal()

try:
    admin_email = "postinai.inc@gmail.com"
    
    # Check if admin already exists
    existing_admin = db.query(Admin).filter(Admin.email == admin_email).first()
    
    if existing_admin:
        print(f"\n⚠️  Admin user already exists with email: {admin_email}")
        print(f"   ID: {existing_admin.id}")
        print(f"   Role: {existing_admin.role}")
        print(f"   Active: {existing_admin.is_active}")
        
        # Update email if it was different, ensure password_hash is None for passwordless login
        if existing_admin.email != admin_email:
            existing_admin.email = admin_email
        existing_admin.password_hash = None  # Passwordless login
        db.commit()
        print("✓ Admin user updated for passwordless login")
    else:
        # Create admin user with passwordless login
        print("\nCreating admin user...")
        admin = Admin(
            id=str(uuid.uuid4()),
            email=admin_email,
            password_hash=None,  # Passwordless login - no password required
            name="Admin",
            role=AdminRole.SUPER_ADMIN,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✓ Admin user created successfully!")
        print(f"   Email: {admin_email}")
        print(f"   Authentication: Passwordless (email code)")
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


