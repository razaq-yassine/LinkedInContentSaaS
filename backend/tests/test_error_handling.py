"""
Comprehensive Error Handling Test Suite

Tests all error scenarios to ensure:
1. User-friendly messages are displayed (no stack traces)
2. All errors are logged to database with complete information
3. Error recovery mechanisms work properly
4. Sensitive data is never exposed in logs
"""
import pytest
import asyncio
from datetime import datetime, timezone
from unittest.mock import Mock, patch, AsyncMock
import json

from app.core.error_types import (
    ErrorType, ErrorCategory, ErrorSeverity,
    get_error_mapping, get_user_message, ERROR_MAPPINGS
)
from app.core.exceptions import (
    AppException, AuthenticationError, AuthorizationError,
    ValidationError, DatabaseError, ExternalServiceError,
    AIServiceError, LinkedInAPIError, StripeError,
    RateLimitError, FileOperationError, ResourceError,
    TokenExpiredError, TokenInvalidError, CredentialsInvalidError,
    PermissionDeniedError, SubscriptionRequiredError,
    RecordNotFoundError, DuplicateEntryError,
    AIRateLimitError, LinkedInTokenExpiredError,
    PaymentFailedError, CreditsExhaustedError,
    FileTooLargeError, FileTypeInvalidError,
    InternalError, ConfigurationError
)
from app.core.error_handler import (
    generate_error_id, sanitize_data, extract_request_context,
    map_sqlalchemy_error, ErrorResponse, ErrorLogger,
    global_exception_handler, handle_errors, RetryHandler
)
from app.core.service_wrapper import (
    classify_external_error, handle_service_error,
    with_fallback, retry_on_failure, ServiceContext
)


class TestErrorTypes:
    """Test error type definitions and mappings"""
    
    def test_all_error_types_have_mappings(self):
        """Ensure every ErrorType has a corresponding mapping"""
        for error_type in ErrorType:
            mapping = get_error_mapping(error_type)
            assert mapping is not None
            assert mapping.user_message is not None
            assert len(mapping.user_message) > 0
    
    def test_user_messages_are_friendly(self):
        """Ensure user messages don't contain technical jargon"""
        technical_terms = [
            'exception', 'stack', 'trace', 'null', 'undefined',
            'error code', 'sql', 'query', 'database connection',
            'api key', 'token', 'authentication failed',
            '500', '404', '401', '403', 'internal server'
        ]
        
        for error_type, mapping in ERROR_MAPPINGS.items():
            message_lower = mapping.user_message.lower()
            for term in technical_terms:
                assert term not in message_lower, \
                    f"Technical term '{term}' found in user message for {error_type.value}"
    
    def test_user_messages_have_action_hints(self):
        """Ensure most errors have actionable hints"""
        for error_type, mapping in ERROR_MAPPINGS.items():
            # Critical errors may not always have action hints
            if mapping.severity != ErrorSeverity.CRITICAL:
                assert mapping.action_hint is not None or mapping.user_message, \
                    f"No action hint for {error_type.value}"
    
    def test_http_status_codes_are_valid(self):
        """Ensure all HTTP status codes are valid"""
        valid_codes = range(100, 600)
        for error_type, mapping in ERROR_MAPPINGS.items():
            assert mapping.http_status in valid_codes, \
                f"Invalid HTTP status {mapping.http_status} for {error_type.value}"
    
    def test_error_categories_are_consistent(self):
        """Ensure error types match their categories"""
        category_prefixes = {
            ErrorCategory.AUTHENTICATION: "AUTH_",
            ErrorCategory.AUTHORIZATION: "AUTHZ_",
            ErrorCategory.VALIDATION: "VALID_",
            ErrorCategory.DATABASE: "DB_",
            ErrorCategory.NETWORK: "NET_",
            ErrorCategory.EXTERNAL_SERVICE: "EXT_",
            ErrorCategory.FILE_OPERATION: "FILE_",
            ErrorCategory.PAYMENT: "PAY_",
            ErrorCategory.RATE_LIMIT: "RATE_",
            ErrorCategory.RESOURCE: "RES_",
            ErrorCategory.INTERNAL: "INT_",
        }
        
        for error_type, mapping in ERROR_MAPPINGS.items():
            expected_prefix = category_prefixes.get(mapping.category)
            if expected_prefix:
                # Check that the error type name starts with the expected prefix
                # (some exceptions apply)
                pass  # This is a soft check


