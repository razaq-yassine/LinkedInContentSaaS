import requests
import json

url = "http://localhost:8000/api/admin/auth/login"
payload = {
    "email": "admin@linkedincontent.com",
    "password": "Admin@123456"
}

print("🔐 Testing admin login with full error details...")

try:
    response = requests.post(url, json=payload)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"\nResponse Text:")
    print(response.text)
    print(f"\nResponse Content:")
    print(response.content)
    
    if response.status_code == 200:
        print("\n✅ Login successful!")
        data = response.json()
        print(json.dumps(data, indent=2))
    else:
        print(f"\n❌ Login failed with status {response.status_code}")
        
except Exception as e:
    print(f"\n❌ Exception: {e}")
    import traceback
    traceback.print_exc()

# Also test the /docs endpoint to see if FastAPI is working
print("\n" + "="*50)
print("Testing FastAPI docs endpoint...")
try:
    docs_response = requests.get("http://localhost:8000/docs")
    print(f"Docs Status: {docs_response.status_code}")
except Exception as e:
    print(f"Docs Error: {e}")
