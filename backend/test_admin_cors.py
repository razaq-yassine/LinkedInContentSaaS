"""
Test script to verify the admin auth endpoint with CORS
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_admin_request_code():
    """Test the request-code endpoint with proper headers"""
    url = f"{BASE_URL}/api/admin/auth/request-code"
    
    headers = {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000"
    }
    
    data = {
        "email": "postinai.inc@gmail.com"
    }
    
    print(f"Testing POST {url}")
    print(f"Headers: {headers}")
    print(f"Body: {data}")
    print("-" * 50)
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers:")
        for key, value in response.headers.items():
            if 'cors' in key.lower() or 'access-control' in key.lower():
                print(f"  {key}: {value}")
        print(f"\nResponse Body:")
        print(json.dumps(response.json(), indent=2))
        
        # Check for CORS headers
        if 'access-control-allow-origin' in response.headers:
            print("\n✅ CORS headers present")
        else:
            print("\n❌ CORS headers missing")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except json.JSONDecodeError:
        print(f"Response: {response.text}")

def test_options_preflight():
    """Test OPTIONS preflight request"""
    url = f"{BASE_URL}/api/admin/auth/request-code"
    
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
    }
    
    print("\n" + "=" * 50)
    print("Testing OPTIONS (preflight)")
    print("=" * 50)
    print(f"Testing OPTIONS {url}")
    print(f"Headers: {headers}")
    print("-" * 50)
    
    try:
        response = requests.options(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers:")
        for key, value in response.headers.items():
            if 'cors' in key.lower() or 'access-control' in key.lower():
                print(f"  {key}: {value}")
        
        # Check for CORS headers
        if 'access-control-allow-origin' in response.headers:
            print("\n✅ CORS preflight successful")
        else:
            print("\n❌ CORS preflight failed - missing headers")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("Admin Auth CORS Test")
    print("=" * 50)
    test_options_preflight()
    print("\n")
    test_admin_request_code()