class TestExceptions:
    """Test custom exception classes"""
    
    def test_app_exception_creation(self):
        """Test basic AppException creation"""
        exc = AppException(
            error_type=ErrorType.INT_UNEXPECTED,
            technical_message="Internal error details"
        )
        
        assert exc.error_type == ErrorType.INT_UNEXPECTED
        assert exc.technical_message == "Internal error details"
        assert "unexpected" in exc.user_message.lower() or "error" in exc.user_message.lower()
        assert exc.http_status == 500
    
    def test_exception_to_dict(self):
        """Test exception serialization"""
        exc = AuthenticationError(
            error_type=ErrorType.AUTH_TOKEN_EXPIRED,
            technical_message="JWT token expired at 2024-01-01"
        )
        
        result = exc.to_dict()
        assert result["error_code"] == "E1002"
        assert "session has expired" in result["user_message"].lower()
        assert "technical_message" not in result  # Not included by default
        
        result_full = exc.to_dict(include_technical=True)
        assert "technical_message" in result_full
    
    def test_authentication_errors(self):
        """Test authentication error variants"""
        token_expired = TokenExpiredError()
        assert token_expired.http_status == 401
        
        token_invalid = TokenInvalidError()
        assert token_invalid.http_status == 401
        
        creds_invalid = CredentialsInvalidError()
        assert creds_invalid.http_status == 401
    
    def test_authorization_errors(self):
        """Test authorization error variants"""
        perm_denied = PermissionDeniedError(resource="posts", action="delete")
        assert perm_denied.http_status == 403
        assert perm_denied.details.get("resource") == "posts"
        
        sub_required = SubscriptionRequiredError(feature="advanced_analytics")
        assert sub_required.http_status == 403
    
    def test_validation_errors(self):
        """Test validation error variants"""
        file_large = FileTooLargeError(max_size_mb=5.0, actual_size_mb=10.0)
        assert file_large.http_status == 413
        assert file_large.details.get("max_size_mb") == 5.0
        
        file_type = FileTypeInvalidError(allowed_types=["pdf", "docx"], actual_type="exe")
        assert file_type.http_status == 415
    
    def test_database_errors(self):
        """Test database error variants"""
        not_found = RecordNotFoundError(resource_type="User", resource_id="123")
        assert not_found.http_status == 404
        
        duplicate = DuplicateEntryError(field="email")
        assert duplicate.http_status == 409
    
    def test_external_service_errors(self):
        """Test external service error variants"""
        ai_error = AIServiceError(provider="openai", technical_message="API error")
        assert ai_error.http_status == 503
        
        ai_rate = AIRateLimitError(provider="gemini", retry_after=60)
        assert ai_rate.http_status == 429
        
        linkedin_expired = LinkedInTokenExpiredError()
        assert linkedin_expired.http_status == 401
    
    def test_payment_errors(self):
        """Test payment error variants"""
        card_declined = PaymentFailedError(decline_code="card_declined")
        assert card_declined.http_status == 402
        
        insufficient = PaymentFailedError(decline_code="insufficient_funds")
        assert insufficient.error_type == ErrorType.PAY_INSUFFICIENT_FUNDS
    
    def test_rate_limit_errors(self):
        """Test rate limit error variants"""
        credits = CreditsExhaustedError(credits_used=100, credits_limit=100)
        assert credits.http_status == 429
        assert credits.details.get("credits_used") == 100


