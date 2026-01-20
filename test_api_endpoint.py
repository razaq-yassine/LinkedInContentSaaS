"""Test the notification preferences API endpoint directly"""
import requests
import json

API_URL = "http://localhost:8000"

def test_endpoint():
    print("Testing notification preferences API endpoint...")
    print(f"URL: {API_URL}/api/admin/notifications/preferences\n")
    
    try:
        # Test without auth (should fail)
        response = requests.get(f"{API_URL}/api/admin/notifications/preferences")
        print(f"Without auth: Status {response.status_code}")
        if response.status_code == 401:
            print("✓ Correctly requires authentication\n")
        
        # You need to get a real admin token to test with auth
        print("To test with authentication:")
        print("1. Log into admin dashboard at http://localhost:3000/admin/login")
        print("2. Open browser DevTools > Application > Local Storage")
        print("3. Copy the 'admin_token' value")
        print("4. Use that token to test the API")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server at http://localhost:8000")
        print("Make sure the backend is running with: python backend/main.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_endpoint()
