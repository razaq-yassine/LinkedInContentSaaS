from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict
import time

from ..database import get_db
from ..models import Admin
from ..schemas.admin_schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminResponse,
    CreateAdminRequest,
    UpdateAdminRequest,
    ChangePasswordRequest,
    AdminRequestCodeRequest,
    AdminCodeLoginRequest
)
from ..config import get_settings
from ..services.email_service import EmailService

router = APIRouter()
settings = get_settings()
security = HTTPBearer()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = settings.jwt_secret_key
ALGORITHM = settings.jwt_algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 480

# Rate limiting storage (in-memory, resets on server restart)
code_request_times: dict[str, list[float]] = defaultdict(list)
failed_code_attempts: dict[str, list[datetime]] = defaultdict(list)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_admin_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "admin"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if admin_id is None or token_type != "admin":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if admin is None or not admin.is_active:
        raise credentials_exception
    
    return admin


async def get_current_super_admin(
    admin: Admin = Depends(get_current_admin)
) -> Admin:
    if admin.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return admin


@router.post("/request-code")
async def request_login_code(
    request: AdminRequestCodeRequest,
    db: Session = Depends(get_db)
):
    """Request a login code for passwordless admin authentication"""
    # Rate limiting: Max 3 requests per email per 15 minutes
    rate_key = f"code_request:{request.email}"
    now = time.time()
    window_seconds = 15 * 60  # 15 minutes
    
    # Clean old requests
    code_request_times[rate_key] = [
        req_time for req_time in code_request_times[rate_key]
        if now - req_time < window_seconds
    ]
    
    if len(code_request_times[rate_key]) >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many code requests. Please wait 15 minutes before requesting another code."
        )
    
    # Check if admin exists and is active
    admin = db.query(Admin).filter(Admin.email == request.email).first()
    
    if not admin:
        # Don't reveal if admin exists or not for security
        code_request_times[rate_key].append(now)
        return {"success": True, "message": "If an admin account exists with this email, a code has been sent."}
    
    if not admin.is_active:
        # Don't reveal account status for security - return same message as non-existent account
        code_request_times[rate_key].append(now)
        return {"success": True, "message": "If an admin account exists with this email, a code has been sent."}
    
    # Generate code
    code = EmailService.generate_verification_code()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Store code in database
    admin.email_code = code
    admin.email_code_expires_at = expires_at
    db.commit()
    
    # Send email and log result
    email_sent = EmailService.send_admin_login_code(admin.email, admin.name, code)
    if not email_sent:
        # Log warning but don't reveal to user (security)
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to send admin login code email to {admin.email}. Code: {code}")
        print(f"[WARNING] Failed to send admin login code email to {admin.email}. Check SMTP configuration.")
    
    # Record request time
    code_request_times[rate_key].append(now)
    
    return {"success": True, "message": "If an admin account exists with this email, a code has been sent."}


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    request: AdminCodeLoginRequest,
    db: Session = Depends(get_db)
):
    """Login with email and code (passwordless authentication)"""
    admin = db.query(Admin).filter(Admin.email == request.email).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or code"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive"
        )
    
    # Check failed attempts rate limiting
    failed_key = f"failed_code:{request.email}"
    now = datetime.utcnow()
    lockout_duration = timedelta(minutes=15)
    
    # Clean old attempts
    failed_code_attempts[failed_key] = [
        attempt_time for attempt_time in failed_code_attempts[failed_key]
        if now - attempt_time < lockout_duration
    ]
    
    # Check if locked out
    if len(failed_code_attempts[failed_key]) >= 5:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Too many failed attempts. Please wait 15 minutes before trying again."
        )
    
    # Verify code
    if not admin.email_code or admin.email_code != request.code:
        failed_code_attempts[failed_key].append(now)
        remaining = 5 - len(failed_code_attempts[failed_key])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect code. {remaining} attempts remaining."
        )
    
    # Check expiration
    if not admin.email_code_expires_at or admin.email_code_expires_at < datetime.utcnow():
        failed_code_attempts[failed_key].append(now)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Code has expired. Please request a new code."
        )
    
    # Clear code and failed attempts on successful login
    admin.email_code = None
    admin.email_code_expires_at = None
    admin.last_login = datetime.utcnow()
    
    if failed_key in failed_code_attempts:
        del failed_code_attempts[failed_key]
    
    db.commit()
    
    access_token = create_admin_access_token(data={"sub": admin.id})
    
    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        admin=AdminResponse(
            id=admin.id,
            email=admin.email,
            name=admin.name,
            role=admin.role.value if hasattr(admin.role, 'value') else admin.role,
            is_active=admin.is_active,
            last_login=admin.last_login,
            created_at=admin.created_at
        )
    )


