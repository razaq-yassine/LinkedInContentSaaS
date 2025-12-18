import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from ..config import get_settings

settings = get_settings()

LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_API_BASE = "https://api.linkedin.com/v2"

class LinkedInService:
    """Service for LinkedIn OAuth and API interactions"""
    
    @staticmethod
    def get_authorization_url(state: str) -> str:
        """Generate LinkedIn OAuth authorization URL"""
        params = {
            "response_type": "code",
            "client_id": settings.linkedin_client_id,
            "redirect_uri": settings.linkedin_redirect_uri,
            "state": state,
            "scope": "openid profile email w_member_social"
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{LINKEDIN_AUTH_URL}?{query_string}"
    
    @staticmethod
    async def exchange_code_for_token(code: str) -> Dict:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LINKEDIN_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": settings.linkedin_client_id,
                    "client_secret": settings.linkedin_client_secret,
                    "redirect_uri": settings.linkedin_redirect_uri
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.text}")
            
            return response.json()
    
    @staticmethod
    async def get_user_profile(access_token: str) -> Dict:
        """Fetch user profile from LinkedIn"""
        async with httpx.AsyncClient() as client:
            profile_response = await client.get(
                f"{LINKEDIN_API_BASE}/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if profile_response.status_code != 200:
                raise Exception(f"Profile fetch failed: {profile_response.text}")
            
            return profile_response.json()
    
    @staticmethod
    async def get_user_posts(access_token: str, author_id: str = None, limit: int = 50) -> List[Dict]:
        """
        Fetch user's recent posts from LinkedIn.
        Note: LinkedIn's API restricts access to posts for most apps.
        This will return an empty list if posts cannot be accessed.
        """
        try:
            async with httpx.AsyncClient() as client:
                # Try the UGC Posts API (requires special permissions)
                posts_response = await client.get(
                    f"{LINKEDIN_API_BASE}/ugcPosts",
                    params={
                        "q": "authors",
                        "authors": f"urn:li:person:{author_id}" if author_id else "",
                        "count": limit
                    },
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "X-Restli-Protocol-Version": "2.0.0"
                    }
                )
                
                if posts_response.status_code != 200:
                    # LinkedIn API often restricts access to posts
                    # Return empty list gracefully instead of raising error
                    print(f"LinkedIn Posts API returned {posts_response.status_code}: {posts_response.text}")
                    return []
                
                data = posts_response.json()
                posts = []
                
                for element in data.get("elements", []):
                    share_content = element.get("specificContent", {}).get("com.linkedin.ugc.ShareContent", {})
                    post_text = share_content.get("shareCommentary", {}).get("text", "")
                    
                    if post_text:
                        posts.append({
                            "id": element.get("id"),
                            "text": post_text,
                            "created_at": element.get("created", {}).get("time"),
                            "url": element.get("id")
                        })
                
                return posts
        except Exception as e:
            print(f"Error fetching LinkedIn posts: {str(e)}")
            return []
    
    @staticmethod
    async def refresh_access_token(refresh_token: str) -> Dict:
        """Refresh expired access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LINKEDIN_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": settings.linkedin_client_id,
                    "client_secret": settings.linkedin_client_secret
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Token refresh failed: {response.text}")
            
            return response.json()
