from fastapi import APIRouter, Depends, HTTPException, Header, Query, BackgroundTasks, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import uuid
import secrets
import httpx

from ..database import get_db
from ..models import User, UserProfile, Subscription, UserToken, TokenType, AdminSetting
from ..schemas.auth import (
    MockLoginRequest, LoginResponse, UserResponse,
    RegisterRequest, RegisterResponse, LoginRequest,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest,
    VerifyEmailCodeRequest, ResendVerificationRequest, MessageResponse, 
    ChangePasswordRequest, SetPasswordRequest
)
from ..config import get_settings
from ..services.linkedin_service import LinkedInService
from ..services.email_service import EmailService

router = APIRouter()
settings = get_settings()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth_states = {}
google_oauth_states = {}

def create_popup_response(success: bool, message_type: str, error_message: str = None):
    """Create HTML response that sends message to popup opener and closes popup"""
    if success:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Successful</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }}
                .container {{
                    text-align: center;
                    color: white;
                }}
                .checkmark {{
                    font-size: 64px;
                    margin-bottom: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="checkmark">✓</div>
                <h1>Connected Successfully!</h1>
                <p>You can close this window now.</p>
            </div>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: '{message_type}',
                        success: true
                    }}, window.location.origin);
                    setTimeout(() => window.close(), 1500);
                }} else {{
                    document.body.innerHTML = '<div class="container"><h1>Success!</h1><p>Please close this window and return to the application.</p></div>';
                }}
            </script>
        </body>
        </html>
        """
    else:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Failed</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }}
                .container {{
                    text-align: center;
                    color: white;
                }}
                .error-icon {{
                    font-size: 64px;
                    margin-bottom: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="error-icon">✕</div>
                <h1>Connection Failed</h1>
                <p>{error_message or 'An error occurred during authentication.'}</p>
                <p>You can close this window now.</p>
            </div>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: '{message_type}',
                        success: false,
                        message: '{error_message or "Authentication failed"}'
                    }}, window.location.origin);
                    setTimeout(() => window.close(), 3000);
                }} else {{
                    document.body.innerHTML = '<div class="container"><h1>Error</h1><p>Please close this window and return to the application.</p></div>';
                }}
            </script>
        </body>
        </html>
        """
    return HTMLResponse(content=html_content)

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
    
    # Get LinkedIn profile picture if available
    linkedin_profile_picture = None
    if user.linkedin_profile_data and isinstance(user.linkedin_profile_data, dict):
        linkedin_profile_picture = user.linkedin_profile_data.get("picture")
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        name=user.name,
        linkedin_profile_picture=linkedin_profile_picture,
        linkedin_connected=user.linkedin_connected or False,
        onboarding_completed=profile.onboarding_completed if profile else False,
        email_verified=user.email_verified if hasattr(user, 'email_verified') else True
    )


# ============== EMAIL/PASSWORD AUTHENTICATION ==============

