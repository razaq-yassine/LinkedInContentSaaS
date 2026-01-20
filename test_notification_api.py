"""Test notification preferences API endpoint"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from backend.app.database import SessionLocal
from backend.app.models import NotificationAction, NotificationPreference

def test_api_data():
    db = SessionLocal()
    
    try:
        # Query the same way the API does
        preferences = db.query(NotificationPreference).join(
            NotificationAction
        ).order_by(NotificationAction.category, NotificationAction.action_name).all()
        
        print(f"\n✅ Found {len(preferences)} notification preferences\n")
        
        if not preferences:
            print("❌ No preferences found - API will return empty list!")
            return
        
        # Display them grouped by category
        categories = {}
        for pref in preferences:
            cat = pref.action.category
            if cat not in categories:
                categories[cat] = []
            categories[cat].append({
                'action_code': pref.action.action_code,
                'action_name': pref.action.action_name,
                'email_enabled': pref.email_enabled,
                'push_enabled': pref.push_enabled
            })
        
        for category, items in categories.items():
            print(f"\n📁 {category.upper()}:")
            for item in items:
                email = "✓" if item['email_enabled'] else "✗"
                push = "✓" if item['push_enabled'] else "✗"
                print(f"  {item['action_code']:30} {item['action_name']:35} Email:{email} Push:{push}")
        
        print(f"\n✅ API should return {len(preferences)} preferences")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_api_data()
