"""
Centralized Error Handler

Provides middleware and utilities for consistent error handling across the application.
"""
import traceback
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Callable
from functools import wraps
import re
import asyncio

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError

from .exceptions import AppException
from .error_types import ErrorType, ErrorSeverity, ErrorCategory, get_error_mapping


# Sensitive data patterns to sanitize from logs
SENSITIVE_PATTERNS = [
    (r'password["\']?\s*[:=]\s*["\']?[^"\'&\s]+', 'password=***REDACTED***'),
    (r'token["\']?\s*[:=]\s*["\']?[^"\'&\s]+', 'token=***REDACTED***'),
    (r'api_key["\']?\s*[:=]\s*["\']?[^"\'&\s]+', 'api_key=***REDACTED***'),
    (r'secret["\']?\s*[:=]\s*["\']?[^"\'&\s]+', 'secret=***REDACTED***'),
    (r'authorization["\']?\s*[:=]\s*["\']?Bearer\s+[^"\'&\s]+', 'authorization=***REDACTED***'),
    (r'credit_card["\']?\s*[:=]\s*["\']?\d+', 'credit_card=***REDACTED***'),
    (r'\b\d{13,19}\b', '***CARD_REDACTED***'),  # Credit card numbers
    (r'cvv["\']?\s*[:=]\s*["\']?\d{3,4}', 'cvv=***REDACTED***'),
    (r'ssn["\']?\s*[:=]\s*["\']?\d{3}-?\d{2}-?\d{4}', 'ssn=***REDACTED***'),
    (r'sk-[a-zA-Z0-9]+', '***REDACTED***'),  # OpenAI API keys
    (r'sk_test_[a-zA-Z0-9]+', '***REDACTED***'),  # Stripe test keys
    (r'sk_live_[a-zA-Z0-9]+', '***REDACTED***'),  # Stripe live keys
]


def generate_error_id() -> str:
    """Generate a unique error ID in format ERR-YYYYMMDD-XXXX"""
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    unique_part = uuid.uuid4().hex[:8].upper()
    return f"ERR-{date_part}-{unique_part}"


def sanitize_data(data: Any) -> Any:
    """
    Recursively sanitize sensitive data from logs.
    
    Args:
        data: Data to sanitize (can be string, dict, list, or other)
    
    Returns:
        Sanitized data with sensitive information redacted
    """
    if data is None:
        return None
    
    if isinstance(data, str):
        result = data
        for pattern, replacement in SENSITIVE_PATTERNS:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        return result
    
    if isinstance(data, dict):
        sanitized = {}
        sensitive_keys = {'password', 'token', 'api_key', 'secret', 'authorization', 
                         'credit_card', 'cvv', 'ssn', 'access_token', 'refresh_token',
                         'stripe_secret', 'private_key', 'client_secret', 'confirm_password',
                         'openai_api_key', 'stripe_secret_key'}
        
        for key, value in data.items():
            if key.lower() in sensitive_keys:
                sanitized[key] = "***REDACTED***"
            else:
                sanitized[key] = sanitize_data(value)
        return sanitized
    
    if isinstance(data, list):
        return [sanitize_data(item) for item in data]
    
    return data


def extract_request_context(request: Request) -> Dict[str, Any]:
    """
    Extract relevant context from a request for logging.
    
    Args:
        request: FastAPI request object
    
    Returns:
        Dictionary with sanitized request context
    """
    # Get client IP (handle proxied requests)
    forwarded_for = request.headers.get("x-forwarded-for")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else request.client.host if request.client else "unknown"
    
    # Extract query params (sanitized)
    query_params = dict(request.query_params)
    sanitized_params = sanitize_data(query_params)
    
    # Get path parameters
    path_params = dict(request.path_params) if hasattr(request, 'path_params') else {}
    
    return {
        "endpoint": str(request.url.path),
        "method": request.method,
        "query_params": sanitized_params,
        "path_params": path_params,
        "client_ip": client_ip,
        "user_agent": request.headers.get("user-agent", "")[:500],  # Limit length
        "content_type": request.headers.get("content-type", ""),
        "referer": request.headers.get("referer", "")[:500],
    }


