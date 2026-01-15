#!/usr/bin/env python3
"""Test admin email sending"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import Admin
from app.services.email_service import EmailService
from app.config import get_settings

settings = get_settings()

print("=" * 60)
print("Testing Admin Email Configuration")
print("=" * 60)

# Check SMTP configuration
print("\n1. SMTP Configuration:")
print(f"   Host: {settings.smtp_host}")
print(f"   Port: {settings.smtp_port}")
print(f"   Username: {settings.smtp_username[:3] + '***' if settings.smtp_username else 'Not set'}")
print(f"   Password: {'***' if settings.smtp_password else 'Not set'}")
print(f"   From Email: {settings.smtp_from_email}")
print(f"   From Name: {settings.smtp_from_name}")
print(f"   Use TLS: {settings.smtp_use_tls}")
print(f"   Configured: {EmailService.is_configured()}")

# Check admin account
print("\n2. Admin Account:")
db = SessionLocal()
try:
    admin = db.query(Admin).filter(Admin.email == 'postinai.inc@gmail.com').first()
    if admin:
        print(f"   Email: {admin.email}")
        print(f"   Name: {admin.name}")
        print(f"   Active: {admin.is_active}")
        print(f"   Password Hash: {'Set' if admin.password_hash else 'None (passwordless)'}")
        
        # Test email sending
        print("\n3. Testing Email Send:")
        test_code = EmailService.generate_verification_code()
        print(f"   Generated test code: {test_code}")
        print(f"   Sending email to: {admin.email}")
        
        result = EmailService.send_admin_login_code(admin.email, admin.name, test_code)
        if result:
            print("   ✅ Email sent successfully!")
        else:
            print("   ❌ Email failed to send. Check logs above for details.")
    else:
        print("   ❌ Admin account not found!")
        print("   Run: python database/seed_admin.py")
finally:
    db.close()

print("\n" + "=" * 60)
