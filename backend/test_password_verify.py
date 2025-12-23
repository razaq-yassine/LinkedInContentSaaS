import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Connect to database
conn = sqlite3.connect("linkedin_content_saas.db")
cursor = conn.cursor()

# Get admin
cursor.execute("SELECT email, password_hash FROM admins WHERE email = ?", 
               ("admin@linkedincontent.com",))
admin = cursor.fetchone()

if admin:
    email, password_hash = admin
    print(f"Email: {email}")
    print(f"Password Hash: {password_hash[:50]}...")
    
    # Test password verification
    test_password = "Admin@123456"
    try:
        result = pwd_context.verify(test_password, password_hash)
        print(f"\nPassword verification result: {result}")
        
        if result:
            print("✅ Password is correct!")
        else:
            print("❌ Password is incorrect!")
            
            # Try creating a new hash
            print("\nCreating new hash for testing...")
            new_hash = pwd_context.hash(test_password)
            print(f"New hash: {new_hash[:50]}...")
            
            # Verify with new hash
            verify_new = pwd_context.verify(test_password, new_hash)
            print(f"New hash verification: {verify_new}")
            
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        import traceback
        traceback.print_exc()
else:
    print("❌ Admin not found!")

conn.close()
