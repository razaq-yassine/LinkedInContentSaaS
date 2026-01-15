#!/usr/bin/env python3
"""Direct test of email sending with current code"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Admin
from app.services.email_service import EmailService
from app.config import get_settings

settings = get_settings()

print("=" * 60)
print("Direct Email Test")
print("=" * 60)
print(f"SMTP Host: {settings.smtp_host}")
print(f"SMTP Port: {settings.smtp_port}")
print(f"From Email: {settings.smtp_from_email}")
print(f"To Email: postinai.inc@gmail.com")
print()

db = SessionLocal()
try:
    admin = db.query(Admin).filter(Admin.email == 'postinai.inc@gmail.com').first()
    if admin:
        print(f"Admin found: {admin.email}")
        print(f"Current code in DB: {admin.email_code}")
        print()
        print("Sending test email...")
        print("-" * 60)
        
        test_code = "123456"  # Use a test code
        result = EmailService.send_admin_login_code(admin.email, admin.name, test_code)
        
        print("-" * 60)
        if result:
            print("✅ Email send returned: SUCCESS")
            print()
            print("⚠️  If you don't receive the email:")
            print("   1. Check SPAM/Junk folder")
            print("   2. Check Gmail security settings")
            print("   3. Verify SMTP password is a Gmail App Password (not regular password)")
            print("   4. Check if Gmail account has 2FA enabled (required for App Passwords)")
        else:
            print("❌ Email send returned: FAILED")
            print("   Check the error messages above")
    else:
        print("❌ Admin not found!")
finally:
    db.close()

print("=" * 60)
