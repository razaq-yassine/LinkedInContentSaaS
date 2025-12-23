import sqlite3

# Database path
DB_PATH = "../backend/linkedin_content_saas.db"

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("🔍 Verifying admin account...")

# Check if admin exists
cursor.execute("SELECT id, email, name, role, is_active FROM admins WHERE email = ?", 
               ("admin@linkedincontent.com",))
admin = cursor.fetchone()

if admin:
    print("\n✅ Admin account found!")
    print(f"  ID: {admin[0]}")
    print(f"  Email: {admin[1]}")
    print(f"  Name: {admin[2]}")
    print(f"  Role: {admin[3]}")
    print(f"  Active: {'Yes' if admin[4] else 'No'}")
    
    # Verify password hash exists
    cursor.execute("SELECT password_hash FROM admins WHERE email = ?", 
                   ("admin@linkedincontent.com",))
    pwd_hash = cursor.fetchone()
    print(f"  Password Hash: {'Set ✓' if pwd_hash and pwd_hash[0] else 'Missing ✗'}")
else:
    print("\n❌ Admin account NOT found!")
    print("   Run the migration script again: python run_admin_migration.py")

conn.close()
