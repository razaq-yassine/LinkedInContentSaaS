"""
Seed global settings for site configuration.
This script is idempotent - safe to run multiple times.
"""
import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models import AdminSetting
import uuid


def seed_global_settings():
    """Seed global settings for site configuration"""
    db = SessionLocal()
    
    try:
        settings_data = [
            # Site Configuration
            {
                "key": "maintenance_mode",
                "value": "false",
                "description": "Enable maintenance mode to prevent user access (true/false)"
            },
            {
                "key": "maintenance_message",
                "value": "We're currently performing scheduled maintenance. Please check back soon!",
                "description": "Message displayed to users during maintenance mode"
            },
            {
                "key": "app_name",
                "value": "LinkedIn Content AI",
                "description": "Application name displayed in the UI"
            },
            {
                "key": "registration_enabled",
                "value": "true",
                "description": "Allow new user registrations (true/false)"
            },
            {
                "key": "require_email_verification",
                "value": "true",
                "description": "Require email verification for new accounts (true/false)"
            },
            
            # Public Pages Theme (Landing, Login, About)
            {
                "key": "public_theme",
                "value": "modern-gradient",
                "description": "Theme for public pages (modern-gradient, minimal-light, dark-elegance, vibrant-startup, corporate-blue, nature-green)"
            },
            {
                "key": "public_hero_style",
                "value": "gradient",
                "description": "Hero section style for landing page (gradient, image, video, animated)"
            },
            {
                "key": "public_accent_color",
                "value": "#6366f1",
                "description": "Accent color for public pages in hex format"
            },
            {
                "key": "public_dark_mode",
                "value": "true",
                "description": "Enable dark mode for public pages (true/false)"
            },
            
            # App Theme (Dashboard, Generate, etc.)
            {
                "key": "app_theme",
                "value": "professional-light",
                "description": "Theme for the main application (professional-light, modern-dark, ocean-breeze, sunset-warm, forest-calm, midnight-purple, rose-gold, slate-minimal)"
            },
            {
                "key": "app_sidebar_style",
                "value": "default",
                "description": "Sidebar style (default, compact, floating, hidden)"
            },
            {
                "key": "app_accent_color",
                "value": "#0A66C2",
                "description": "Accent color for the app in hex format"
            },
            {
                "key": "app_dark_mode",
                "value": "true",
                "description": "Enable dark mode for the application (true/false)"
            },
            {
                "key": "app_card_style",
                "value": "elevated",
                "description": "Card style in the app (elevated, flat, bordered, glass)"
            },
            {
                "key": "app_animations_enabled",
                "value": "true",
                "description": "Enable UI animations and transitions (true/false)"
            },
            
            # Legacy theme settings (kept for compatibility)
            {
                "key": "site_theme",
                "value": "default",
                "description": "Legacy: Current site theme"
            },
            {
                "key": "primary_color",
                "value": "#0A66C2",
                "description": "Primary brand color in hex format"
            },
            {
                "key": "logo_url",
                "value": "",
                "description": "Custom logo URL (leave empty for default)"
            },
            {
                "key": "favicon_url",
                "value": "",
                "description": "Custom favicon URL (leave empty for default)"
            },
            {
                "key": "custom_css",
                "value": "",
                "description": "Custom CSS to inject into the site"
            },
            
            # Feature Toggles - Authentication
            {
                "key": "linkedin_oauth_enabled",
                "value": "true",
                "description": "Enable LinkedIn OAuth login and posting (true/false)"
            },
            {
                "key": "google_oauth_enabled",
                "value": "true",
                "description": "Enable Google OAuth login (true/false)"
            },
            {
                "key": "email_login_enabled",
                "value": "true",
                "description": "Enable email/password login (true/false)"
            },
            {
                "key": "magic_link_enabled",
                "value": "false",
                "description": "Enable passwordless magic link login (true/false)"
            },
            
            # Feature Toggles - Content Generation
            {
                "key": "post_generation_enabled",
                "value": "true",
                "description": "Enable AI post generation (true/false)"
            },
            {
                "key": "image_generation_enabled",
                "value": "true",
                "description": "Enable AI image generation feature (true/false)"
            },
            {
                "key": "carousel_generation_enabled",
                "value": "true",
                "description": "Enable carousel/PDF generation feature (true/false)"
            },
            {
                "key": "comment_generation_enabled",
                "value": "true",
                "description": "Enable comment generation feature (true/false)"
            },
            {
                "key": "web_search_enabled",
                "value": "true",
                "description": "Enable web search for content research (true/false)"
            },
            {
                "key": "trending_topics_enabled",
                "value": "true",
                "description": "Enable trending topics suggestions (true/false)"
            },
            {
                "key": "content_rewrite_enabled",
                "value": "true",
                "description": "Enable AI content rewriting/improvement (true/false)"
            },
            {
                "key": "hashtag_suggestions_enabled",
                "value": "true",
                "description": "Enable AI hashtag suggestions (true/false)"
            },
            {
                "key": "tone_selection_enabled",
                "value": "true",
                "description": "Enable tone/style selection for posts (true/false)"
            },
            {
                "key": "multi_language_enabled",
                "value": "true",
                "description": "Enable multi-language content generation (true/false)"
            },
            
            # Feature Toggles - LinkedIn Integration
            {
                "key": "direct_posting_enabled",
                "value": "true",
                "description": "Enable direct posting to LinkedIn (true/false)"
            },
            {
                "key": "post_scheduling_enabled",
                "value": "true",
                "description": "Enable post scheduling feature (true/false)"
            },
            {
                "key": "linkedin_analytics_enabled",
                "value": "false",
                "description": "Enable LinkedIn post analytics (true/false)"
            },
            
            # Feature Toggles - User Features
            {
                "key": "conversation_history_enabled",
                "value": "true",
                "description": "Enable conversation history saving (true/false)"
            },
            {
                "key": "saved_posts_enabled",
                "value": "true",
                "description": "Enable saving posts for later (true/false)"
            },
            {
                "key": "templates_enabled",
                "value": "true",
                "description": "Enable post templates feature (true/false)"
            },
            {
                "key": "user_preferences_enabled",
                "value": "true",
                "description": "Enable user preference customization (true/false)"
            },
            {
                "key": "onboarding_enabled",
                "value": "true",
                "description": "Enable new user onboarding flow (true/false)"
            },
            {
                "key": "profile_customization_enabled",
                "value": "true",
                "description": "Enable user profile customization (true/false)"
            },
            {
                "key": "creator_personas_enabled",
                "value": "true",
                "description": "Enable creator persona selection (true/false)"
            },
            {
                "key": "keyboard_shortcuts_enabled",
                "value": "true",
                "description": "Enable keyboard shortcuts (true/false)"
            },
            
            # Feature Toggles - Premium/Advanced
            {
                "key": "premium_features_enabled",
                "value": "true",
                "description": "Enable premium feature tier (true/false)"
            },
            {
                "key": "api_access_enabled",
                "value": "false",
                "description": "Enable API access for users (true/false)"
            },
            {
                "key": "bulk_generation_enabled",
                "value": "false",
                "description": "Enable bulk content generation (true/false)"
            },
            {
                "key": "export_enabled",
                "value": "true",
                "description": "Enable export functionality (true/false)"
            },
            
            # Rate Limits
            {
                "key": "api_rate_limit_per_minute",
                "value": "60",
                "description": "Maximum API requests per minute per user"
            },
            {
                "key": "generation_cooldown_seconds",
                "value": "5",
                "description": "Minimum seconds between content generations"
            },
            {
                "key": "max_daily_generations_free",
                "value": "10",
                "description": "Maximum daily generations for free tier users"
            },
            {
                "key": "max_daily_generations_premium",
                "value": "100",
                "description": "Maximum daily generations for premium users"
            },
            {
                "key": "max_images_per_day_free",
                "value": "5",
                "description": "Maximum images per day for free tier"
            },
            {
                "key": "max_images_per_day_premium",
                "value": "50",
                "description": "Maximum images per day for premium users"
            },
            {
                "key": "max_conversations_stored",
                "value": "50",
                "description": "Maximum conversations stored per user"
            },
            
            # Content Moderation
            {
                "key": "content_moderation_enabled",
                "value": "false",
                "description": "Enable AI content moderation before publishing (true/false)"
            },
            {
                "key": "profanity_filter_enabled",
                "value": "true",
                "description": "Enable profanity filtering (true/false)"
            },
            {
                "key": "spam_detection_enabled",
                "value": "true",
                "description": "Enable spam content detection (true/false)"
            },
            {
                "key": "blocked_keywords",
                "value": "[]",
                "description": "JSON array of blocked keywords for content generation"
            },
            {
                "key": "max_post_length",
                "value": "3000",
                "description": "Maximum post length in characters"
            },
            
            # Email Settings
            {
                "key": "email_notifications_enabled",
                "value": "true",
                "description": "Enable email notifications (true/false)"
            },
            {
                "key": "welcome_email_enabled",
                "value": "true",
                "description": "Send welcome email on registration (true/false)"
            },
            {
                "key": "weekly_digest_enabled",
                "value": "false",
                "description": "Send weekly usage digest emails (true/false)"
            },
            {
                "key": "tips_emails_enabled",
                "value": "true",
                "description": "Send tips and best practices emails (true/false)"
            },
            
            # Analytics & Tracking
            {
                "key": "analytics_enabled",
                "value": "false",
                "description": "Enable usage analytics tracking (true/false)"
            },
            {
                "key": "google_analytics_id",
                "value": "",
                "description": "Google Analytics tracking ID (e.g., G-XXXXXXXXXX)"
            },
            {
                "key": "error_tracking_enabled",
                "value": "true",
                "description": "Enable error tracking and reporting (true/false)"
            },
            {
                "key": "performance_monitoring_enabled",
                "value": "false",
                "description": "Enable performance monitoring (true/false)"
            },
        ]
        
        for setting_data in settings_data:
            # Check if setting already exists
            existing = db.query(AdminSetting).filter(AdminSetting.key == setting_data["key"]).first()
            if not existing:
                setting = AdminSetting(
                    id=str(uuid.uuid4()),
                    **setting_data
                )
                db.add(setting)
                print(f"✅ Added global setting: {setting_data['key']}")
            else:
                print(f"⚠️  Global setting already exists: {setting_data['key']}")
        
        db.commit()
        print("✅ Global settings seeding completed")
        
    except Exception as e:
        print(f"❌ Error seeding global settings: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_global_settings()
