import requests
import json

# First, login to get a token
login_url = "http://localhost:8000/api/admin/auth/login"
login_payload = {
    "email": "admin@linkedincontent.com",
    "password": "Admin@123456"
}

print("1. Getting admin token...")
login_response = requests.post(login_url, json=login_payload)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print(f"   Token: {token[:50]}...")

# Now test the subscription plans endpoint
plans_url = "http://localhost:8000/api/admin/subscription-plans"
headers = {
    "Authorization": f"Bearer {token}",
    "Origin": "http://localhost:3000"
}

print("\n2. Fetching subscription plans...")
plans_response = requests.get(plans_url, headers=headers)

print(f"   Status Code: {plans_response.status_code}")

if plans_response.status_code == 200:
    plans = plans_response.json()
    print(f"\n✅ SUCCESS! Found {len(plans)} subscription plans:\n")
    for plan in plans:
        print(f"   - {plan['display_name']} ({plan['plan_name']})")
        print(f"     Price: ${plan['price_monthly']/100:.2f}/month")
        print(f"     Posts: {plan['posts_limit']}/month")
        print(f"     Created: {plan.get('created_at', 'N/A')}")
        print()
else:
    print(f"\n❌ FAILED!")
    print(f"   Response: {plans_response.text}")

# Check CORS headers
print("3. CORS Headers:")
for header, value in plans_response.headers.items():
    if 'access-control' in header.lower() or 'origin' in header.lower():
        print(f"   {header}: {value}")
