import requests

url = "http://localhost:8000/api/admin/auth/login"
payload = {
    "email": "admin@linkedincontent.com",
    "password": "Admin@123456"
}

print("🔐 Testing admin login...")

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Text: {response.text}")
    print(f"Response Headers: {response.headers}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
