from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
import uuid

from ..database import get_db
from ..models import User, UserProfile, Subscription
from ..schemas.auth import MockLoginRequest, LoginResponse, UserResponse
from ..config import get_settings

router = APIRouter()
settings = get_settings()

def create_access_token(data: dict):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def get_current_user_id(authorization: str = Header(None), db: Session = Depends(get_db)) -> str:
    """Extract user ID from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/mock-login", response_model=LoginResponse)
async def mock_login(request: MockLoginRequest, db: Session = Depends(get_db)):
    """
    Mock login for development - creates user if doesn't exist
    """
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Create new user
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=request.email,
            name=request.email.split("@")[0].title(),
            account_type="person"
        )
        db.add(user)
        
        # Create profile
        profile = UserProfile(
            user_id=user_id,
            onboarding_step=1,
            onboarding_completed=False
        )
        db.add(profile)
        
        # Create subscription
        subscription = Subscription(
            user_id=user_id,
            plan="free",
            posts_limit=5
        )
        db.add(subscription)
        
        db.commit()
        db.refresh(user)
    
    # Get profile to check onboarding status
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        name=user.name,
        onboarding_completed=profile.onboarding_completed if profile else False
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get current user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        linkedin_id=user.linkedin_id,
        account_type=user.account_type.value,
        onboarding_completed=profile.onboarding_completed if profile else False
    )


