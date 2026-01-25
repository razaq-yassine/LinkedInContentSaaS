import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.app.database import SessionLocal, engine, Base
from backend.app.models import User, UserProfile, Subscription, SubscriptionPlanConfig, Admin, AdminSetting, AdminRole
from sqlalchemy import text
from datetime import datetime
import uuid

# Import all models to ensure they're registered
print("Creating all tables...")
Base.metadata.create_all(bind=engine)

# Create session
db = SessionLocal()

try:
    # Seed subscription plans
    print("\nSeeding subscription plans...")
    
    plans = [
        {
            "id": str(uuid.uuid4()),
            "plan_name": "free",
            "display_name": "Free Plan",
            "description": "Perfect for getting started with LinkedIn content generation",
            "price_monthly": 0,
            "price_yearly": 0,
            "credits_limit": 5.0,
            "features": [
                "5 credits per month",
                "Basic AI generation",
                "Text-only posts",
                "Email support"
            ],
            "is_active": True,
            "sort_order": 1
        },
        {
            "id": str(uuid.uuid4()),
            "plan_name": "pro",
            "display_name": "Pro Plan",
            "description": "For professionals who want to scale their LinkedIn presence",
            "price_monthly": 2900,  # $29.00
            "price_yearly": 29000,  # $290.00 (save $58)
            "credits_limit": 50.0,
            "features": [
                "50 credits per month",
                "Advanced AI generation",
                "All post formats (text, image, carousel, video)",
                "Priority support",
                "Custom writing style",
                "Analytics dashboard"
            ],
            "is_active": True,
            "sort_order": 2
        },
        {
            "id": str(uuid.uuid4()),
            "plan_name": "agency",
            "display_name": "Agency Plan",
            "description": "For agencies managing multiple clients",
            "price_monthly": 9900,  # $99.00
            "price_yearly": 99000,  # $990.00 (save $198)
            "credits_limit": 500.0,
            "features": [
                "500 credits per month",
                "Premium AI generation",
                "All post formats",
                "Dedicated support",
                "Multi-user access",
                "White-label options",
                "API access",
                "Custom integrations"
            ],
            "is_active": True,
            "sort_order": 3
        }
    ]
    
    for plan_data in plans:
        existing_plan = db.query(SubscriptionPlanConfig).filter(
            SubscriptionPlanConfig.plan_name == plan_data["plan_name"]
        ).first()
        
        if not existing_plan:
            plan = SubscriptionPlanConfig(**plan_data)
            db.add(plan)
            print(f"  ✓ Created {plan_data['display_name']}")
        else:
            print(f"  - {plan_data['display_name']} already exists")
    
    db.commit()
    print("\n✓ Subscription plans seeded successfully")
    
    # Seed admin user
    print("\nSeeding admin user...")
    admin_email = "postinai.inc@gmail.com"
    
    # Check if admin already exists
    existing_admin = db.query(Admin).filter(Admin.email == admin_email).first()
    
    if existing_admin:
        print(f"  ⚠️  Admin user already exists with email: {admin_email}")
        print(f"     ID: {existing_admin.id}")
        print(f"     Role: {existing_admin.role}")
        print(f"     Active: {existing_admin.is_active}")
        
        # Update email if it was different, ensure password_hash is None for passwordless login
        if existing_admin.email != admin_email:
            existing_admin.email = admin_email
        existing_admin.password_hash = None  # Passwordless login
        db.commit()
        print("  ✓ Admin user updated for passwordless login")
    else:
        # Create admin user with passwordless login
        print("  Creating admin user...")
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
        
        print("  ✓ Admin user created successfully!")
        print(f"     Email: {admin_email}")
        print(f"     Authentication: Passwordless (email code)")
        print(f"     Role: super_admin")
        print(f"     ID: {admin.id}")
    
    print("\n✓ Admin setup complete!")
    
    # Verify tables
    result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
    tables = result.fetchall()
    
    print(f"\n✓ Database has {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    print("\n✓ Database setup complete!")
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    db.rollback()
finally:
    db.close()
