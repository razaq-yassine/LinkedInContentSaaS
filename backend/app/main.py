from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sqlalchemy as sa
from .config import get_settings
from .database import engine, Base
from .routers import auth, onboarding, generation, comments, admin, admin_auth, user, conversations, images, pdfs, subscription

settings = get_settings()

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

if __name__ == "__main__":
    import uvicorn
    import os
    # Use random port from environment or default to 8753
    port = int(os.getenv("PORT", "8753"))
    print(f"🚀 Starting backend server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)

