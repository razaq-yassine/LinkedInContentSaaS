"""
Rate Limiting Middleware and Utilities

Implements per-user rate limiting for API endpoints to prevent abuse.
Uses in-memory storage with sliding window algorithm.

Limits:
- 30 requests per minute per user
- 500 requests per day per user
"""

import time
from typing import Dict, Optional, Tuple
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import threading
import logging

logger = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""
    requests_per_minute: int = 30
    requests_per_day: int = 500
    minute_window: int = 60  # seconds
    day_window: int = 86400  # seconds


@dataclass
class UserRateState:
    """Tracks rate limit state for a single user."""
    minute_requests: list = field(default_factory=list)  # Timestamps
    day_requests: list = field(default_factory=list)  # Timestamps
    blocked_until: Optional[float] = None


class RateLimiter:
    """
    In-memory rate limiter with sliding window algorithm.
    
    Thread-safe implementation suitable for single-instance deployments.
    For distributed deployments, use Redis-based implementation.
    """
    
    def __init__(self, config: Optional[RateLimitConfig] = None):
        self.config = config or RateLimitConfig()
        self._state: Dict[str, UserRateState] = defaultdict(UserRateState)
        self._lock = threading.Lock()
        self._cleanup_interval = 300  # 5 minutes
        self._last_cleanup = time.time()
    
    def _cleanup_old_entries(self):
        """Remove expired entries to prevent memory growth."""
        current_time = time.time()
        
        if current_time - self._last_cleanup < self._cleanup_interval:
            return
        
        with self._lock:
            cutoff = current_time - self.config.day_window
            users_to_remove = []
            
            for user_id, state in self._state.items():
                # Remove old timestamps
                state.minute_requests = [
                    ts for ts in state.minute_requests 
                    if ts > current_time - self.config.minute_window
                ]
                state.day_requests = [
                    ts for ts in state.day_requests 
                    if ts > cutoff
                ]
                
                # Mark inactive users for removal
                if not state.minute_requests and not state.day_requests:
                    users_to_remove.append(user_id)
            
            for user_id in users_to_remove:
                del self._state[user_id]
            
            self._last_cleanup = current_time
            
            if users_to_remove:
                logger.debug(f"Rate limiter cleanup: removed {len(users_to_remove)} inactive users")
    
    def check_rate_limit(
        self,
        user_id: str,
        endpoint: str = "default"
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Check if a request should be allowed.
        
        Args:
            user_id: Unique user identifier
            endpoint: Optional endpoint identifier for granular limiting
            
        Returns:
            Tuple of (allowed: bool, rate_limit_info: dict or None)
            If not allowed, rate_limit_info contains retry_after and limit details
        """
        self._cleanup_old_entries()
        
        current_time = time.time()
        key = f"{user_id}:{endpoint}" if endpoint != "default" else user_id
        
        with self._lock:
            state = self._state[key]
            
            # Check if user is temporarily blocked
            if state.blocked_until and current_time < state.blocked_until:
                retry_after = int(state.blocked_until - current_time)
                return False, {
                    "error": "rate_limit_exceeded",
                    "retry_after": retry_after,
                    "message": f"Too many requests. Please retry after {retry_after} seconds."
                }
            
            # Clean up old timestamps
            minute_cutoff = current_time - self.config.minute_window
            day_cutoff = current_time - self.config.day_window
            
            state.minute_requests = [ts for ts in state.minute_requests if ts > minute_cutoff]
            state.day_requests = [ts for ts in state.day_requests if ts > day_cutoff]
            
            # Check minute limit
            if len(state.minute_requests) >= self.config.requests_per_minute:
                oldest = min(state.minute_requests)
                retry_after = int(oldest + self.config.minute_window - current_time) + 1
                
                logger.warning(
                    f"Rate limit exceeded (minute) for user {user_id}: "
                    f"{len(state.minute_requests)}/{self.config.requests_per_minute}"
                )
                
                return False, {
                    "error": "rate_limit_exceeded",
                    "limit_type": "minute",
                    "limit": self.config.requests_per_minute,
                    "current": len(state.minute_requests),
                    "retry_after": retry_after,
                    "message": f"Rate limit exceeded. Maximum {self.config.requests_per_minute} requests per minute."
                }
            
            # Check daily limit
            if len(state.day_requests) >= self.config.requests_per_day:
                oldest = min(state.day_requests)
                retry_after = int(oldest + self.config.day_window - current_time) + 1
                
                # Block user until reset
                state.blocked_until = oldest + self.config.day_window
                
                logger.warning(
                    f"Rate limit exceeded (daily) for user {user_id}: "
                    f"{len(state.day_requests)}/{self.config.requests_per_day}"
                )
                
                return False, {
                    "error": "rate_limit_exceeded",
                    "limit_type": "daily",
                    "limit": self.config.requests_per_day,
                    "current": len(state.day_requests),
                    "retry_after": retry_after,
                    "message": f"Daily limit exceeded. Maximum {self.config.requests_per_day} requests per day."
                }
            
            # Request allowed - record it
            state.minute_requests.append(current_time)
            state.day_requests.append(current_time)
            
            return True, None
    
    def get_rate_limit_headers(self, user_id: str, endpoint: str = "default") -> Dict[str, str]:
        """
        Get rate limit headers for response.
        
        Returns headers following draft IETF rate limit standard.
        """
        key = f"{user_id}:{endpoint}" if endpoint != "default" else user_id
        
        with self._lock:
            state = self._state.get(key, UserRateState())
            current_time = time.time()
            
            # Calculate remaining limits
            minute_cutoff = current_time - self.config.minute_window
            day_cutoff = current_time - self.config.day_window
            
            minute_count = len([ts for ts in state.minute_requests if ts > minute_cutoff])
            day_count = len([ts for ts in state.day_requests if ts > day_cutoff])
            
            minute_remaining = max(0, self.config.requests_per_minute - minute_count)
            day_remaining = max(0, self.config.requests_per_day - day_count)
            
            # Use the more restrictive limit for primary header
            remaining = min(minute_remaining, day_remaining)
            limit = self.config.requests_per_minute  # Show minute limit as primary
            
            # Calculate reset time (next minute window)
            if state.minute_requests:
                reset = int(min(state.minute_requests) + self.config.minute_window)
            else:
                reset = int(current_time + self.config.minute_window)
            
            return {
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(reset),
                "X-RateLimit-Limit-Day": str(self.config.requests_per_day),
                "X-RateLimit-Remaining-Day": str(day_remaining),
            }
    
    def reset_user(self, user_id: str):
        """Reset rate limit state for a user (admin function)."""
        with self._lock:
            keys_to_remove = [k for k in self._state.keys() if k.startswith(user_id)]
            for key in keys_to_remove:
                del self._state[key]
        logger.info(f"Rate limit reset for user {user_id}")


# Global rate limiter instance
_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


def check_rate_limit(user_id: str, endpoint: str = "generation") -> Tuple[bool, Optional[Dict]]:
    """
    Convenience function to check rate limit.
    
    Args:
        user_id: User ID to check
        endpoint: Endpoint identifier
        
    Returns:
        Tuple of (allowed, error_info)
    """
    return get_rate_limiter().check_rate_limit(user_id, endpoint)


def get_rate_limit_headers(user_id: str, endpoint: str = "generation") -> Dict[str, str]:
    """Convenience function to get rate limit headers."""
    return get_rate_limiter().get_rate_limit_headers(user_id, endpoint)


# FastAPI dependency for rate limiting
from fastapi import HTTPException, Request, Depends
from fastapi.responses import JSONResponse


async def rate_limit_dependency(request: Request):
    """
    FastAPI dependency that enforces rate limiting.
    
    Usage:
        @router.post("/generate", dependencies=[Depends(rate_limit_dependency)])
        async def generate_post(...):
            ...
    """
    # Extract user_id from request state (set by auth middleware)
    user_id = getattr(request.state, 'user_id', None)
    
    if not user_id:
        # Try to extract from authorization header
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            from jose import jwt, JWTError
            from ..config import get_settings
            settings = get_settings()
            
            try:
                token = auth_header.replace('Bearer ', '')
                payload = jwt.decode(
                    token,
                    settings.jwt_secret_key,
                    algorithms=[settings.jwt_algorithm]
                )
                user_id = payload.get('sub')
            except JWTError:
                pass
    
    if not user_id:
        # Can't rate limit without user identity
        return
    
    # Get endpoint identifier
    endpoint = request.url.path
    
    allowed, error_info = check_rate_limit(user_id, endpoint)
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=error_info,
            headers={
                "Retry-After": str(error_info.get("retry_after", 60)),
                **get_rate_limit_headers(user_id, endpoint)
            }
        )
    
    # Store for response headers
    request.state.rate_limit_user_id = user_id
    request.state.rate_limit_endpoint = endpoint
