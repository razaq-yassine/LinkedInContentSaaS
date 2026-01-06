"""
AI Configuration Router - Manage AI provider, model, and settings dynamically
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from pydantic import BaseModel
import os
import httpx

from ..database import get_db
from ..models import Admin
from ..routers.admin_auth import get_current_admin
from ..config import get_settings

router = APIRouter()


# Available AI providers and their models
AI_PROVIDERS = {
    "gemini": {
        "name": "Google Gemini",
        "models": [
            {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "description": "Fastest, most cost-effective"},
            {"id": "gemini-2.0-flash-exp", "name": "Gemini 2.0 Flash Exp", "description": "Experimental with advanced features"},
            {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "description": "Fast and versatile"},
            {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "description": "Best quality, longer context"},
        ],
        "features": ["vision", "long_context"],
        "api_key_env": "GEMINI_API_KEY",
        "model_env": "GEMINI_MODEL"
    },
    "openai": {
        "name": "OpenAI",
        "models": [
            {"id": "gpt-4o", "name": "GPT-4o", "description": "Most capable, multimodal"},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "description": "Fast and cost-effective"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "description": "High capability, vision support"},
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "description": "Fast, good for simple tasks"},
        ],
        "features": ["vision", "function_calling"],
        "api_key_env": "OPENAI_API_KEY",
        "model_env": "OPENAI_MODEL"
    },
    "claude": {
        "name": "Anthropic Claude",
        "models": [
            {"id": "claude-haiku-4-5", "name": "Claude Haiku 4.5", "description": "Fastest, most cost-efficient ($1/MTok input)"},
            {"id": "claude-sonnet-4-5", "name": "Claude Sonnet 4.5", "description": "Balanced intelligence and speed"},
            {"id": "claude-opus-4-5", "name": "Claude Opus 4.5", "description": "Most intelligent model"},
        ],
        "features": ["vision", "long_context", "extended_thinking"],
        "api_key_env": "CLAUDE_API_KEY",
        "model_env": "CLAUDE_MODEL"
    }
}

# Image generation providers
IMAGE_PROVIDERS = {
    "cloudflare": {
        "name": "Cloudflare Workers AI",
        "models": [
            {"id": "@cf/black-forest-labs/flux-1-schnell", "name": "FLUX.1 Schnell", "description": "Fast, high-quality images"},
            {"id": "@cf/stabilityai/stable-diffusion-xl-base-1.0", "name": "Stable Diffusion XL", "description": "Versatile, detailed images"},
            {"id": "@cf/bytedance/stable-diffusion-xl-lightning", "name": "SDXL Lightning", "description": "Very fast generation"},
        ],
        "api_key_env": "CLOUDFLARE_API_TOKEN",
        "account_id_env": "CLOUDFLARE_ACCOUNT_ID",
        "model_env": "CLOUDFLARE_IMAGE_MODEL"
    }
}


class AIConfigResponse(BaseModel):
    current_provider: str
    current_model: str
    current_image_model: str
    providers: Dict
    image_providers: Dict
    status: Dict


class AIConfigUpdateRequest(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    image_model: Optional[str] = None
    temperature: Optional[float] = None


class AITestRequest(BaseModel):
    provider: Optional[str] = None
    prompt: str = "Say 'Hello, I am working!' in exactly 5 words."


class AITestResponse(BaseModel):
    success: bool
    provider: str
    model: str
    response: Optional[str] = None
    error: Optional[str] = None
    latency_ms: int
    token_usage: Optional[Dict] = None


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
                    value = value.strip().strip('"').strip("'")
                    env_vars[key.strip()] = value
    
    return env_vars


def write_env_file(env_vars: Dict[str, str]):
    """Write variables to .env file, preserving comments and order"""
    env_path = get_env_file_path()
    
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
                        value = env_vars[key]
                        if ' ' in value or '"' in value:
                            value = f'"{value}"'
                        lines.append(f"{key}={value}\n")
                    else:
                        lines.append(original_line)
                else:
                    lines.append(original_line)
    
    for key, value in env_vars.items():
        if key not in existing_keys:
            if ' ' in value or '"' in value:
                value = f'"{value}"'
            lines.append(f"{key}={value}\n")
    
    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)


async def check_provider_status(provider: str, env_vars: Dict[str, str]) -> Dict:
    """Check the status of an AI provider"""
    if provider == "gemini":
        api_key = env_vars.get("GEMINI_API_KEY", "")
        if not api_key:
            return {"status": "unconfigured", "message": "API key not set"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://generativelanguage.googleapis.com/v1/models?key={api_key}",
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    model_count = len(data.get("models", []))
                    return {
                        "status": "valid",
                        "message": f"Connected ({model_count} models available)",
                        "models_available": model_count
                    }
                else:
                    return {"status": "invalid", "message": "Invalid API key"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    elif provider == "openai":
        api_key = env_vars.get("OPENAI_API_KEY", "")
        if not api_key:
            return {"status": "unconfigured", "message": "API key not set"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=10.0
                )
                if response.status_code == 200:
                    return {"status": "valid", "message": "Connected"}
                elif response.status_code == 401:
                    return {"status": "invalid", "message": "Invalid API key"}
                else:
                    return {"status": "error", "message": f"API error: {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    elif provider == "claude":
        api_key = env_vars.get("CLAUDE_API_KEY", "")
        if not api_key:
            return {"status": "unconfigured", "message": "API key not set"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.anthropic.com/v1/models",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01"
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    return {"status": "valid", "message": "Connected"}
                elif response.status_code == 401:
                    return {"status": "invalid", "message": "Invalid API key"}
                else:
                    return {"status": "error", "message": f"API error: {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    elif provider == "cloudflare":
        account_id = env_vars.get("CLOUDFLARE_ACCOUNT_ID", "")
        api_token = env_vars.get("CLOUDFLARE_API_TOKEN", "")
        if not account_id or not api_token:
            return {"status": "unconfigured", "message": "Account ID or API token not set"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.cloudflare.com/client/v4/user/tokens/verify",
                    headers={"Authorization": f"Bearer {api_token}"},
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        return {"status": "valid", "message": "Connected"}
                return {"status": "invalid", "message": "Invalid token"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    return {"status": "unknown", "message": "Unknown provider"}


@router.get("/ai/config")
async def get_ai_config(admin: Admin = Depends(get_current_admin)) -> Dict:
    """Get current AI configuration and available options"""
    env_vars = read_env_file()
    
    current_provider = env_vars.get("AI_PROVIDER", "gemini").lower()
    current_model = env_vars.get(
        f"{current_provider.upper()}_MODEL",
        "gemini-2.5-flash" if current_provider == "gemini" else "gpt-4o"
    )
    current_image_model = env_vars.get("CLOUDFLARE_IMAGE_MODEL", "@cf/black-forest-labs/flux-1-schnell")
    
    # Check status for each provider
    provider_statuses = {}
    for provider_id in AI_PROVIDERS:
        provider_statuses[provider_id] = await check_provider_status(provider_id, env_vars)
    
    # Check image provider status
    image_status = await check_provider_status("cloudflare", env_vars)
    
    return {
        "current_provider": current_provider,
        "current_model": current_model,
        "current_image_model": current_image_model,
        "providers": AI_PROVIDERS,
        "image_providers": IMAGE_PROVIDERS,
        "provider_statuses": provider_statuses,
        "image_provider_status": image_status,
        "settings": {
            "temperature": float(env_vars.get("AI_TEMPERATURE", "0.7")),
            "max_tokens": int(env_vars.get("AI_MAX_TOKENS", "4096")),
        }
    }


@router.put("/ai/config")
async def update_ai_config(
    request: AIConfigUpdateRequest,
    admin: Admin = Depends(get_current_admin)
) -> Dict:
    """Update AI configuration"""
    env_vars = read_env_file()
    updated_fields = []
    
    if request.provider:
        if request.provider not in AI_PROVIDERS:
            raise HTTPException(status_code=400, detail=f"Invalid provider: {request.provider}")
        env_vars["AI_PROVIDER"] = request.provider
        updated_fields.append("provider")
        
        # Also update OS environment for immediate effect
        os.environ["AI_PROVIDER"] = request.provider
    
    if request.model:
        current_provider = request.provider or env_vars.get("AI_PROVIDER", "gemini")
        provider_config = AI_PROVIDERS.get(current_provider)
        if provider_config:
            valid_models = [m["id"] for m in provider_config["models"]]
            if request.model not in valid_models:
                raise HTTPException(status_code=400, detail=f"Invalid model for {current_provider}: {request.model}")
            
            model_env_key = provider_config["model_env"]
            env_vars[model_env_key] = request.model
            updated_fields.append("model")
            
            os.environ[model_env_key] = request.model
    
    if request.image_model:
        cloudflare_models = [m["id"] for m in IMAGE_PROVIDERS["cloudflare"]["models"]]
        if request.image_model not in cloudflare_models:
            raise HTTPException(status_code=400, detail=f"Invalid image model: {request.image_model}")
        env_vars["CLOUDFLARE_IMAGE_MODEL"] = request.image_model
        updated_fields.append("image_model")
        
        os.environ["CLOUDFLARE_IMAGE_MODEL"] = request.image_model
    
    if request.temperature is not None:
        if not 0 <= request.temperature <= 2:
            raise HTTPException(status_code=400, detail="Temperature must be between 0 and 2")
        env_vars["AI_TEMPERATURE"] = str(request.temperature)
        updated_fields.append("temperature")
    
    # Write to .env file
    write_env_file(env_vars)
    
    # Clear settings cache to reload
    from ..config import get_settings
    get_settings.cache_clear()
    
    return {
        "success": True,
        "message": f"Updated: {', '.join(updated_fields)}",
        "updated_fields": updated_fields,
        "note": "Changes take effect immediately for new requests"
    }


@router.post("/ai/test")
async def test_ai_connection(
    request: AITestRequest,
    admin: Admin = Depends(get_current_admin)
) -> AITestResponse:
    """Test AI connection with a simple prompt"""
    import time
    
    env_vars = read_env_file()
    provider = request.provider or env_vars.get("AI_PROVIDER", "gemini")
    
    start_time = time.time()
    
    try:
        if provider == "gemini":
            api_key = env_vars.get("GEMINI_API_KEY", "")
            model = env_vars.get("GEMINI_MODEL", "gemini-2.5-flash")
            
            if not api_key:
                return AITestResponse(
                    success=False,
                    provider=provider,
                    model=model,
                    error="Gemini API key not configured",
                    latency_ms=0
                )
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
                    json={
                        "contents": [{"parts": [{"text": request.prompt}]}],
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 100}
                    },
                    timeout=30.0
                )
                
                latency = int((time.time() - start_time) * 1000)
                
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    usage = data.get("usageMetadata", {})
                    
                    return AITestResponse(
                        success=True,
                        provider=provider,
                        model=model,
                        response=text,
                        latency_ms=latency,
                        token_usage={
                            "input_tokens": usage.get("promptTokenCount", 0),
                            "output_tokens": usage.get("candidatesTokenCount", 0),
                            "total_tokens": usage.get("totalTokenCount", 0)
                        }
                    )
                else:
                    error_data = response.json()
                    error_msg = error_data.get("error", {}).get("message", f"API error: {response.status_code}")
                    return AITestResponse(
                        success=False,
                        provider=provider,
                        model=model,
                        error=error_msg,
                        latency_ms=latency
                    )
        
        elif provider == "openai":
            api_key = env_vars.get("OPENAI_API_KEY", "")
            model = env_vars.get("OPENAI_MODEL", "gpt-4o")
            
            if not api_key:
                return AITestResponse(
                    success=False,
                    provider=provider,
                    model=model,
                    error="OpenAI API key not configured",
                    latency_ms=0
                )
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": request.prompt}],
                        "temperature": 0.7,
                        "max_tokens": 100
                    },
                    timeout=30.0
                )
                
                latency = int((time.time() - start_time) * 1000)
                
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    usage = data.get("usage", {})
                    
                    return AITestResponse(
                        success=True,
                        provider=provider,
                        model=model,
                        response=text,
                        latency_ms=latency,
                        token_usage={
                            "input_tokens": usage.get("prompt_tokens", 0),
                            "output_tokens": usage.get("completion_tokens", 0),
                            "total_tokens": usage.get("total_tokens", 0)
                        }
                    )
                else:
                    error_data = response.json()
                    error_msg = error_data.get("error", {}).get("message", f"API error: {response.status_code}")
                    return AITestResponse(
                        success=False,
                        provider=provider,
                        model=model,
                        error=error_msg,
                        latency_ms=latency
                    )
        
        else:
            return AITestResponse(
                success=False,
                provider=provider,
                model="unknown",
                error=f"Unknown provider: {provider}",
                latency_ms=0
            )
    
    except httpx.TimeoutException:
        return AITestResponse(
            success=False,
            provider=provider,
            model=env_vars.get(f"{provider.upper()}_MODEL", "unknown"),
            error="Request timed out",
            latency_ms=int((time.time() - start_time) * 1000)
        )
    except Exception as e:
        return AITestResponse(
            success=False,
            provider=provider,
            model=env_vars.get(f"{provider.upper()}_MODEL", "unknown"),
            error=str(e),
            latency_ms=int((time.time() - start_time) * 1000)
        )


@router.post("/ai/test-image")
async def test_image_generation(admin: Admin = Depends(get_current_admin)) -> Dict:
    """Test image generation with Cloudflare"""
    import time
    import base64
    
    env_vars = read_env_file()
    account_id = env_vars.get("CLOUDFLARE_ACCOUNT_ID", "")
    api_token = env_vars.get("CLOUDFLARE_API_TOKEN", "")
    model = env_vars.get("CLOUDFLARE_IMAGE_MODEL", "@cf/black-forest-labs/flux-1-schnell")
    
    if not account_id or not api_token:
        return {
            "success": False,
            "error": "Cloudflare credentials not configured",
            "latency_ms": 0
        }
    
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}",
                headers={
                    "Authorization": f"Bearer {api_token}",
                    "Content-Type": "application/json"
                },
                json={"prompt": "A simple blue square on white background, minimal, test image"},
                timeout=60.0
            )
            
            latency = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                # Image is returned as binary
                image_data = base64.b64encode(response.content).decode('utf-8')
                return {
                    "success": True,
                    "model": model,
                    "latency_ms": latency,
                    "image_preview": f"data:image/png;base64,{image_data[:100]}...",
                    "image_size_bytes": len(response.content)
                }
            else:
                try:
                    error_data = response.json()
                    error_msg = str(error_data.get("errors", [{"message": f"HTTP {response.status_code}"}])[0].get("message", "Unknown error"))
                except:
                    error_msg = f"HTTP {response.status_code}"
                
                return {
                    "success": False,
                    "model": model,
                    "error": error_msg,
                    "latency_ms": latency
                }
    
    except httpx.TimeoutException:
        return {
            "success": False,
            "model": model,
            "error": "Request timed out (image generation can take up to 60s)",
            "latency_ms": int((time.time() - start_time) * 1000)
        }
    except Exception as e:
        return {
            "success": False,
            "model": model,
            "error": str(e),
            "latency_ms": int((time.time() - start_time) * 1000)
        }


@router.get("/ai/providers")
async def get_available_providers(admin: Admin = Depends(get_current_admin)) -> Dict:
    """Get list of available AI providers and their models"""
    return {
        "text_providers": AI_PROVIDERS,
        "image_providers": IMAGE_PROVIDERS
    }
