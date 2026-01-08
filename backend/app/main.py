from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sqlalchemy as sa
from .config import get_settings
from .database import engine, Base
from .routers import auth, onboarding, generation, comments, admin, admin_auth, user, conversations, images, pdfs, subscription, env_config, ai_config, test_subscription
from .services.scheduler_service import start_scheduler, stop_scheduler
from .logging_config import setup_logging, get_logger

settings = get_settings()

# Initialize logging
setup_logging()
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="LinkedIn Content SaaS API",
    description="AI-powered LinkedIn content generation platform",
    version="1.0.0",
)

# Configure CORS
# Allow Cloudflare tunnel origins (trycloudflare.com domains)
cors_origins = [
    settings.frontend_url,
    "http://localhost:3000",
    "http://localhost:3001",
]
# Allow all trycloudflare.com domains (Cloudflare Quick Tunnels)
# This is a wildcard approach - in production, use specific domains
# For now, we'll allow any trycloudflare.com origin

# Custom CORS function to allow trycloudflare.com domains
def is_allowed_origin(origin: str) -> bool:
    if origin in cors_origins:
        return True
    # Allow any trycloudflare.com domain
    if "trycloudflare.com" in origin:
        return True
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*\.trycloudflare\.com",
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create uploads directory if it doesn't exist
os.makedirs(settings.upload_dir, exist_ok=True)