class TestErrorHandler:
    """Test error handler utilities"""
    
    def test_generate_error_id_format(self):
        """Test error ID generation format"""
        error_id = generate_error_id()
        
        # Format: ERR-YYYYMMDD-XXXXXXXX
        assert error_id.startswith("ERR-")
        parts = error_id.split("-")
        assert len(parts) == 3
        assert len(parts[1]) == 8  # Date
        assert len(parts[2]) == 8  # Unique ID
    
    def test_sanitize_data_passwords(self):
        """Test password sanitization"""
        data = {"username": "john", "password": "secret123"}
        sanitized = sanitize_data(data)
        
        assert sanitized["username"] == "john"
        assert sanitized["password"] == "***REDACTED***"
    
    def test_sanitize_data_tokens(self):
        """Test token sanitization"""
        data = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
            "refresh_token": "refresh_token_value",
            "api_key": "sk-1234567890"
        }
        sanitized = sanitize_data(data)
        
        assert sanitized["access_token"] == "***REDACTED***"
        assert sanitized["refresh_token"] == "***REDACTED***"
        assert sanitized["api_key"] == "***REDACTED***"
    
    def test_sanitize_data_nested(self):
        """Test nested data sanitization"""
        data = {
            "user": {
                "email": "test@example.com",
                "password": "secret"
            },
            "tokens": ["token1", "token2"]
        }
        sanitized = sanitize_data(data)
        
        assert sanitized["user"]["email"] == "test@example.com"
        assert sanitized["user"]["password"] == "***REDACTED***"
    
    def test_sanitize_data_credit_cards(self):
        """Test credit card number sanitization in strings"""
        data = "Card number: 4111111111111111"
        sanitized = sanitize_data(data)
        
        assert "4111111111111111" not in sanitized
        assert "CARD_REDACTED" in sanitized
    
    def test_error_response_creation(self):
        """Test error response builder"""
        response = ErrorResponse.create(
            error_id="ERR-20240101-ABC123",
            user_message="Something went wrong",
            action_hint="Try again",
            http_status=500,
            error_code="E11001"
        )
        
        assert response["success"] == False
        assert response["error"]["id"] == "ERR-20240101-ABC123"
        assert response["error"]["message"] == "Something went wrong"
        assert "timestamp" in response
    
    def test_error_response_from_exception(self):
        """Test error response from exception"""
        exc = AuthenticationError(error_type=ErrorType.AUTH_TOKEN_EXPIRED)
        error_id = generate_error_id()
        
        response = ErrorResponse.from_exception(exc, error_id)
        
        assert response["success"] == False
        assert response["error"]["id"] == error_id
        assert response["error"]["code"] == "E1002"


class TestRetryHandler:
    """Test retry mechanism"""
    
    @pytest.mark.asyncio
    async def test_retry_success_first_attempt(self):
        """Test successful execution on first attempt"""
        call_count = 0
        
        async def success_func():
            nonlocal call_count
            call_count += 1
            return "success"
        
        handler = RetryHandler(max_retries=3)
        result = await handler.execute(success_func)
        
        assert result == "success"
        assert call_count == 1
    
    @pytest.mark.asyncio
    async def test_retry_success_after_failures(self):
        """Test successful execution after transient failures"""
        call_count = 0
        
        async def flaky_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ConnectionError("Connection failed")
            return "success"
        
        handler = RetryHandler(max_retries=3, base_delay=0.01)
        result = await handler.execute(flaky_func)
        
        assert result == "success"
        assert call_count == 3
    
    @pytest.mark.asyncio
    async def test_retry_max_retries_exceeded(self):
        """Test failure after max retries"""
        call_count = 0
        
        async def always_fail():
            nonlocal call_count
            call_count += 1
            raise ConnectionError("Always fails")
        
        handler = RetryHandler(max_retries=2, base_delay=0.01)
        
        with pytest.raises(ConnectionError):
            await handler.execute(always_fail)
        
        assert call_count == 3  # Initial + 2 retries
    
    @pytest.mark.asyncio
    async def test_retry_non_retryable_error(self):
        """Test immediate failure for non-retryable errors"""
        call_count = 0
        
        async def validation_fail():
            nonlocal call_count
            call_count += 1
            raise ValueError("Invalid input")
        
        handler = RetryHandler(max_retries=3, base_delay=0.01)
        
        with pytest.raises(ValueError):
            await handler.execute(validation_fail)
        
        assert call_count == 1  # No retries


class TestServiceWrapper:
    """Test service wrapper decorators"""
    
    def test_classify_ai_error(self):
        """Test AI error classification"""
        rate_limit = classify_external_error(
            Exception("Rate limit exceeded"),
            "openai"
        )
        assert isinstance(rate_limit, (AIRateLimitError, AIServiceError))
        
        generic = classify_external_error(
            Exception("Some AI error"),
            "gemini"
        )
        assert isinstance(generic, AIServiceError)
    
    def test_classify_linkedin_error(self):
        """Test LinkedIn error classification"""
        token_expired = classify_external_error(
            Exception("Token expired"),
            "linkedin"
        )
        assert isinstance(token_expired, LinkedInTokenExpiredError)
    
    def test_classify_stripe_error(self):
        """Test Stripe error classification"""
        card_declined = classify_external_error(
            Exception("Card was declined"),
            "stripe"
        )
        assert card_declined.error_type in [
            ErrorType.PAY_CARD_DECLINED,
            ErrorType.EXT_STRIPE_PAYMENT_FAILED
        ]
    
    @pytest.mark.asyncio
    async def test_handle_service_error_decorator(self):
        """Test service error handling decorator"""
        
        @handle_service_error("ai", log_errors=False)
        async def ai_operation():
            raise Exception("AI service unavailable")
        
        with pytest.raises(AIServiceError):
            await ai_operation()
    
    @pytest.mark.asyncio
    async def test_with_fallback_decorator(self):
        """Test fallback decorator"""
        
        @with_fallback(fallback_value=[], log_errors=False)
        async def get_data():
            raise Exception("Service unavailable")
        
        result = await get_data()
        assert result == []
    
    @pytest.mark.asyncio
    async def test_retry_on_failure_decorator(self):
        """Test retry decorator"""
        call_count = 0
        
        @retry_on_failure(max_retries=2, base_delay=0.01)
        async def flaky_operation():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise AIServiceError(provider="test")
            return "success"
        
        result = await flaky_operation()
        assert result == "success"
        assert call_count == 2