@router.get("/me", response_model=AdminResponse)
async def get_current_admin_info(
    admin: Admin = Depends(get_current_admin)
):
    return AdminResponse(
        id=admin.id,
        email=admin.email,
        name=admin.name,
        role=admin.role.value if hasattr(admin.role, 'value') else admin.role,
        is_active=admin.is_active,
        last_login=admin.last_login,
        created_at=admin.created_at
    )


@router.post("/admins", response_model=AdminResponse)
async def create_admin(
    request: CreateAdminRequest,
    current_admin: Admin = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    existing_admin = db.query(Admin).filter(Admin.email == request.email).first()
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin with this email already exists"
        )
    
    if request.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin' or 'super_admin'"
        )
    
    # For passwordless login, password_hash is optional
    password_hash = get_password_hash(request.password) if request.password else None
    
    new_admin = Admin(
        email=request.email,
        password_hash=password_hash,
        name=request.name,
        role=request.role
    )
    
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    return AdminResponse(
        id=new_admin.id,
        email=new_admin.email,
        name=new_admin.name,
        role=new_admin.role.value if hasattr(new_admin.role, 'value') else new_admin.role,
        is_active=new_admin.is_active,
        last_login=new_admin.last_login,
        created_at=new_admin.created_at
    )


@router.get("/admins", response_model=list[AdminResponse])
async def list_admins(
    current_admin: Admin = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    admins = db.query(Admin).all()
    return [
        AdminResponse(
            id=admin.id,
            email=admin.email,
            name=admin.name,
            role=admin.role.value if hasattr(admin.role, 'value') else admin.role,
            is_active=admin.is_active,
            last_login=admin.last_login,
            created_at=admin.created_at
        )
        for admin in admins
    ]


@router.put("/admins/{admin_id}", response_model=AdminResponse)
async def update_admin(
    admin_id: str,
    request: UpdateAdminRequest,
    current_admin: Admin = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found"
        )
    
    if request.name is not None:
        admin.name = request.name
    if request.role is not None:
        if request.role not in ["admin", "super_admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        admin.role = request.role
    if request.is_active is not None:
        admin.is_active = request.is_active
    
    db.commit()
    db.refresh(admin)
    
    return AdminResponse(
        id=admin.id,
        email=admin.email,
        name=admin.name,
        role=admin.role.value if hasattr(admin.role, 'value') else admin.role,
        is_active=admin.is_active,
        last_login=admin.last_login,
        created_at=admin.created_at
    )


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Change password (deprecated for passwordless login, kept for backward compatibility)"""
    if not admin.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password authentication is not enabled for this account"
        )
    
    if not verify_password(request.current_password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    admin.password_hash = get_password_hash(request.new_password)
    db.commit()
    
    return {"success": True, "message": "Password changed successfully"}


@router.delete("/admins/{admin_id}")
async def delete_admin(
    admin_id: str,
    current_admin: Admin = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    if admin_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own admin account"
        )
    
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found"
        )
    
    db.delete(admin)
    db.commit()
    
    return {"success": True, "message": "Admin deleted successfully"}
