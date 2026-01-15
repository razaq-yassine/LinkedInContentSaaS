from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models import GeneratedPost, User, GeneratedImage, GeneratedPDF, PostFormat
from ..services.linkedin_service import LinkedInService
from ..services.notification_service import send_notification

async def publish_post_to_linkedin(post_id: str, db: Session) -> Dict[str, Any]:
    """
    Internal function to publish a post to LinkedIn.
    Can be called by both the endpoint and the scheduler.
    
    Returns:
        Dict with success status, message, and LinkedIn post details
    Raises:
        Exception if publishing fails
    """
    # Get the post
    post = db.query(GeneratedPost).filter(GeneratedPost.id == post_id).first()
    
    if not post:
        raise ValueError("Post not found")
    
    if post.published_to_linkedin:
        raise ValueError("Post already published")
    
    # Get user and check LinkedIn connection
    user = db.query(User).filter(User.id == post.user_id).first()
    if not user:
        raise ValueError("User not found")
    
    if not user.linkedin_connected or not user.linkedin_access_token:
        raise ValueError("LINKEDIN_NOT_CONNECTED: Please connect your LinkedIn account first to publish posts. Go to Settings > LinkedIn to connect your account.")
    
    # Check if token is expired and refresh if needed
    access_token = user.linkedin_access_token
    if user.linkedin_token_expires_at and datetime.utcnow() >= user.linkedin_token_expires_at:
        if user.linkedin_refresh_token:
            try:
                token_data = await LinkedInService.refresh_access_token(user.linkedin_refresh_token)
                access_token = token_data["access_token"]
                user.linkedin_access_token = access_token
                user.linkedin_token_expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 5184000))
                db.commit()
            except Exception as e:
                raise ValueError(f"Token expired. Please reconnect your LinkedIn account: {str(e)}")
        else:
            raise ValueError("Token expired. Please reconnect your LinkedIn account.")
    
    # Get post content (use edited content if available, otherwise use generated content)
    post_content = post.user_edited_content if post.user_edited_content else post.content
    
    if not post_content or not post_content.strip():
        raise ValueError("Post content is empty")
    
    # Get current image or PDF for attachment
    image_urn = None
    image_urns = None
    document_urn = None
    
    # Check for carousel PDF (carousel posts - PDF only, no fallback)
    if post.format == PostFormat.CAROUSEL:
        current_pdf = db.query(GeneratedPDF).filter(
            GeneratedPDF.post_id == post_id,
            GeneratedPDF.is_current == True
        ).first()
        
        if not current_pdf or not current_pdf.pdf_data:
            raise ValueError("No PDF found for this carousel post")
        
        # Upload PDF document
        try:
            document_urn = await LinkedInService.upload_document(
                access_token=access_token,
                linkedin_id=user.linkedin_id,
                pdf_base64=current_pdf.pdf_data
            )
        except Exception as e:
            raise ValueError(f"Failed to upload PDF document to LinkedIn: {str(e)}")
        
        image_urns = None
    
    # Check for single image (image posts)
    elif post.format == PostFormat.IMAGE:
        current_image = db.query(GeneratedImage).filter(
            GeneratedImage.post_id == post_id,
            GeneratedImage.is_current == True
        ).first()
        
        if current_image and current_image.image_data:
            try:
                image_urn = await LinkedInService.upload_image(
                    access_token=access_token,
                    linkedin_id=user.linkedin_id,
                    image_base64=current_image.image_data
                )
            except Exception as e:
                # If image upload fails, publish as text-only
                print(f"Failed to upload image: {str(e)}")
                image_urn = None
    
    # Publish to LinkedIn
    result = await LinkedInService.publish_post(
        access_token=access_token,
        linkedin_id=user.linkedin_id,
        content=post_content,
        visibility="PUBLIC",
        image_urn=image_urn,
        image_urns=image_urns,
        document_urn=document_urn
    )
    
    # Update post status
    post.published_to_linkedin = True
    post.scheduled_at = None  # Clear scheduled_at after publishing
    db.commit()
    
    # Send notification
    try:
        send_notification(
            db=db,
            action_code="post_published",
            user_id=user.id,
            data={
                "post_id": post.id,
                "post_title": post.topic or "Your post" if post.topic else "Your post",
                "linkedin_url": result.get("url")
            }
        )
    except Exception as e:
        # Don't fail the publish if notification fails
        print(f"Failed to send notification: {str(e)}")
    
    return {
        "success": True,
        "message": "Post published to LinkedIn successfully",
        "linkedin_post_id": result.get("id"),
        "linkedin_post_url": result.get("url")
    }


