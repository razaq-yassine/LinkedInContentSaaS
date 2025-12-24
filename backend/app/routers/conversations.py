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
    for msg in conv_messages:
        # Safeguard: Check if content is JSON and extract post_content if needed
        content = msg.content
        if isinstance(content, str) and content.strip().startswith('{') and '"post_content"' in content:
            try:
                import json
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "post_content" in parsed:
                    extracted = parsed.get("post_content")
                    if isinstance(extracted, str) and len(extracted.strip()) > 0:
                        content = extracted
                        print(f"Extracted post_content from JSON in conversation message {msg.id}")
            except:
                pass
        
        message_data = {
            "id": msg.id,
            "role": msg.role.value,
            "content": content,
            "created_at": msg.created_at
        }
        
        # If it's an assistant message, fetch post details
        if msg.role.value == "assistant" and msg.post_id:
            post = db.query(GeneratedPost).filter(GeneratedPost.id == msg.post_id).first()
            if post:
                message_data["format"] = post.format.value
                message_data["post_id"] = msg.post_id  # Include post_id in response
                # Get image_prompt/image_prompts from generation_options
                if post.generation_options:
                    gen_options = post.generation_options if isinstance(post.generation_options, dict) else {}
                    message_data["image_prompt"] = gen_options.get("image_prompt")
                    # For carousel posts, also include image_prompts array
                    if post.format.value == 'carousel':
                        message_data["image_prompts"] = gen_options.get("image_prompts")
                    message_data["metadata"] = gen_options.get("metadata")
                else:
                    message_data["image_prompt"] = None
                    if post.format.value == 'carousel':
                        message_data["image_prompts"] = None
                    message_data["metadata"] = None
        
        messages.append(MessageResponse(**message_data))
    
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

