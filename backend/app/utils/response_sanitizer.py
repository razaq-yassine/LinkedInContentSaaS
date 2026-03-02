"""
Response Sanitizer Utility

Ensures sensitive data like OAuth tokens, password hashes, and API keys
are never accidentally included in API responses.
"""

from typing import Dict, Any, List, Set
import logging

logger = logging.getLogger(__name__)

# Fields that should NEVER appear in API responses
SENSITIVE_FIELDS: Set[str] = {
    # OAuth tokens
    "linkedin_access_token",
    "linkedin_refresh_token",
    "google_access_token",
    "google_refresh_token",
    "access_token",  # When it's an OAuth token, not JWT
    "refresh_token",
    
    # Passwords and secrets
    "password_hash",
    "password",
    "secret",
    "api_key",
    "private_key",
    
    # Internal IDs that could be sensitive
    "stripe_customer_id",
    "stripe_subscription_id",
    
    # Verification tokens
    "email_code",
    "verification_code",
    "reset_token",
}

# Fields that might contain nested sensitive data
NESTED_SENSITIVE_PATHS: Set[str] = {
    "user.linkedin_access_token",
    "user.linkedin_refresh_token",
    "user.password_hash",
}


def sanitize_dict(data: Dict[str, Any], path: str = "") -> Dict[str, Any]:
    """
    Recursively remove sensitive fields from a dictionary.
    
    Args:
        data: Dictionary to sanitize
        path: Current path for nested detection
        
    Returns:
        Sanitized dictionary without sensitive fields
    """
    if not isinstance(data, dict):
        return data
    
    sanitized = {}
    redacted_fields = []
    
    for key, value in data.items():
        current_path = f"{path}.{key}" if path else key
        
        # Check if field is sensitive
        if key.lower() in SENSITIVE_FIELDS or current_path in NESTED_SENSITIVE_PATHS:
            redacted_fields.append(current_path)
            continue
        
        # Recursively sanitize nested dicts
        if isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, current_path)
        # Sanitize lists of dicts
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_dict(item, current_path) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            sanitized[key] = value
    
    if redacted_fields:
        logger.warning(f"Sanitized sensitive fields from response: {redacted_fields}")
    
    return sanitized


def sanitize_user_for_response(user: Any) -> Dict[str, Any]:
    """
    Sanitize a User model instance for safe API response.
    
    Args:
        user: SQLAlchemy User model instance
        
    Returns:
        Dictionary with only safe fields
    """
    if user is None:
        return None
    
    # Explicitly whitelist safe fields
    safe_fields = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "linkedin_id": user.linkedin_id,
        "linkedin_connected": user.linkedin_connected,
        "account_type": user.account_type.value if hasattr(user.account_type, 'value') else user.account_type,
        "email_verified": getattr(user, 'email_verified', True),
        "registration_provider": getattr(user, 'registration_provider', None),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
    
    # Add LinkedIn profile picture if available (safe to expose)
    if user.linkedin_profile_data and isinstance(user.linkedin_profile_data, dict):
        safe_fields["linkedin_profile_picture"] = user.linkedin_profile_data.get("picture")
    
    # Add google_id presence check (not the actual ID)
    safe_fields["google_connected"] = user.google_id is not None
    
    # Add password presence check (not the hash)
    safe_fields["has_password"] = user.password_hash is not None
    
    return safe_fields


def ensure_no_tokens(response_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Final safety check to ensure no OAuth tokens in response.
    Raises an error if tokens are detected.
    
    Args:
        response_data: Response data to check
        
    Returns:
        Original data if safe
        
    Raises:
        ValueError if tokens detected
    """
    def check_recursive(data: Any, path: str = ""):
        if isinstance(data, dict):
            for key, value in data.items():
                current_path = f"{path}.{key}" if path else key
                
                # Check for token fields
                if any(token_field in key.lower() for token_field in ['access_token', 'refresh_token', 'api_key', 'secret_key']):
                    # Exception: JWT access_token in login response is OK
                    if key == "access_token" and path == "" and isinstance(value, str) and value.startswith("eyJ"):
                        continue
                    
                    raise ValueError(
                        f"SECURITY: Sensitive field '{current_path}' detected in response. "
                        "This is a potential data leak."
                    )
                
                check_recursive(value, current_path)
                
        elif isinstance(data, list):
            for i, item in enumerate(data):
                check_recursive(item, f"{path}[{i}]")
    
    check_recursive(response_data)
    return response_data