def map_sqlalchemy_error(exc: SQLAlchemyError) -> AppException:
    """
    Map SQLAlchemy exceptions to application exceptions.
    
    Args:
        exc: SQLAlchemy exception
    
    Returns:
        Appropriate AppException subclass
    """
    from .exceptions import (
        DatabaseError, DuplicateEntryError, ConnectionError as DBConnectionError,
        RecordNotFoundError
    )
    
    error_message = str(exc)
    
    if isinstance(exc, IntegrityError):
        if "unique constraint" in error_message.lower() or "duplicate" in error_message.lower():
            return DuplicateEntryError(technical_message=error_message)
        return DatabaseError(
            error_type=ErrorType.DB_INTEGRITY_ERROR,
            technical_message=error_message,
            original_exception=exc
        )
    
    if isinstance(exc, OperationalError):
        if "connection" in error_message.lower():
            return DBConnectionError(technical_message=error_message)
        if "timeout" in error_message.lower():
            return DatabaseError(
                error_type=ErrorType.DB_TIMEOUT,
                technical_message=error_message,
                original_exception=exc
            )
        return DatabaseError(
            error_type=ErrorType.DB_QUERY_FAILED,
            technical_message=error_message,
            original_exception=exc
        )
    
    return DatabaseError(
        error_type=ErrorType.DB_QUERY_FAILED,
        technical_message=error_message,
        original_exception=exc
    )


def map_http_exception(exc: HTTPException) -> AppException:
    """
    Map FastAPI HTTPException to application exception.
    
    Args:
        exc: HTTPException
    
    Returns:
        Appropriate AppException subclass
    """
    from .exceptions import (
        AuthenticationError, AuthorizationError, ValidationError,
        ResourceNotFoundError, RateLimitError, InternalError
    )
    
    status_code = exc.status_code
    detail = str(exc.detail) if exc.detail else ""
    
    # Map by status code
    if status_code == 401:
        return AuthenticationError(
            error_type=ErrorType.AUTH_TOKEN_INVALID,
            technical_message=detail
        )
    elif status_code == 403:
        return AuthorizationError(
            error_type=ErrorType.AUTHZ_PERMISSION_DENIED,
            technical_message=detail
        )
    elif status_code == 404:
        return ResourceNotFoundError(technical_message=detail)
    elif status_code == 422:
        return ValidationError(
            error_type=ErrorType.VALID_DATA_FORMAT,
            technical_message=detail
        )
    elif status_code == 429:
        return RateLimitError(
            error_type=ErrorType.RATE_API_EXCEEDED,
            technical_message=detail
        )
    else:
        return InternalError(
            error_type=ErrorType.INT_UNEXPECTED,
            technical_message=detail
        )


