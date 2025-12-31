import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from urllib.parse import urlencode, quote
import base64
import io
import asyncio
import json
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
        # Use configured scopes or default to OpenID Connect scopes
        scopes = settings.linkedin_scopes if hasattr(settings, 'linkedin_scopes') and settings.linkedin_scopes else "openid profile email w_member_social"
        
        params = {
            "response_type": "code",
            "client_id": settings.linkedin_client_id,
            "redirect_uri": settings.linkedin_redirect_uri,
            "state": state,
            "scope": scopes
        }
        
        # URL encode the parameters properly
        query_string = urlencode(params)
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
    
    @staticmethod
    async def upload_image(access_token: str, linkedin_id: str, image_base64: str) -> str:
        """
        Upload an image to LinkedIn using Assets API (for UGC posts) and return the asset URN.
        
        Args:
            access_token: LinkedIn access token
            linkedin_id: User's LinkedIn ID (without 'urn:li:person:' prefix)
            image_base64: Base64 encoded image data (without data URL prefix)
        
        Returns:
            Asset URN (e.g., "urn:li:digitalmediaAsset:C5522AQGTYER3k3ByHQ")
        """
        async with httpx.AsyncClient() as client:
            person_urn = f"urn:li:person:{linkedin_id}"
            
            # Step 1: Register upload using Assets API (required for UGC posts)
            register_response = await client.post(
                f"{LINKEDIN_API_BASE}/assets?action=registerUpload",
                json={
                    "registerUploadRequest": {
                        "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                        "owner": person_urn,
                        "serviceRelationships": [
                            {
                                "relationshipType": "OWNER",
                                "identifier": "urn:li:userGeneratedContent"
                            }
                        ],
                        "supportedUploadMechanism": ["SYNCHRONOUS_UPLOAD"]
                    }
                },
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0",
                    "Content-Type": "application/json"
                }
            )
            
            if register_response.status_code != 200:
                error_text = register_response.text
                try:
                    error_json = register_response.json()
                    error_text = error_json.get("message", str(error_json))
                except:
                    pass
                raise Exception(f"Failed to register image upload: {error_text}")
            
            register_data = register_response.json()
            upload_url = register_data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
            asset_urn = register_data["value"]["asset"]
            
            # Step 2: Decode base64 and upload image
            # Remove data URL prefix if present
            if "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]
            
            image_bytes = base64.b64decode(image_base64)
            
            # Step 3: Upload the image binary
            upload_response = await client.put(
                upload_url,
                content=image_bytes,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "image/png"  # Default to PNG, could detect from base64
                }
            )
            
            if upload_response.status_code not in [200, 201]:
                raise Exception(f"Failed to upload image: {upload_response.text}")
            
            # Return the asset URN (not image URN) for UGC posts
            return asset_urn
    
    @staticmethod
    async def upload_document(access_token: str, linkedin_id: str, pdf_base64: str) -> str:
        """
        Upload a PDF document to LinkedIn using Documents API (for UGC posts) and return the document URN.
        
        Args:
            access_token: LinkedIn access token
            linkedin_id: User's LinkedIn ID (without 'urn:li:person:' prefix)
            pdf_base64: Base64 encoded PDF data (without data URL prefix)
        
        Returns:
            Document URN (e.g., "urn:li:document:C5522AQGTYER3k3ByHQ")
        """
        async with httpx.AsyncClient() as client:
            person_urn = f"urn:li:person:{linkedin_id}"
            
            # Try Documents API first (separate API for documents)
            # Use REST API endpoint with LinkedIn-Version header
            linkedin_version = "202411"  # Use a stable version
            
            # Step 1: Initialize upload using Documents API
            initialize_payload = {
                "initializeUploadRequest": {
                    "owner": person_urn
                }
            }
            
            print(f"Trying Documents API initializeUpload with payload: {json.dumps(initialize_payload, indent=2)}")
            
            initialize_response = await client.post(
                "https://api.linkedin.com/rest/documents?action=initializeUpload",
                json=initialize_payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "LinkedIn-Version": linkedin_version,
                    "X-Restli-Protocol-Version": "2.0.0",
                    "Content-Type": "application/json"
                }
            )
            
            if initialize_response.status_code in [200, 201]:
                # Documents API worked!
                initialize_data = initialize_response.json()
                print(f"Documents API initializeUpload success: {json.dumps(initialize_data, indent=2)}")
                
                # Get upload URL and document URN from response
                # Response structure may vary - check multiple possible structures
                value = initialize_data.get("value", initialize_data)  # Some APIs return value directly
                
                # Try multiple possible locations for upload URL
                # According to LinkedIn Documents API docs, uploadUrl is directly in value.uploadUrl
                upload_url = None
                document_urn = None
                
                # Method 1: Check for direct uploadUrl field (Documents API standard structure)
                upload_url = value.get("uploadUrl")
                
                # Method 2: Check uploadInstructions array (alternative structure)
                if not upload_url:
                    upload_instructions = value.get("uploadInstructions", [])
                    if upload_instructions and isinstance(upload_instructions, list) and len(upload_instructions) > 0:
                        upload_url = upload_instructions[0].get("uploadUrl")
                
                # Method 3: Check uploadMechanism (like Assets API, for fallback)
                if not upload_url:
                    upload_mechanism = value.get("uploadMechanism", {})
                    if "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest" in upload_mechanism:
                        upload_url = upload_mechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].get("uploadUrl")
                    elif "com.linkedin.digitalmedia.uploading.MultipartUploadMechanism" in upload_mechanism:
                        multipart = upload_mechanism["com.linkedin.digitalmedia.uploading.MultipartUploadMechanism"]
                        upload_instructions_multipart = multipart.get("uploadInstructions", [])
                        if upload_instructions_multipart:
                            upload_url = upload_instructions_multipart[0].get("uploadUrl")
                
                # Get document URN (could be "document", "id", or in headers)
                document_urn = value.get("document") or value.get("id")
                
                # Check response headers for document URN (some APIs return it in headers)
                if not document_urn and "x-restli-id" in initialize_response.headers:
                    document_urn = initialize_response.headers.get("x-restli-id")
                
                if not upload_url:
                    raise Exception(
                        f"No upload URL found in Documents API response. "
                        f"Response structure: {json.dumps(initialize_data, indent=2)}"
                    )
                
                if not document_urn:
                    raise Exception(
                        f"No document URN found in Documents API response. "
                        f"Response structure: {json.dumps(initialize_data, indent=2)}"
                    )
                
                # Step 2: Decode base64 and upload PDF
                try:
                    if "," in pdf_base64:
                        pdf_base64 = pdf_base64.split(",", 1)[1]
                    
                    pdf_bytes = base64.b64decode(pdf_base64)
                    pdf_size = len(pdf_bytes)
                    print(f"Uploading PDF document: {pdf_size} bytes ({pdf_size / 1024 / 1024:.2f} MB) to {upload_url}")
                    
                    # Step 3: Upload the PDF binary with timeout
                    # Note: LinkedIn may return empty response on success, which is normal
                    # Use a longer timeout for large files (8MB+)
                    timeout = httpx.Timeout(300.0, connect=30.0)  # 5 minutes total, 30s connect
                    
                    upload_response = await client.put(
                        upload_url,
                        content=pdf_bytes,
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/pdf"
                        },
                        timeout=timeout
                    )
                    
                    print(f"Upload response status: {upload_response.status_code}")
                    print(f"Upload response headers: {dict(upload_response.headers)}")
                    if upload_response.text:
                        print(f"Upload response body: {upload_response.text[:500]}")  # First 500 chars
                    
                    if upload_response.status_code not in [200, 201, 202, 204]:
                        error_text = upload_response.text
                        try:
                            error_json = upload_response.json()
                            error_text = error_json.get("message", str(error_json))
                        except:
                            pass
                        raise Exception(f"Failed to upload document (status {upload_response.status_code}): {error_text}")
                    
                    # LinkedIn may return empty response on success - that's normal
                    print(f"Document uploaded successfully! Document URN: {document_urn}")
                    
                    # IMPORTANT: Documents API returns document URNs (urn:li:document:) which are for ads/sponsored content
                    # UGC posts require digitalmediaAsset URNs (urn:li:digitalmediaAsset:)
                    # The Documents API may not support organic UGC posts for personal accounts
                    # 
                    # Try to fetch document details to see if there's an associated digitalmediaAsset URN
                    try:
                        import time
                        linkedin_version = "202411"
                        
                        # Wait a moment for document processing
                        await asyncio.sleep(2)
                        
                        # URL encode the document URN for the API call
                        encoded_doc_urn = quote(document_urn, safe='')
                        
                        doc_response = await client.get(
                            f"https://api.linkedin.com/rest/documents/{encoded_doc_urn}",
                            headers={
                                "Authorization": f"Bearer {access_token}",
                                "LinkedIn-Version": linkedin_version,
                                "X-Restli-Protocol-Version": "2.0.0"
                            }
                        )
                        if doc_response.status_code == 200:
                            doc_data = doc_response.json()
                            print(f"Document details: {json.dumps(doc_data, indent=2)}")
                            # Check if there's a digitalmediaAsset URN in the response
                            value = doc_data.get("value", doc_data)
                            asset_urn = value.get("digitalmediaAsset") or value.get("asset") or value.get("mediaAsset")
                            if asset_urn:
                                print(f"Found associated asset URN: {asset_urn}")
                                return asset_urn
                        else:
                            print(f"Could not fetch document details: {doc_response.status_code} - {doc_response.text}")
                    except Exception as e:
                        print(f"Could not fetch document details: {str(e)}")
                        import traceback
                        print(f"Traceback: {traceback.format_exc()}")
                    
                    # Return document URN - will try to use it directly
                    # Note: This may fail with "not owned by the author" error for UGC posts
                    # Documents API is designed for ads, not organic UGC posts
                    print(f"Warning: Using document URN for UGC post. This may not work - document URNs are for ads.")
                    return document_urn
                    
                except httpx.TimeoutException as e:
                    raise Exception(f"Upload timeout: The PDF file ({pdf_size / 1024 / 1024:.2f} MB) is too large or upload is taking too long: {str(e)}")
                except Exception as e:
                    print(f"Error during PDF upload: {str(e)}")
                    print(f"Error type: {type(e).__name__}")
                    import traceback
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            # If Documents API fails, fall back to Assets API (for backward compatibility)
            print(f"Documents API failed ({initialize_response.status_code}), trying Assets API fallback...")
            
            # Fallback to Assets API approach
            request_payload = {
                "registerUploadRequest": {
                    "owner": person_urn,
                    "recipes": ["urn:li:digitalmediaRecipe:feedshare-document"],
                    "serviceRelationships": [
                        {
                            "identifier": "urn:li:userGeneratedContent",
                            "relationshipType": "OWNER"
                        }
                    ]
                }
            }
            
            register_response = await client.post(
                f"{LINKEDIN_API_BASE}/assets?action=registerUpload",
                json=request_payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0",
                    "Content-Type": "application/json"
                }
            )
            
            if register_response.status_code != 200:
                error_text = register_response.text
                error_details = {}
                try:
                    error_json = register_response.json()
                    error_text = error_json.get("message", str(error_json))
                    error_details = error_json
                except:
                    pass
                
                print(f"Assets API also failed:")
                print(f"  Status: {register_response.status_code}")
                print(f"  Response: {error_text}")
                print(f"  Full error: {error_details}")
                
                raise Exception(
                    f"Both Documents API and Assets API failed. "
                    f"Documents API error: {initialize_response.text if initialize_response.status_code != 200 else 'N/A'}. "
                    f"Assets API error: {error_text}"
                )
            
            register_data = register_response.json()
            
            # Handle different upload mechanisms (synchronous or multipart)
            upload_mechanism = register_data["value"]["uploadMechanism"]
            
            if "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest" in upload_mechanism:
                upload_url = upload_mechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
            elif "com.linkedin.digitalmedia.uploading.MultipartUploadMechanism" in upload_mechanism:
                multipart_mechanism = upload_mechanism["com.linkedin.digitalmedia.uploading.MultipartUploadMechanism"]
                upload_url = multipart_mechanism.get("uploadUrl") or multipart_mechanism.get("uploadInstructions", [{}])[0].get("uploadUrl")
            else:
                raise Exception(f"Unsupported upload mechanism: {list(upload_mechanism.keys())}")
            
            asset_urn = register_data["value"]["asset"]
            
            # Decode and upload PDF
            if "," in pdf_base64:
                pdf_base64 = pdf_base64.split(",", 1)[1]
            
            pdf_bytes = base64.b64decode(pdf_base64)
            
            upload_response = await client.put(
                upload_url,
                content=pdf_bytes,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/pdf"
                }
            )
            
            if upload_response.status_code not in [200, 201]:
                raise Exception(f"Failed to upload document: {upload_response.text}")
            
            return asset_urn
    
    @staticmethod
    async def publish_post(
        access_token: str, 
        linkedin_id: str, 
        content: str, 
        visibility: str = "PUBLIC",
        image_urn: Optional[str] = None,
        image_urns: Optional[List[str]] = None,
        document_urn: Optional[str] = None
    ) -> Dict:
        """
        Publish a post to LinkedIn.
        
        Args:
            access_token: LinkedIn access token
            linkedin_id: User's LinkedIn ID (without 'urn:li:person:' prefix)
            content: Post content text
            visibility: Post visibility (PUBLIC, CONNECTIONS, etc.)
            image_urn: Single image URN for image posts
            image_urns: List of image URNs for carousel/multi-image posts
            document_urn: Document/PDF URN for document posts
        
        Returns:
            Dict with post ID and URL
        """
        async with httpx.AsyncClient() as client:
            # Get user's person URN
            person_urn = f"urn:li:person:{linkedin_id}"
            
            # Determine media category - document takes priority
            if document_urn:
                # Document/PDF post
                share_media_category = "NATIVE_DOCUMENT"
                media_urns = [document_urn]
            elif image_urns and len(image_urns) > 0:
                # Multi-image post (carousel-like for organic posts)
                share_media_category = "IMAGE"
                media_urns = image_urns
            elif image_urn:
                # Single image post
                share_media_category = "IMAGE"
                media_urns = [image_urn]
            else:
                # Text-only post
                share_media_category = "NONE"
                media_urns = []
            
            # Prepare the UGC post payload according to LinkedIn API
            share_content = {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": share_media_category
            }
            
            # Add media if present
            if share_media_category == "NATIVE_DOCUMENT" and media_urns:
                # Document post format
                # Note: Documents API returns document URNs (urn:li:document:) which are for ads
                # UGC posts might require digitalmediaAsset URNs (urn:li:digitalmediaAsset:)
                # This is a known limitation - documents may not be supported for personal account UGC posts
                document_urn = media_urns[0]
                
                print(f"Attempting to use document URN for UGC post: {document_urn}")
                print("Note: Document URNs from Documents API are typically for ads/sponsored content.")
                print("UGC posts may require digitalmediaAsset URNs instead.")
                
                share_content["media"] = [
                    {
                        "status": "READY",
                        "media": document_urn
                    }
                ]
            elif share_media_category == "IMAGE" and media_urns:
                # Multi-image post - include ALL images
                share_content["media"] = [
                    {
                        "status": "READY",
                        "media": urn
                    }
                    for urn in media_urns
                ]
            
            ugc_post_data = {
                "author": person_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": share_content
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": visibility
                }
            }
            
            # Publish the post
            # For documents, try the newer Posts API first (rest/posts) as it might support documents better
            # Fall back to UGC Posts API if needed
            use_posts_api = share_media_category == "NATIVE_DOCUMENT"
            
            if use_posts_api:
                # Try newer Posts API for documents
                linkedin_version = "202411"
                
                # Posts API has a different structure
                posts_api_data = {
                    "author": person_urn,
                    "commentary": content,
                    "visibility": visibility,
                    "lifecycleState": "PUBLISHED",
                    "distribution": {
                        "feedDistribution": "MAIN_FEED"
                    }
                }
                
                # Add document media (Posts API structure)
                if document_urn:
                    posts_api_data["content"] = {
                        "media": {
                            "title": "Carousel Post.pdf",  # Title for the document
                            "id": document_urn
                        }
                    }
                
                print(f"Trying Posts API (rest/posts) for document post...")
                print(f"Posts API payload: {json.dumps(posts_api_data, indent=2)}")
                
                try:
                    response = await client.post(
                        "https://api.linkedin.com/rest/posts",
                        json=posts_api_data,
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "LinkedIn-Version": linkedin_version,
                            "X-Restli-Protocol-Version": "2.0.0",
                            "Content-Type": "application/json"
                        },
                        timeout=60.0
                    )
                    
                    print(f"Posts API response status: {response.status_code}")
                    print(f"Posts API response headers: {dict(response.headers)}")
                    print(f"Posts API response text (first 500 chars): {response.text[:500]}")
                    
                    if response.status_code in [200, 201]:
                        # Posts API succeeded
                        response_text = response.text.strip()
                        if not response_text:
                            print("Posts API returned empty response, treating as success")
                            # Some LinkedIn APIs return 201 with empty body on success
                            # Try to extract post ID from Location header if available
                            location = response.headers.get("Location") or response.headers.get("location")
                            if location:
                                # Extract ID from location URL
                                post_id = location.split("/")[-1] if "/" in location else location
                                return {
                                    "id": post_id,
                                    "urn": location,
                                    "url": f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None,
                                    "success": True
                                }
                            else:
                                # No location header, try to construct from document URN
                                # This is a fallback - ideally LinkedIn should return the post ID
                                return {
                                    "id": "",
                                    "urn": document_urn if document_urn else "",
                                    "url": None,
                                    "success": True
                                }
                        
                        try:
                            result = response.json()
                            post_id = result.get("id", "")
                            
                            if ":" in post_id:
                                post_id = post_id.split(":")[-1]
                            
                            return {
                                "id": post_id,
                                "urn": result.get("id", ""),
                                "url": f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None,
                                "success": True
                            }
                        except ValueError as e:
                            print(f"Failed to parse Posts API JSON response: {str(e)}")
                            print(f"Response text: {response_text}")
                            raise Exception(f"Posts API returned invalid JSON: {str(e)}")
                    else:
                        # Posts API failed, fall back to UGC Posts API
                        error_text = response.text
                        try:
                            error_json = response.json()
                            error_text = error_json.get("message", str(error_json))
                        except:
                            pass
                        print(f"Posts API failed ({response.status_code}): {error_text}")
                        print("Falling back to UGC Posts API...")
                        use_posts_api = False
                        
                except httpx.TimeoutException as e:
                    print(f"Posts API timed out: {str(e)}, falling back to UGC Posts API...")
                    use_posts_api = False
                except Exception as e:
                    print(f"Posts API failed with exception: {str(e)}, falling back to UGC Posts API...")
                    use_posts_api = False
            
            if not use_posts_api:
                # Use UGC Posts API (original method)
                print(f"Trying UGC Posts API (v2/ugcPosts) for post...")
                print(f"UGC Posts API payload: {json.dumps(ugc_post_data, indent=2)}")
                
                response = await client.post(
                    f"{LINKEDIN_API_BASE}/ugcPosts",
                    json=ugc_post_data,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "X-Restli-Protocol-Version": "2.0.0",
                        "Content-Type": "application/json"
                    },
                    timeout=60.0
                )
                
                print(f"UGC Posts API response status: {response.status_code}")
                print(f"UGC Posts API response headers: {dict(response.headers)}")
                print(f"UGC Posts API response text (first 500 chars): {response.text[:500]}")
                
                if response.status_code not in [200, 201]:
                    error_text = response.text
                    try:
                        error_json = response.json()
                        error_text = error_json.get("message", str(error_json))
                    except:
                        pass
                    raise Exception(f"Failed to publish post to LinkedIn: {error_text}")
                
                # Parse response - handle empty responses
                response_text = response.text.strip()
                if not response_text:
                    print("UGC Posts API returned empty response")
                    # Try to extract post ID from Location header if available
                    location = response.headers.get("Location") or response.headers.get("location")
                    if location:
                        post_id = location.split("/")[-1] if "/" in location else location
                        return {
                            "id": post_id,
                            "urn": location,
                            "url": f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None,
                            "success": True
                        }
                    else:
                        raise Exception("UGC Posts API returned empty response with no Location header")
                
                try:
                    result = response.json()
                except ValueError as e:
                    print(f"Failed to parse UGC Posts API JSON response: {str(e)}")
                    print(f"Response text: {response_text[:500]}")
                    raise Exception(f"UGC Posts API returned invalid JSON: {str(e)}")
                
                post_id = result.get("id", "")
                
                # Extract the numeric ID from the URN
                if ":" in post_id:
                    post_id = post_id.split(":")[-1]
                
                return {
                    "id": post_id,
                    "urn": result.get("id", ""),
                    "url": f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None,
                    "success": True
                }
