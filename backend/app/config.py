from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Development mode - skips email verification
    dev_mode: bool = True
    
    # Database (SQLite for development)
    database_url: str = "sqlite:///./linkedin_content_saas.db"
    
    # AI Provider Selection
    ai_provider: str = "gemini"  # Options: "openai" or "gemini"
    
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"  # Options: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
    
    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"  # Options: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.0-flash-exp, gemini-2.0-flash-lite-exp, gemini-1.5-flash, gemini-1.5-pro
    
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
    smtp_from_name: str = "ContentAI"
    smtp_use_tls: bool = True
    
    # Token expiration
    email_verification_expire_hours: int = 24
    password_reset_expire_hours: int = 1
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()

