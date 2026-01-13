#!/usr/bin/env python3
"""
Script to update dark mode settings in the database to default to true.
Run this after updating the code defaults to ensure existing databases are updated.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import AdminSetting

def update_dark_mode_defaults():
    """Update dark mode settings in the database to 'true'"""
    db = SessionLocal()
    try:
        # Update app_dark_mode
        app_dark_mode = db.query(AdminSetting).filter(AdminSetting.key == "app_dark_mode").first()
        if app_dark_mode:
            app_dark_mode.value = "true"
            print(f"✅ Updated app_dark_mode to 'true'")
        else:
            print("⚠️  app_dark_mode setting not found in database (will use API default)")
        
        # Update public_dark_mode
        public_dark_mode = db.query(AdminSetting).filter(AdminSetting.key == "public_dark_mode").first()
        if public_dark_mode:
            public_dark_mode.value = "true"
            print(f"✅ Updated public_dark_mode to 'true'")
        else:
            print("⚠️  public_dark_mode setting not found in database (will use API default)")
        
        db.commit()
        print("\n✅ Dark mode defaults updated successfully!")
        print("   The app will now default to dark mode for new users and when settings are not set.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating dark mode defaults: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    update_dark_mode_defaults()
