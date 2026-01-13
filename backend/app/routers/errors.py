"""
Error Logging API Endpoints

Provides endpoints for frontend error logging and error management.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel

from ..database import get_db
from ..models import ErrorLog, ErrorResolutionStatus
from ..core.error_handler import generate_error_id, sanitize_data, error_logger
from ..core.exceptions import AppException, InternalError
from ..core.error_types import ErrorType, ErrorSeverity, ErrorCategory
from ..routers.auth import get_current_user_id


router = APIRouter()


class FrontendErrorRequest(BaseModel):
    """Frontend error logging request"""
    error_message: str
    error_name: Optional[str] = None
    stack_trace: Optional[str] = None
    component_stack: Optional[str] = None
    url: Optional[str] = None
    user_agent: Optional[str] = None
    component: Optional[str] = None
    action: Optional[str] = None
    extra: Optional[dict] = None
    timestamp: Optional[str] = None
    error_id: Optional[str] = None


class ErrorLogResponse(BaseModel):
    """Error log response"""
    id: str
    error_type: str
    category: str
    severity: str
    user_message: str
    technical_message: Optional[str] = None
    resolution_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ErrorStatsResponse(BaseModel):
    """Error statistics response"""
    total_errors: int
    errors_today: int
    critical_errors: int
    unresolved_errors: int
    errors_by_category: dict
    errors_by_severity: dict


@router.post("/frontend")
async def log_frontend_error(
    request: Request,
    error_data: FrontendErrorRequest,
    db: Session = Depends(get_db)
):
    """
    Log a frontend error.
    
    This endpoint accepts error reports from the frontend and stores them
    for debugging and monitoring purposes.
    """
    try:
        # Get user ID if authenticated (optional)
        user_id = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from ..routers.auth import get_current_user_id
                user_id = get_current_user_id(auth_header, db)
            except:
                pass  # Continue without user ID
        
        # Generate error ID if not provided
        error_id = error_data.error_id or generate_error_id()
        
        # Sanitize stack traces
        sanitized_stack = sanitize_data(error_data.stack_trace) if error_data.stack_trace else None
        sanitized_component_stack = sanitize_data(error_data.component_stack) if error_data.component_stack else None
        
        # Combine stack traces
        full_stack = sanitized_stack
        if sanitized_component_stack:
            full_stack = f"{sanitized_stack or ''}\n\nComponent Stack:\n{sanitized_component_stack}"
        
        # Create error log entry
        error_log = ErrorLog(
            id=error_id,
            error_type="FRONTEND",
            category="internal",
            severity="error",
            technical_message=sanitize_data(error_data.error_message),
            user_message="A frontend error occurred",
            stack_trace=full_stack,
            request_context={
                "url": error_data.url,
                "user_agent": error_data.user_agent[:500] if error_data.user_agent else None,
                "component": error_data.component,
                "action": error_data.action,
                "source": "frontend"
            },
            user_id=user_id,
            environment="production",  # Could be determined from request
            resolution_status=ErrorResolutionStatus.NEW,
            details=sanitize_data(error_data.extra) if error_data.extra else None,
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(error_log)
        db.commit()
        
        return {
            "success": True,
            "error_id": error_id,
            "message": "Error logged successfully"
        }
    
    except Exception as e:
        # Don't fail the request if logging fails
        print(f"Failed to log frontend error: {str(e)}")
        return {
            "success": False,
            "error_id": None,
            "message": "Error logging failed but your report was received"
        }


@router.post("/log")
async def log_error(
    request: Request,
    error_data: FrontendErrorRequest,
    db: Session = Depends(get_db)
):
    """
    Alias for frontend error logging (for ErrorBoundary component).
    """
    return await log_frontend_error(request, error_data, db)


@router.get("/", response_model=List[ErrorLogResponse])
async def list_errors(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    limit: int = 50,
    offset: int = 0,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None
):
    """
    List error logs (admin only).
    
    This endpoint is for admin users to view and manage errors.
    """
    # TODO: Add admin check
    query = db.query(ErrorLog).order_by(ErrorLog.created_at.desc())
    
    if severity:
        query = query.filter(ErrorLog.severity == severity)
    if category:
        query = query.filter(ErrorLog.category == category)
    if status:
        query = query.filter(ErrorLog.resolution_status == status)
    
    errors = query.offset(offset).limit(limit).all()
    
    return [
        ErrorLogResponse(
            id=e.id,
            error_type=e.error_type,
            category=e.category,
            severity=e.severity,
            user_message=e.user_message,
            technical_message=e.technical_message,
            resolution_status=e.resolution_status.value if e.resolution_status else "new",
            created_at=e.created_at
        )
        for e in errors
    ]


@router.get("/stats", response_model=ErrorStatsResponse)
async def get_error_stats(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    Get error statistics (admin only).
    """
    from sqlalchemy import func
    from datetime import timedelta
    
    # TODO: Add admin check
    
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_errors = db.query(func.count(ErrorLog.id)).scalar() or 0
    errors_today = db.query(func.count(ErrorLog.id)).filter(ErrorLog.created_at >= today).scalar() or 0
    critical_errors = db.query(func.count(ErrorLog.id)).filter(ErrorLog.severity == "critical").scalar() or 0
    unresolved_errors = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.resolution_status == ErrorResolutionStatus.NEW
    ).scalar() or 0
    
    # Group by category
    category_counts = db.query(
        ErrorLog.category,
        func.count(ErrorLog.id)
    ).group_by(ErrorLog.category).all()
    
    # Group by severity
    severity_counts = db.query(
        ErrorLog.severity,
        func.count(ErrorLog.id)
    ).group_by(ErrorLog.severity).all()
    
    return ErrorStatsResponse(
        total_errors=total_errors,
        errors_today=errors_today,
        critical_errors=critical_errors,
        unresolved_errors=unresolved_errors,
        errors_by_category={cat: count for cat, count in category_counts},
        errors_by_severity={sev: count for sev, count in severity_counts}
    )


@router.put("/{error_id}/resolve")
async def resolve_error(
    error_id: str,
    resolution_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    Mark an error as resolved (admin only).
    """
    # TODO: Add admin check and get admin ID
    
    error = db.query(ErrorLog).filter(ErrorLog.id == error_id).first()
    if not error:
        raise HTTPException(status_code=404, detail="Error not found")
    
    error.resolution_status = ErrorResolutionStatus.RESOLVED
    error.resolved_at = datetime.now(timezone.utc)
    error.resolution_notes = resolution_notes
    # error.resolved_by = admin_id  # TODO: Set from admin session
    
    db.commit()
    
    return {"success": True, "message": "Error marked as resolved"}


@router.put("/{error_id}/acknowledge")
async def acknowledge_error(
    error_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    Acknowledge an error (admin only).
    """
    error = db.query(ErrorLog).filter(ErrorLog.id == error_id).first()
    if not error:
        raise HTTPException(status_code=404, detail="Error not found")
    
    error.resolution_status = ErrorResolutionStatus.ACKNOWLEDGED
    db.commit()
    
    return {"success": True, "message": "Error acknowledged"}