# Mount uploads directory for serving files
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["onboarding"])
app.include_router(generation.router, prefix="/api/generate", tags=["generation"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(admin_auth.router, prefix="/api/admin/auth", tags=["admin-auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(images.router, prefix="/api/images", tags=["images"])
app.include_router(pdfs.router, prefix="/api/pdfs", tags=["pdfs"])
app.include_router(subscription.router, prefix="/api/subscription", tags=["subscription"])
app.include_router(env_config.router, prefix="/api/admin", tags=["env-config"])
app.include_router(ai_config.router, prefix="/api/admin", tags=["ai-config"])

# Test endpoints (only in development mode)
if settings.dev_mode:
    app.include_router(test_subscription.router, tags=["test"])

@app.on_event("startup")
async def startup_event():
    """
    Database initialization on startup.
    
    In development: Creates tables if they don't exist (for convenience).
    In production: Only verifies connection. Migrations should be run separately.
    
    Note: For production deployments, run migrations manually:
    alembic upgrade head
    """
    # Check if we're in development mode
    # In production, migrations should be run as a separate deployment step
    if settings.dev_mode or "sqlite" in settings.database_url.lower():
        # Development: Auto-create tables for convenience
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified (development mode)")
    else:
        # Production: Just verify connection
        try:
            with engine.connect() as conn:
                conn.execute(sa.text("SELECT 1"))
            print("✅ Database connection verified")
        except Exception as e:
            print(f"⚠️  Database connection warning: {e}")
            print("💡 Make sure migrations are up to date: alembic upgrade head")
    
    # Start the scheduler for publishing scheduled posts
    try:
        start_scheduler()
        print("✅ Scheduler started - checking for scheduled posts every 5 minutes")
    except Exception as e:
        print(f"⚠️  Failed to start scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup on shutdown.
    """
    # Stop the scheduler gracefully
    try:
        stop_scheduler()
        print("✅ Scheduler stopped")
    except Exception as e:
        print(f"⚠️  Error stopping scheduler: {e}")

@app.get("/")
async def root():
    return {
        "message": "LinkedIn Content SaaS API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/public/settings")
async def get_public_settings():
    """Get all public settings (no auth required)"""
    from .database import SessionLocal
    from .models import AdminSetting
    
    db = SessionLocal()
    try:
        # Get all settings as a dict
        all_settings = db.query(AdminSetting).all()
        settings_dict = {s.key: s.value for s in all_settings}
        
        def get_setting(key: str, default: str = "") -> str:
            return settings_dict.get(key, default) or default
        
        return {
            # Site Configuration
            "maintenance_mode": get_setting("maintenance_mode", "false"),
            "maintenance_message": get_setting("maintenance_message", "We're currently performing maintenance."),
            "app_name": get_setting("app_name", "LinkedIn Content AI"),
            "registration_enabled": get_setting("registration_enabled", "true"),
            "require_email_verification": get_setting("require_email_verification", "true"),
            
            # Public Theme
            "public_theme": get_setting("public_theme", "modern-gradient"),
            "public_hero_style": get_setting("public_hero_style", "gradient"),
            "public_accent_color": get_setting("public_accent_color", "#6366f1"),
            "public_dark_mode": get_setting("public_dark_mode", "false"),
            
            # App Theme
            "app_theme": get_setting("app_theme", "professional-light"),
            "app_sidebar_style": get_setting("app_sidebar_style", "default"),
            "app_accent_color": get_setting("app_accent_color", "#0A66C2"),
            "app_dark_mode": get_setting("app_dark_mode", "false"),
            "app_card_style": get_setting("app_card_style", "elevated"),
            "app_animations_enabled": get_setting("app_animations_enabled", "true"),
            
            # Legacy
            "site_theme": get_setting("site_theme", "default"),
            "primary_color": get_setting("primary_color", "#0A66C2"),
            "logo_url": get_setting("logo_url", ""),
            "favicon_url": get_setting("favicon_url", ""),
            "custom_css": get_setting("custom_css", ""),
            
            # Feature Toggles - Auth
            "linkedin_oauth_enabled": get_setting("linkedin_oauth_enabled", "true"),
            "google_oauth_enabled": get_setting("google_oauth_enabled", "true"),
            "email_login_enabled": get_setting("email_login_enabled", "true"),
            "magic_link_enabled": get_setting("magic_link_enabled", "false"),
            
            # Feature Toggles - Content
            "post_generation_enabled": get_setting("post_generation_enabled", "true"),
            "image_generation_enabled": get_setting("image_generation_enabled", "true"),
            "carousel_generation_enabled": get_setting("carousel_generation_enabled", "true"),
            "comment_generation_enabled": get_setting("comment_generation_enabled", "true"),
            "web_search_enabled": get_setting("web_search_enabled", "true"),
            "trending_topics_enabled": get_setting("trending_topics_enabled", "true"),
            "content_rewrite_enabled": get_setting("content_rewrite_enabled", "true"),
            "hashtag_suggestions_enabled": get_setting("hashtag_suggestions_enabled", "true"),
            "tone_selection_enabled": get_setting("tone_selection_enabled", "true"),
            "multi_language_enabled": get_setting("multi_language_enabled", "true"),
            
            # Feature Toggles - LinkedIn
            "direct_posting_enabled": get_setting("direct_posting_enabled", "true"),
            "post_scheduling_enabled": get_setting("post_scheduling_enabled", "true"),
            "linkedin_analytics_enabled": get_setting("linkedin_analytics_enabled", "false"),
            
            # Feature Toggles - User
            "conversation_history_enabled": get_setting("conversation_history_enabled", "true"),
            "saved_posts_enabled": get_setting("saved_posts_enabled", "true"),
            "templates_enabled": get_setting("templates_enabled", "true"),
            "user_preferences_enabled": get_setting("user_preferences_enabled", "true"),
            "onboarding_enabled": get_setting("onboarding_enabled", "true"),
            "profile_customization_enabled": get_setting("profile_customization_enabled", "true"),
            "creator_personas_enabled": get_setting("creator_personas_enabled", "true"),
            "keyboard_shortcuts_enabled": get_setting("keyboard_shortcuts_enabled", "true"),
            
            # Feature Toggles - Premium
            "premium_features_enabled": get_setting("premium_features_enabled", "true"),
            "api_access_enabled": get_setting("api_access_enabled", "false"),
            "bulk_generation_enabled": get_setting("bulk_generation_enabled", "false"),
            "export_enabled": get_setting("export_enabled", "true"),
            
            # Rate Limits
            "api_rate_limit_per_minute": get_setting("api_rate_limit_per_minute", "60"),
            "generation_cooldown_seconds": get_setting("generation_cooldown_seconds", "5"),
            "max_daily_generations_free": get_setting("max_daily_generations_free", "10"),
            "max_daily_generations_premium": get_setting("max_daily_generations_premium", "100"),
            "max_images_per_day_free": get_setting("max_images_per_day_free", "5"),
            "max_images_per_day_premium": get_setting("max_images_per_day_premium", "50"),
            "max_conversations_stored": get_setting("max_conversations_stored", "50"),
            "max_post_length": get_setting("max_post_length", "3000"),
            
            # Moderation
            "content_moderation_enabled": get_setting("content_moderation_enabled", "false"),
            "profanity_filter_enabled": get_setting("profanity_filter_enabled", "true"),
            "spam_detection_enabled": get_setting("spam_detection_enabled", "true"),
            
            # Email
            "email_notifications_enabled": get_setting("email_notifications_enabled", "true"),
            "welcome_email_enabled": get_setting("welcome_email_enabled", "true"),
            "weekly_digest_enabled": get_setting("weekly_digest_enabled", "false"),
            "tips_emails_enabled": get_setting("tips_emails_enabled", "true"),
            
            # Analytics
            "analytics_enabled": get_setting("analytics_enabled", "false"),
            "google_analytics_id": get_setting("google_analytics_id", ""),
            "error_tracking_enabled": get_setting("error_tracking_enabled", "true"),
            "performance_monitoring_enabled": get_setting("performance_monitoring_enabled", "false"),
        }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    import os
    # Use random port from environment or default to 8753
    port = int(os.getenv("PORT", "8753"))
    print(f"🚀 Starting backend server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)

