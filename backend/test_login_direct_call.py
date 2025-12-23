import sys
sys.path.insert(0, '.')

from app.routers.admin_auth import admin_login
from app.schemas.admin_schemas import AdminLoginRequest
from app.database import SessionLocal

# Test the login function directly
db = SessionLocal()

try:
    request = AdminLoginRequest(
        email="admin@linkedincontent.com",
        password="Admin@123456"
    )
    
    print("Testing admin_login function directly...")
    
    # Call the async function
    import asyncio
    result = asyncio.run(admin_login(request, db))
    
    print(f"✅ Login successful!")
    print(f"Token: {result.access_token[:50]}...")
    print(f"Admin: {result.admin.email}")
    print(f"Role: {result.admin.role}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
