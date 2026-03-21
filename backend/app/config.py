from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
import secrets
import warnings

# Insecure default JWT key - used only to detect if user hasn't set a real key
_INSECURE_DEFAULT_JWT_KEY = "your-super-secret-jwt-key-change-in-production"

def generate_secure_jwt_secret() -> str:
    """Generate a cryptographically secure JWT secret (256 bits / 32 bytes)"""
    return secrets.token_urlsafe(32)

class Settings(BaseSettings):
    # Development mode - skips email verification
    dev_mode: bool = True
    
    # Database (SQLite for development)
    database_url: str = "sqlite:///./linkedin_content_saas.db"
    
    # AI Provider Selection
    ai_provider: str = "openrouter"  # Options: "openai", "gemini", "claude", or "openrouter"
    
    # OpenRouter (unified API for multiple providers)
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-3.5-haiku"  # Content generation model
    openrouter_onboarding_model: str = "google/gemini-2.5-flash"  # Onboarding/CV analysis model
    
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
    
    # JWT - SECURITY: jwt_secret_key must be set in production
    jwt_secret_key: str = _INSECURE_DEFAULT_JWT_KEY
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    @field_validator('jwt_secret_key')
    @classmethod
    def validate_jwt_secret(cls, v, info):
        """Validate JWT secret key is secure in production"""
        # Check if using insecure default
        if v == _INSECURE_DEFAULT_JWT_KEY:
            # In dev mode, generate a random key and warn
            # Note: This means dev tokens won't persist across restarts
            warnings.warn(
                "\n" + "="*60 + "\n"
                "SECURITY WARNING: Using auto-generated JWT secret.\n"
                "Tokens will NOT persist across server restarts.\n"
                "For production, set JWT_SECRET_KEY in your .env file:\n"
                f"JWT_SECRET_KEY={generate_secure_jwt_secret()}\n"
                + "="*60,
                UserWarning
            )
            return generate_secure_jwt_secret()
        
        # Validate minimum security requirements
        if len(v) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters. "
                f"Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        
        return v
    
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
    
    # VAPID keys for push notifications (generated automatically if not set)
    vapid_public_key: str = ""
    vapid_private_key: str = ""
    vapid_subject: str = ""  # Email or URL for VAPID
    
    # Token Encryption (for OAuth tokens at rest)
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    encryption_key: str = ""  # If empty, derives from JWT_SECRET_KEY (less secure)
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()

