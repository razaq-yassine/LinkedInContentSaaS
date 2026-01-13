"""
Error Dashboard API Endpoints

Provides comprehensive endpoints for the admin error dashboard with
analytics, filtering, and management capabilities.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, cast, String
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from enum import Enum

from ..database import get_db
from ..models import ErrorLog, ErrorResolutionStatus, Admin
from ..routers.admin_auth import get_current_admin


router = APIRouter()


# ============== Pydantic Models ==============

class TimeRange(str, Enum):
    HOUR = "1h"
    DAY = "24h"
    WEEK = "7d"
    MONTH = "30d"
    ALL = "all"


class ErrorSortField(str, Enum):
    CREATED_AT = "created_at"
    SEVERITY = "severity"
    CATEGORY = "category"
    ERROR_TYPE = "error_type"


class ErrorOverviewResponse(BaseModel):
    total_errors: int
    errors_last_hour: int
    errors_last_24h: int
    errors_last_7d: int
    errors_last_30d: int
    critical_count: int
    error_count: int
    warning_count: int
    info_count: int
    unresolved_count: int
    resolved_today: int


class ErrorTrendPoint(BaseModel):
    timestamp: str
    count: int
    critical: int
    error: int
    warning: int


class ErrorTrendsResponse(BaseModel):
    time_range: str
    data_points: List[ErrorTrendPoint]


class CategoryBreakdown(BaseModel):
    category: str
    count: int
    percentage: float


class TopErrorType(BaseModel):
    error_type: str
    count: int
    last_occurrence: str
    severity: str
    category: str


class ErrorListItem(BaseModel):
    id: str
    error_type: str
    category: str
    severity: str
    user_message: str
    technical_message: Optional[str]
    user_id: Optional[str]
    resolution_status: str
    created_at: str
    occurrence_count: int = 1

    class Config:
        from_attributes = True


class ErrorDetailResponse(BaseModel):
    id: str
    error_type: str
    category: str
    severity: str
    technical_message: Optional[str]
    user_message: str
    stack_trace: Optional[str]
    request_context: Optional[dict]
    user_id: Optional[str]
    session_id: Optional[str]
    environment: str
    resolution_status: str
    resolved_by: Optional[str]
    resolved_at: Optional[str]
    resolution_notes: Optional[str]
    details: Optional[dict]
    created_at: str
    related_errors: List[ErrorListItem] = []


class ErrorExportRequest(BaseModel):
    format: str = "json"  # json or csv
    time_range: Optional[str] = "7d"
    category: Optional[str] = None
    severity: Optional[str] = None


class BulkActionRequest(BaseModel):
    error_ids: List[str]
    action: str  # resolve, acknowledge, delete
    notes: Optional[str] = None


# ============== Helper Functions ==============

def get_time_filter(time_range: TimeRange) -> datetime:
    """Get datetime filter based on time range"""
    now = datetime.now(timezone.utc)
    if time_range == TimeRange.HOUR:
        return now - timedelta(hours=1)
    elif time_range == TimeRange.DAY:
        return now - timedelta(days=1)
    elif time_range == TimeRange.WEEK:
        return now - timedelta(days=7)
    elif time_range == TimeRange.MONTH:
        return now - timedelta(days=30)
    else:
        return datetime.min.replace(tzinfo=timezone.utc)


def severity_to_order(severity: str) -> int:
    """Convert severity to sortable order"""
    order = {"critical": 0, "error": 1, "warning": 2, "info": 3}
    return order.get(severity, 4)


# ============== Dashboard Overview ==============

@router.get("/overview", response_model=ErrorOverviewResponse)
async def get_error_overview(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get error dashboard overview metrics"""
    now = datetime.now(timezone.utc)
    
    # Calculate time boundaries
    hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total errors
    total = db.query(func.count(ErrorLog.id)).scalar() or 0
    
    # Time-based counts
    last_hour = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.created_at >= hour_ago
    ).scalar() or 0
    
    last_24h = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.created_at >= day_ago
    ).scalar() or 0
    
    last_7d = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.created_at >= week_ago
    ).scalar() or 0
    
    last_30d = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.created_at >= month_ago
    ).scalar() or 0
    
    # Severity counts
    critical = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.severity == "critical"
    ).scalar() or 0
    
    error = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.severity == "error"
    ).scalar() or 0
    
    warning = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.severity == "warning"
    ).scalar() or 0
    
    info = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.severity == "info"
    ).scalar() or 0
    
    # Resolution status
    unresolved = db.query(func.count(ErrorLog.id)).filter(
        ErrorLog.resolution_status == ErrorResolutionStatus.NEW
    ).scalar() or 0
    
    resolved_today = db.query(func.count(ErrorLog.id)).filter(
        and_(
            ErrorLog.resolution_status == ErrorResolutionStatus.RESOLVED,
            ErrorLog.resolved_at >= today_start
        )
    ).scalar() or 0
    
    return ErrorOverviewResponse(
        total_errors=total,
        errors_last_hour=last_hour,
        errors_last_24h=last_24h,
        errors_last_7d=last_7d,
        errors_last_30d=last_30d,
        critical_count=critical,
        error_count=error,
        warning_count=warning,
        info_count=info,
        unresolved_count=unresolved,
        resolved_today=resolved_today
    )


