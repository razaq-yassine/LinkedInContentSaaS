"""
Error Types and Categories for the Application

Defines all error categories, types, and their mappings to user-friendly messages.
"""
from enum import Enum
from typing import Dict, Optional
from dataclasses import dataclass


class ErrorCategory(str, Enum):
    """High-level error categories"""
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    VALIDATION = "validation"
    DATABASE = "database"
    NETWORK = "network"
    EXTERNAL_SERVICE = "external_service"
    FILE_OPERATION = "file_operation"
    PAYMENT = "payment"
    RATE_LIMIT = "rate_limit"
    RESOURCE = "resource"
    INTERNAL = "internal"
    CONFIGURATION = "configuration"


class ErrorSeverity(str, Enum):
    """Error severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ErrorType(str, Enum):
    """Specific error types with unique identifiers"""
    # Authentication Errors (1xxx)
    AUTH_TOKEN_INVALID = "E1001"
    AUTH_TOKEN_EXPIRED = "E1002"
    AUTH_CREDENTIALS_INVALID = "E1003"
    AUTH_SESSION_EXPIRED = "E1004"
    AUTH_ACCOUNT_LOCKED = "E1005"
    AUTH_EMAIL_NOT_VERIFIED = "E1006"
    AUTH_OAUTH_FAILED = "E1007"
    AUTH_PASSWORD_WEAK = "E1008"
    AUTH_REGISTRATION_FAILED = "E1009"
    AUTH_LOGOUT_FAILED = "E1010"
    
    # Authorization Errors (2xxx)
    AUTHZ_PERMISSION_DENIED = "E2001"
    AUTHZ_RESOURCE_FORBIDDEN = "E2002"
    AUTHZ_ROLE_INSUFFICIENT = "E2003"
    AUTHZ_SUBSCRIPTION_REQUIRED = "E2004"
    AUTHZ_FEATURE_DISABLED = "E2005"
    AUTHZ_ADMIN_ONLY = "E2006"
    
    # Validation Errors (3xxx)
    VALID_FIELD_REQUIRED = "E3001"
    VALID_FIELD_INVALID = "E3002"
    VALID_EMAIL_INVALID = "E3003"
    VALID_PASSWORD_INVALID = "E3004"
    VALID_FILE_TOO_LARGE = "E3005"
    VALID_FILE_TYPE_INVALID = "E3006"
    VALID_DATA_FORMAT = "E3007"
    VALID_INPUT_SANITIZATION = "E3008"
    VALID_LENGTH_EXCEEDED = "E3009"
    VALID_CONTENT_POLICY = "E3010"
    
    # Database Errors (4xxx)
    DB_CONNECTION_FAILED = "E4001"
    DB_QUERY_FAILED = "E4002"
    DB_TRANSACTION_FAILED = "E4003"
    DB_RECORD_NOT_FOUND = "E4004"
    DB_DUPLICATE_ENTRY = "E4005"
    DB_INTEGRITY_ERROR = "E4006"
    DB_POOL_EXHAUSTED = "E4007"
    DB_MIGRATION_FAILED = "E4008"
    DB_TIMEOUT = "E4009"
    
    # Network Errors (5xxx)
    NET_CONNECTION_FAILED = "E5001"
    NET_TIMEOUT = "E5002"
    NET_DNS_FAILED = "E5003"
    NET_SSL_ERROR = "E5004"
    NET_REQUEST_FAILED = "E5005"
    
    # External Service Errors (6xxx)
    EXT_AI_SERVICE_FAILED = "E6001"
    EXT_AI_RATE_LIMITED = "E6002"
    EXT_AI_QUOTA_EXCEEDED = "E6003"
    EXT_AI_INVALID_RESPONSE = "E6004"
    EXT_LINKEDIN_API_FAILED = "E6005"
    EXT_LINKEDIN_TOKEN_EXPIRED = "E6006"
    EXT_LINKEDIN_RATE_LIMITED = "E6007"
    EXT_STRIPE_FAILED = "E6008"
    EXT_STRIPE_PAYMENT_FAILED = "E6009"
    EXT_STRIPE_WEBHOOK_FAILED = "E6010"
    EXT_EMAIL_SEND_FAILED = "E6011"
    EXT_CLOUDFLARE_FAILED = "E6012"
    EXT_SEARCH_FAILED = "E6013"
    
    # File Operation Errors (7xxx)
    FILE_UPLOAD_FAILED = "E7001"
    FILE_DOWNLOAD_FAILED = "E7002"
    FILE_NOT_FOUND = "E7003"
    FILE_PERMISSION_DENIED = "E7004"
    FILE_CORRUPT = "E7005"
    FILE_PROCESSING_FAILED = "E7006"
    FILE_STORAGE_FULL = "E7007"
    
    # Payment Errors (8xxx)
    PAY_CARD_DECLINED = "E8001"
    PAY_INSUFFICIENT_FUNDS = "E8002"
    PAY_CARD_EXPIRED = "E8003"
    PAY_PROCESSING_ERROR = "E8004"
    PAY_SUBSCRIPTION_FAILED = "E8005"
    PAY_REFUND_FAILED = "E8006"
    PAY_INVOICE_FAILED = "E8007"
    
    # Rate Limit Errors (9xxx)
    RATE_API_EXCEEDED = "E9001"
    RATE_GENERATION_EXCEEDED = "E9002"
    RATE_LOGIN_EXCEEDED = "E9003"
    RATE_CREDITS_EXHAUSTED = "E9004"
    RATE_DAILY_LIMIT = "E9005"
    
    # Resource Errors (10xxx)
    RES_NOT_FOUND = "E10001"
    RES_ALREADY_EXISTS = "E10002"
    RES_UNAVAILABLE = "E10003"
    RES_LOCKED = "E10004"
    RES_EXPIRED = "E10005"
    
    # Internal Errors (11xxx)
    INT_UNEXPECTED = "E11001"
    INT_CONFIGURATION = "E11002"
    INT_MEMORY = "E11003"
    INT_TIMEOUT = "E11004"
    INT_SCHEDULER_FAILED = "E11005"
    INT_CACHE_FAILED = "E11006"


@dataclass
class ErrorMapping:
    """Maps technical errors to user-friendly messages"""
    error_type: ErrorType
    category: ErrorCategory
    severity: ErrorSeverity
    user_message: str
    action_hint: Optional[str] = None
    http_status: int = 500


# User-friendly message mappings for all error types
ERROR_MAPPINGS: Dict[ErrorType, ErrorMapping] = {
    # Authentication Errors
    ErrorType.AUTH_TOKEN_INVALID: ErrorMapping(
        error_type=ErrorType.AUTH_TOKEN_INVALID,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.WARNING,
        user_message="Your session has become invalid. Please sign in again.",
        action_hint="Sign in to continue",
        http_status=401
    ),
    ErrorType.AUTH_TOKEN_EXPIRED: ErrorMapping(
        error_type=ErrorType.AUTH_TOKEN_EXPIRED,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.WARNING,
        user_message="Your session has expired. Please sign in again to continue.",
        action_hint="Sign in to continue",
        http_status=401
    ),
    ErrorType.AUTH_CREDENTIALS_INVALID: ErrorMapping(
        error_type=ErrorType.AUTH_CREDENTIALS_INVALID,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.WARNING,
        user_message="We couldn't verify your credentials. Please check your email and password.",
        action_hint="Double-check your login details",
        http_status=401
    ),
    ErrorType.AUTH_SESSION_EXPIRED: ErrorMapping(
        error_type=ErrorType.AUTH_SESSION_EXPIRED,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.INFO,
        user_message="Your session has expired for security reasons. Please sign in again.",
        action_hint="Sign in to continue",
        http_status=401
    ),
    ErrorType.AUTH_ACCOUNT_LOCKED: ErrorMapping(
        error_type=ErrorType.AUTH_ACCOUNT_LOCKED,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.ERROR,
        user_message="Your account has been temporarily locked due to multiple failed login attempts. Please try again later or contact support.",
        action_hint="Wait 15 minutes or contact support",
        http_status=423
    ),
    ErrorType.AUTH_EMAIL_NOT_VERIFIED: ErrorMapping(
        error_type=ErrorType.AUTH_EMAIL_NOT_VERIFIED,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.WARNING,
        user_message="Please verify your email address to continue. Check your inbox for the verification link.",
        action_hint="Check your email inbox",
        http_status=403
    ),
    ErrorType.AUTH_OAUTH_FAILED: ErrorMapping(
        error_type=ErrorType.AUTH_OAUTH_FAILED,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.ERROR,
        user_message="We couldn't complete the sign-in with your account. Please try again.",
        action_hint="Try signing in again",
        http_status=400
    ),
    ErrorType.AUTH_PASSWORD_WEAK: ErrorMapping(
        error_type=ErrorType.AUTH_PASSWORD_WEAK,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.WARNING,
        user_message="Please choose a stronger password with at least 8 characters, including letters and numbers.",
        action_hint="Use a stronger password",
        http_status=400
    ),
    ErrorType.AUTH_REGISTRATION_FAILED: ErrorMapping(
        error_type=ErrorType.AUTH_REGISTRATION_FAILED,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.ERROR,
        user_message="We couldn't create your account. Please try again or contact support if the issue persists.",
        action_hint="Try again or contact support",
        http_status=500
    ),
    ErrorType.AUTH_LOGOUT_FAILED: ErrorMapping(
        error_type=ErrorType.AUTH_LOGOUT_FAILED,
        category=ErrorCategory.AUTHENTICATION,
        severity=ErrorSeverity.WARNING,
        user_message="We had trouble signing you out completely. Please clear your browser cache if needed.",
        action_hint="Clear browser cache",
        http_status=500
    ),
    
    # Authorization Errors
    ErrorType.AUTHZ_PERMISSION_DENIED: ErrorMapping(
        error_type=ErrorType.AUTHZ_PERMISSION_DENIED,
        category=ErrorCategory.AUTHORIZATION,
        severity=ErrorSeverity.WARNING,
        user_message="You don't have permission to perform this action.",
        action_hint="Contact an administrator",
        http_status=403
    ),
    ErrorType.AUTHZ_RESOURCE_FORBIDDEN: ErrorMapping(
        error_type=ErrorType.AUTHZ_RESOURCE_FORBIDDEN,
        category=ErrorCategory.AUTHORIZATION,
        severity=ErrorSeverity.WARNING,
        user_message="You don't have access to this resource.",
        action_hint="Contact an administrator",
        http_status=403
    ),
    ErrorType.AUTHZ_ROLE_INSUFFICIENT: ErrorMapping(
        error_type=ErrorType.AUTHZ_ROLE_INSUFFICIENT,
        category=ErrorCategory.AUTHORIZATION,
        severity=ErrorSeverity.WARNING,
        user_message="Your current role doesn't allow this action. Please contact an administrator.",
        action_hint="Contact an administrator",
        http_status=403
    ),
    ErrorType.AUTHZ_SUBSCRIPTION_REQUIRED: ErrorMapping(
        error_type=ErrorType.AUTHZ_SUBSCRIPTION_REQUIRED,
        category=ErrorCategory.AUTHORIZATION,
        severity=ErrorSeverity.INFO,
        user_message="This feature requires a subscription. Upgrade your plan to unlock it.",
        action_hint="Upgrade your plan",
        http_status=403
    ),
    ErrorType.AUTHZ_FEATURE_DISABLED: ErrorMapping(
        error_type=ErrorType.AUTHZ_FEATURE_DISABLED,
        category=ErrorCategory.AUTHORIZATION,
        severity=ErrorSeverity.INFO,
        user_message="This feature is currently disabled. Please check back later.",
        action_hint="Check back later",
        http_status=503
    ),
    ErrorType.AUTHZ_ADMIN_ONLY: ErrorMapping(
        error_type=ErrorType.AUTHZ_ADMIN_ONLY,
        category=ErrorCategory.AUTHORIZATION,
        severity=ErrorSeverity.WARNING,
        user_message="This action is restricted to administrators only.",
        action_hint="Contact an administrator",
        http_status=403
    ),
    
    # Validation Errors
    ErrorType.VALID_FIELD_REQUIRED: ErrorMapping(
        error_type=ErrorType.VALID_FIELD_REQUIRED,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="Some required information is missing. Please fill in all required fields.",
        action_hint="Complete all required fields",
        http_status=400
    ),
    ErrorType.VALID_FIELD_INVALID: ErrorMapping(
        error_type=ErrorType.VALID_FIELD_INVALID,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="Some information you provided is not valid. Please review the highlighted fields.",
        action_hint="Review and correct the fields",
        http_status=400
    ),
    ErrorType.VALID_EMAIL_INVALID: ErrorMapping(
        error_type=ErrorType.VALID_EMAIL_INVALID,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="Please enter a valid email address.",
        action_hint="Check your email format",
        http_status=400
    ),
    ErrorType.VALID_PASSWORD_INVALID: ErrorMapping(
        error_type=ErrorType.VALID_PASSWORD_INVALID,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="Your password doesn't meet the security requirements.",
        action_hint="Use a stronger password",
        http_status=400
    ),
    ErrorType.VALID_FILE_TOO_LARGE: ErrorMapping(
        error_type=ErrorType.VALID_FILE_TOO_LARGE,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="The file you're trying to upload is too large. Please choose a smaller file.",
        action_hint="Reduce file size or choose another",
        http_status=413
    ),
    ErrorType.VALID_FILE_TYPE_INVALID: ErrorMapping(
        error_type=ErrorType.VALID_FILE_TYPE_INVALID,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="This file type is not supported. Please upload a file in a supported format.",
        action_hint="Use a supported file format",
        http_status=415
    ),
    ErrorType.VALID_DATA_FORMAT: ErrorMapping(
        error_type=ErrorType.VALID_DATA_FORMAT,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="The data format is incorrect. Please check your input.",
        action_hint="Review the input format",
        http_status=400
    ),
    ErrorType.VALID_INPUT_SANITIZATION: ErrorMapping(
        error_type=ErrorType.VALID_INPUT_SANITIZATION,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="Your input contains invalid characters. Please remove special characters.",
        action_hint="Remove special characters",
        http_status=400
    ),
    ErrorType.VALID_LENGTH_EXCEEDED: ErrorMapping(
        error_type=ErrorType.VALID_LENGTH_EXCEEDED,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="Your input exceeds the maximum allowed length. Please shorten it.",
        action_hint="Shorten your input",
        http_status=400
    ),
    ErrorType.VALID_CONTENT_POLICY: ErrorMapping(
        error_type=ErrorType.VALID_CONTENT_POLICY,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.WARNING,
        user_message="Your content doesn't comply with our content policy. Please review and modify it.",
        action_hint="Review content guidelines",
        http_status=400
    ),
    
    # Database Errors
    ErrorType.DB_CONNECTION_FAILED: ErrorMapping(
        error_type=ErrorType.DB_CONNECTION_FAILED,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.CRITICAL,
        user_message="We're having trouble connecting to our servers. Please try again in a moment.",
        action_hint="Wait a moment and retry",
        http_status=503
    ),
    ErrorType.DB_QUERY_FAILED: ErrorMapping(
        error_type=ErrorType.DB_QUERY_FAILED,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.ERROR,
        user_message="We're having trouble processing your request. Please try again.",
        action_hint="Try again",
        http_status=500
    ),
    ErrorType.DB_TRANSACTION_FAILED: ErrorMapping(
        error_type=ErrorType.DB_TRANSACTION_FAILED,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.ERROR,
        user_message="We couldn't save your changes. Please try again.",
        action_hint="Try again",
        http_status=500
    ),
    ErrorType.DB_RECORD_NOT_FOUND: ErrorMapping(
        error_type=ErrorType.DB_RECORD_NOT_FOUND,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.WARNING,
        user_message="The item you're looking for could not be found.",
        action_hint="Check the URL or go back",
        http_status=404
    ),
    ErrorType.DB_DUPLICATE_ENTRY: ErrorMapping(
        error_type=ErrorType.DB_DUPLICATE_ENTRY,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.WARNING,
        user_message="This item already exists. Please use a different value.",
        action_hint="Use a unique value",
        http_status=409
    ),
    ErrorType.DB_INTEGRITY_ERROR: ErrorMapping(
        error_type=ErrorType.DB_INTEGRITY_ERROR,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.ERROR,
        user_message="We couldn't complete this operation due to a data conflict. Please try again.",
        action_hint="Try again",
        http_status=409
    ),
    ErrorType.DB_POOL_EXHAUSTED: ErrorMapping(
        error_type=ErrorType.DB_POOL_EXHAUSTED,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.CRITICAL,
        user_message="Our servers are experiencing high load. Please try again in a few moments.",
        action_hint="Wait and retry",
        http_status=503
    ),
    ErrorType.DB_MIGRATION_FAILED: ErrorMapping(
        error_type=ErrorType.DB_MIGRATION_FAILED,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.CRITICAL,
        user_message="A system update is in progress. Please try again shortly.",
        action_hint="Wait for update completion",
        http_status=503
    ),
    ErrorType.DB_TIMEOUT: ErrorMapping(
        error_type=ErrorType.DB_TIMEOUT,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.ERROR,
        user_message="The operation took too long. Please try again.",
        action_hint="Try again",
        http_status=504
    ),
    
    # Network Errors
    ErrorType.NET_CONNECTION_FAILED: ErrorMapping(
        error_type=ErrorType.NET_CONNECTION_FAILED,
        category=ErrorCategory.NETWORK,
        severity=ErrorSeverity.ERROR,
        user_message="Connection issue detected. Please check your internet connection.",
        action_hint="Check your connection",
        http_status=502
    ),
    ErrorType.NET_TIMEOUT: ErrorMapping(
        error_type=ErrorType.NET_TIMEOUT,
        category=ErrorCategory.NETWORK,
        severity=ErrorSeverity.WARNING,
        user_message="The request timed out. Please check your connection and try again.",
        action_hint="Check connection and retry",
        http_status=504
    ),
    ErrorType.NET_DNS_FAILED: ErrorMapping(
        error_type=ErrorType.NET_DNS_FAILED,
        category=ErrorCategory.NETWORK,
        severity=ErrorSeverity.ERROR,
        user_message="We couldn't reach the server. Please check your internet connection.",
        action_hint="Check your connection",
        http_status=502
    ),
    ErrorType.NET_SSL_ERROR: ErrorMapping(
        error_type=ErrorType.NET_SSL_ERROR,
        category=ErrorCategory.NETWORK,
        severity=ErrorSeverity.CRITICAL,
        user_message="A secure connection couldn't be established. Please try again later.",
        action_hint="Try again later",
        http_status=502
    ),
    ErrorType.NET_REQUEST_FAILED: ErrorMapping(
        error_type=ErrorType.NET_REQUEST_FAILED,
        category=ErrorCategory.NETWORK,
        severity=ErrorSeverity.ERROR,
        user_message="The request failed. Please try again.",
        action_hint="Try again",
        http_status=502
    ),
    
    # External Service Errors
    ErrorType.EXT_AI_SERVICE_FAILED: ErrorMapping(
        error_type=ErrorType.EXT_AI_SERVICE_FAILED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.ERROR,
        user_message="Our AI service is temporarily unavailable. Please try again in a moment.",
        action_hint="Wait and retry",
        http_status=503
    ),
    ErrorType.EXT_AI_RATE_LIMITED: ErrorMapping(
        error_type=ErrorType.EXT_AI_RATE_LIMITED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.WARNING,
        user_message="You're generating content too quickly. Please wait a moment before trying again.",
        action_hint="Wait before retrying",
        http_status=429
    ),
    ErrorType.EXT_AI_QUOTA_EXCEEDED: ErrorMapping(
        error_type=ErrorType.EXT_AI_QUOTA_EXCEEDED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.WARNING,
        user_message="You've reached your content generation limit. Please upgrade your plan or wait for the reset.",
        action_hint="Upgrade or wait for reset",
        http_status=429
    ),
    ErrorType.EXT_AI_INVALID_RESPONSE: ErrorMapping(
        error_type=ErrorType.EXT_AI_INVALID_RESPONSE,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.ERROR,
        user_message="The AI couldn't generate a proper response. Please try again with different input.",
        action_hint="Try different input",
        http_status=500
    ),
    ErrorType.EXT_LINKEDIN_API_FAILED: ErrorMapping(
        error_type=ErrorType.EXT_LINKEDIN_API_FAILED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.ERROR,
        user_message="We couldn't connect to LinkedIn. Please try again later.",
        action_hint="Try again later",
        http_status=503
    ),
    ErrorType.EXT_LINKEDIN_TOKEN_EXPIRED: ErrorMapping(
        error_type=ErrorType.EXT_LINKEDIN_TOKEN_EXPIRED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.WARNING,
        user_message="Your LinkedIn connection has expired. Please reconnect your account.",
        action_hint="Reconnect LinkedIn account",
        http_status=401
    ),
    ErrorType.EXT_LINKEDIN_RATE_LIMITED: ErrorMapping(
        error_type=ErrorType.EXT_LINKEDIN_RATE_LIMITED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.WARNING,
        user_message="LinkedIn is limiting our requests. Please wait a few minutes before trying again.",
        action_hint="Wait a few minutes",
        http_status=429
    ),
    ErrorType.EXT_STRIPE_FAILED: ErrorMapping(
        error_type=ErrorType.EXT_STRIPE_FAILED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.ERROR,
        user_message="Payment service is temporarily unavailable. Please try again.",
        action_hint="Try again",
        http_status=503
    ),
    ErrorType.EXT_STRIPE_PAYMENT_FAILED: ErrorMapping(
        error_type=ErrorType.EXT_STRIPE_PAYMENT_FAILED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.WARNING,
        user_message="Your payment could not be processed. Please check your payment details.",
        action_hint="Check payment details",
        http_status=402
    ),
    ErrorType.EXT_STRIPE_WEBHOOK_FAILED: ErrorMapping(
        error_type=ErrorType.EXT_STRIPE_WEBHOOK_FAILED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.ERROR,
        user_message="Payment processing encountered an issue. Your payment is safe.",
        action_hint="Contact support if issue persists",
        http_status=500
    ),
    ErrorType.EXT_EMAIL_SEND_FAILED: ErrorMapping(
        error_type=ErrorType.EXT_EMAIL_SEND_FAILED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.WARNING,
        user_message="We couldn't send the email. Please try again or check your email address.",
        action_hint="Try again",
        http_status=503
    ),
    ErrorType.EXT_CLOUDFLARE_FAILED: ErrorMapping(
        error_type=ErrorType.EXT_CLOUDFLARE_FAILED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.ERROR,
        user_message="Image service is temporarily unavailable. Please try again.",
        action_hint="Try again",
        http_status=503
    ),
    ErrorType.EXT_SEARCH_FAILED: ErrorMapping(
        error_type=ErrorType.EXT_SEARCH_FAILED,
        category=ErrorCategory.EXTERNAL_SERVICE,
        severity=ErrorSeverity.WARNING,
        user_message="Web search is temporarily unavailable. Content will be generated without web search.",
        action_hint="Proceed without search",
        http_status=503
    ),
    
    # File Operation Errors
    ErrorType.FILE_UPLOAD_FAILED: ErrorMapping(
        error_type=ErrorType.FILE_UPLOAD_FAILED,
        category=ErrorCategory.FILE_OPERATION,
        severity=ErrorSeverity.ERROR,
        user_message="File upload failed. Please try again with a different file.",
        action_hint="Try a different file",
        http_status=500
    ),
    ErrorType.FILE_DOWNLOAD_FAILED: ErrorMapping(
        error_type=ErrorType.FILE_DOWNLOAD_FAILED,
        category=ErrorCategory.FILE_OPERATION,
        severity=ErrorSeverity.ERROR,
        user_message="File download failed. Please try again.",
        action_hint="Try again",
        http_status=500
    ),
    ErrorType.FILE_NOT_FOUND: ErrorMapping(
        error_type=ErrorType.FILE_NOT_FOUND,
        category=ErrorCategory.FILE_OPERATION,
        severity=ErrorSeverity.WARNING,
        user_message="The file you're looking for could not be found.",
        action_hint="Check the file path",
        http_status=404
    ),
    ErrorType.FILE_PERMISSION_DENIED: ErrorMapping(
        error_type=ErrorType.FILE_PERMISSION_DENIED,
        category=ErrorCategory.FILE_OPERATION,
        severity=ErrorSeverity.ERROR,
        user_message="You don't have permission to access this file.",
        action_hint="Contact administrator",
        http_status=403
    ),
    ErrorType.FILE_CORRUPT: ErrorMapping(
        error_type=ErrorType.FILE_CORRUPT,
        category=ErrorCategory.FILE_OPERATION,
        severity=ErrorSeverity.ERROR,
        user_message="The file appears to be corrupted. Please upload a different file.",
        action_hint="Upload a different file",
        http_status=422
    ),
    ErrorType.FILE_PROCESSING_FAILED: ErrorMapping(
        error_type=ErrorType.FILE_PROCESSING_FAILED,
        category=ErrorCategory.FILE_OPERATION,
        severity=ErrorSeverity.ERROR,
        user_message="We couldn't process your file. Please try a different format.",
        action_hint="Try a different format",
        http_status=422
    ),
    ErrorType.FILE_STORAGE_FULL: ErrorMapping(
        error_type=ErrorType.FILE_STORAGE_FULL,
        category=ErrorCategory.FILE_OPERATION,
        severity=ErrorSeverity.CRITICAL,
        user_message="Storage is currently full. Please contact support.",
        action_hint="Contact support",
        http_status=507
    ),
    
    # Payment Errors
    ErrorType.PAY_CARD_DECLINED: ErrorMapping(
        error_type=ErrorType.PAY_CARD_DECLINED,
        category=ErrorCategory.PAYMENT,
        severity=ErrorSeverity.WARNING,
        user_message="Your card was declined. Please try a different payment method.",
        action_hint="Try a different card",
        http_status=402
    ),
    ErrorType.PAY_INSUFFICIENT_FUNDS: ErrorMapping(
        error_type=ErrorType.PAY_INSUFFICIENT_FUNDS,
        category=ErrorCategory.PAYMENT,
        severity=ErrorSeverity.WARNING,
        user_message="Insufficient funds. Please try a different payment method.",
        action_hint="Try a different payment method",
        http_status=402
    ),
    ErrorType.PAY_CARD_EXPIRED: ErrorMapping(
        error_type=ErrorType.PAY_CARD_EXPIRED,
        category=ErrorCategory.PAYMENT,
        severity=ErrorSeverity.WARNING,
        user_message="Your card has expired. Please update your payment method.",
        action_hint="Update payment method",
        http_status=402
    ),
    ErrorType.PAY_PROCESSING_ERROR: ErrorMapping(
        error_type=ErrorType.PAY_PROCESSING_ERROR,
        category=ErrorCategory.PAYMENT,
        severity=ErrorSeverity.ERROR,
        user_message="Payment processing failed. Please try again.",
        action_hint="Try again",
        http_status=500
    ),
    ErrorType.PAY_SUBSCRIPTION_FAILED: ErrorMapping(
        error_type=ErrorType.PAY_SUBSCRIPTION_FAILED,
        category=ErrorCategory.PAYMENT,
        severity=ErrorSeverity.ERROR,
        user_message="Subscription update failed. Please try again or contact support.",
        action_hint="Try again or contact support",
        http_status=500
    ),
    ErrorType.PAY_REFUND_FAILED: ErrorMapping(
        error_type=ErrorType.PAY_REFUND_FAILED,
        category=ErrorCategory.PAYMENT,
        severity=ErrorSeverity.ERROR,
        user_message="Refund processing failed. Our team will review this manually.",
        action_hint="Contact support",
        http_status=500
    ),
    ErrorType.PAY_INVOICE_FAILED: ErrorMapping(
        error_type=ErrorType.PAY_INVOICE_FAILED,
        category=ErrorCategory.PAYMENT,
        severity=ErrorSeverity.ERROR,
        user_message="Invoice generation failed. Please try again.",
        action_hint="Try again",
        http_status=500
    ),
    
    # Rate Limit Errors
    ErrorType.RATE_API_EXCEEDED: ErrorMapping(
        error_type=ErrorType.RATE_API_EXCEEDED,
        category=ErrorCategory.RATE_LIMIT,
        severity=ErrorSeverity.WARNING,
        user_message="You're making requests too quickly. Please slow down.",
        action_hint="Wait before retrying",
        http_status=429
    ),
    ErrorType.RATE_GENERATION_EXCEEDED: ErrorMapping(
        error_type=ErrorType.RATE_GENERATION_EXCEEDED,
        category=ErrorCategory.RATE_LIMIT,
        severity=ErrorSeverity.WARNING,
        user_message="You've reached your generation limit. Please wait or upgrade your plan.",
        action_hint="Wait or upgrade",
        http_status=429
    ),
    ErrorType.RATE_LOGIN_EXCEEDED: ErrorMapping(
        error_type=ErrorType.RATE_LOGIN_EXCEEDED,
        category=ErrorCategory.RATE_LIMIT,
        severity=ErrorSeverity.WARNING,
        user_message="Too many login attempts. Please wait before trying again.",
        action_hint="Wait 15 minutes",
        http_status=429
    ),
    ErrorType.RATE_CREDITS_EXHAUSTED: ErrorMapping(
        error_type=ErrorType.RATE_CREDITS_EXHAUSTED,
        category=ErrorCategory.RATE_LIMIT,
        severity=ErrorSeverity.WARNING,
        user_message="You've used all your credits for this month. Upgrade your plan or wait for the reset.",
        action_hint="Upgrade your plan",
        http_status=429
    ),
    ErrorType.RATE_DAILY_LIMIT: ErrorMapping(
        error_type=ErrorType.RATE_DAILY_LIMIT,
        category=ErrorCategory.RATE_LIMIT,
        severity=ErrorSeverity.WARNING,
        user_message="You've reached your daily limit. Come back tomorrow or upgrade your plan.",
        action_hint="Wait or upgrade",
        http_status=429
    ),
    
    # Resource Errors
    ErrorType.RES_NOT_FOUND: ErrorMapping(
        error_type=ErrorType.RES_NOT_FOUND,
        category=ErrorCategory.RESOURCE,
        severity=ErrorSeverity.WARNING,
        user_message="The item you're looking for doesn't exist or has been removed.",
        action_hint="Go back and try again",
        http_status=404
    ),
    ErrorType.RES_ALREADY_EXISTS: ErrorMapping(
        error_type=ErrorType.RES_ALREADY_EXISTS,
        category=ErrorCategory.RESOURCE,
        severity=ErrorSeverity.WARNING,
        user_message="This item already exists. Please use a different name or identifier.",
        action_hint="Use a unique name",
        http_status=409
    ),
    ErrorType.RES_UNAVAILABLE: ErrorMapping(
        error_type=ErrorType.RES_UNAVAILABLE,
        category=ErrorCategory.RESOURCE,
        severity=ErrorSeverity.WARNING,
        user_message="This resource is currently unavailable. Please try again later.",
        action_hint="Try again later",
        http_status=503
    ),
    ErrorType.RES_LOCKED: ErrorMapping(
        error_type=ErrorType.RES_LOCKED,
        category=ErrorCategory.RESOURCE,
        severity=ErrorSeverity.WARNING,
        user_message="This resource is currently locked. Please try again later.",
        action_hint="Wait and retry",
        http_status=423
    ),
    ErrorType.RES_EXPIRED: ErrorMapping(
        error_type=ErrorType.RES_EXPIRED,
        category=ErrorCategory.RESOURCE,
        severity=ErrorSeverity.WARNING,
        user_message="This resource has expired and is no longer available.",
        action_hint="Request a new one",
        http_status=410
    ),
    
    # Internal Errors
    ErrorType.INT_UNEXPECTED: ErrorMapping(
        error_type=ErrorType.INT_UNEXPECTED,
        category=ErrorCategory.INTERNAL,
        severity=ErrorSeverity.CRITICAL,
        user_message="An unexpected error occurred. Our team has been notified. Please try again.",
        action_hint="Try again",
        http_status=500
    ),
    ErrorType.INT_CONFIGURATION: ErrorMapping(
        error_type=ErrorType.INT_CONFIGURATION,
        category=ErrorCategory.INTERNAL,
        severity=ErrorSeverity.CRITICAL,
        user_message="A system configuration issue occurred. Our team has been notified.",
        action_hint="Contact support",
        http_status=500
    ),
    ErrorType.INT_MEMORY: ErrorMapping(
        error_type=ErrorType.INT_MEMORY,
        category=ErrorCategory.INTERNAL,
        severity=ErrorSeverity.CRITICAL,
        user_message="The system is under heavy load. Please try again in a few moments.",
        action_hint="Wait and retry",
        http_status=503
    ),
    ErrorType.INT_TIMEOUT: ErrorMapping(
        error_type=ErrorType.INT_TIMEOUT,
        category=ErrorCategory.INTERNAL,
        severity=ErrorSeverity.ERROR,
        user_message="The operation took too long. Please try again.",
        action_hint="Try again",
        http_status=504
    ),
    ErrorType.INT_SCHEDULER_FAILED: ErrorMapping(
        error_type=ErrorType.INT_SCHEDULER_FAILED,
        category=ErrorCategory.INTERNAL,
        severity=ErrorSeverity.ERROR,
        user_message="Scheduled task failed. Our team has been notified.",
        action_hint="Contact support",
        http_status=500
    ),
    ErrorType.INT_CACHE_FAILED: ErrorMapping(
        error_type=ErrorType.INT_CACHE_FAILED,
        category=ErrorCategory.INTERNAL,
        severity=ErrorSeverity.WARNING,
        user_message="A temporary issue occurred. Please try again.",
        action_hint="Try again",
        http_status=500
    ),
}


def get_error_mapping(error_type: ErrorType) -> ErrorMapping:
    """Get the error mapping for a specific error type"""
    return ERROR_MAPPINGS.get(error_type, ERROR_MAPPINGS[ErrorType.INT_UNEXPECTED])


def get_user_message(error_type: ErrorType) -> str:
    """Get the user-friendly message for an error type"""
    mapping = get_error_mapping(error_type)
    return mapping.user_message
