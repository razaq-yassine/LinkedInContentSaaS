import sqlite3
import uuid
from passlib.context import CryptContext
import json

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database path
DB_PATH = "../backend/linkedin_content_saas.db"

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("🔄 Starting admin system migration...")

# Create admins table
print("Creating admins table...")
cursor.execute("""
CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    is_active INTEGER DEFAULT 1,
    last_login TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
""")

# Create subscription_plan_configs table
print("Creating subscription_plan_configs table...")
cursor.execute("""
CREATE TABLE IF NOT EXISTS subscription_plan_configs (
    id TEXT PRIMARY KEY,
    plan_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly INTEGER DEFAULT 0,
    price_yearly INTEGER DEFAULT 0,
    posts_limit INTEGER DEFAULT 5,
    features TEXT,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
""")

# Create indexes
print("Creating indexes...")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_plan_configs_name ON subscription_plan_configs(plan_name)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_plan_configs_active ON subscription_plan_configs(is_active)")

# Insert default admin (password: Admin@123456)
print("Creating default admin account...")
admin_id = str(uuid.uuid4())
admin_email = "admin@linkedincontent.com"
admin_password_hash = pwd_context.hash("Admin@123456")

from datetime import datetime

cursor.execute("""
INSERT OR REPLACE INTO admins (id, email, password_hash, name, role, is_active, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (admin_id, admin_email, admin_password_hash, "Super Admin", "SUPER_ADMIN", 1, 
      datetime.utcnow().isoformat(), datetime.utcnow().isoformat()))

# Insert default subscription plans
print("Creating default subscription plans...")

plans = [
    {
        "id": str(uuid.uuid4()),
        "plan_name": "free",
        "display_name": "Free Plan",
        "description": "Perfect for getting started with LinkedIn content generation",
        "price_monthly": 0,
        "price_yearly": 0,
        "posts_limit": 5,
        "features": json.dumps([
            "5 posts per month",
            "Basic AI generation",
            "Text-only posts",
            "Email support"
        ]),
        "sort_order": 1
    },
    {
        "id": str(uuid.uuid4()),
        "plan_name": "pro",
        "display_name": "Pro Plan",
        "description": "For professionals who want to scale their LinkedIn presence",
        "price_monthly": 2900,
        "price_yearly": 29000,
        "posts_limit": 50,
        "features": json.dumps([
            "50 posts per month",
            "Advanced AI generation",
            "All post formats (text, image, carousel, video)",
            "Priority support",
            "Custom writing style",
            "Analytics dashboard"
        ]),
        "sort_order": 2
    },
    {
        "id": str(uuid.uuid4()),
        "plan_name": "agency",
        "display_name": "Agency Plan",
        "description": "For agencies managing multiple clients",
        "price_monthly": 9900,
        "price_yearly": 99000,
        "posts_limit": 500,
        "features": json.dumps([
            "500 posts per month",
            "Premium AI generation",
            "All post formats",
            "Dedicated support",
            "Multi-user access",
            "White-label options",
            "API access",
            "Custom integrations"
        ]),
        "sort_order": 3
    }
]

for plan in plans:
    cursor.execute("""
    INSERT OR REPLACE INTO subscription_plan_configs 
    (id, plan_name, display_name, description, price_monthly, price_yearly, posts_limit, features, is_active, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        plan["id"],
        plan["plan_name"],
        plan["display_name"],
        plan["description"],
        plan["price_monthly"],
        plan["price_yearly"],
        plan["posts_limit"],
        plan["features"],
        1,
        plan["sort_order"],
        datetime.utcnow().isoformat(),
        datetime.utcnow().isoformat()
    ))

# Commit changes
conn.commit()

# Verify migration
print("\n✅ Migration completed successfully!")
print("\nVerifying tables...")

cursor.execute("SELECT COUNT(*) FROM admins")
admin_count = cursor.fetchone()[0]
print(f"  - Admins table: {admin_count} admin(s) created")

cursor.execute("SELECT COUNT(*) FROM subscription_plan_configs")
plan_count = cursor.fetchone()[0]
print(f"  - Subscription plans table: {plan_count} plan(s) created")

print("\n📋 Default Admin Credentials:")
print(f"  Email: {admin_email}")
print(f"  Password: Admin@123456")
print("\n⚠️  IMPORTANT: Change this password after first login!")

# Close connection
conn.close()

print("\n🎉 Admin system is ready to use!")