@router.get("/trends", response_model=ErrorTrendsResponse)
async def get_error_trends(
    time_range: TimeRange = TimeRange.DAY,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get error trends over time for charts"""
    now = datetime.now(timezone.utc)
    start_time = get_time_filter(time_range)
    
    # Determine interval based on time range
    if time_range == TimeRange.HOUR:
        interval_minutes = 5
        format_str = "%H:%M"
    elif time_range == TimeRange.DAY:
        interval_minutes = 60
        format_str = "%H:00"
    elif time_range == TimeRange.WEEK:
        interval_minutes = 360  # 6 hours
        format_str = "%m/%d %H:00"
    else:
        interval_minutes = 1440  # 1 day
        format_str = "%m/%d"
    
    # Get all errors in range
    errors = db.query(ErrorLog).filter(
        ErrorLog.created_at >= start_time
    ).all()
    
    # Helper to make datetime timezone-aware if needed
    def ensure_utc(dt):
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt
    
    # Group by time interval
    data_points = []
    current = start_time
    while current <= now:
        next_time = current + timedelta(minutes=interval_minutes)
        
        # Count errors in this interval (handle timezone-naive datetimes from DB)
        interval_errors = [e for e in errors if current <= ensure_utc(e.created_at) < next_time]
        
        data_points.append(ErrorTrendPoint(
            timestamp=current.strftime(format_str),
            count=len(interval_errors),
            critical=len([e for e in interval_errors if e.severity == "critical"]),
            error=len([e for e in interval_errors if e.severity == "error"]),
            warning=len([e for e in interval_errors if e.severity == "warning"])
        ))
        
        current = next_time
    
    return ErrorTrendsResponse(
        time_range=time_range.value,
        data_points=data_points[-50:]  # Limit to last 50 points
    )


@router.get("/categories", response_model=List[CategoryBreakdown])
async def get_category_breakdown(
    time_range: TimeRange = TimeRange.WEEK,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get error breakdown by category"""
    start_time = get_time_filter(time_range)
    
    # Group by category
    results = db.query(
        ErrorLog.category,
        func.count(ErrorLog.id).label("count")
    ).filter(
        ErrorLog.created_at >= start_time
    ).group_by(ErrorLog.category).all()
    
    total = sum(r.count for r in results) or 1
    
    return [
        CategoryBreakdown(
            category=r.category or "unknown",
            count=r.count,
            percentage=round((r.count / total) * 100, 1)
        )
        for r in sorted(results, key=lambda x: x.count, reverse=True)
    ]


@router.get("/top-errors", response_model=List[TopErrorType])
async def get_top_errors(
    time_range: TimeRange = TimeRange.WEEK,
    limit: int = 10,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get most frequent error types"""
    start_time = get_time_filter(time_range)
    
    # Group by error_type
    results = db.query(
        ErrorLog.error_type,
        ErrorLog.severity,
        ErrorLog.category,
        func.count(ErrorLog.id).label("count"),
        func.max(ErrorLog.created_at).label("last_occurrence")
    ).filter(
        ErrorLog.created_at >= start_time
    ).group_by(
        ErrorLog.error_type,
        ErrorLog.severity,
        ErrorLog.category
    ).order_by(desc("count")).limit(limit).all()
    
    return [
        TopErrorType(
            error_type=r.error_type or "UNKNOWN",
            count=r.count,
            last_occurrence=r.last_occurrence.isoformat() if r.last_occurrence else "",
            severity=r.severity or "unknown",
            category=r.category or "unknown"
        )
        for r in results
    ]


@router.get("/critical", response_model=List[ErrorListItem])
async def get_critical_errors(
    limit: int = 20,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get unresolved critical errors requiring immediate attention"""
    errors = db.query(ErrorLog).filter(
        and_(
            ErrorLog.severity == "critical",
            ErrorLog.resolution_status == ErrorResolutionStatus.NEW
        )
    ).order_by(desc(ErrorLog.created_at)).limit(limit).all()
    
    return [
        ErrorListItem(
            id=e.id,
            error_type=e.error_type or "UNKNOWN",
            category=e.category or "unknown",
            severity=e.severity or "error",
            user_message=e.user_message,
            technical_message=e.technical_message,
            user_id=e.user_id,
            resolution_status=e.resolution_status.value if e.resolution_status else "new",
            created_at=e.created_at.isoformat() if e.created_at else ""
        )
        for e in errors
    ]


# ============== Error List with Filtering ==============

@router.get("/list", response_model=dict)
async def list_errors(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    error_type: Optional[str] = None,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    time_range: TimeRange = TimeRange.WEEK,
    sort_by: ErrorSortField = ErrorSortField.CREATED_AT,
    sort_order: str = "desc",
    group_similar: bool = False,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """List errors with filtering, pagination, and grouping"""
    start_time = get_time_filter(time_range)
    
    # Build query
    query = db.query(ErrorLog).filter(ErrorLog.created_at >= start_time)
    
    # Apply filters
    if category:
        query = query.filter(ErrorLog.category == category)
    
    if severity:
        query = query.filter(ErrorLog.severity == severity)
    
    if status:
        query = query.filter(ErrorLog.resolution_status == status)
    
    if error_type:
        query = query.filter(ErrorLog.error_type == error_type)
    
    if user_id:
        query = query.filter(ErrorLog.user_id == user_id)
    
    if search:
        search_filter = or_(
            ErrorLog.id.ilike(f"%{search}%"),
            ErrorLog.user_message.ilike(f"%{search}%"),
            ErrorLog.technical_message.ilike(f"%{search}%"),
            ErrorLog.error_type.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply sorting
    if sort_order == "desc":
        query = query.order_by(desc(getattr(ErrorLog, sort_by.value)))
    else:
        query = query.order_by(getattr(ErrorLog, sort_by.value))
    
    # Apply pagination
    offset = (page - 1) * page_size
    errors = query.offset(offset).limit(page_size).all()
    
    # Build response
    items = []
    for e in errors:
        items.append(ErrorListItem(
            id=e.id,
            error_type=e.error_type or "UNKNOWN",
            category=e.category or "unknown",
            severity=e.severity or "error",
            user_message=e.user_message,
            technical_message=e.technical_message[:200] if e.technical_message else None,
            user_id=e.user_id,
            resolution_status=e.resolution_status.value if e.resolution_status else "new",
            created_at=e.created_at.isoformat() if e.created_at else ""
        ))
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


# ============== Error Details ==============

@router.get("/detail/{error_id}", response_model=ErrorDetailResponse)
async def get_error_detail(
    error_id: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get full error details including stack trace and related errors"""
    error = db.query(ErrorLog).filter(ErrorLog.id == error_id).first()
    
    if not error:
        raise HTTPException(status_code=404, detail="Error not found")
    
    # Find related errors (same error_type in last 24 hours)
    related = db.query(ErrorLog).filter(
        and_(
            ErrorLog.error_type == error.error_type,
            ErrorLog.id != error_id,
            ErrorLog.created_at >= datetime.now(timezone.utc) - timedelta(hours=24)
        )
    ).order_by(desc(ErrorLog.created_at)).limit(10).all()
    
    related_items = [
        ErrorListItem(
            id=e.id,
            error_type=e.error_type or "UNKNOWN",
            category=e.category or "unknown",
            severity=e.severity or "error",
            user_message=e.user_message,
            technical_message=e.technical_message[:100] if e.technical_message else None,
            user_id=e.user_id,
            resolution_status=e.resolution_status.value if e.resolution_status else "new",
            created_at=e.created_at.isoformat() if e.created_at else ""
        )
        for e in related
    ]
    
    return ErrorDetailResponse(
        id=error.id,
        error_type=error.error_type or "UNKNOWN",
        category=error.category or "unknown",
        severity=error.severity or "error",
        technical_message=error.technical_message,
        user_message=error.user_message,
        stack_trace=error.stack_trace,
        request_context=error.request_context,
        user_id=error.user_id,
        session_id=error.session_id,
        environment=error.environment or "production",
        resolution_status=error.resolution_status.value if error.resolution_status else "new",
        resolved_by=error.resolved_by,
        resolved_at=error.resolved_at.isoformat() if error.resolved_at else None,
        resolution_notes=error.resolution_notes,
        details=error.details,
        created_at=error.created_at.isoformat() if error.created_at else "",
        related_errors=related_items
    )


# ============== Error Management ==============

@router.put("/resolve/{error_id}")
async def resolve_error(
    error_id: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Mark an error as resolved"""
    error = db.query(ErrorLog).filter(ErrorLog.id == error_id).first()
    
    if not error:
        raise HTTPException(status_code=404, detail="Error not found")
    
    error.resolution_status = ErrorResolutionStatus.RESOLVED
    error.resolved_at = datetime.now(timezone.utc)
    error.resolved_by = admin.id
    error.resolution_notes = notes
    
    db.commit()
    
    return {"success": True, "message": "Error marked as resolved"}


@router.put("/acknowledge/{error_id}")
async def acknowledge_error(
    error_id: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Acknowledge an error"""
    error = db.query(ErrorLog).filter(ErrorLog.id == error_id).first()
    
    if not error:
        raise HTTPException(status_code=404, detail="Error not found")
    
    error.resolution_status = ErrorResolutionStatus.ACKNOWLEDGED
    db.commit()
    
    return {"success": True, "message": "Error acknowledged"}


@router.post("/bulk-action")
async def bulk_action(
    request: BulkActionRequest,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Perform bulk actions on multiple errors"""
    errors = db.query(ErrorLog).filter(ErrorLog.id.in_(request.error_ids)).all()
    
    if not errors:
        raise HTTPException(status_code=404, detail="No errors found")
    
    now = datetime.now(timezone.utc)
    
    for error in errors:
        if request.action == "resolve":
            error.resolution_status = ErrorResolutionStatus.RESOLVED
            error.resolved_at = now
            error.resolved_by = admin.id
            error.resolution_notes = request.notes
        elif request.action == "acknowledge":
            error.resolution_status = ErrorResolutionStatus.ACKNOWLEDGED
        elif request.action == "delete":
            db.delete(error)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Action '{request.action}' applied to {len(errors)} errors"
    }


# ============== Export ==============

@router.post("/export")
async def export_errors(
    request: ErrorExportRequest,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Export errors to JSON or CSV format"""
    # Build time filter
    time_map = {"1h": 1, "24h": 24, "7d": 168, "30d": 720}
    hours = time_map.get(request.time_range, 168)
    start_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    query = db.query(ErrorLog).filter(ErrorLog.created_at >= start_time)
    
    if request.category:
        query = query.filter(ErrorLog.category == request.category)
    
    if request.severity:
        query = query.filter(ErrorLog.severity == request.severity)
    
    errors = query.order_by(desc(ErrorLog.created_at)).limit(10000).all()
    
    if request.format == "csv":
        # Return CSV data
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Error ID", "Timestamp", "Type", "Category", "Severity",
            "User Message", "User ID", "Status"
        ])
        
        for e in errors:
            writer.writerow([
                e.id,
                e.created_at.isoformat() if e.created_at else "",
                e.error_type,
                e.category,
                e.severity,
                e.user_message,
                e.user_id or "",
                e.resolution_status.value if e.resolution_status else "new"
            ])
        
        return {
            "format": "csv",
            "data": output.getvalue(),
            "count": len(errors)
        }
    else:
        # Return JSON data
        return {
            "format": "json",
            "data": [
                {
                    "id": e.id,
                    "timestamp": e.created_at.isoformat() if e.created_at else "",
                    "error_type": e.error_type,
                    "category": e.category,
                    "severity": e.severity,
                    "user_message": e.user_message,
                    "technical_message": e.technical_message,
                    "user_id": e.user_id,
                    "status": e.resolution_status.value if e.resolution_status else "new"
                }
                for e in errors
            ],
            "count": len(errors)
        }


# ============== Analytics ==============

@router.get("/analytics/patterns")
async def get_error_patterns(
    time_range: TimeRange = TimeRange.WEEK,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Identify error patterns and recurring issues"""
    start_time = get_time_filter(time_range)
    
    # Get error frequency by type
    patterns = db.query(
        ErrorLog.error_type,
        ErrorLog.category,
        ErrorLog.severity,
        func.count(ErrorLog.id).label("count"),
        func.count(func.distinct(ErrorLog.user_id)).label("affected_users"),
        func.min(ErrorLog.created_at).label("first_seen"),
        func.max(ErrorLog.created_at).label("last_seen")
    ).filter(
        ErrorLog.created_at >= start_time
    ).group_by(
        ErrorLog.error_type,
        ErrorLog.category,
        ErrorLog.severity
    ).having(func.count(ErrorLog.id) > 1).order_by(desc("count")).limit(20).all()
    
    return {
        "patterns": [
            {
                "error_type": p.error_type,
                "category": p.category,
                "severity": p.severity,
                "occurrences": p.count,
                "affected_users": p.affected_users,
                "first_seen": p.first_seen.isoformat() if p.first_seen else "",
                "last_seen": p.last_seen.isoformat() if p.last_seen else "",
                "frequency": "high" if p.count > 10 else "medium" if p.count > 3 else "low"
            }
            for p in patterns
        ]
    }


@router.get("/analytics/resolution-metrics")
async def get_resolution_metrics(
    time_range: TimeRange = TimeRange.MONTH,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get error resolution time metrics"""
    start_time = get_time_filter(time_range)
    
    # Get resolved errors with resolution time
    resolved = db.query(ErrorLog).filter(
        and_(
            ErrorLog.created_at >= start_time,
            ErrorLog.resolution_status == ErrorResolutionStatus.RESOLVED,
            ErrorLog.resolved_at.isnot(None)
        )
    ).all()
    
    if not resolved:
        return {
            "total_resolved": 0,
            "avg_resolution_time_hours": 0,
            "min_resolution_time_hours": 0,
            "max_resolution_time_hours": 0,
            "resolved_within_1h": 0,
            "resolved_within_24h": 0,
            "resolved_within_7d": 0
        }
    
    # Calculate resolution times
    resolution_times = []
    within_1h = 0
    within_24h = 0
    within_7d = 0
    
    for e in resolved:
        if e.resolved_at and e.created_at:
            delta = (e.resolved_at - e.created_at).total_seconds() / 3600
            resolution_times.append(delta)
            
            if delta <= 1:
                within_1h += 1
            if delta <= 24:
                within_24h += 1
            if delta <= 168:
                within_7d += 1
    
    return {
        "total_resolved": len(resolved),
        "avg_resolution_time_hours": round(sum(resolution_times) / len(resolution_times), 2) if resolution_times else 0,
        "min_resolution_time_hours": round(min(resolution_times), 2) if resolution_times else 0,
        "max_resolution_time_hours": round(max(resolution_times), 2) if resolution_times else 0,
        "resolved_within_1h": within_1h,
        "resolved_within_24h": within_24h,
        "resolved_within_7d": within_7d
    }
