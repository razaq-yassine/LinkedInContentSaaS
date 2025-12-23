import requests
import json

# Test admin login
url = "http://localhost:8000/api/admin/auth/login"
payload = {
    "email": "admin@linkedincontent.com",
    "password": "Admin@123456"
}

print("🔐 Testing admin login...")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print()

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ Login successful!")
        print(f"Token: {response.json()['access_token'][:50]}...")
    else:
        print(f"\n❌ Login failed!")
        print(f"Error: {response.json()}")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
