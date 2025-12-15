from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .config import get_settings
from .database import engine, Base
from .routers import auth, onboarding, generation, comments, admin, user, conversations, images, pdfs

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="LinkedIn Content SaaS API",
    description="AI-powered LinkedIn content generation platform",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(images.router, prefix="/api/images", tags=["images"])
app.include_router(pdfs.router, prefix="/api/pdfs", tags=["pdfs"])

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

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
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

