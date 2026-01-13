"""
Service Wrapper Utilities

Provides decorators and utilities for wrapping service functions
with consistent error handling, retry logic, and logging.
"""
import asyncio
import functools
import traceback
from typing import Callable, TypeVar, Optional, Any, Dict, Type
from datetime import datetime, timezone

from .exceptions import (
    AppException, InternalError, AIServiceError, AIRateLimitError,
    LinkedInAPIError, LinkedInTokenExpiredError, StripeError,
    EmailServiceError, DatabaseError, ExternalServiceError
)
from .error_types import ErrorType, ErrorSeverity
from .error_handler import error_logger, generate_error_id, sanitize_data


T = TypeVar('T')


def classify_external_error(
    error: Exception,
    service_name: str
) -> AppException:
    """
    Classify an external service error into the appropriate AppException type.
    
    Args:
        error: The original exception
        service_name: Name of the external service (ai, linkedin, stripe, email, etc.)
    
    Returns:
        Appropriate AppException subclass
    """
    error_str = str(error).lower()
    
    # AI Service errors
    if service_name in ["ai", "openai", "gemini", "claude"]:
        if "rate limit" in error_str or "429" in error_str:
            return AIRateLimitError(provider=service_name)
        if "quota" in error_str or "exceeded" in error_str:
            return AIServiceError(
                error_type=ErrorType.EXT_AI_QUOTA_EXCEEDED,
                provider=service_name,
                technical_message=str(error),
                original_exception=error
            )
        if "invalid" in error_str and "response" in error_str:
            return AIServiceError(
                error_type=ErrorType.EXT_AI_INVALID_RESPONSE,
                provider=service_name,
                technical_message=str(error),
                original_exception=error
            )
        return AIServiceError(
            provider=service_name,
            technical_message=str(error),
            original_exception=error
        )
    
    # LinkedIn errors
    if service_name == "linkedin":
        if "token" in error_str and ("expired" in error_str or "invalid" in error_str):
            return LinkedInTokenExpiredError()
        if "rate" in error_str or "throttl" in error_str:
            return LinkedInAPIError(
                error_type=ErrorType.EXT_LINKEDIN_RATE_LIMITED,
                technical_message=str(error),
                original_exception=error
            )
        return LinkedInAPIError(
            technical_message=str(error),
            original_exception=error
        )
    
    # Stripe errors
    if service_name == "stripe":
        if "card" in error_str and "declined" in error_str:
            from .exceptions import PaymentFailedError
            return PaymentFailedError(decline_code="card_declined", technical_message=str(error))
        return StripeError(technical_message=str(error), original_exception=error)
    
    # Email errors
    if service_name == "email":
        return EmailServiceError(technical_message=str(error), original_exception=error)
    
    # Generic external service error
    return ExternalServiceError(
        service_name=service_name,
        technical_message=str(error),
        original_exception=error
    )