@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Register a new user with email and password"""
    # Check maintenance mode first
    maintenance_setting = db.query(AdminSetting).filter(AdminSetting.key == "maintenance_mode").first()
    if maintenance_setting and maintenance_setting.value.lower() == "true":
        message_setting = db.query(AdminSetting).filter(AdminSetting.key == "maintenance_message").first()
        message = message_setting.value if message_setting else "System is under maintenance."
        raise HTTPException(status_code=503, detail=message)
    
    # Check if registration is enabled
    registration_setting = db.query(AdminSetting).filter(AdminSetting.key == "registration_enabled").first()
    if registration_setting and registration_setting.value.lower() == "false":
        raise HTTPException(status_code=403, detail="New user registration is currently disabled.")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = pwd_context.hash(request.password)
    
    # Check if email verification is required from database settings
    require_verification_setting = db.query(AdminSetting).filter(AdminSetting.key == "require_email_verification").first()
    require_verification = require_verification_setting and require_verification_setting.value.lower() == "true"
    
    # In dev mode or if verification not required, auto-verify email
    auto_verify = settings.dev_mode or not require_verification
    
    # Create user
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=request.email,
        password_hash=password_hash,
        name=request.name or request.email.split("@")[0].title(),
        email_verified=auto_verify,
        account_type="person",
        registration_provider="email"
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
    
    # Always send verification email for email/password registration
    if not auto_verify:
        token = EmailService.generate_token()
        verification_code = EmailService.generate_verification_code()
        verification_token = UserToken(
            user_id=user_id,
            token=token,
            verification_code=verification_code,
            token_type=TokenType.EMAIL_VERIFICATION,
            expires_at=datetime.utcnow() + timedelta(minutes=15)
        )
        db.add(verification_token)
        db.commit()
        
        background_tasks.add_task(
            EmailService.send_verification_email,
            request.email,
            user.name,
            token,
            verification_code
        )
        message = "Registration successful. Please check your email to verify your account."
    else:
        message = "Registration successful. You can now log in."
    
    return RegisterResponse(
        success=True,
        message=message,
        user_id=user_id,
        email=request.email
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    # Check maintenance mode first
    maintenance_setting = db.query(AdminSetting).filter(AdminSetting.key == "maintenance_mode").first()
    if maintenance_setting and maintenance_setting.value.lower() == "true":
        message_setting = db.query(AdminSetting).filter(AdminSetting.key == "maintenance_message").first()
        message = message_setting.value if message_setting else "System is under maintenance."
        raise HTTPException(status_code=503, detail=message)
    
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.password_hash:
        raise HTTPException(
            status_code=401, 
            detail="This account uses social login. Please sign in with LinkedIn or Google."
        )
    
    if not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check email verification - required for email/password accounts
    if not user.email_verified:
        raise HTTPException(
            status_code=403, 
            detail="Please verify your email before logging in. Check your inbox for the verification code or link."
        )
    
    # Get profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    
    # Get LinkedIn profile picture if available
    linkedin_profile_picture = None
    if user.linkedin_profile_data and isinstance(user.linkedin_profile_data, dict):
        linkedin_profile_picture = user.linkedin_profile_data.get("picture")
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        name=user.name,
        linkedin_profile_picture=linkedin_profile_picture,
        linkedin_connected=user.linkedin_connected or False,
        onboarding_completed=profile.onboarding_completed if profile else False,
        email_verified=user.email_verified
    )


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    request: VerifyEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Verify email with token (link verification)"""
    token_record = db.query(UserToken).filter(
        UserToken.token == request.token,
        UserToken.token_type == TokenType.EMAIL_VERIFICATION,
        UserToken.used == False
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    if datetime.utcnow() > token_record.expires_at:
        raise HTTPException(status_code=400, detail="Verification token has expired. Please request a new one.")
    
    # Mark token as used
    token_record.used = True
    
    # Verify user email
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if user:
        user.email_verified = True
        db.commit()
        
        # Send welcome email in background
        background_tasks.add_task(
            EmailService.send_welcome_email,
            user.email,
            user.name
        )
        
        return MessageResponse(success=True, message="Email verified successfully. You can now log in.")
    
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/verify-email-code", response_model=MessageResponse)
async def verify_email_code(
    request: VerifyEmailCodeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Verify email with 6-digit code"""
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or verification code")
    
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    # Find valid token with matching code
    token_record = db.query(UserToken).filter(
        UserToken.user_id == user.id,
        UserToken.verification_code == request.code,
        UserToken.token_type == TokenType.EMAIL_VERIFICATION,
        UserToken.used == False
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    if datetime.utcnow() > token_record.expires_at:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
    
    # Mark token as used
    token_record.used = True
    
    # Verify user email
    user.email_verified = True
    db.commit()
    
    # Send welcome email in background
    background_tasks.add_task(
        EmailService.send_welcome_email,
        user.email,
        user.name
    )
    
    return MessageResponse(success=True, message="Email verified successfully. You can now log in.")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    request: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Resend verification email"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Don't reveal if email exists
        return MessageResponse(success=True, message="If an account exists with this email, a verification link has been sent.")
    
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")
    
    # Invalidate old tokens
    db.query(UserToken).filter(
        UserToken.user_id == user.id,
        UserToken.token_type == TokenType.EMAIL_VERIFICATION,
        UserToken.used == False
    ).update({"used": True})
    
    # Create new verification token with code
    token = EmailService.generate_token()
    verification_code = EmailService.generate_verification_code()
    verification_token = UserToken(
        user_id=user.id,
        token=token,
        verification_code=verification_code,
        token_type=TokenType.EMAIL_VERIFICATION,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(verification_token)
    db.commit()
    
    # Send verification email
    background_tasks.add_task(
        EmailService.send_verification_email,
        user.email,
        user.name,
        token,
        verification_code
    )
    
    return MessageResponse(success=True, message="If an account exists with this email, a verification link has been sent.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success to prevent email enumeration
    if not user or not user.password_hash:
        return MessageResponse(success=True, message="If an account exists with this email, a password reset link has been sent.")
    
    # Invalidate old tokens
    db.query(UserToken).filter(
        UserToken.user_id == user.id,
        UserToken.token_type == TokenType.PASSWORD_RESET,
        UserToken.used == False
    ).update({"used": True})
    
    # Create reset token
    token = EmailService.generate_token()
    reset_token = UserToken(
        user_id=user.id,
        token=token,
        token_type=TokenType.PASSWORD_RESET,
        expires_at=datetime.utcnow() + timedelta(hours=settings.password_reset_expire_hours)
    )
    db.add(reset_token)
    db.commit()
    
    # Send reset email
    background_tasks.add_task(
        EmailService.send_password_reset_email,
        user.email,
        user.name,
        token
    )
    
    return MessageResponse(success=True, message="If an account exists with this email, a password reset link has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password with token"""
    token_record = db.query(UserToken).filter(
        UserToken.token == request.token,
        UserToken.token_type == TokenType.PASSWORD_RESET,
        UserToken.used == False
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    if datetime.utcnow() > token_record.expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Mark token as used
    token_record.used = True
    
    # Update password
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if user:
        user.password_hash = pwd_context.hash(request.password)
        db.commit()
        return MessageResponse(success=True, message="Password reset successfully. You can now log in with your new password.")
    
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/set-password", response_model=MessageResponse)
async def set_password(
    request: SetPasswordRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Set password for OAuth users who don't have a password yet"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="Password already set. Use change-password endpoint to update it."
        )
    
    user.password_hash = pwd_context.hash(request.new_password)
    db.commit()
    
    return MessageResponse(success=True, message="Password set successfully")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    request: ChangePasswordRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Change password for authenticated user"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="No password set. Use set-password endpoint first."
        )
    
    if not pwd_context.verify(request.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    user.password_hash = pwd_context.hash(request.new_password)
    db.commit()
    
    return MessageResponse(success=True, message="Password changed successfully")


# ============== GOOGLE OAUTH ==============

@router.get("/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth flow for LOGIN"""
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured")
    
    # Get the base URL from the request (supports both localhost and Cloudflare tunnel)
    scheme = request.url.scheme
    host = request.headers.get("host", request.url.hostname)
    base_url = f"{scheme}://{host}"
    redirect_uri = f"{base_url}/api/auth/google/callback"
    
    # Get frontend URL from referer (where the request came from)
    referer = request.headers.get("referer", "")
    frontend_url = None
    if referer and "trycloudflare.com" in referer:
        from urllib.parse import urlparse
        parsed_referer = urlparse(referer)
        frontend_url = f"{parsed_referer.scheme}://{parsed_referer.netloc}"
    
    state = secrets.token_urlsafe(32)
    google_oauth_states[state] = {
        "user_id": None,
        "redirect_context": "login",
        "redirect_uri": redirect_uri,  # Store the redirect URI used
        "frontend_tunnel_url": frontend_url,  # Store frontend tunnel URL for callback redirect
        "created_at": datetime.utcnow()
    }
    
    # Google OAuth URL
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent"
    }
    
    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    
    return {
        "authorization_url": auth_url,
        "state": state
    }


@router.get("/google/connect")
async def google_connect(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """Initiate Google OAuth flow for connecting account (requires auth)"""
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured")
    
    # Get the base URL from the request (supports both localhost and Cloudflare tunnel)
    scheme = request.url.scheme
    host = request.headers.get("host", request.url.hostname)
    base_url = f"{scheme}://{host}"
    redirect_uri = f"{base_url}/api/auth/google/callback"
    
    state = secrets.token_urlsafe(32)
    google_oauth_states[state] = {
        "user_id": user_id,
        "redirect_context": "settings",
        "redirect_uri": redirect_uri,  # Store the redirect URI used
        "created_at": datetime.utcnow()
    }
    
    # Google OAuth URL
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent"
    }
    
    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    
    return {
        "authorization_url": auth_url,
        "state": state
    }


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback"""
    if state not in google_oauth_states:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    state_data = google_oauth_states.pop(state)
    user_id = state_data.get("user_id")
    redirect_context = state_data.get("redirect_context", "login")
    redirect_uri = state_data.get("redirect_uri", settings.google_redirect_uri)
    
    if datetime.utcnow() - state_data["created_at"] > timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="State expired")
    
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri
                }
            )
            token_data = token_response.json()
            
            if "error" in token_data:
                raise HTTPException(status_code=400, detail=token_data.get("error_description", "Failed to get access token"))
            
            access_token = token_data["access_token"]
            
            # Get user info
            userinfo_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            userinfo = userinfo_response.json()
        
        google_id = userinfo.get("id")
        google_email = userinfo.get("email")
        google_name = userinfo.get("name")
        google_picture = userinfo.get("picture")
        
        # Handle LOGIN context (create or find user by email)
        if redirect_context == "login":
            # ALWAYS check by email first (unified authentication)
            user = None
            if google_email:
                user = db.query(User).filter(User.email == google_email).first()
            
            if not user:
                # No account with this email exists - create new user
                user_id = str(uuid.uuid4())
                user = User(
                    id=user_id,
                    email=google_email,
                    name=google_name,
                    account_type="person",
                    email_verified=True,  # Google emails are verified
                    registration_provider="google"
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
            
            # If account exists with this email, authenticate into it
            user_id = user.id
        else:
            # Regular connect flow - user must exist
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Check if Google email matches a different account
            if google_email and google_email != user.email:
                existing_user = db.query(User).filter(User.email == google_email).first()
                if existing_user and existing_user.id != user_id:
                    raise HTTPException(
                        status_code=400,
                        detail=f"This Google account is already associated with another account ({google_email})"
                    )
        
        # Check if this Google ID is already connected to a different user
        existing_user = db.query(User).filter(User.google_id == google_id).first()
        if existing_user and existing_user.id != user_id:
            # Disconnect from old user (keep their email intact)
            existing_user.google_id = None
        
        # Link Google to this user
        user.google_id = google_id
        
        # Update name only if not set
        if not user.name and google_name:
            user.name = google_name
        
        # Ensure email is never null
        if not user.email and google_email:
            user.email = google_email
        
        db.commit()
        db.refresh(user)
        
        # Get profile for onboarding status
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        
        # Determine response based on context
        if redirect_context == "login":
            # For login context, use redirect (full page flow)
            import json
            import urllib.parse
            
            access_token_jwt = create_access_token(data={"sub": user.id, "email": user.email})
            
            user_data = {
                "access_token": access_token_jwt,
                "user_id": user.id,
                "email": user.email,
                "name": user.name,
                "google_profile_picture": google_picture,
                "linkedin_connected": user.linkedin_connected or False,
                "onboarding_completed": profile.onboarding_completed if profile else False,
                "email_verified": True
            }
            user_data_encoded = urllib.parse.quote(json.dumps(user_data))
            
            # Determine frontend URL dynamically based on request origin
            # If callback came from Cloudflare tunnel, redirect to frontend tunnel
            scheme = request.url.scheme
            host = request.headers.get("host", request.url.hostname)
            referer = request.headers.get("referer", "")
            
            if "trycloudflare.com" in host:
                # We're on a Cloudflare tunnel - try to get frontend URL from referer or state
                frontend_tunnel_url = state_data.get("frontend_tunnel_url")
                if frontend_tunnel_url:
                    frontend_url = frontend_tunnel_url
                elif referer and "trycloudflare.com" in referer:
                    # Extract frontend URL from referer (where user came from)
                    from urllib.parse import urlparse
                    parsed_referer = urlparse(referer)
                    frontend_url = f"{parsed_referer.scheme}://{parsed_referer.netloc}"
                else:
                    # Fallback: use configured frontend URL
                    frontend_url = settings.frontend_url
            else:
                # Use configured frontend URL (localhost)
                frontend_url = settings.frontend_url
            
            redirect_url = f"{frontend_url}/login/callback?data={user_data_encoded}"
            
            return RedirectResponse(url=redirect_url, status_code=302)
        else:
            # For settings context (account linking), use popup response
            return create_popup_response(True, "google-oauth-success")
        
    except Exception as e:
        # For settings context, return popup error response
        if redirect_context == "settings":
            return create_popup_response(False, "google-oauth-error", str(e))
        raise HTTPException(status_code=500, detail=f"Google login failed: {str(e)}")


@router.get("/google/status")
async def google_status(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Check Google account connection status"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "connected": user.google_id is not None,
        "profile_data": {
            "email": user.email,
            "name": user.name
        } if user.google_id else None
    }


@router.post("/google/disconnect")
async def google_disconnect(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Disconnect Google account"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if Google was the registration provider
    if user.registration_provider == "google":
        raise HTTPException(
            status_code=400, 
            detail="Cannot disconnect Google account. You created your account with Google and cannot unlink it. You can connect other login methods, but this one must remain."
        )
    
    # Check if user has another way to login (password or LinkedIn)
    if not user.password_hash and not user.linkedin_connected:
        raise HTTPException(
            status_code=400, 
            detail="Cannot disconnect Google account. Please set a password or connect LinkedIn first to maintain access to your account."
        )
    
    user.google_id = None
    
    db.commit()
    
    return {
        "success": True,
        "message": "Google account disconnected successfully"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get current user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    # Get LinkedIn profile picture if available
    linkedin_profile_picture = None
    if user.linkedin_profile_data and isinstance(user.linkedin_profile_data, dict):
        linkedin_profile_picture = user.linkedin_profile_data.get("picture")
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        linkedin_id=user.linkedin_id,
        linkedin_profile_picture=linkedin_profile_picture,
        linkedin_connected=user.linkedin_connected or False,
        google_connected=user.google_id is not None,
        has_password=user.password_hash is not None,
        account_type=user.account_type.value,
        onboarding_completed=profile.onboarding_completed if profile else False,
        email_verified=user.email_verified if hasattr(user, 'email_verified') else True,
        registration_provider=user.registration_provider
    )

@router.get("/linkedin/login")
async def linkedin_login():
    """Initiate LinkedIn OAuth flow for LOGIN (no auth required)"""
    state = secrets.token_urlsafe(32)
    oauth_states[state] = {
        "user_id": None,  # Will be created/found during callback
        "redirect_context": "login",
        "created_at": datetime.utcnow()
    }
    
    auth_url = LinkedInService.get_authorization_url(state)
    
    return {
        "authorization_url": auth_url,
        "state": state
    }

@router.get("/linkedin/connect")
async def linkedin_connect(
    user_id: str = Depends(get_current_user_id),
    redirect_context: str = Query(default="settings")
):
    """Initiate LinkedIn OAuth flow for connecting account (requires auth)"""
    state = secrets.token_urlsafe(32)
    oauth_states[state] = {
        "user_id": user_id,
        "redirect_context": redirect_context,
        "created_at": datetime.utcnow()
    }
    
    auth_url = LinkedInService.get_authorization_url(state)
    
    return {
        "authorization_url": auth_url,
        "state": state
    }

@router.get("/linkedin/callback")
async def linkedin_callback(
    request: Request,
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    error_description: str = Query(None),
    db: Session = Depends(get_db)
):
    """Handle LinkedIn OAuth callback"""
    # Try to get redirect_context from state if available (for popup responses)
    redirect_context = "login"  # Default to login for error responses
    if state and state in oauth_states:
        redirect_context = oauth_states[state].get("redirect_context", "login")
    
    # Check for LinkedIn error responses first
    if error:
        error_msg = error_description or error
        if redirect_context == "settings":
            return create_popup_response(False, "linkedin-oauth-error", f"LinkedIn OAuth error: {error_msg}")
        raise HTTPException(status_code=400, detail=f"LinkedIn OAuth error: {error_msg}")
    
    # Check if code is missing
    if not code:
        # Get all query parameters for debugging
        all_params = dict(request.query_params)
        error_msg = f"Missing authorization code. Query parameters received: {all_params}. Please verify that the redirect URI in your LinkedIn app matches exactly: {settings.linkedin_redirect_uri}"
        if redirect_context == "settings":
            return create_popup_response(False, "linkedin-oauth-error", error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Check if state is missing
    if not state:
        error_msg = f"Missing state parameter. This may indicate a redirect URI mismatch. Expected redirect URI: {settings.linkedin_redirect_uri}"
        if redirect_context == "settings":
            return create_popup_response(False, "linkedin-oauth-error", error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    if state not in oauth_states:
        error_msg = "Invalid state parameter. The OAuth session may have expired. Please try again."
        if redirect_context == "settings":
            return create_popup_response(False, "linkedin-oauth-error", error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    state_data = oauth_states.pop(state)
    user_id = state_data.get("user_id")
    redirect_context = state_data.get("redirect_context", "settings")
    
    if datetime.utcnow() - state_data["created_at"] > timedelta(minutes=5):
        error_msg = "State expired. Please try again."
        if redirect_context == "settings":
            return create_popup_response(False, "linkedin-oauth-error", error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    try:
        token_data = await LinkedInService.exchange_code_for_token(code)
        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 5184000)
        
        linkedin_profile = await LinkedInService.get_user_profile(access_token)
        linkedin_id = linkedin_profile.get("sub")
        linkedin_email = linkedin_profile.get("email")
        linkedin_name = linkedin_profile.get("name")
        
        # Handle LOGIN context (create or find user by email)
        if redirect_context == "login":
            # ALWAYS check by email first (unified authentication)
            user = None
            if linkedin_email:
                user = db.query(User).filter(User.email == linkedin_email).first()
            
            if not user:
                # No account with this email exists - create new user
                new_user_id = str(uuid.uuid4())
                user = User(
                    id=new_user_id,
                    email=linkedin_email or f"{linkedin_id}@linkedin.user",
                    name=linkedin_name,
                    account_type="person",
                    email_verified=True,  # LinkedIn emails are verified
                    registration_provider="linkedin"
                )
                db.add(user)
                
                # Create profile
                profile = UserProfile(
                    user_id=new_user_id,
                    onboarding_step=1,
                    onboarding_completed=False
                )
                db.add(profile)
                
                # Create subscription
                subscription = Subscription(
                    user_id=new_user_id,
                    plan="free",
                    posts_limit=5
                )
                db.add(subscription)
            
            # If account exists with this email, authenticate into it
            user_id = user.id
        else:
            # Regular connect flow - user must exist
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Check if LinkedIn email matches a different account
            if linkedin_email and linkedin_email != user.email:
                existing_user = db.query(User).filter(User.email == linkedin_email).first()
                if existing_user and existing_user.id != user_id:
                    raise HTTPException(
                        status_code=400,
                        detail=f"This LinkedIn account is already associated with another account ({linkedin_email})"
                    )
        
        # Check if this LinkedIn ID is already connected to a different user
        existing_user = db.query(User).filter(User.linkedin_id == linkedin_id).first()
        if existing_user and existing_user.id != user_id:
            # Disconnect from old user (keep their email intact)
            existing_user.linkedin_id = None
            existing_user.linkedin_access_token = None
            existing_user.linkedin_refresh_token = None
            existing_user.linkedin_token_expires_at = None
            existing_user.linkedin_profile_data = None
            existing_user.linkedin_connected = False
            existing_user.linkedin_last_sync = None
        
        # Link LinkedIn to this user
        user.linkedin_id = linkedin_id
        user.linkedin_access_token = access_token
        user.linkedin_refresh_token = refresh_token
        user.linkedin_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        user.linkedin_profile_data = linkedin_profile
        user.linkedin_connected = True
        user.linkedin_last_sync = datetime.utcnow()
        
        # Update name only if not set
        if not user.name and linkedin_name:
            user.name = linkedin_name
        
        # Ensure email is never null
        if not user.email and linkedin_email:
            user.email = linkedin_email
        
        db.commit()
        
        # Sync posts for login and onboarding contexts
        posts_data = []
        if redirect_context in ["login", "onboarding"]:
            try:
                posts = await LinkedInService.get_user_posts(access_token, user.linkedin_id, limit=10)
                posts_data = posts
                
                # Store posts in user profile for later use
                if posts_data:
                    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
                    if profile:
                        profile.writing_samples = [p.get("text", "") for p in posts_data if p.get("text")]
                        db.commit()
            except Exception as e:
                print(f"Failed to sync posts during callback: {str(e)}")
        
        # Get profile for onboarding status
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        
        # Determine response based on context
        import json
        import urllib.parse
        
        if redirect_context == "login":
            # For login context, still use redirect (full page flow)
            access_token_jwt = create_access_token(data={"sub": user.id, "email": user.email})
            
            # Build user data for frontend
            user_data = {
                "access_token": access_token_jwt,
                "user_id": user.id,
                "email": user.email,
                "name": user.name,
                "linkedin_profile_picture": linkedin_profile.get("picture"),
                "linkedin_connected": True,
                "onboarding_completed": profile.onboarding_completed if profile else False
            }
            user_data_encoded = urllib.parse.quote(json.dumps(user_data))
            redirect_url = f"{settings.frontend_url}/login/callback?data={user_data_encoded}"
            return RedirectResponse(url=redirect_url, status_code=302)
        elif redirect_context == "onboarding":
            # For onboarding, still use redirect
            posts_json = json.dumps(posts_data)
            posts_encoded = urllib.parse.quote(posts_json)
            redirect_url = f"{settings.frontend_url}/onboarding?linkedin_connected=true&posts={posts_encoded}"
            return RedirectResponse(url=redirect_url, status_code=302)
        else:
            # For settings context (account linking), use popup response
            return create_popup_response(True, "linkedin-oauth-success")
        
    except Exception as e:
        # For settings context, return popup error response
        if redirect_context == "settings":
            return create_popup_response(False, "linkedin-oauth-error", str(e))
        raise HTTPException(status_code=500, detail=f"LinkedIn connection failed: {str(e)}")

@router.post("/linkedin/disconnect")
async def linkedin_disconnect(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Disconnect LinkedIn account"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if LinkedIn was the registration provider
    if user.registration_provider == "linkedin":
        raise HTTPException(
            status_code=400, 
            detail="Cannot disconnect LinkedIn account. You created your account with LinkedIn and cannot unlink it. You can connect other login methods, but this one must remain."
        )
    
    # Check if user has another way to login (password or Google)
    if not user.password_hash and not user.google_id:
        raise HTTPException(
            status_code=400, 
            detail="Cannot disconnect LinkedIn account. Please set a password or connect Google first to maintain access to your account."
        )
    
    user.linkedin_id = None
    user.linkedin_access_token = None
    user.linkedin_refresh_token = None
    user.linkedin_token_expires_at = None
    user.linkedin_profile_data = None
    user.linkedin_connected = False
    user.linkedin_last_sync = None
    
    db.commit()
    
    return {
        "success": True,
        "message": "LinkedIn account disconnected successfully"
    }

@router.get("/linkedin/status")
async def linkedin_status(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Check LinkedIn connection status and return stored posts"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get stored writing samples from profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    stored_posts = []
    if profile and profile.writing_samples:
        stored_posts = profile.writing_samples if isinstance(profile.writing_samples, list) else []
    
    return {
        "connected": user.linkedin_connected or False,
        "profile": {
            "name": user.name,
            "email": user.email
        } if user.linkedin_connected else None,
        "profile_data": user.linkedin_profile_data if user.linkedin_connected else None,
        "last_sync": user.linkedin_last_sync,
        "stored_posts": stored_posts
    }

@router.post("/linkedin/sync-posts")
async def sync_linkedin_posts(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Sync user's LinkedIn posts for writing style analysis"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.linkedin_connected or not user.linkedin_access_token:
        raise HTTPException(status_code=400, detail="LinkedIn account not connected")
    
    try:
        if user.linkedin_token_expires_at and datetime.utcnow() >= user.linkedin_token_expires_at:
            if user.linkedin_refresh_token:
                token_data = await LinkedInService.refresh_access_token(user.linkedin_refresh_token)
                user.linkedin_access_token = token_data["access_token"]
                user.linkedin_token_expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 5184000))
                db.commit()
            else:
                raise HTTPException(status_code=401, detail="Token expired. Please reconnect LinkedIn account")
        
        author_id = user.linkedin_id
        posts = await LinkedInService.get_user_posts(user.linkedin_access_token, author_id, limit=50)
        
        post_texts = [post["text"] for post in posts if post["text"]]
        
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if profile:
            profile.writing_samples = post_texts
            user.linkedin_last_sync = datetime.utcnow()
            db.commit()
        
        return {
            "success": True,
            "posts_count": len(post_texts),
            "posts": posts[:10],
            "message": f"Synced {len(post_texts)} posts successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Post sync failed: {str(e)}")


