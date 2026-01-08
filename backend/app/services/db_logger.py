"""
Database logger service for storing critical events in the database
These logs can be queried by admins through the UI
"""
from typing import Optional, Dict
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import asyncio

from ..models import SystemLog, LogLevel
from .email_alert_service import send_critical_error_alert


def log_to_db(
    db: Session,
    level: LogLevel,
    message: str,
    logger_name: str = "app",
    user_id: Optional[str] = None,
    admin_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    method: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    extra_data: Optional[Dict] = None,
    stack_trace: Optional[str] = None
):
    """
    Log an event to the database
    
    Args:
        db: Database session
        level: Log level (debug, info, warning, error, critical)
        message: Log message
        logger_name: Logger name
        user_id: Optional user ID
        admin_id: Optional admin ID
        endpoint: API endpoint
        method: HTTP method
        ip_address: Client IP address
        user_agent: User agent string
        extra_data: Additional data as JSON
        stack_trace: Exception stack trace
    """
    try:
        log = SystemLog(
            id=str(uuid.uuid4()),
            level=level,
            logger_name=logger_name,
            message=message,
            user_id=user_id,
            admin_id=admin_id,
            endpoint=endpoint,
            method=method,
            ip_address=ip_address,
            user_agent=user_agent,
            extra_data=extra_data,
            stack_trace=stack_trace,
            created_at=datetime.utcnow()
        )
        db.add(log)
        db.commit()
    except Exception as e:
        # Don't fail the main operation if logging fails
        print(f"Failed to log to database: {str(e)}")
        db.rollback()


def log_error_to_db(
    db: Session,
    message: str,
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    stack_trace: Optional[str] = None,
    extra_data: Optional[Dict] = None,
    send_alert: bool = False
):
    """
    Quick helper to log errors to database
    
    Args:
        db: Database session
        message: Error message
        user_id: User ID
        endpoint: API endpoint
        stack_trace: Exception stack trace
        extra_data: Additional data
        send_alert: If True, sends email alert for critical errors
    """
    log_to_db(
        db=db,
        level=LogLevel.ERROR,
        message=message,
        user_id=user_id,
        endpoint=endpoint,
        stack_trace=stack_trace,
        extra_data=extra_data
    )
    
    # Send email alert for critical errors if requested
    if send_alert:
        try:
            send_critical_error_alert(
                error_message=message,
                endpoint=endpoint,
                user_id=user_id,
                stack_trace=stack_trace,
                extra_info=extra_data
            )
        except Exception as e:
            print(f"Failed to send error alert email: {str(e)}")


def log_warning_to_db(
    db: Session,
    message: str,
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    extra_data: Optional[Dict] = None
):
    """
    Quick helper to log warnings to database
    """
    log_to_db(
        db=db,
        level=LogLevel.WARNING,
        message=message,
        user_id=user_id,
        endpoint=endpoint,
        extra_data=extra_data
    )


def log_info_to_db(
    db: Session,
    message: str,
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    extra_data: Optional[Dict] = None
):
    """
    Quick helper to log info to database
    """
    log_to_db(
        db=db,
        level=LogLevel.INFO,
        message=message,
        user_id=user_id,
        endpoint=endpoint,
        extra_data=extra_data
    )

