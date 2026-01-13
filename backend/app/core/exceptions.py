"""
Custom Exception Classes for the Application

Provides structured exceptions that map to user-friendly error messages.
"""
from typing import Optional, Dict, Any
from .error_types import ErrorType, ErrorCategory, ErrorSeverity, get_error_mapping


class AppException(Exception):
    """
    Base exception class for all application errors.
    
    All custom exceptions should inherit from this class to ensure
    consistent error handling and user-friendly message mapping.
    """
    
    def __init__(
        self,
        error_type: ErrorType,
        technical_message: str = None,
        user_message: str = None,
        details: Dict[str, Any] = None,
        original_exception: Exception = None,
        http_status: int = None
    ):
        self.error_type = error_type
        self.mapping = get_error_mapping(error_type)
        
        # Technical message for logging (never shown to users)
        if technical_message:
            self.technical_message = technical_message
        elif original_exception:
            self.technical_message = str(original_exception)
        else:
            self.technical_message = None
        
        # User-facing message (can be overridden)
        self.user_message = user_message or self.mapping.user_message
        
        # Action hint for the user
        self.action_hint = self.mapping.action_hint
        
        # Additional details (sanitized before logging)
        self.details = details or {}
        
        # Original exception for stack trace
        self.original_exception = original_exception
        
        # HTTP status code
        self.http_status = http_status or self.mapping.http_status
        
        # Category and severity from mapping
        self.category = self.mapping.category
        self.severity = self.mapping.severity
        
        super().__init__(self.user_message)
    
    def to_dict(self, include_technical: bool = False) -> Dict[str, Any]:
        """Convert exception to dictionary for API response"""
        result = {
            "error_code": self.error_type.value,
            "user_message": self.user_message,
            "action_hint": self.action_hint,
            "category": self.category.value,
        }
        
        if include_technical:
            result["technical_message"] = self.technical_message
            result["details"] = self.details
            result["severity"] = self.severity.value
        
        return result


# Authentication Exceptions
class AuthenticationError(AppException):
    """Errors related to authentication (login, tokens, sessions)"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.AUTH_CREDENTIALS_INVALID,
        technical_message: str = None,
        user_message: str = None,
        details: Dict[str, Any] = None,
        original_exception: Exception = None
    ):
        super().__init__(
            error_type=error_type,
            technical_message=technical_message,
            user_message=user_message,
            details=details,
            original_exception=original_exception
        )


class TokenExpiredError(AuthenticationError):
    """Token has expired"""
    
    def __init__(self, technical_message: str = None):
        super().__init__(
            error_type=ErrorType.AUTH_TOKEN_EXPIRED,
            technical_message=technical_message
        )


class TokenInvalidError(AuthenticationError):
    """Token is invalid"""
    
    def __init__(self, technical_message: str = None):
        super().__init__(
            error_type=ErrorType.AUTH_TOKEN_INVALID,
            technical_message=technical_message
        )


class CredentialsInvalidError(AuthenticationError):
    """Invalid credentials"""
    
    def __init__(self, technical_message: str = None):
        super().__init__(
            error_type=ErrorType.AUTH_CREDENTIALS_INVALID,
            technical_message=technical_message
        )


class EmailNotVerifiedError(AuthenticationError):
    """Email not verified"""
    
    def __init__(self, email: str = None):
        super().__init__(
            error_type=ErrorType.AUTH_EMAIL_NOT_VERIFIED,
            details={"email": email} if email else None
        )


class OAuthError(AuthenticationError):
    """OAuth authentication failed"""
    
    def __init__(self, provider: str = None, technical_message: str = None):
        super().__init__(
            error_type=ErrorType.AUTH_OAUTH_FAILED,
            technical_message=technical_message,
            details={"provider": provider} if provider else None
        )


# Authorization Exceptions
class AuthorizationError(AppException):
    """Errors related to authorization (permissions, roles)"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.AUTHZ_PERMISSION_DENIED,
        technical_message: str = None,
        user_message: str = None,
        details: Dict[str, Any] = None,
        original_exception: Exception = None
    ):
        super().__init__(
            error_type=error_type,
            technical_message=technical_message,
            user_message=user_message,
            details=details,
            original_exception=original_exception
        )


class PermissionDeniedError(AuthorizationError):
    """User doesn't have required permission"""
    
    def __init__(self, resource: str = None, action: str = None):
        super().__init__(
            error_type=ErrorType.AUTHZ_PERMISSION_DENIED,
            details={"resource": resource, "action": action}
        )


class SubscriptionRequiredError(AuthorizationError):
    """Feature requires subscription"""
    
    def __init__(self, feature: str = None, required_plan: str = None):
        super().__init__(
            error_type=ErrorType.AUTHZ_SUBSCRIPTION_REQUIRED,
            details={"feature": feature, "required_plan": required_plan}
        )


class FeatureDisabledError(AuthorizationError):
    """Feature is disabled"""
    
    def __init__(self, feature: str = None):
        super().__init__(
            error_type=ErrorType.AUTHZ_FEATURE_DISABLED,
            details={"feature": feature}
        )