class ErrorResponse:
    """Standardized error response builder"""
    
    @staticmethod
    def create(
        error_id: str,
        user_message: str,
        action_hint: Optional[str] = None,
        http_status: int = 500,
        error_code: Optional[str] = None,
        timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a standardized error response.
        
        Args:
            error_id: Unique error identifier
            user_message: User-friendly error message
            action_hint: Suggested action for the user
            http_status: HTTP status code
            error_code: Error code for client-side handling
            timestamp: Error timestamp
        
        Returns:
            Dictionary suitable for JSON response
        """
        return {
            "success": False,
            "error": {
                "id": error_id,
                "code": error_code,
                "message": user_message,
                "action_hint": action_hint,
            },
            "timestamp": timestamp or datetime.now(timezone.utc).isoformat(),
        }
    
    @staticmethod
    def from_exception(
        exc: AppException,
        error_id: str
    ) -> Dict[str, Any]:
        """Create error response from AppException"""
        return ErrorResponse.create(
            error_id=error_id,
            user_message=exc.user_message,
            action_hint=exc.action_hint,
            http_status=exc.http_status,
            error_code=exc.error_type.value
        )


class ErrorLogger:
    """Handles error logging to database and file"""
    
    def __init__(self, db_session_factory: Callable = None):
        self._db_session_factory = db_session_factory
        self._fallback_logger = None
    
    def set_db_session_factory(self, factory: Callable):
        """Set the database session factory"""
        self._db_session_factory = factory
    
    def log_error(
        self,
        error_id: str,
        error: AppException,
        request_context: Dict[str, Any] = None,
        user_id: Optional[str] = None,
        environment: str = "production"
    ) -> bool:
        """
        Log error to database and file.
        
        Args:
            error_id: Unique error identifier
            error: AppException instance
            request_context: Request context dictionary
            user_id: User ID if authenticated
            environment: Environment name
        
        Returns:
            True if logging succeeded, False otherwise
        """
        try:
            # Get stack trace
            stack_trace = None
            if error.original_exception:
                stack_trace = "".join(traceback.format_exception(
                    type(error.original_exception),
                    error.original_exception,
                    error.original_exception.__traceback__
                ))
            else:
                stack_trace = traceback.format_exc()
            
            # Sanitize stack trace
            stack_trace = sanitize_data(stack_trace)
            
            # Prepare log entry
            log_entry = {
                "error_id": error_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error_type": error.error_type.value,
                "category": error.category.value,
                "severity": error.severity.value,
                "technical_message": sanitize_data(error.technical_message),
                "user_message": error.user_message,
                "stack_trace": stack_trace,
                "request_context": sanitize_data(request_context) if request_context else None,
                "user_id": user_id,
                "environment": environment,
                "resolution_status": "new",
                "details": sanitize_data(error.details) if error.details else None,
            }
            
            # Always try to log to database
            self._log_to_database(log_entry)
            
            # Always log to console/file as fallback
            self._log_to_console(log_entry)
            
            return True
        
        except Exception as log_error:
            # Never fail the main operation due to logging errors
            print(f"ERROR: Failed to log error {error_id}: {str(log_error)}")
            return False
    
    def _log_to_database(self, log_entry: Dict[str, Any]):
        """Log error to database"""
        try:
            from ..models import ErrorLog, ErrorResolutionStatus
            from ..database import SessionLocal
            
            db = SessionLocal()
            try:
                error_log = ErrorLog(
                    id=log_entry["error_id"],
                    error_type=log_entry["error_type"],
                    category=log_entry["category"],
                    severity=log_entry["severity"],
                    technical_message=log_entry["technical_message"],
                    user_message=log_entry["user_message"],
                    stack_trace=log_entry["stack_trace"],
                    request_context=log_entry["request_context"],
                    user_id=log_entry["user_id"],
                    environment=log_entry["environment"],
                    resolution_status=ErrorResolutionStatus.NEW,
                    details=log_entry["details"],
                    created_at=datetime.now(timezone.utc)
                )
                db.add(error_log)
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"Failed to log to database: {str(e)}")
            finally:
                db.close()
        except ImportError:
            # ErrorLog model not yet created, skip database logging
            pass
    
    def _log_to_console(self, log_entry: Dict[str, Any]):
        """Log error to console/file"""
        import logging
        logger = logging.getLogger("error_handler")
        
        severity = log_entry.get("severity", "error")
        message = (
            f"[{log_entry['error_id']}] "
            f"{log_entry['category']}/{log_entry['error_type']}: "
            f"{log_entry['technical_message'] or log_entry['user_message']}"
        )
        
        if severity == "critical":
            logger.critical(message)
        elif severity == "error":
            logger.error(message)
        elif severity == "warning":
            logger.warning(message)
        else:
            logger.info(message)


# Global error logger instance
error_logger = ErrorLogger()


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for FastAPI.
    
    Catches all unhandled exceptions and returns a standardized error response.
    """
    from .exceptions import InternalError
    
    error_id = generate_error_id()
    request_context = extract_request_context(request)
    
    # Get user ID from request state if available
    user_id = getattr(request.state, 'user_id', None) if hasattr(request, 'state') else None
    
    # Determine environment
    from ..config import get_settings
    settings = get_settings()
    environment = "development" if settings.dev_mode else "production"
    
    # Convert exception to AppException if needed
    if isinstance(exc, AppException):
        app_error = exc
    elif isinstance(exc, HTTPException):
        app_error = map_http_exception(exc)
    elif isinstance(exc, SQLAlchemyError):
        app_error = map_sqlalchemy_error(exc)
    else:
        app_error = InternalError(
            error_type=ErrorType.INT_UNEXPECTED,
            technical_message=str(exc),
            original_exception=exc
        )
    
    # Log the error
    error_logger.log_error(
        error_id=error_id,
        error=app_error,
        request_context=request_context,
        user_id=user_id,
        environment=environment
    )
    
    # Send critical error alerts
    if app_error.severity == ErrorSeverity.CRITICAL:
        try:
            from ..services.email_alert_service import send_critical_error_alert
            send_critical_error_alert(
                error_message=app_error.technical_message or app_error.user_message,
                endpoint=request_context.get("endpoint"),
                user_id=user_id,
                stack_trace=traceback.format_exc() if not isinstance(exc, AppException) else None,
                extra_info={"error_id": error_id}
            )
        except Exception:
            pass  # Don't fail if alert fails
    
    # Build response
    response = ErrorResponse.from_exception(app_error, error_id)
    
    return JSONResponse(
        status_code=app_error.http_status,
        content=response
    )


def handle_errors(func: Callable) -> Callable:
    """
    Decorator for handling errors in route handlers.
    
    Wraps async functions with error handling that converts exceptions
    to standardized error responses.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except AppException:
            raise  # Let the global handler deal with it
        except HTTPException:
            raise  # Let FastAPI handle it normally
        except SQLAlchemyError as e:
            raise map_sqlalchemy_error(e)
        except Exception as e:
            from .exceptions import InternalError
            raise InternalError(
                error_type=ErrorType.INT_UNEXPECTED,
                technical_message=str(e),
                original_exception=e
            )
    
    return wrapper


def handle_errors_sync(func: Callable) -> Callable:
    """
    Decorator for handling errors in synchronous functions.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except AppException:
            raise
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            raise map_sqlalchemy_error(e)
        except Exception as e:
            from .exceptions import InternalError
            raise InternalError(
                error_type=ErrorType.INT_UNEXPECTED,
                technical_message=str(e),
                original_exception=e
            )
    
    return wrapper


class RetryHandler:
    """
    Handles retry logic for transient failures.
    """
    
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 30.0,
        exponential_base: float = 2.0,
        retryable_errors: tuple = None
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.retryable_errors = retryable_errors or (
            ConnectionError,
            TimeoutError,
            OperationalError,
        )
    
    def _calculate_delay(self, attempt: int) -> float:
        """Calculate delay with exponential backoff"""
        delay = self.base_delay * (self.exponential_base ** attempt)
        return min(delay, self.max_delay)
    
    def _is_retryable(self, exc: Exception) -> bool:
        """Check if exception is retryable"""
        if isinstance(exc, self.retryable_errors):
            return True
        if isinstance(exc, AppException):
            # Retry on network and some database errors
            retryable_types = {
                ErrorType.NET_CONNECTION_FAILED,
                ErrorType.NET_TIMEOUT,
                ErrorType.DB_CONNECTION_FAILED,
                ErrorType.DB_TIMEOUT,
                ErrorType.DB_POOL_EXHAUSTED,
                ErrorType.EXT_AI_SERVICE_FAILED,
            }
            return exc.error_type in retryable_types
        return False
    
    async def execute(self, func: Callable, *args, **kwargs):
        """
        Execute function with retry logic.
        
        Args:
            func: Async function to execute
            *args: Positional arguments
            **kwargs: Keyword arguments
        
        Returns:
            Result of the function
        
        Raises:
            Last exception if all retries fail
        """
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                if asyncio.iscoroutinefunction(func):
                    return await func(*args, **kwargs)
                else:
                    return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                
                if not self._is_retryable(e) or attempt >= self.max_retries:
                    raise
                
                delay = self._calculate_delay(attempt)
                await asyncio.sleep(delay)
        
        raise last_exception


# Default retry handler instance
retry_handler = RetryHandler()


def with_retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    retryable_errors: tuple = None
):
    """
    Decorator for adding retry logic to functions.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Base delay between retries
        retryable_errors: Tuple of exception types to retry on
    """
    handler = RetryHandler(
        max_retries=max_retries,
        base_delay=base_delay,
        retryable_errors=retryable_errors
    )
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await handler.execute(func, *args, **kwargs)
        return wrapper
    
    return decorator
