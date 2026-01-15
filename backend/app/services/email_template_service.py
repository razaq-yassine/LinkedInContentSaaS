"""
Email template service for notification emails
"""
from typing import Dict, Optional
from sqlalchemy.orm import Session
from ..models import User, NotificationAction
from ..services.email_service import EmailService
from ..config import get_settings

settings = get_settings()


def format_email_subject(action_code: str, data: Dict) -> str:
    """
    Generate email subject based on action code and data.
    
    Args:
        action_code: Notification action code
        data: Notification data
    
    Returns:
        Email subject string
    """
    subjects = {
        "post_published": "Your post has been published to LinkedIn!",
        "post_failed": "Post publishing failed",
        "post_scheduled": "Post scheduled successfully",
        "subscription_activated": "Welcome to your new plan!",
        "subscription_renewed": "Subscription renewed successfully",
        "subscription_canceled": "Subscription canceled",
        "payment_failed": "Payment failed - action required",
        "credits_low": "Low credits warning",
        "credits_exhausted": "Credits exhausted",
        "credits_reset": "Your credits have been reset",
        "linkedin_connected": "LinkedIn account connected",
        "linkedin_token_expired": "LinkedIn reconnection required",
        "admin_error_critical": "[CRITICAL] System Error Alert",
        "admin_payment_failed": "[ALERT] Payment Processing Failed"
    }
    
    return subjects.get(action_code, "Notification from PostInAi")


def format_email_body(action_code: str, data: Dict, user_name: Optional[str] = None) -> tuple[str, str]:
    """
    Generate email HTML and text body based on action code and data.
    
    Args:
        action_code: Notification action code
        data: Notification data
        user_name: User's name (optional)
    
    Returns:
        Tuple of (html_content, text_content)
    """
    name = user_name or "there"
    
    # Base template
    base_header = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">PostInAi</h1>
        </div>
        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    """
    
    base_footer = """
        </div>
    </body>
    </html>
    """
    
    # Action-specific content
    if action_code == "post_published":
        linkedin_url = data.get("linkedin_url", "#")
        post_title = data.get("post_title", "Your post")
        html_content = base_header + f"""
            <h2 style="color: #1f2937; margin-top: 0;">🎉 Post Published Successfully!</h2>
            <p>Hi {name},</p>
            <p>Great news! Your post "{post_title[:50]}..." has been successfully published to LinkedIn.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{linkedin_url}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View on LinkedIn</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Keep creating amazing content!</p>
        """ + base_footer
        
        text_content = f"""
Post Published Successfully!

Hi {name},

Great news! Your post "{post_title[:50]}..." has been successfully published to LinkedIn.

View on LinkedIn: {linkedin_url}

Keep creating amazing content!
        """
    
    elif action_code == "post_failed":
        error = data.get("error", "Unknown error")
        html_content = base_header + f"""
            <h2 style="color: #1f2937; margin-top: 0;">❌ Post Publishing Failed</h2>
            <p>Hi {name},</p>
            <p>We encountered an issue while publishing your post to LinkedIn.</p>
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b;"><strong>Error:</strong> {error}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Please try again or contact support if the issue persists.</p>
        """ + base_footer
        
        text_content = f"""
Post Publishing Failed

Hi {name},

We encountered an issue while publishing your post to LinkedIn.

Error: {error}

Please try again or contact support if the issue persists.
        """
    
    elif action_code == "post_scheduled":
        scheduled_at = data.get("scheduled_at", "")
        html_content = base_header + f"""
            <h2 style="color: #1f2937; margin-top: 0;">📅 Post Scheduled</h2>
            <p>Hi {name},</p>
            <p>Your post has been scheduled successfully.</p>
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af;"><strong>Scheduled for:</strong> {scheduled_at}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Your post will be published automatically at the scheduled time.</p>
        """ + base_footer
        
        text_content = f"""
Post Scheduled

Hi {name},

Your post has been scheduled successfully.

Scheduled for: {scheduled_at}

Your post will be published automatically at the scheduled time.
        """
    
    elif action_code == "subscription_activated":
        plan = data.get("plan", "plan")
        credits_limit = data.get("credits_limit", 0)
        html_content = base_header + f"""
            <h2 style="color: #1f2937; margin-top: 0;">🎉 Welcome to {plan.title()}!</h2>
            <p>Hi {name},</p>
            <p>Your subscription has been activated successfully. You now have access to:</p>
            <ul style="color: #374151;">
                <li><strong>{credits_limit}</strong> credits per month</li>
                <li>All premium features</li>
                <li>Priority support</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.frontend_url}/generate" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Start Creating</a>
            </div>
        """ + base_footer
        
        text_content = f"""
Welcome to {plan.title()}!

Hi {name},

Your subscription has been activated successfully. You now have access to:
- {credits_limit} credits per month
- All premium features
- Priority support

Start creating: {settings.frontend_url}/generate
        """
    
    elif action_code == "subscription_renewed":
        plan = data.get("plan", "plan")
        html_content = base_header + f"""
            <h2 style="color: #1f2937; margin-top: 0;">✅ Subscription Renewed</h2>
            <p>Hi {name},</p>
            <p>Your {plan.title()} subscription has been renewed successfully. Your credits have been reset.</p>
            <p style="color: #6b7280; font-size: 14px;">Thank you for being a valued member!</p>
        """ + base_footer
        
        text_content = f"""
Subscription Renewed

Hi {name},

Your {plan.title()} subscription has been renewed successfully. Your credits have been reset.