# Validation Exceptions
class ValidationError(AppException):
    """Errors related to input validation"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.VALID_FIELD_INVALID,
        technical_message: str = None,
        user_message: str = None,
        details: Dict[str, Any] = None,
        field_errors: Dict[str, str] = None,
        original_exception: Exception = None
    ):
        if field_errors:
            details = details or {}
            details["field_errors"] = field_errors
        
        super().__init__(
            error_type=error_type,
            technical_message=technical_message,
            user_message=user_message,
            details=details,
            original_exception=original_exception
        )


class FieldRequiredError(ValidationError):
    """Required field is missing"""
    
    def __init__(self, field: str):
        super().__init__(
            error_type=ErrorType.VALID_FIELD_REQUIRED,
            field_errors={field: "This field is required"}
        )


class FileTooLargeError(ValidationError):
    """File exceeds size limit"""
    
    def __init__(self, max_size_mb: float = None, actual_size_mb: float = None):
        super().__init__(
            error_type=ErrorType.VALID_FILE_TOO_LARGE,
            details={"max_size_mb": max_size_mb, "actual_size_mb": actual_size_mb}
        )


class FileTypeInvalidError(ValidationError):
    """File type not allowed"""
    
    def __init__(self, allowed_types: list = None, actual_type: str = None):
        super().__init__(
            error_type=ErrorType.VALID_FILE_TYPE_INVALID,
            details={"allowed_types": allowed_types, "actual_type": actual_type}
        )


# Database Exceptions
class DatabaseError(AppException):
    """Errors related to database operations"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.DB_QUERY_FAILED,
        technical_message: str = None,
        user_message: str = None,
        details: Dict[str, Any] = None,
        original_exception: Exception = None
    ):
        super().__init__(
            error_type=error_type,
            technical_message=technical_message,
            user_message=user_message,
            details=details,
            original_exception=original_exception
        )


class RecordNotFoundError(DatabaseError):
    """Record not found in database"""
    
    def __init__(self, resource_type: str = None, resource_id: str = None):
        super().__init__(
            error_type=ErrorType.DB_RECORD_NOT_FOUND,
            details={"resource_type": resource_type, "resource_id": resource_id}
        )


class DuplicateEntryError(DatabaseError):
    """Duplicate entry in database"""
    
    def __init__(self, field: str = None, value: str = None):
        super().__init__(
            error_type=ErrorType.DB_DUPLICATE_ENTRY,
            details={"field": field}  # Don't log the actual value for security
        )


class ConnectionError(DatabaseError):
    """Database connection failed"""
    
    def __init__(self, technical_message: str = None):
        super().__init__(
            error_type=ErrorType.DB_CONNECTION_FAILED,
            technical_message=technical_message
        )


# External Service Exceptions
class ExternalServiceError(AppException):
    """Errors from external services (AI, LinkedIn, Stripe, etc.)"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.EXT_AI_SERVICE_FAILED,
        service_name: str = None,
        technical_message: str = None,
        user_message: str = None,
        details: Dict[str, Any] = None,
        original_exception: Exception = None
    ):
        if service_name:
            details = details or {}
            details["service"] = service_name
        
        super().__init__(
            error_type=error_type,
            technical_message=technical_message,
            user_message=user_message,
            details=details,
            original_exception=original_exception
        )


class AIServiceError(ExternalServiceError):
    """AI service errors"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.EXT_AI_SERVICE_FAILED,
        provider: str = None,
        technical_message: str = None,
        original_exception: Exception = None
    ):
        super().__init__(
            error_type=error_type,
            service_name=provider or "AI",
            technical_message=technical_message,
            original_exception=original_exception
        )


class AIRateLimitError(AIServiceError):
    """AI service rate limited"""
    
    def __init__(self, provider: str = None, retry_after: int = None):
        super().__init__(
            error_type=ErrorType.EXT_AI_RATE_LIMITED,
            provider=provider
        )
        if retry_after:
            self.details["retry_after"] = retry_after


class LinkedInAPIError(ExternalServiceError):
    """LinkedIn API errors"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.EXT_LINKEDIN_API_FAILED,
        technical_message: str = None,
        original_exception: Exception = None
    ):
        super().__init__(
            error_type=error_type,
            service_name="LinkedIn",
            technical_message=technical_message,
            original_exception=original_exception
        )


class LinkedInTokenExpiredError(LinkedInAPIError):
    """LinkedIn access token expired"""
    
    def __init__(self):
        super().__init__(error_type=ErrorType.EXT_LINKEDIN_TOKEN_EXPIRED)


class StripeError(ExternalServiceError):
    """Stripe payment errors"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.EXT_STRIPE_FAILED,
        technical_message: str = None,
        original_exception: Exception = None
    ):
        super().__init__(
            error_type=error_type,
            service_name="Stripe",
            technical_message=technical_message,
            original_exception=original_exception
        )


