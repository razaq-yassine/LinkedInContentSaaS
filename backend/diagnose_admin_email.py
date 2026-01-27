#!/usr/bin/env python3
"""Diagnose admin email issue"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Admin
from app.services.email_service import EmailService
from app.config import get_settings

settings = get_settings()

print("=" * 70)
print("ADMIN EMAIL DIAGNOSIS")
print("=" * 70)

# 1. Check SMTP Configuration
print("\n[1] SMTP Configuration:")
print(f"    Host: {settings.smtp_host}")
print(f"    Port: {settings.smtp_port}")
print(f"    Username: {settings.smtp_username}")
print(f"    Password: {'*' * 10} ({len(settings.smtp_password)} chars)")
print(f"    From Email: {settings.smtp_from_email}")
print(f"    Use TLS: {settings.smtp_use_tls}")
print(f"    Configured: {EmailService.is_configured()}")

# 2. Check Admin Account
print("\n[2] Admin Account Check:")
db = SessionLocal()
try:
    admin = db.query(Admin).filter(Admin.email == 'postinai.inc@gmail.com').first()
    if admin:
        print(f"    ✓ Admin found")
        print(f"    Email: {admin.email}")
        print(f"    Name: {admin.name}")
        print(f"    Active: {admin.is_active}")
        print(f"    Role: {admin.role}")
        print(f"    Current email_code: {admin.email_code}")
        print(f"    Code expires at: {admin.email_code_expires_at}")
    else:
        print(f"    ✗ Admin NOT found for postinai.inc@gmail.com")
        print(f"\n    Available admins:")
        all_admins = db.query(Admin).all()
        for a in all_admins:
            print(f"      - {a.email} (active: {a.is_active})")
finally:
    db.close()

# 3. Test Email Sending
if admin:
    print("\n[3] Testing Email Send:")
    print(f"    Generating test code...")
    test_code = "999999"
    print(f"    Test code: {test_code}")
    print(f"    Attempting to send to: {admin.email}")
    print(f"    -" * 70)
    
    try:
        result = EmailService.send_admin_login_code(admin.email, admin.name, test_code)
        print(f"    -" * 70)
        if result:
            print(f"    ✓ Email send returned SUCCESS")
            print(f"\n    If you don't see the email:")
            print(f"      1. Check your SPAM/Junk folder")
            print(f"      2. Wait a few minutes (email delivery can be delayed)")
            print(f"      3. Check Gmail blocks/filters")
            print(f"      4. Verify the SMTP password is a Gmail App Password")
        else:
            print(f"    ✗ Email send returned FAILURE")
            print(f"      Check the error messages above for details")
    except Exception as e:
        print(f"    ✗ Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 70)
