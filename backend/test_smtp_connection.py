"""
Test SMTP connection and email sending
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import get_settings

settings = get_settings()

def test_smtp_connection():
    """Test SMTP connection"""
    print("=" * 60)
    print("SMTP Configuration Test")
    print("=" * 60)
    
    print("\n1. Configuration Check:")
    print(f"   Host: {settings.smtp_host}")
    print(f"   Port: {settings.smtp_port}")
    print(f"   Username: {settings.smtp_username}")
    print(f"   Password: {'*' * len(settings.smtp_password) if settings.smtp_password else 'NOT SET'}")
    print(f"   From Email: {settings.smtp_from_email}")
    print(f"   Use TLS: {settings.smtp_use_tls}")
    
    if not all([settings.smtp_host, settings.smtp_username, settings.smtp_password, settings.smtp_from_email]):
        print("\n❌ SMTP not fully configured!")
        print("   Missing required settings in .env file")
        return False
    
    print("\n2. Testing SMTP Connection...")
    try:
        # Port 465 uses SSL/TLS directly, port 587 uses STARTTLS
        if settings.smtp_port == 465:
            # Port 465 requires SMTP_SSL (direct SSL connection)
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
            print(f"   ✅ Connected to {settings.smtp_host}:{settings.smtp_port} (SSL)")
        elif settings.smtp_use_tls:
            # Port 587 uses STARTTLS
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
            print(f"   ✅ Connected to {settings.smtp_host}:{settings.smtp_port}")
            
            print("   🔒 Starting TLS...")
            server.starttls()
            print("   ✅ TLS enabled")
        else:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
            print(f"   ✅ Connected to {settings.smtp_host}:{settings.smtp_port} (SSL)")
        
        print(f"   🔑 Authenticating as {settings.smtp_username}...")
        server.login(settings.smtp_username, settings.smtp_password)
        print("   ✅ Authentication successful")
        
        server.quit()
        print("\n✅ SMTP Connection Test: PASSED")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ Authentication Failed: {e}")
        print("\n   Possible causes:")
        print("   - Incorrect username or password")
        print("   - For Gmail: Need to use App Password (not regular password)")
        print("   - 2-Step Verification must be enabled for App Passwords")
        print("\n   Gmail App Password Setup:")
        print("   1. Go to: https://myaccount.google.com/security")
        print("   2. Enable 2-Step Verification")
        print("   3. Generate App Password: https://myaccount.google.com/apppasswords")
        print("   4. Use the generated password in .env SMTP_PASSWORD")
        return False
        
    except smtplib.SMTPException as e:
        print(f"\n❌ SMTP Error: {e}")
        return False
        
    except Exception as e:
        print(f"\n❌ Connection Error: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

def send_test_email(to_email: str):
    """Send a test email"""
    print("\n" + "=" * 60)
    print("Sending Test Email")
    print("=" * 60)
    print(f"To: {to_email}")
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Test Email - SMTP Verification"
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = to_email
    
    text_content = """
    SMTP Test Email
    
    If you received this email, your SMTP configuration is working correctly!
    
    Configuration:
    - SMTP Host: {}
    - SMTP Port: {}
    - From Email: {}
    """.format(settings.smtp_host, settings.smtp_port, settings.smtp_from_email)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10b981;">✅ SMTP Test Successful</h2>
        <p>If you received this email, your SMTP configuration is working correctly!</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Configuration:</h3>
            <ul>
                <li><strong>SMTP Host:</strong> {settings.smtp_host}</li>
                <li><strong>SMTP Port:</strong> {settings.smtp_port}</li>
                <li><strong>From Email:</strong> {settings.smtp_from_email}</li>
            </ul>
        </div>
        <p style="color: #6b7280; font-size: 12px;">This is an automated test email.</p>
    </body>
    </html>
    """
    
    part1 = MIMEText(text_content, "plain")
    part2 = MIMEText(html_content, "html")
    msg.attach(part1)
    msg.attach(part2)
    
    try:
        # Port 465 uses SSL/TLS directly, port 587 uses STARTTLS
        if settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
        elif settings.smtp_use_tls:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
        
        server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
        server.quit()
        
        print("\n✅ Test email sent successfully!")
        print(f"   Check {to_email} inbox")
        print("   (May take a few seconds to arrive)")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to send test email: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Test connection
    connection_ok = test_smtp_connection()
    
    if connection_ok:
        # Ask if user wants to send test email
        print("\n" + "=" * 60)
        test_email = input("Enter email address to send test (or press Enter to skip): ").strip()
        if test_email:
            send_test_email(test_email)
    else:
        print("\n⚠️  Fix SMTP configuration before testing email sending")
