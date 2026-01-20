"""
Test admin login code request with real email sending
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_request_login_code():
    """Request a login code"""
    url = f"{BASE_URL}/api/admin/auth/request-code"
    
    data = {
        "email": "postinai.inc@gmail.com"
    }
    
    print("=" * 60)
    print("Testing Admin Login Code Request")
    print("=" * 60)
    print(f"URL: {url}")
    print(f"Email: {data['email']}")
    print("-" * 60)
    
    try:
        response = requests.post(url, json=data)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            print("\n✅ Request successful!")
            print(f"📧 Check your inbox: {data['email']}")
            print("   Subject: Your Admin Login Code")
            print("   (May take 5-30 seconds to arrive)")
        else:
            print(f"❌ Request failed")
            try:
                print(f"Error: {response.json()}")
            except:
                print(f"Response: {response.text}")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Backend server not running")
        print("   Start the backend: python -m app.main")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test_request_login_code()
