import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import secrets

from ..config import get_settings

settings = get_settings()


class EmailService:
    """Service for sending emails via SMTP"""
    
    @staticmethod
    def is_configured() -> bool:
        """Check if SMTP is properly configured"""
        return bool(
            settings.smtp_host and 
            settings.smtp_username and 
            settings.smtp_password and
            settings.smtp_from_email
        )
    
    @staticmethod
    def _create_smtp_connection():
        """Create SMTP connection with timeout"""
        if settings.smtp_use_tls:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
        
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        
        return server
    
    @staticmethod
    def _send_email(to_email: str, subject: str, html_content: str, text_content: str = None):
        """Send an email"""
        if not EmailService.is_configured():
            print(f"[EMAIL] SMTP not configured. Would send to {to_email}: {subject}")
            return False
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg["To"] = to_email
        
        # Add plain text version
        if text_content:
            part1 = MIMEText(text_content, "plain")
            msg.attach(part1)
        
        # Add HTML version
        part2 = MIMEText(html_content, "html")
        msg.attach(part2)
        
        try:
            server = EmailService._create_smtp_connection()
            server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
            server.quit()
            print(f"[EMAIL] Successfully sent email to {to_email}: {subject}")
            return True
        except Exception as e:
            print(f"[EMAIL] Failed to send email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_verification_code() -> str:
        """Generate a 6-digit verification code"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    @staticmethod
    def send_verification_email(to_email: str, name: str, token: str, verification_code: str):
        """Send email verification email with code and link"""
        verification_url = f"{settings.frontend_url}/verify-email?token={token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">ContentAI</h1>
            </div>
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
                <p>Hi {name or 'there'},</p>
                <p>Thank you for signing up for ContentAI! Use the verification code below to activate your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">VERIFICATION CODE</p>
                        <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1f2937; font-family: 'Courier New', monospace;">{verification_code}</p>
                    </div>
                </div>
                <p style="color: #6b7280; font-size: 14px; text-align: center;">Or click the button below to verify automatically:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="{verification_url}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email Address</a>
                </div>
                <p style="color: #ef4444; font-size: 14px; font-weight: 600; text-align: center;">⏱️ This code will expire in 15 minutes</p>
                <p style="color: #6b7280; font-size: 14px;">If you didn't create an account with ContentAI, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{verification_url}" style="color: #3b82f6; word-break: break-all;">{verification_url}</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Verify Your Email Address
        
        Hi {name or 'there'},
        
        Thank you for signing up for ContentAI! Your verification code is:
        
        {verification_code}
        
        Or click this link to verify automatically:
        {verification_url}
        
        This code will expire in 15 minutes.
        
        If you didn't create an account with ContentAI, you can safely ignore this email.
        """
        
        return EmailService._send_email(to_email, "Verify your ContentAI email", html_content, text_content)
    
    @staticmethod
    def send_password_reset_email(to_email: str, name: str, token: str):
        """Send password reset email"""
        reset_url = f"{settings.frontend_url}/reset-password?token={token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">ContentAI</h1>
            </div>
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
                <p>Hi {name or 'there'},</p>
                <p>We received a request to reset your password. Click the button below to choose a new password.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">This link will expire in {settings.password_reset_expire_hours} hour(s).</p>
                <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{reset_url}" style="color: #3b82f6; word-break: break-all;">{reset_url}</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Reset Your Password
        
        Hi {name or 'there'},
        
        We received a request to reset your password. Click the link below to choose a new password:
        
        {reset_url}
        
        This link will expire in {settings.password_reset_expire_hours} hour(s).
        
        If you didn't request a password reset, you can safely ignore this email.
        """
        
        return EmailService._send_email(to_email, "Reset your ContentAI password", html_content, text_content)
    
    @staticmethod
    def send_welcome_email(to_email: str, name: str):
        """Send welcome email after verification"""
        login_url = f"{settings.frontend_url}/login"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">ContentAI</h1>
            </div>
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Welcome to ContentAI! 🎉</h2>
                <p>Hi {name or 'there'},</p>
                <p>Your email has been verified and your account is now active. You're all set to start creating amazing LinkedIn content!</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{login_url}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Start Creating Content</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Need help getting started? Check out our onboarding guide after you log in.</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to ContentAI!
        
        Hi {name or 'there'},
        
        Your email has been verified and your account is now active. You're all set to start creating amazing LinkedIn content!
        
        Log in here: {login_url}
        """
        
        return EmailService._send_email(to_email, "Welcome to ContentAI!", html_content, text_content)