class PaymentFailedError(StripeError):
    """Payment processing failed"""
    
    def __init__(self, decline_code: str = None, technical_message: str = None):
        # Map Stripe decline codes to appropriate error types
        error_type = ErrorType.EXT_STRIPE_PAYMENT_FAILED
        if decline_code == "insufficient_funds":
            error_type = ErrorType.PAY_INSUFFICIENT_FUNDS
        elif decline_code == "expired_card":
            error_type = ErrorType.PAY_CARD_EXPIRED
        elif decline_code in ["card_declined", "do_not_honor"]:
            error_type = ErrorType.PAY_CARD_DECLINED
        
        super().__init__(
            error_type=error_type,
            technical_message=technical_message
        )


class EmailServiceError(ExternalServiceError):
    """Email service errors"""
    
    def __init__(self, technical_message: str = None, original_exception: Exception = None):
        super().__init__(
            error_type=ErrorType.EXT_EMAIL_SEND_FAILED,
            service_name="Email",
            technical_message=technical_message,
            original_exception=original_exception
        )


# Rate Limit Exceptions
class RateLimitError(AppException):
    """Rate limit exceeded errors"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.RATE_API_EXCEEDED,
        retry_after: int = None,
        limit_type: str = None,
        technical_message: str = None
    ):
        details = {}
        if retry_after:
            details["retry_after"] = retry_after
        if limit_type:
            details["limit_type"] = limit_type
        
        super().__init__(
            error_type=error_type,
            technical_message=technical_message,
            details=details if details else None
        )


class CreditsExhaustedError(RateLimitError):
    """User has no more credits"""
    
    def __init__(self, credits_used: int = None, credits_limit: int = None):
        super().__init__(
            error_type=ErrorType.RATE_CREDITS_EXHAUSTED,
            limit_type="credits"
        )
        if credits_used is not None:
            self.details["credits_used"] = credits_used
        if credits_limit is not None:
            self.details["credits_limit"] = credits_limit


class DailyLimitError(RateLimitError):
    """Daily limit reached"""
    
    def __init__(self, reset_time: str = None):
        super().__init__(
            error_type=ErrorType.RATE_DAILY_LIMIT,
            limit_type="daily"
        )
        if reset_time:
            self.details["reset_time"] = reset_time


# File Operation Exceptions
class FileOperationError(AppException):
    """File operation errors"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.FILE_PROCESSING_FAILED,
        technical_message: str = None,
        user_message: str = None,
        details: Dict[str, Any] = None,
        original_exception: Exception = None
    ):
        super().__init__(
            error_type=error_type,
            technical_message=technical_message,
            user_message=user_message,
            details=details,
            original_exception=original_exception
        )


class FileUploadError(FileOperationError):
    """File upload failed"""
    
    def __init__(self, technical_message: str = None, filename: str = None):
        super().__init__(
            error_type=ErrorType.FILE_UPLOAD_FAILED,
            technical_message=technical_message,
            details={"filename": filename} if filename else None
        )


class FileNotFoundError(FileOperationError):
    """File not found"""
    
    def __init__(self, filename: str = None):
        super().__init__(
            error_type=ErrorType.FILE_NOT_FOUND,
            details={"filename": filename} if filename else None
        )


# Resource Exceptions
class ResourceError(AppException):
    """Resource-related errors"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.RES_NOT_FOUND,
        resource_type: str = None,
        resource_id: str = None,
        technical_message: str = None
    ):
        details = {}
        if resource_type:
            details["resource_type"] = resource_type
        if resource_id:
            details["resource_id"] = resource_id
        
        super().__init__(
            error_type=error_type,
            technical_message=technical_message,
            details=details if details else None
        )


class ResourceNotFoundError(ResourceError):
    """Resource not found"""
    
    def __init__(self, resource_type: str = None, resource_id: str = None):
        super().__init__(
            error_type=ErrorType.RES_NOT_FOUND,
            resource_type=resource_type,
            resource_id=resource_id
        )


class ResourceAlreadyExistsError(ResourceError):
    """Resource already exists"""
    
    def __init__(self, resource_type: str = None, identifier: str = None):
        super().__init__(
            error_type=ErrorType.RES_ALREADY_EXISTS,
            resource_type=resource_type
        )


# Internal Exceptions
class InternalError(AppException):
    """Internal system errors"""
    
    def __init__(
        self,
        error_type: ErrorType = ErrorType.INT_UNEXPECTED,
        technical_message: str = None,
        original_exception: Exception = None
    ):
        super().__init__(
            error_type=error_type,
            technical_message=technical_message,
            original_exception=original_exception
        )


class ConfigurationError(InternalError):
    """Configuration error"""
    
    def __init__(self, config_key: str = None, technical_message: str = None):
        super().__init__(
            error_type=ErrorType.INT_CONFIGURATION,
            technical_message=technical_message
        )


class TimeoutError(InternalError):
    """Operation timeout"""
    
    def __init__(self, operation: str = None, timeout_seconds: int = None):
        super().__init__(
            error_type=ErrorType.INT_TIMEOUT,
            technical_message=f"Operation '{operation}' timed out after {timeout_seconds}s" if operation else None
        )