Thank you for being a valued member!
        """
    
    elif action_code == "subscription_canceled":
        plan = data.get("plan", "plan")
        html_content = base_header + f"""
            <h2 style="color: #1f2937; margin-top: 0;">Subscription Canceled</h2>
            <p>Hi {name},</p>
            <p>Your {plan.title()} subscription has been canceled. You'll continue to have access until the end of your billing period.</p>
            <p style="color: #6b7280; font-size: 14px;">We're sorry to see you go. If you change your mind, you can reactivate anytime.</p>
        """ + base_footer
        
        text_content = f"""
Subscription Canceled

Hi {name},

Your {plan.title()} subscription has been canceled. You'll continue to have access until the end of your billing period.

We're sorry to see you go. If you change your mind, you can reactivate anytime.
        """
    
    elif action_code == "payment_failed":
        plan = data.get("plan", "plan")
        html_content = base_header + f"""
            <h2 style="color: #ef4444; margin-top: 0;">⚠️ Payment Failed</h2>
            <p>Hi {name},</p>
            <p>We were unable to process your payment for your {plan.title()} subscription.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.frontend_url}/billing" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Update Payment Method</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Please update your payment method to avoid service interruption.</p>
        """ + base_footer
        
        text_content = f"""
Payment Failed

Hi {name},

We were unable to process your payment for your {plan.title()} subscription.

Please update your payment method: {settings.frontend_url}/billing

Please update your payment method to avoid service interruption.
        """
    
    elif action_code == "credits_low":
        credits_remaining = data.get("credits_remaining", 0)
        credits_limit = data.get("credits_limit", 0)
        percentage = data.get("percentage", 0)
        html_content = base_header + f"""
            <h2 style="color: #f59e0b; margin-top: 0;">⚠️ Low Credits Warning</h2>
            <p>Hi {name},</p>
            <p>You're running low on credits!</p>
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;"><strong>{credits_remaining}</strong> credits remaining out of {credits_limit} ({percentage:.0f}%)</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.frontend_url}/billing" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Upgrade Plan</a>
            </div>
        """ + base_footer
        
        text_content = f"""
Low Credits Warning

Hi {name},

You're running low on credits!

{credits_remaining} credits remaining out of {credits_limit} ({percentage:.0f}%)

Upgrade your plan: {settings.frontend_url}/billing
        """
    
    elif action_code == "credits_exhausted":
        credits_limit = data.get("credits_limit", 0)
        html_content = base_header + f"""
            <h2 style="color: #ef4444; margin-top: 0;">⛔ Credits Exhausted</h2>
            <p>Hi {name},</p>
            <p>You've used all your credits for this month.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.frontend_url}/billing" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Upgrade Plan</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Your credits will reset next month, or upgrade now for more credits.</p>
        """ + base_footer
        
        text_content = f"""
Credits Exhausted

Hi {name},

You've used all your credits for this month.

Upgrade your plan: {settings.frontend_url}/billing

Your credits will reset next month, or upgrade now for more credits.
        """
    
    elif action_code == "credits_reset":
        html_content = base_header + f"""
            <h2 style="color: #1f2937; margin-top: 0;">🔄 Credits Reset</h2>
            <p>Hi {name},</p>
            <p>Your monthly credits have been reset. You now have full access to create content again!</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.frontend_url}/generate" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Create Content</a>
            </div>
        """ + base_footer
        
        text_content = f"""
Credits Reset

Hi {name},

Your monthly credits have been reset. You now have full access to create content again!

Create content: {settings.frontend_url}/generate
        """
    
    elif action_code == "linkedin_connected":
        html_content = base_header + f"""
            <h2 style="color: #1f2937; margin-top: 0;">🔗 LinkedIn Connected</h2>
            <p>Hi {name},</p>
            <p>Your LinkedIn account has been successfully connected. You can now publish posts directly to LinkedIn!</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.frontend_url}/generate" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Create Your First Post</a>
            </div>
        """ + base_footer
        
        text_content = f"""
LinkedIn Connected

Hi {name},

Your LinkedIn account has been successfully connected. You can now publish posts directly to LinkedIn!

Create your first post: {settings.frontend_url}/generate
        """
    
    elif action_code == "linkedin_token_expired":
        html_content = base_header + f"""
            <h2 style="color: #ef4444; margin-top: 0;">⚠️ LinkedIn Reconnection Required</h2>
            <p>Hi {name},</p>
            <p>Your LinkedIn connection has expired. Please reconnect your account to continue publishing.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.frontend_url}/settings" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reconnect LinkedIn</a>
            </div>
        """ + base_footer
        
        text_content = f"""
LinkedIn Reconnection Required

Hi {name},

Your LinkedIn connection has expired. Please reconnect your account to continue publishing.

Reconnect: {settings.frontend_url}/settings
        """
    
    else:
        # Default template
        html_content = base_header + f"""
            <h2 style="color: #1f2937; margin-top: 0;">Notification</h2>
            <p>Hi {name},</p>
            <p>You have a new notification from PostInAi.</p>
        """ + base_footer
        
        text_content = f"""
Notification

Hi {name},

You have a new notification from PostInAi.
        """
    
    return html_content, text_content


def send_notification_email(
    db: Session,
    user_id: str,
    action_code: str,
    data: Dict
) -> Dict:
    """
    Send a notification email to a user.
    
    Args:
        db: Database session
        user_id: User ID
        action_code: Notification action code
        data: Notification data
    
    Returns:
        Dict with success status
    """
    try:
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.email:
            return {"success": False, "error": "User not found or no email"}
        
        # Format email
        subject = format_email_subject(action_code, data)
        html_content, text_content = format_email_body(action_code, data, user.name)
        
        # Send email
        success = EmailService._send_email(
            to_email=user.email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
        
        return {"success": success, "error": None if success else "Email sending failed"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}
