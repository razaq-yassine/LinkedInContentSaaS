"""
Email alert service for sending critical error notifications to admins
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime
import traceback

from ..config import get_settings
from ..logging_config import get_logger

settings = get_settings()
logger = get_logger(__name__)


def send_email_alert(
    subject: str,
    message: str,
    html_message: Optional[str] = None,
    to_email: Optional[str] = None
) -> bool:
    """
    Send an email alert to the admin
    
    Args:
        subject: Email subject
        message: Plain text message
        html_message: Optional HTML version of the message
        to_email: Override recipient email (defaults to admin_email from settings)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    if not settings.admin_email and not to_email:
        logger.warning("No admin email configured, cannot send alert")
        return False
    
    if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
        logger.warning("SMTP not configured, cannot send alert")
        return False
    
    recipient = to_email or settings.admin_email
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"[LinkedIn Content SaaS] {subject}"
        msg['From'] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg['To'] = recipient
        msg['Date'] = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')
        
        # Attach plain text
        text_part = MIMEText(message, 'plain')
        msg.attach(text_part)
        
        # Attach HTML if provided
        if html_message:
            html_part = MIMEText(html_message, 'html')
            msg.attach(html_part)
        
        # Connect to SMTP server and send
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
        
        logger.info(f"Alert email sent successfully to {recipient}: {subject}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send alert email: {str(e)}")
        logger.error(traceback.format_exc())
        return False


def send_critical_error_alert(
    error_message: str,
    endpoint: Optional[str] = None,
    user_id: Optional[str] = None,
    stack_trace: Optional[str] = None,
    extra_info: Optional[dict] = None
):
    """
    Send an alert for a critical error
    
    Args:
        error_message: The error message
        endpoint: API endpoint where error occurred
        user_id: User ID if applicable
        stack_trace: Full stack trace
        extra_info: Additional context information
    """
    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    
    # Plain text version
    plain_text = f"""
CRITICAL ERROR ALERT
====================

Time: {timestamp}
Error: {error_message}
"""
    
    if endpoint:
        plain_text += f"Endpoint: {endpoint}\n"
    if user_id:
        plain_text += f"User ID: {user_id}\n"
    
    if extra_info:
        plain_text += "\nAdditional Information:\n"
        for key, value in extra_info.items():
            plain_text += f"  {key}: {value}\n"
    
    if stack_trace:
        plain_text += f"\nStack Trace:\n{stack_trace}\n"
    
    # HTML version
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #dc2626; color: white; padding: 15px; border-radius: 5px 5px 0 0; }}
        .header h1 {{ margin: 0; font-size: 20px; }}
        .content {{ background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }}
        .info-row {{ margin: 10px 0; }}
        .label {{ font-weight: bold; color: #4b5563; }}
        .stack-trace {{ background-color: #1f2937; color: #f3f4f6; padding: 15px; border-radius: 5px; 
                        font-family: monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; }}
        .timestamp {{ color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Critical Error Alert</h1>
        </div>
        <div class="content">
            <p class="timestamp">Time: {timestamp}</p>
            
            <div class="info-row">
                <span class="label">Error:</span><br>
                <span>{error_message}</span>
            </div>
"""
    
    if endpoint:
        html += f"""
            <div class="info-row">
                <span class="label">Endpoint:</span> {endpoint}
            </div>
"""
    
    if user_id:
        html += f"""
            <div class="info-row">
                <span class="label">User ID:</span> {user_id}
            </div>
"""
    
    if extra_info:
        html += """
            <div class="info-row">
                <span class="label">Additional Information:</span><br>
"""
        for key, value in extra_info.items():
            html += f"                <span>{key}: {value}</span><br>\n"
        html += "            </div>\n"
    
    if stack_trace:
        html += f"""
            <div class="info-row">
                <span class="label">Stack Trace:</span>
                <div class="stack-trace">{stack_trace}</div>
            </div>
"""
    
    html += """
        </div>
    </div>
</body>
</html>
"""
    
    send_email_alert(
        subject=f"Critical Error: {error_message[:50]}",
        message=plain_text,
        html_message=html
    )


def send_high_error_rate_alert(
    error_count: int,
    time_period: str,
    error_details: list
):
    """
    Send an alert when error rate is unusually high
    
    Args:
        error_count: Number of errors in the period
        time_period: Time period description (e.g., "last hour")
        error_details: List of recent errors with details
    """
    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    
    plain_text = f"""
HIGH ERROR RATE ALERT
=====================

Time: {timestamp}
Error Count: {error_count} errors in {time_period}

Recent Errors:
"""
    
    for idx, error in enumerate(error_details[:10], 1):  # Show up to 10 recent errors
        plain_text += f"\n{idx}. {error.get('message', 'Unknown error')}"
        if error.get('endpoint'):
            plain_text += f"\n   Endpoint: {error['endpoint']}"
        if error.get('created_at'):
            plain_text += f"\n   Time: {error['created_at']}"
        plain_text += "\n"
    
    # HTML version
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #f59e0b; color: white; padding: 15px; border-radius: 5px 5px 0 0; }}
        .header h1 {{ margin: 0; font-size: 20px; }}
        .content {{ background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }}
        .error-list {{ list-style: none; padding: 0; }}
        .error-item {{ background-color: white; padding: 10px; margin: 10px 0; border-left: 3px solid #dc2626; }}
        .timestamp {{ color: #6b7280; font-size: 14px; }}
        .metric {{ font-size: 24px; font-weight: bold; color: #dc2626; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ High Error Rate Alert</h1>
        </div>
        <div class="content">
            <p class="timestamp">Time: {timestamp}</p>
            <p><span class="metric">{error_count} errors</span> in {time_period}</p>
            
            <h3>Recent Errors:</h3>
            <ul class="error-list">
"""
    
    for idx, error in enumerate(error_details[:10], 1):
        html += f"""
                <li class="error-item">
                    <strong>{idx}. {error.get('message', 'Unknown error')}</strong><br>
"""
        if error.get('endpoint'):
            html += f"                    <span>Endpoint: {error['endpoint']}</span><br>\n"
        if error.get('created_at'):
            html += f"                    <span>Time: {error['created_at']}</span><br>\n"
        html += "                </li>\n"
    
    html += """
            </ul>
        </div>
    </div>
</body>
</html>
"""
    
    send_email_alert(
        subject=f"High Error Rate: {error_count} errors in {time_period}",
        message=plain_text,
        html_message=html
    )


def send_low_credits_alert(user_email: str, user_name: str, credits_remaining: float):
    """
    Send an alert when a paid user is running low on credits
    
    Args:
        user_email: User's email
        user_name: User's name
        credits_remaining: Remaining credits
    """
    send_email_alert(
        subject=f"User Low on Credits: {user_email}",
        message=f"User {user_name} ({user_email}) has {credits_remaining} credits remaining.",
        html_message=f"""
<html>
<body style="font-family: Arial, sans-serif;">
    <h2>User Low on Credits</h2>
    <p><strong>User:</strong> {user_name} ({user_email})</p>
    <p><strong>Remaining Credits:</strong> {credits_remaining}</p>
    <p>Consider reaching out to encourage an upgrade.</p>
</body>
</html>
"""
    )