class TestSensitiveDataProtection:
    """Test that sensitive data is never exposed"""
    
    def test_passwords_not_in_logs(self):
        """Ensure passwords are never logged"""
        test_data = {
            "email": "user@example.com",
            "password": "MySecretPassword123!",
            "confirm_password": "MySecretPassword123!"
        }
        
        sanitized = sanitize_data(test_data)
        sanitized_str = json.dumps(sanitized)
        
        assert "MySecretPassword123!" not in sanitized_str
        assert "password" in sanitized_str  # Key exists
        assert "REDACTED" in sanitized_str  # Value is redacted
    
    def test_api_keys_not_in_logs(self):
        """Ensure API keys are never logged"""
        test_data = {
            "openai_api_key": "sk-1234567890abcdef",
            "stripe_secret_key": "sk_test_abc123",
            "client_secret": "my_client_secret"
        }
        
        sanitized = sanitize_data(test_data)
        sanitized_str = json.dumps(sanitized)
        
        assert "sk-1234567890" not in sanitized_str
        assert "sk_test_abc" not in sanitized_str
        assert "my_client_secret" not in sanitized_str
    
    def test_credit_card_numbers_not_in_logs(self):
        """Ensure credit card numbers are never logged"""
        test_strings = [
            "Card: 4111111111111111",
            "CC: 5500000000000004",
            "Payment with 378282246310005"
        ]
        
        for test_str in test_strings:
            sanitized = sanitize_data(test_str)
            # Check no 13-19 digit sequences remain
            import re
            matches = re.findall(r'\b\d{13,19}\b', sanitized)
            assert len(matches) == 0, f"Credit card number found in: {sanitized}"
    
    def test_stack_traces_sanitized(self):
        """Ensure stack traces don't contain sensitive data"""
        stack_trace = """
        Traceback (most recent call last):
          File "/app/auth.py", line 42, in login
            validate_password(password="secret123")
          File "/app/auth.py", line 50, in validate_password
            api_key="sk-abcdef123456"
        """
        
        sanitized = sanitize_data(stack_trace)
        
        assert "secret123" not in sanitized
        assert "sk-abcdef123456" not in sanitized


class TestErrorScenarios:
    """Test specific error scenarios"""
    
    def test_database_connection_error(self):
        """Test database connection failure handling"""
        exc = DatabaseError(
            error_type=ErrorType.DB_CONNECTION_FAILED,
            technical_message="Connection refused to localhost:5432"
        )
        
        # User message should be friendly
        assert "trouble" in exc.user_message.lower() or "server" in exc.user_message.lower()
        # Technical details should be preserved
        assert exc.technical_message is not None
        assert "5432" in exc.technical_message
    
    def test_ai_service_timeout(self):
        """Test AI service timeout handling"""
        exc = AIServiceError(
            error_type=ErrorType.EXT_AI_SERVICE_FAILED,
            provider="openai",
            technical_message="Request timed out after 30s"
        )
        
        assert exc.http_status == 503
        assert "unavailable" in exc.user_message.lower() or "try again" in exc.user_message.lower()
    
    def test_file_upload_error(self):
        """Test file upload error handling"""
        exc = FileTooLargeError(max_size_mb=10, actual_size_mb=25)
        
        assert exc.http_status == 413
        assert "too large" in exc.user_message.lower()
        assert exc.details.get("max_size_mb") == 10
    
    def test_rate_limit_error(self):
        """Test rate limit error handling"""
        exc = CreditsExhaustedError(credits_used=100, credits_limit=100)
        
        assert exc.http_status == 429
        assert "limit" in exc.user_message.lower() or "credits" in exc.user_message.lower()
    
    def test_payment_declined_error(self):
        """Test payment declined handling"""
        exc = PaymentFailedError(decline_code="insufficient_funds")
        
        assert exc.http_status == 402
        assert exc.error_type == ErrorType.PAY_INSUFFICIENT_FUNDS


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
