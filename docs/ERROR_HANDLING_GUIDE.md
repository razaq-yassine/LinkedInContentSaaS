# Comprehensive Error Handling System Documentation

## Overview

This document describes the comprehensive error handling system implemented for the LinkedIn Content SaaS application. The system ensures:

- **Zero raw errors visible to end users** - All technical errors are mapped to friendly messages
- **100% error capture and logging** - Every error is logged with full context
- **Consistent error responses** - Standardized JSON format across all endpoints
- **Security** - Sensitive data is never exposed in logs or responses

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Error Code Reference](#error-code-reference)
3. [Backend Error Handling](#backend-error-handling)
4. [Frontend Error Handling](#frontend-error-handling)
5. [Error Logging](#error-logging)
6. [Developer Guide](#developer-guide)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Architecture Overview

### Error Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FASTAPI MIDDLEWARE                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Global Exception Handler                        │   │
│  │  - Catches all unhandled exceptions                         │   │
│  │  - Maps to AppException if needed                           │   │
│  │  - Generates unique error ID                                │   │
│  │  - Logs to database                                         │   │
│  │  - Returns standardized response                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE HANDLERS                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              @handle_errors decorator                        │   │
│  │  - Wraps async operations                                   │   │
│  │  - Converts exceptions to AppException                      │   │
│  │  - Provides context for logging                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │           @handle_service_error decorator                    │   │
│  │  - Classifies external service errors                       │   │
│  │  - Adds retry logic for transient failures                  │   │
│  │  - Provides graceful degradation                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR RESPONSE                                    │
│  {                                                                   │
│    "success": false,                                                │
│    "error": {                                                       │
│      "id": "ERR-20260113-ABC123XY",                                │
│      "code": "E1002",                                              │
│      "message": "Your session has expired. Please sign in again.", │
│      "action_hint": "Sign in to continue"                          │
│    },                                                               │
│    "timestamp": "2026-01-13T18:10:00Z"                             │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Error Types | `backend/app/core/error_types.py` | Defines all error categories and user message mappings |
| Exceptions | `backend/app/core/exceptions.py` | Custom exception classes |
| Error Handler | `backend/app/core/error_handler.py` | Middleware and utilities |
| Service Wrapper | `backend/app/core/service_wrapper.py` | Decorators for service functions |
| Error Router | `backend/app/routers/errors.py` | API endpoints for error logging |
| ErrorLog Model | `backend/app/models.py` | Database model for error storage |
| Frontend Types | `frontend/lib/error-types.ts` | TypeScript error definitions |
| Error Handler | `frontend/lib/error-handler.ts` | Frontend error utilities |
| Error Boundary | `frontend/components/ErrorBoundary.tsx` | React error boundary |

---

## Error Code Reference

### Error Code Format

All error codes follow the format `EXXXX` where:
- `E1XXX` - Authentication errors
- `E2XXX` - Authorization errors
- `E3XXX` - Validation errors
- `E4XXX` - Database errors
- `E5XXX` - Network errors
- `E6XXX` - External service errors
- `E7XXX` - File operation errors
- `E8XXX` - Payment errors
- `E9XXX` - Rate limit errors
- `E10XXX` - Resource errors
- `E11XXX` - Internal errors

### Complete Error Code Catalog

#### Authentication Errors (E1XXX)

| Code | Name | User Message | HTTP Status |
|------|------|--------------|-------------|
| E1001 | AUTH_TOKEN_INVALID | Your session has become invalid. Please sign in again. | 401 |
| E1002 | AUTH_TOKEN_EXPIRED | Your session has expired. Please sign in again to continue. | 401 |
| E1003 | AUTH_CREDENTIALS_INVALID | We couldn't verify your credentials. Please check your email and password. | 401 |
| E1004 | AUTH_SESSION_EXPIRED | Your session has expired for security reasons. Please sign in again. | 401 |
| E1005 | AUTH_ACCOUNT_LOCKED | Your account has been temporarily locked due to multiple failed login attempts. | 423 |
| E1006 | AUTH_EMAIL_NOT_VERIFIED | Please verify your email address to continue. | 403 |
| E1007 | AUTH_OAUTH_FAILED | We couldn't complete the sign-in with your account. | 400 |
| E1008 | AUTH_PASSWORD_WEAK | Please choose a stronger password. | 400 |
| E1009 | AUTH_REGISTRATION_FAILED | We couldn't create your account. | 500 |
| E1010 | AUTH_LOGOUT_FAILED | We had trouble signing you out completely. | 500 |

#### Authorization Errors (E2XXX)

| Code | Name | User Message | HTTP Status |
|------|------|--------------|-------------|
| E2001 | AUTHZ_PERMISSION_DENIED | You don't have permission to perform this action. | 403 |
| E2002 | AUTHZ_RESOURCE_FORBIDDEN | You don't have access to this resource. | 403 |
| E2003 | AUTHZ_ROLE_INSUFFICIENT | Your current role doesn't allow this action. | 403 |
| E2004 | AUTHZ_SUBSCRIPTION_REQUIRED | This feature requires a subscription. Upgrade your plan to unlock it. | 403 |
| E2005 | AUTHZ_FEATURE_DISABLED | This feature is currently disabled. | 503 |
| E2006 | AUTHZ_ADMIN_ONLY | This action is restricted to administrators only. | 403 |

#### Validation Errors (E3XXX)

| Code | Name | User Message | HTTP Status |
|------|------|--------------|-------------|
| E3001 | VALID_FIELD_REQUIRED | Some required information is missing. | 400 |
| E3002 | VALID_FIELD_INVALID | Some information you provided is not valid. | 400 |
| E3003 | VALID_EMAIL_INVALID | Please enter a valid email address. | 400 |
| E3004 | VALID_PASSWORD_INVALID | Your password doesn't meet the security requirements. | 400 |
| E3005 | VALID_FILE_TOO_LARGE | The file you're trying to upload is too large. | 413 |
| E3006 | VALID_FILE_TYPE_INVALID | This file type is not supported. | 415 |
| E3007 | VALID_DATA_FORMAT | The data format is incorrect. | 400 |
| E3008 | VALID_INPUT_SANITIZATION | Your input contains invalid characters. | 400 |
| E3009 | VALID_LENGTH_EXCEEDED | Your input exceeds the maximum allowed length. | 400 |
| E3010 | VALID_CONTENT_POLICY | Your content doesn't comply with our content policy. | 400 |

#### Database Errors (E4XXX)

| Code | Name | User Message | HTTP Status |
|------|------|--------------|-------------|
| E4001 | DB_CONNECTION_FAILED | We're having trouble connecting to our servers. | 503 |
| E4002 | DB_QUERY_FAILED | We're having trouble processing your request. | 500 |
| E4003 | DB_TRANSACTION_FAILED | We couldn't save your changes. | 500 |
| E4004 | DB_RECORD_NOT_FOUND | The item you're looking for could not be found. | 404 |
| E4005 | DB_DUPLICATE_ENTRY | This item already exists. | 409 |
| E4006 | DB_INTEGRITY_ERROR | We couldn't complete this operation due to a data conflict. | 409 |
| E4007 | DB_POOL_EXHAUSTED | Our servers are experiencing high load. | 503 |
| E4008 | DB_MIGRATION_FAILED | A system update is in progress. | 503 |
| E4009 | DB_TIMEOUT | The operation took too long. | 504 |

#### External Service Errors (E6XXX)

| Code | Name | User Message | HTTP Status |
|------|------|--------------|-------------|
| E6001 | EXT_AI_SERVICE_FAILED | Our AI service is temporarily unavailable. | 503 |
| E6002 | EXT_AI_RATE_LIMITED | You're generating content too quickly. | 429 |
| E6003 | EXT_AI_QUOTA_EXCEEDED | You've reached your content generation limit. | 429 |
| E6004 | EXT_AI_INVALID_RESPONSE | The AI couldn't generate a proper response. | 500 |
| E6005 | EXT_LINKEDIN_API_FAILED | We couldn't connect to LinkedIn. | 503 |
| E6006 | EXT_LINKEDIN_TOKEN_EXPIRED | Your LinkedIn connection has expired. | 401 |
| E6007 | EXT_LINKEDIN_RATE_LIMITED | LinkedIn is limiting our requests. | 429 |
| E6008 | EXT_STRIPE_FAILED | Payment service is temporarily unavailable. | 503 |
| E6009 | EXT_STRIPE_PAYMENT_FAILED | Your payment could not be processed. | 402 |
| E6010 | EXT_STRIPE_WEBHOOK_FAILED | Payment processing encountered an issue. | 500 |
| E6011 | EXT_EMAIL_SEND_FAILED | We couldn't send the email. | 503 |

#### Rate Limit Errors (E9XXX)

| Code | Name | User Message | HTTP Status |
|------|------|--------------|-------------|
| E9001 | RATE_API_EXCEEDED | You're making requests too quickly. | 429 |
| E9002 | RATE_GENERATION_EXCEEDED | You've reached your generation limit. | 429 |
| E9003 | RATE_LOGIN_EXCEEDED | Too many login attempts. | 429 |
| E9004 | RATE_CREDITS_EXHAUSTED | You've used all your credits for this month. | 429 |
| E9005 | RATE_DAILY_LIMIT | You've reached your daily limit. | 429 |

---

## Backend Error Handling

### Using Custom Exceptions

```python
from app.core.exceptions import (
    AuthenticationError, ValidationError, 
    RecordNotFoundError, AIServiceError
)
from app.core.error_types import ErrorType

# Raise a specific authentication error
raise TokenExpiredError()

# Raise with custom message
raise AuthenticationError(
    error_type=ErrorType.AUTH_CREDENTIALS_INVALID,
    technical_message="User not found in database"
)

# Raise database error
raise RecordNotFoundError(resource_type="Post", resource_id=post_id)
```

### Using Decorators

```python
from app.core.error_handler import handle_errors
from app.core.service_wrapper import handle_service_error, retry_on_failure

# Wrap route handlers
@router.post("/generate")
@handle_errors
async def generate_post(request: GenerateRequest):
    # Your code here - exceptions are automatically caught and handled
    pass

# Wrap service functions
@handle_service_error("ai")
@retry_on_failure(max_retries=3)
async def call_openai(prompt: str) -> str:
    # Errors are classified and retried automatically
    response = await openai.chat.completions.create(...)
    return response.choices[0].message.content
```

### Using Context Manager

```python
from app.core.service_wrapper import ServiceContext

async def process_payment(user_id: str, amount: float):
    async with ServiceContext("stripe", user_id=user_id, operation="charge") as ctx:
        result = await stripe.PaymentIntent.create(amount=amount)
        ctx.set_result(result)
        return result
```

---

## Frontend Error Handling

### Using Error Boundary

```tsx
import ErrorBoundary from "@/components/ErrorBoundary";

function MyPage() {
  return (
    <ErrorBoundary showErrorId>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Handling API Errors

```typescript
import { handleAPIError, parseAPIError } from "@/lib/error-handler";
import { formatErrorForToast } from "@/lib/error-types";

try {
  const response = await api.generate.post(message, options);
} catch (error) {
  // Option 1: Use the global handler (shows toast, handles auth, etc.)
  const parsed = await handleAPIError(error);
  
  // Option 2: Handle manually
  const errorInfo = parseAPIError(error);
  console.log(errorInfo.message);  // User-friendly message
  console.log(errorInfo.code);     // Error code like "E6001"
  console.log(errorInfo.isRetryable);  // Whether to retry
}
```

### Using Retry Logic

```typescript
import { withRetry } from "@/lib/error-handler";

const result = await withRetry(
  () => api.generate.post(message, options),
  {
    maxRetries: 3,
    delayMs: 1000,
    retryCondition: (error) => error.isRetryable
  }
);
```

---

## Error Logging

### Database Schema

The `error_logs` table stores all errors with:

| Field | Description |
|-------|-------------|
| id | Unique error ID (ERR-YYYYMMDD-XXXXXXXX) |
| error_type | Error code (e.g., E1001) |
| category | Error category (authentication, database, etc.) |
| severity | Error severity (info, warning, error, critical) |
| technical_message | Technical details for debugging |
| user_message | Message shown to user |
| stack_trace | Sanitized stack trace |
| request_context | Endpoint, method, params (sanitized) |
| user_id | User ID if authenticated |
| environment | production/staging/development |
| resolution_status | new/acknowledged/in_progress/resolved |
| created_at | Timestamp |

### Viewing Errors

Errors can be viewed via:
1. Admin dashboard at `/admin/errors`
2. API endpoint: `GET /api/errors?severity=critical`
3. Error statistics: `GET /api/errors/stats`

---

## Developer Guide

### Adding a New Error Type

1. Add the error type to `error_types.py`:

```python
class ErrorType(str, Enum):
    # ... existing types
    MY_NEW_ERROR = "E12001"
```

2. Add the mapping:

```python
ERROR_MAPPINGS[ErrorType.MY_NEW_ERROR] = ErrorMapping(
    error_type=ErrorType.MY_NEW_ERROR,
    category=ErrorCategory.INTERNAL,
    severity=ErrorSeverity.ERROR,
    user_message="A friendly message for users",
    action_hint="What the user should do",
    http_status=500
)
```

3. Create an exception class (optional):

```python
class MyNewError(AppException):
    def __init__(self, details: str = None):
        super().__init__(
            error_type=ErrorType.MY_NEW_ERROR,
            technical_message=details
        )
```

### Checklist for New Features

When adding new features, ensure:

- [ ] All async operations are wrapped with error handlers
- [ ] Database queries use try/except or decorators
- [ ] External API calls have retry logic
- [ ] File operations have proper error handling
- [ ] User input is validated before processing
- [ ] Sensitive data is never logged
- [ ] Errors return user-friendly messages
- [ ] Critical errors trigger alerts

---

## Troubleshooting

### Common Issues

#### "ERR-XXXXXXXX-XXXXXXXX" - Finding Error Details

1. Copy the error ID from the user
2. Search in admin dashboard or database:
   ```sql
   SELECT * FROM error_logs WHERE id = 'ERR-20260113-ABC123XY';
   ```

#### User Reports "Something Went Wrong"

1. Ask for the error ID (shown to user)
2. Check error logs for technical details
3. Review stack trace for root cause
4. Check request context for additional info

#### Errors Not Being Logged

1. Verify database connection
2. Check that ErrorLog model is migrated
3. Ensure error endpoints are registered
4. Check for logging errors in console

---

## Best Practices

### DO

- ✅ Use specific exception types when possible
- ✅ Include technical details in `technical_message`
- ✅ Add context like resource IDs to `details`
- ✅ Use decorators for consistent handling
- ✅ Test error scenarios in your code
- ✅ Monitor critical errors regularly

### DON'T

- ❌ Expose stack traces to users
- ❌ Log passwords, tokens, or API keys
- ❌ Catch exceptions silently (log them!)
- ❌ Use generic "Error occurred" messages
- ❌ Ignore transient failures (add retries)
- ❌ Return raw database errors to users

---

## Testing Report Template

When running error handling tests, use this template for the report:

```markdown
## Error Handling Test Report

**Date:** YYYY-MM-DD
**Environment:** development/staging/production
**Tester:** [Name]

### Summary
- Total scenarios tested: XX
- Passed: XX
- Failed: XX
- Coverage: XX%

### Results by Category

| Category | Scenarios | Passed | Failed |
|----------|-----------|--------|--------|
| Authentication | X | X | X |
| Authorization | X | X | X |
| Validation | X | X | X |
| Database | X | X | X |
| External Services | X | X | X |
| File Operations | X | X | X |
| Rate Limiting | X | X | X |

### Sample User Messages vs Technical Logs

| Scenario | User Sees | Technical Log |
|----------|-----------|---------------|
| Login failed | "We couldn't verify your credentials" | "User not found: test@example.com" |
| AI timeout | "Our AI service is temporarily unavailable" | "OpenAI API timeout after 30s" |

### Issues Found
1. [Issue description]

### Recommendations
1. [Recommendation]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-13 | Initial implementation |

---

*This documentation is part of the LinkedIn Content SaaS error handling system.*
