from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Development mode - skips email verification
    dev_mode: bool = True
    
    # Database (SQLite for development)
    database_url: str = "sqlite:///./linkedin_content_saas.db"
    
    # AI Provider Selection
    ai_provider: str = "gemini"  # Options: "openai", "gemini", or "claude"
    
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"  # Options: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
    openai_onboarding_model: str = ""  # Separate model for onboarding (CV analysis). If empty, uses openai_model
    
    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"  # Options: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.0-flash-exp, gemini-2.0-flash-lite-exp, gemini-1.5-flash, gemini-1.5-pro
    gemini_onboarding_model: str = ""  # Separate model for onboarding (CV analysis). If empty, uses gemini_model
    
    # Claude (Anthropic)
    claude_api_key: str = ""
    claude_model: str = "claude-haiku-4-5"  # Options: claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5
    
    # Brave Search API
    brave_api_key: str = ""
    brave_search_enabled: bool = True
    
    # Cloudflare Workers AI
    cloudflare_account_id: str = ""
    cloudflare_api_token: str = ""
    cloudflare_image_model: str = "@cf/leonardo/lucid-origin"  # Options: @cf/leonardo/lucid-origin, @cf/black-forest-labs/flux-1-schnell, @cf/stabilityai/stable-diffusion-xl-base-1.0
    
    # JWT
    jwt_secret_key: str = "your-super-secret-jwt-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # CORS
    frontend_url: str = "http://localhost:3000"
    
    # File uploads
    upload_dir: str = "uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    
    # LinkedIn OAuth
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""
    linkedin_redirect_uri: str = "http://localhost:8000/api/auth/linkedin/callback"
    linkedin_scopes: str = "openid profile email w_member_social"  # Can be customized if needed
    
    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"
    
    # SMTP Email Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""  # For Gmail, use App Password
    smtp_from_email: str = ""
    smtp_from_name: str = "PostInAi"
    smtp_use_tls: bool = True
    admin_email: str = ""  # Email address to send critical alerts
    
    # Token expiration
    email_verification_expire_hours: int = 24
    password_reset_expire_hours: int = 1
    
    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    
    # Company/Product Info (for Stripe branding)
    company_name: str = "PostInAi"
    company_website: str = "http://localhost:3000"
    support_email: str = "support@postinai.com"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()

