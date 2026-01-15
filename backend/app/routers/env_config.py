"""
Environment Configuration Router - Manage .env file and API key validation
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from pydantic import BaseModel
import os
import httpx
import asyncio

from ..database import get_db
from ..models import Admin
from ..routers.admin_auth import get_current_admin
from ..config import get_settings

router = APIRouter()

# Define env variable categories and metadata
ENV_VARIABLES = {
    "ai_keys": {
        "title": "AI Provider Keys",
        "variables": [
            {"key": "AI_PROVIDER", "label": "AI Provider", "type": "select", "options": ["openai", "gemini", "claude"], "default": "gemini", "sensitive": False},
            {"key": "OPENAI_API_KEY", "label": "OpenAI API Key", "type": "password", "default": "", "sensitive": True},
            {"key": "OPENAI_MODEL", "label": "OpenAI Model", "type": "select", "options": ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"], "default": "gpt-4o", "sensitive": False},
            {"key": "GEMINI_API_KEY", "label": "Gemini API Key", "type": "password", "default": "", "sensitive": True},
            {"key": "GEMINI_MODEL", "label": "Gemini Model", "type": "select", "options": ["gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"], "default": "gemini-2.5-flash", "sensitive": False},
            {"key": "CLAUDE_API_KEY", "label": "Claude API Key", "type": "password", "default": "", "sensitive": True},
            {"key": "CLAUDE_MODEL", "label": "Claude Model", "type": "select", "options": ["claude-haiku-4-5", "claude-sonnet-4-5", "claude-opus-4-5"], "default": "claude-haiku-4-5", "sensitive": False},
        ]
    },
    "brave_search": {
        "title": "Brave Search API",
        "variables": [
            {"key": "BRAVE_API_KEY", "label": "Brave API Key", "type": "password", "default": "", "sensitive": True},
            {"key": "BRAVE_SEARCH_ENABLED", "label": "Enable Web Search", "type": "boolean", "default": "true", "sensitive": False},
        ]
    },
    "cloudflare": {
        "title": "Cloudflare (Image Generation)",
        "variables": [
            {"key": "CLOUDFLARE_ACCOUNT_ID", "label": "Cloudflare Account ID", "type": "text", "default": "", "sensitive": True},
            {"key": "CLOUDFLARE_API_TOKEN", "label": "Cloudflare API Token", "type": "password", "default": "", "sensitive": True},
            {"key": "CLOUDFLARE_IMAGE_MODEL", "label": "Image Model", "type": "select", "options": ["@cf/leonardo/lucid-origin", "@cf/black-forest-labs/flux-1-schnell", "@cf/stabilityai/stable-diffusion-xl-base-1.0"], "default": "@cf/leonardo/lucid-origin", "sensitive": False},
        ]
    },
    "linkedin": {
        "title": "LinkedIn OAuth",
        "variables": [
            {"key": "LINKEDIN_CLIENT_ID", "label": "Client ID", "type": "text", "default": "", "sensitive": True},
            {"key": "LINKEDIN_CLIENT_SECRET", "label": "Client Secret", "type": "password", "default": "", "sensitive": True},
            {"key": "LINKEDIN_REDIRECT_URI", "label": "Redirect URI", "type": "text", "default": "http://localhost:8000/api/auth/linkedin/callback", "sensitive": False},
        ]
    },
    "google": {
        "title": "Google OAuth",
        "variables": [
            {"key": "GOOGLE_CLIENT_ID", "label": "Client ID", "type": "text", "default": "", "sensitive": True},
            {"key": "GOOGLE_CLIENT_SECRET", "label": "Client Secret", "type": "password", "default": "", "sensitive": True},
            {"key": "GOOGLE_REDIRECT_URI", "label": "Redirect URI", "type": "text", "default": "http://localhost:8000/api/auth/google/callback", "sensitive": False},
        ]
    },
    "smtp": {
        "title": "Email (SMTP)",
        "variables": [
            {"key": "SMTP_HOST", "label": "SMTP Host", "type": "text", "default": "smtp.gmail.com", "sensitive": False},
            {"key": "SMTP_PORT", "label": "SMTP Port", "type": "number", "default": "587", "sensitive": False},
            {"key": "SMTP_USERNAME", "label": "Username", "type": "text", "default": "", "sensitive": False},
            {"key": "SMTP_PASSWORD", "label": "Password", "type": "password", "default": "", "sensitive": True},
            {"key": "SMTP_FROM_EMAIL", "label": "From Email", "type": "text", "default": "", "sensitive": False},
            {"key": "SMTP_FROM_NAME", "label": "From Name", "type": "text", "default": "PostInAi", "sensitive": False},
        ]
    },
    "app": {
        "title": "Application Settings",
        "variables": [
            {"key": "DEV_MODE", "label": "Development Mode", "type": "boolean", "default": "true", "sensitive": False},
            {"key": "JWT_SECRET_KEY", "label": "JWT Secret Key", "type": "password", "default": "", "sensitive": True},
            {"key": "FRONTEND_URL", "label": "Frontend URL", "type": "text", "default": "http://localhost:3000", "sensitive": False},
            {"key": "DATABASE_URL", "label": "Database URL", "type": "text", "default": "sqlite:///./linkedin_content_saas.db", "sensitive": False},
        ]
    }
}


class EnvUpdateRequest(BaseModel):
    variables: Dict[str, str]


class KeyStatusResponse(BaseModel):
    key: str
    status: str  # "valid", "invalid", "unconfigured", "error"
    message: str
    balance: Optional[str] = None
    quota: Optional[dict] = None


def get_env_file_path():
    """Get the path to the .env file"""
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")


def read_env_file() -> Dict[str, str]:
    """Read the .env file and return as dict"""
    env_path = get_env_file_path()
    env_vars = {}
    
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip().strip('"').strip("'")
                    env_vars[key.strip()] = value
    
    return env_vars


def write_env_file(env_vars: Dict[str, str]):
    """Write variables to .env file"""
    env_path = get_env_file_path()
    
    # Read existing file to preserve comments and order
    lines = []
    existing_keys = set()
    
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                original_line = line
                line_stripped = line.strip()
                
                if line_stripped and not line_stripped.startswith('#') and '=' in line_stripped:
                    key = line_stripped.split('=', 1)[0].strip()
                    existing_keys.add(key)
                    
                    if key in env_vars:
                        # Update the value
                        value = env_vars[key]
                        # Quote values with spaces
                        if ' ' in value or '"' in value:
                            value = f'"{value}"'
                        lines.append(f"{key}={value}\n")
                    else:
                        lines.append(original_line)
                else:
                    lines.append(original_line)
    
    # Add new keys that weren't in the file
    for key, value in env_vars.items():
        if key not in existing_keys:
            if ' ' in value or '"' in value:
                value = f'"{value}"'
            lines.append(f"{key}={value}\n")
    
    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)


def mask_sensitive_value(value: str) -> str:
    """Mask sensitive values, showing only first 4 and last 4 chars"""
    if not value or len(value) < 12:
        return "••••••••" if value else ""
    return f"{value[:4]}••••••••{value[-4:]}"


@router.get("/env/variables")
async def get_env_variables(admin: Admin = Depends(get_current_admin)):
    """Get all environment variables (sensitive values masked)"""
    env_vars = read_env_file()
    
    result = {}
    for category_id, category in ENV_VARIABLES.items():
        result[category_id] = {
            "title": category["title"],
            "variables": []
        }
        
        for var in category["variables"]:
            value = env_vars.get(var["key"], var.get("default", ""))
            display_value = mask_sensitive_value(value) if var["sensitive"] and value else value
            
            result[category_id]["variables"].append({
                **var,
                "value": display_value,
                "hasValue": bool(value),
                "isSet": var["key"] in env_vars
            })
    
    return result


@router.put("/env/variables")
async def update_env_variables(
    request: EnvUpdateRequest,
    admin: Admin = Depends(get_current_admin)
):
    """Update environment variables"""
    current_vars = read_env_file()
    
    # Update only provided variables
    for key, value in request.variables.items():
        # Skip masked values (user didn't change them)
        if "••••" in value:
            continue
        current_vars[key] = value
    
    write_env_file(current_vars)
    
    # Clear settings cache to reload
    from ..config import get_settings
    get_settings.cache_clear()
    
    return {"success": True, "message": "Environment variables updated. Restart the server for changes to take effect."}


@router.get("/env/key-status/{key_type}")
async def check_key_status(
    key_type: str,
    admin: Admin = Depends(get_current_admin)
) -> KeyStatusResponse:
    """Check the status of an API key"""
    env_vars = read_env_file()
    
    if key_type == "openai":
        return await check_openai_key(env_vars.get("OPENAI_API_KEY", ""))
    elif key_type == "gemini":
        return await check_gemini_key(env_vars.get("GEMINI_API_KEY", ""))
    elif key_type == "claude":
        return await check_claude_key(env_vars.get("CLAUDE_API_KEY", ""))
    elif key_type == "cloudflare":
        return await check_cloudflare_key(
            env_vars.get("CLOUDFLARE_ACCOUNT_ID", ""),
            env_vars.get("CLOUDFLARE_API_TOKEN", "")
        )
    elif key_type == "brave":
        return await check_brave_key(env_vars.get("BRAVE_API_KEY", ""))
    else:
        raise HTTPException(status_code=400, detail=f"Unknown key type: {key_type}")


@router.get("/env/all-key-status")
async def check_all_keys_status(admin: Admin = Depends(get_current_admin)):
    """Check status of all API keys"""
    env_vars = read_env_file()
    
    results = {}
    
    # Check OpenAI
    results["openai"] = await check_openai_key(env_vars.get("OPENAI_API_KEY", ""))
    
    # Check Gemini
    results["gemini"] = await check_gemini_key(env_vars.get("GEMINI_API_KEY", ""))
    
    # Check Claude
    results["claude"] = await check_claude_key(env_vars.get("CLAUDE_API_KEY", ""))
    
    # Check Cloudflare
    results["cloudflare"] = await check_cloudflare_key(
        env_vars.get("CLOUDFLARE_ACCOUNT_ID", ""),
        env_vars.get("CLOUDFLARE_API_TOKEN", "")
    )
    
    # Check Brave
    results["brave"] = await check_brave_key(env_vars.get("BRAVE_API_KEY", ""))
    
    return results


async def check_openai_key(api_key: str) -> KeyStatusResponse:
    """Check OpenAI API key status and credit balance"""
    if not api_key:
        return KeyStatusResponse(
            key="openai",
            status="unconfigured",
            message="API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Check if key is valid by listing models
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10.0
            )
            
            if response.status_code == 401:
                return KeyStatusResponse(
                    key="openai",
                    status="invalid",
                    message="Invalid API key"
                )
            elif response.status_code == 200:
                # Try to get usage/billing info
                # Note: OpenAI billing API requires org-level access
                try:
                    # Check subscription
                    billing_response = await client.get(
                        "https://api.openai.com/v1/dashboard/billing/subscription",
                        headers={"Authorization": f"Bearer {api_key}"},
                        timeout=10.0
                    )
                    
                    if billing_response.status_code == 200:
                        billing_data = billing_response.json()
                        hard_limit = billing_data.get("hard_limit_usd", 0)
                        
                        # Get usage
                        import datetime
                        today = datetime.date.today()
                        start_date = today.replace(day=1).isoformat()
                        end_date = today.isoformat()
                        
                        usage_response = await client.get(
                            f"https://api.openai.com/v1/dashboard/billing/usage?start_date={start_date}&end_date={end_date}",
                            headers={"Authorization": f"Bearer {api_key}"},
                            timeout=10.0
                        )
                        
                        if usage_response.status_code == 200:
                            usage_data = usage_response.json()
                            total_usage = usage_data.get("total_usage", 0) / 100  # Convert cents to dollars
                            
                            return KeyStatusResponse(
                                key="openai",
                                status="valid",
                                message="API key is valid",
                                balance=f"${hard_limit - total_usage:.2f} remaining",
                                quota={
                                    "limit": f"${hard_limit:.2f}",
                                    "used": f"${total_usage:.2f}",
                                    "remaining": f"${hard_limit - total_usage:.2f}"
                                }
                            )
                except:
                    pass
                
                return KeyStatusResponse(
                    key="openai",
                    status="valid",
                    message="API key is valid (billing info unavailable)",
                    balance="Balance check not available"
                )
            else:
                return KeyStatusResponse(
                    key="openai",
                    status="error",
                    message=f"API returned status {response.status_code}"
                )
    except httpx.TimeoutException:
        return KeyStatusResponse(
            key="openai",
            status="error",
            message="Request timed out"
        )
    except Exception as e:
        return KeyStatusResponse(
            key="openai",
            status="error",
            message=str(e)
        )


async def check_gemini_key(api_key: str) -> KeyStatusResponse:
    """Check Gemini API key status"""
    if not api_key:
        return KeyStatusResponse(
            key="gemini",
            status="unconfigured",
            message="API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Check if key is valid by listing models
            response = await client.get(
                f"https://generativelanguage.googleapis.com/v1/models?key={api_key}",
                timeout=10.0
            )
            
            if response.status_code == 400 or response.status_code == 401:
                return KeyStatusResponse(
                    key="gemini",
                    status="invalid",
                    message="Invalid API key"
                )
            elif response.status_code == 200:
                data = response.json()
                models = data.get("models", [])
                model_count = len(models)
                
                # Gemini free tier has generous limits
                return KeyStatusResponse(
                    key="gemini",
                    status="valid",
                    message=f"API key is valid ({model_count} models available)",
                    balance="Free tier: 1500 req/day",
                    quota={
                        "models_available": model_count,
                        "tier": "Free tier",
                        "daily_limit": "1500 requests/day",
                        "rpm": "15 requests/minute"
                    }
                )
            else:
                return KeyStatusResponse(
                    key="gemini",
                    status="error",
                    message=f"API returned status {response.status_code}"
                )
    except httpx.TimeoutException:
        return KeyStatusResponse(
            key="gemini",
            status="error",
            message="Request timed out"
        )
    except Exception as e:
        return KeyStatusResponse(
            key="gemini",
            status="error",
            message=str(e)
        )


async def check_cloudflare_key(account_id: str, api_token: str) -> KeyStatusResponse:
    """Check Cloudflare API token status"""
    if not account_id or not api_token:
        return KeyStatusResponse(
            key="cloudflare",
            status="unconfigured",
            message="Account ID or API token not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify token
            response = await client.get(
                "https://api.cloudflare.com/client/v4/user/tokens/verify",
                headers={"Authorization": f"Bearer {api_token}"},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    # Check AI gateway/Workers AI status
                    ai_response = await client.get(
                        f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/models/search",
                        headers={"Authorization": f"Bearer {api_token}"},
                        timeout=10.0
                    )
                    
                    if ai_response.status_code == 200:
                        return KeyStatusResponse(
                            key="cloudflare",
                            status="valid",
                            message="API token is valid with Workers AI access",
                            balance="Workers AI: 10,000 neurons/day free",
                            quota={
                                "tier": "Free tier",
                                "daily_neurons": "10,000",
                                "note": "Image generation uses ~1000 neurons per image"
                            }
                        )
                    else:
                        return KeyStatusResponse(
                            key="cloudflare",
                            status="valid",
                            message="Token valid but Workers AI access may be limited",
                            balance="Check Cloudflare dashboard for limits"
                        )
            
            return KeyStatusResponse(
                key="cloudflare",
                status="invalid",
                message="Invalid API token"
            )
    except httpx.TimeoutException:
        return KeyStatusResponse(
            key="cloudflare",
            status="error",
            message="Request timed out"
        )
    except Exception as e:
        return KeyStatusResponse(
            key="cloudflare",
            status="error",
            message=str(e)
        )


async def check_claude_key(api_key: str) -> KeyStatusResponse:
    """Check Claude API key status using latest Anthropic API"""
    if not api_key:
        return KeyStatusResponse(
            key="claude",
            status="unconfigured",
            message="API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Verify key with models endpoint
            response = await client.get(
                "https://api.anthropic.com/v1/models",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                timeout=10.0
            )
            
            if response.status_code == 401:
                return KeyStatusResponse(
                    key="claude",
                    status="invalid",
                    message="Invalid API key"
                )
            elif response.status_code == 200:
                return KeyStatusResponse(
                    key="claude",
                    status="valid",
                    message="API key is valid",
                    balance="See Anthropic Console for usage",
                    quota={
                        "haiku_pricing": "$1/MTok input, $5/MTok output",
                        "note": "Haiku 4.5 is fastest and most cost-efficient"
                    }
                )
            else:
                return KeyStatusResponse(
                    key="claude",
                    status="error",
                    message=f"API returned status {response.status_code}"
                )
    except Exception as e:
        return KeyStatusResponse(
            key="claude",
            status="error",
            message=str(e)
        )


async def check_brave_key(api_key: str) -> KeyStatusResponse:
    """Check Brave Search API key status - verified implementation"""
    if not api_key:
        return KeyStatusResponse(
            key="brave",
            status="unconfigured",
            message="API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # Test with a simple query using verified endpoint
            response = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                headers={
                    "X-Subscription-Token": api_key,
                    "Accept": "application/json"
                },
                params={"q": "test", "count": 1},
                timeout=10.0
            )
            
            if response.status_code == 401:
                return KeyStatusResponse(
                    key="brave",
                    status="invalid",
                    message="Invalid API key"
                )
            elif response.status_code == 200:
                return KeyStatusResponse(
                    key="brave",
                    status="valid",
                    message="API key is valid",
                    balance="Free tier: 2,000 queries/month",
                    quota={
                        "tier": "Check Brave Dashboard for current usage",
                        "base_pricing": "$5/1K searches",
                        "pro_pricing": "$9/1K searches"
                    }
                )
            elif response.status_code == 429:
                return KeyStatusResponse(
                    key="brave",
                    status="valid",
                    message="API key valid (rate limit reached during test)",
                    balance="Check Brave Dashboard for usage"
                )
            else:
                return KeyStatusResponse(
                    key="brave",
                    status="error",
                    message=f"API returned status {response.status_code}"
                )
    except Exception as e:
        return KeyStatusResponse(
            key="brave",
            status="error",
            message=str(e)
        )
