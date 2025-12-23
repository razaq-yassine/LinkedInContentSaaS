import requests

# Test CORS headers
url = "http://localhost:8000/api/admin/subscription-plans"

print("Testing CORS headers...\n")

# Test OPTIONS request (preflight)
print("1. OPTIONS request (CORS preflight):")
try:
    response = requests.options(
        url,
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization"
        }
    )
    print(f"   Status: {response.status_code}")
    print(f"   CORS Headers:")
    for header, value in response.headers.items():
        if 'access-control' in header.lower():
            print(f"     {header}: {value}")
except Exception as e:
    print(f"   Error: {e}")

print("\n2. GET request with Origin header:")
try:
    response = requests.get(
        url,
        headers={
            "Origin": "http://localhost:3000"
        }
    )
    print(f"   Status: {response.status_code}")
    print(f"   CORS Headers:")
    for header, value in response.headers.items():
        if 'access-control' in header.lower():
            print(f"     {header}: {value}")
    
    if response.status_code != 200:
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

print("\n3. Test health endpoint:")
try:
    response = requests.get(
        "http://localhost:8000/health",
        headers={"Origin": "http://localhost:3000"}
    )
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    print(f"   CORS Headers:")
    for header, value in response.headers.items():
        if 'access-control' in header.lower():
            print(f"     {header}: {value}")
except Exception as e:
    print(f"   Error: {e}")