def handle_service_error(
    service_name: str,
    log_errors: bool = True
):
    """
    Decorator for handling service function errors with proper classification.
    
    Args:
        service_name: Name of the service for error classification
        log_errors: Whether to log errors to the error log
    
    Example:
        @handle_service_error("ai")
        async def generate_content(prompt: str) -> str:
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            try:
                return await func(*args, **kwargs)
            except AppException:
                # Already an AppException, re-raise
                raise
            except Exception as e:
                # Classify and wrap the error
                app_error = classify_external_error(e, service_name)
                
                # Log if enabled
                if log_errors:
                    error_id = generate_error_id()
                    error_logger.log_error(
                        error_id=error_id,
                        error=app_error,
                        request_context={"service": service_name, "function": func.__name__}
                    )
                
                raise app_error from e
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            try:
                return func(*args, **kwargs)
            except AppException:
                raise
            except Exception as e:
                app_error = classify_external_error(e, service_name)
                
                if log_errors:
                    error_id = generate_error_id()
                    error_logger.log_error(
                        error_id=error_id,
                        error=app_error,
                        request_context={"service": service_name, "function": func.__name__}
                    )
                
                raise app_error from e
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


def with_fallback(
    fallback_value: T,
    exceptions: tuple = (Exception,),
    log_errors: bool = True
):
    """
    Decorator that returns a fallback value on error instead of raising.
    
    Args:
        fallback_value: Value to return on error
        exceptions: Tuple of exception types to catch
        log_errors: Whether to log errors
    
    Example:
        @with_fallback(fallback_value=[], log_errors=True)
        async def get_trending_topics() -> List[str]:
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            try:
                return await func(*args, **kwargs)
            except exceptions as e:
                if log_errors:
                    error_id = generate_error_id()
                    if isinstance(e, AppException):
                        error_logger.log_error(error_id=error_id, error=e)
                    else:
                        error_logger.log_error(
                            error_id=error_id,
                            error=InternalError(technical_message=str(e), original_exception=e)
                        )
                return fallback_value
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            try:
                return func(*args, **kwargs)
            except exceptions as e:
                if log_errors:
                    error_id = generate_error_id()
                    if isinstance(e, AppException):
                        error_logger.log_error(error_id=error_id, error=e)
                    else:
                        error_logger.log_error(
                            error_id=error_id,
                            error=InternalError(technical_message=str(e), original_exception=e)
                        )
                return fallback_value
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


def retry_on_failure(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
    retryable_exceptions: tuple = None
):
    """
    Decorator for adding retry logic to functions.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay between retries
        max_delay: Maximum delay between retries
        exponential_base: Multiplier for exponential backoff
        retryable_exceptions: Tuple of exception types to retry on
    
    Example:
        @retry_on_failure(max_retries=3, base_delay=1.0)
        async def call_external_api():
            ...
    """
    if retryable_exceptions is None:
        retryable_exceptions = (
            ConnectionError,
            TimeoutError,
            AIServiceError,
            DatabaseError,
        )
    
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs) -> T:
            last_exception = None
            delay = base_delay
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt >= max_retries:
                        break
                    
                    # Calculate delay with exponential backoff
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)
                    await asyncio.sleep(delay)
                except Exception as e:
                    # Non-retryable exception, raise immediately
                    raise
            
            # All retries exhausted
            raise last_exception
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs) -> T:
            import time
            last_exception = None
            delay = base_delay
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt >= max_retries:
                        break
                    
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)
                    time.sleep(delay)
                except Exception as e:
                    raise
            
            raise last_exception
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


class ServiceContext:
    """
    Context manager for service operations with automatic error handling.
    
    Example:
        async with ServiceContext("ai", user_id="123") as ctx:
            result = await generate_content(prompt)
            ctx.set_result(result)
    """
    
    def __init__(
        self,
        service_name: str,
        user_id: Optional[str] = None,
        operation: Optional[str] = None,
        log_errors: bool = True,
        raise_errors: bool = True
    ):
        self.service_name = service_name
        self.user_id = user_id
        self.operation = operation
        self.log_errors = log_errors
        self.raise_errors = raise_errors
        self.start_time = None
        self.error = None
        self.result = None
    
    async def __aenter__(self):
        self.start_time = datetime.now(timezone.utc)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_val is not None:
            # Handle the error
            if isinstance(exc_val, AppException):
                self.error = exc_val
            else:
                self.error = classify_external_error(exc_val, self.service_name)
            
            # Log if enabled
            if self.log_errors:
                error_id = generate_error_id()
                error_logger.log_error(
                    error_id=error_id,
                    error=self.error,
                    request_context={
                        "service": self.service_name,
                        "operation": self.operation,
                        "duration_ms": self._get_duration_ms()
                    },
                    user_id=self.user_id
                )
            
            # Return True to suppress the exception if not raising
            return not self.raise_errors
        
        return False
    
    def set_result(self, result: Any):
        """Set the operation result"""
        self.result = result
    
    def _get_duration_ms(self) -> float:
        """Get operation duration in milliseconds"""
        if self.start_time:
            delta = datetime.now(timezone.utc) - self.start_time
            return delta.total_seconds() * 1000
        return 0
