from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
import uuid

from ..database import get_db
from ..models import Conversation, GeneratedPost, UserProfile, ConversationMessage
from ..routers.auth import get_current_user_id
from ..schemas.conversation import (
    ConversationResponse,
    ConversationDetailResponse,
    CreateConversationRequest,
    UpdateConversationTitleRequest,
    MessageResponse
)
from ..schemas.generation import PostGenerationRequest, PostGenerationResponse
from ..services.ai_service import generate_completion, generate_conversation_title
from ..prompts.system_prompts import build_post_generation_prompt
from ..prompts.templates import get_format_specific_instructions

router = APIRouter()

@router.get("/", response_model=List[ConversationResponse])
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List user's conversations with preview
    """
    conversations = db.query(Conversation).filter(
        Conversation.user_id == user_id
    ).order_by(Conversation.updated_at.desc()).all()
    
    result = []
    for conv in conversations:
        # Get message count and last message preview
        posts = db.query(GeneratedPost).filter(
            GeneratedPost.conversation_id == conv.id
        ).order_by(GeneratedPost.created_at.desc()).all()
        
        message_count = len(posts)
        last_message_preview = None
        if posts:
            last_message_preview = posts[0].content[:100] + "..." if len(posts[0].content) > 100 else posts[0].content
        
        result.append(ConversationResponse(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=message_count,
            last_message_preview=last_message_preview
        ))
    
    return result

@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get conversation with all messages (both user and assistant)
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get all messages in this conversation (ordered by creation time)
    conv_messages = db.query(ConversationMessage).filter(
        ConversationMessage.conversation_id == conversation_id
    ).order_by(ConversationMessage.created_at.asc()).all()
    
    messages = []
    # Get all user messages first to check against assistant messages
    user_messages_by_conversation = {}
    for msg in conv_messages:
        if msg.role.value == "USER":
            user_messages_by_conversation[msg.id] = msg.content.strip().lower() if msg.content else ""
    
    for msg in conv_messages:
        # Initialize content variable - will be set below for assistant messages with posts
        content = msg.content
        
        # Safeguard: Check if content is JSON and extract post_content if needed (for user messages or fallback)
        if isinstance(content, str) and content.strip().startswith('{') and '"post_content"' in content:
            try:
                import json
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "post_content" in parsed:
                    extracted = parsed.get("post_content")
                    if isinstance(extracted, str) and len(extracted.strip()) > 0:
                        content = extracted
            except:
                pass
        
        message_data = {
            "id": msg.id,
            "role": msg.role.value,
            "content": content,  # Will be updated for assistant messages with posts
            "created_at": msg.created_at
        }
        
        # If it's an assistant message, fetch post details
        # Note: MessageRole enum values are uppercase ("ASSISTANT", "USER")
        if msg.role.value == "ASSISTANT":
            # Always include post_id if it exists, even if post lookup fails
            if msg.post_id:
                message_data["post_id"] = msg.post_id  # Always include post_id first
                post = db.query(GeneratedPost).filter(GeneratedPost.id == msg.post_id).first()
                if post:
                    # CRITICAL: Use post.content instead of msg.content for assistant messages
                    # This ensures we always get the correct generated content, not the user's prompt
                    if post.content and isinstance(post.content, str) and len(post.content.strip()) > 0:
                        # Additional safety check: if post.content equals the topic (user's prompt), use message content instead
                        # This prevents showing the user's prompt as the assistant message
                        post_content_clean = post.content.strip()
                        topic_clean = post.topic.strip() if post.topic else ""
                        
                        # CRITICAL: Check if content matches ANY user message in the conversation (case-insensitive)
                        content_matches_user_prompt = False
                        for user_msg_content in user_messages_by_conversation.values():
                            if user_msg_content and post_content_clean.lower() == user_msg_content:
                                content_matches_user_prompt = True
                                break
                        
                        # Case-insensitive comparison with topic
                        if topic_clean and post_content_clean.lower() == topic_clean.lower():
                            # Post content is the same as topic (user prompt) - this is an error
                            # Check if msg.content is also wrong, if so, return error message
                            msg_content_clean = msg.content.strip().lower() if msg.content else ""
                            if msg_content_clean == topic_clean.lower() or content_matches_user_prompt:
                                # Both post.content and msg.content are wrong - return error
                                content = "Error: Generated content appears to be invalid. Please regenerate this post."
                            else:
                                # Use message content as fallback
                                content = msg.content
                        elif content_matches_user_prompt:
                            # Content matches a user message but not the topic - still an error
                            msg_content_clean = msg.content.strip().lower() if msg.content else ""
                            if msg_content_clean in user_messages_by_conversation.values():
                                # msg.content is also wrong - return error
                                content = "Error: Generated content appears to be invalid. Please regenerate this post."
                            else:
                                # Use message content as fallback
                                content = msg.content
                        elif len(post_content_clean) < 10:
                            # Post content is too short (likely an error) - use message content
                            content = msg.content
                        else:
                            content = post.content
                    else:
                        # Fallback to message content if post content is missing
                        # But check if msg.content matches any user prompt
                        msg_content_clean = msg.content.strip().lower() if msg.content else ""
                        if msg_content_clean in user_messages_by_conversation.values():
                            # msg.content matches a user prompt - return error
                            content = "Error: Generated content appears to be invalid. Please regenerate this post."
                        else:
                            content = msg.content
                    
                    message_data["format"] = post.format.value.lower() if post.format else 'text'
                    message_data["format_type"] = post.format.value.lower() if post.format else 'text'
                    message_data["published_to_linkedin"] = post.published_to_linkedin or False  # Include published status
                    # Get image_prompt/image_prompts from generation_options
                    if post.generation_options:
                        gen_options = post.generation_options if isinstance(post.generation_options, dict) else {}
                        message_data["image_prompt"] = gen_options.get("image_prompt")
                        # For carousel posts, also include image_prompts array
                        if post.format.value.lower() == 'carousel':
                            message_data["image_prompts"] = gen_options.get("image_prompts")
                        message_data["metadata"] = gen_options.get("metadata")
                        # Include token_usage if available
                        message_data["token_usage"] = gen_options.get("token_usage")
                    else:
                        message_data["image_prompt"] = None
                        if post.format.value.lower() == 'carousel':
                            message_data["image_prompts"] = None
                        message_data["metadata"] = None
                        message_data["token_usage"] = None
                    
                    # Update content with post content
                    message_data["content"] = content
                else:
                    # Post not found but message has post_id - still include post_id
                    # Check if msg.content matches any user prompt
                    msg_content_clean = msg.content.strip().lower() if msg.content else ""
                    if msg_content_clean in user_messages_by_conversation.values():
                        # msg.content matches a user prompt - return error
                        content = "Error: Generated content appears to be invalid. Please regenerate this post."
                    # Try to infer format from post_id lookup or set defaults
                    message_data["format"] = None
                    message_data["format_type"] = None
                    message_data["published_to_linkedin"] = False
                    message_data["image_prompt"] = None
                    message_data["image_prompts"] = None
                    message_data["metadata"] = None
                    message_data["token_usage"] = None
                    # Update content
                    message_data["content"] = content
            else:
                # Assistant message but no post_id
                # Check if content matches any user prompt
                msg_content_clean = msg.content.strip().lower() if msg.content else ""
                if msg_content_clean in user_messages_by_conversation.values():
                    # Content matches a user prompt - return error
                    content = "Error: Generated content appears to be invalid. Please regenerate this post."
                message_data["post_id"] = None
                message_data["format"] = None
                message_data["format_type"] = None
                message_data["published_to_linkedin"] = False
                message_data["content"] = content
        else:
            # User message - no post_id or format
            message_data["post_id"] = None
            message_data["format"] = None
            message_data["format_type"] = None
            message_data["published_to_linkedin"] = False
        
        # Ensure all required fields are present before creating MessageResponse
        # Pydantic will handle None values correctly, but we need to make sure they're explicitly set
        msg_response = MessageResponse(
            id=message_data["id"],
            role=message_data["role"],
            content=message_data["content"],
            created_at=message_data["created_at"],
            format=message_data.get("format"),
            format_type=message_data.get("format_type"),
            post_id=message_data.get("post_id"),
            image_prompt=message_data.get("image_prompt"),
            image_prompts=message_data.get("image_prompts"),
            metadata=message_data.get("metadata"),
            token_usage=message_data.get("token_usage"),
            published_to_linkedin=message_data.get("published_to_linkedin", False)
        )
        messages.append(msg_response)
    
    return ConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=messages
    )

@router.post("/", response_model=ConversationResponse)
async def create_conversation(
    request: CreateConversationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create new conversation with initial message
    """
    # Generate title from first message
    title = await generate_conversation_title(request.initial_message)
    
    # Create conversation
    conversation = Conversation(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=0,
        last_message_preview=None
    )

@router.put("/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: str,
    request: UpdateConversationTitleRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Rename conversation
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.title = request.title
    conversation.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "message": "Conversation title updated"
    }

@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete conversation and all associated messages
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conversation)
    db.commit()
    
    return {
        "success": True,
        "message": "Conversation deleted"
    }

