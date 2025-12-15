from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..database import get_db
from ..models import UserProfile, GeneratedPost, Conversation, ConversationMessage, MessageRole
from ..routers.auth import get_current_user_id
from ..schemas.generation import (
    PostGenerationRequest,
    PostGenerationResponse,
    PostMetadata,
    GenerationHistoryResponse,
    UpdateGenerationRequest
)
from ..services.ai_service import generate_completion, generate_conversation_title
from ..prompts.system_prompts import build_post_generation_prompt
from ..prompts.templates import get_format_specific_instructions
from ..prompts.format_instructions import (
    get_format_instructions,
    get_json_format,
    RESPONSE_FORMAT_REQUIREMENTS
)
import json
import re
import traceback

router = APIRouter()

@router.post("/post", response_model=PostGenerationResponse)
async def generate_post(
    request: PostGenerationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Generate LinkedIn post using chat interface
    
    Options can include:
    - post_type: text/carousel/image/auto
    - topic_mode: trending/auto/custom
    - tone: professional/casual/thought-leader/educator
    - length: short/medium/long
    - hashtag_count: 0-10
    - format_style: top_creator/story/data/question
    """
    try:
        # Get user profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile or not profile.onboarding_completed:
            raise HTTPException(
                status_code=400,
                detail="Please complete onboarding first"
            )
        
        # Build system prompt with user context
        system_prompt = build_post_generation_prompt(
            profile_md=profile.profile_md or "",
            writing_style_md=profile.writing_style_md or "",
            context_json=profile.context_json or {},
            user_message=request.message,
            options=request.options
        )
        
        # Add format-specific instructions
        post_type = request.options.get('post_type', 'text')
        
        # Normalize post type (handle variations)
        if post_type == 'text_with_image':
            post_type = 'image'
        
        # Enforce format type based on user selection
        if post_type == 'image':
            enforced_format = 'image'
            format_instructions = get_format_specific_instructions('image')
            system_prompt += f"\n\n{get_format_instructions('image')}"
            system_prompt += f"\n## Format Instructions\n{format_instructions}"
        elif post_type == 'carousel':
            enforced_format = 'carousel'
            format_instructions = get_format_specific_instructions('carousel')
            system_prompt += f"\n\n{get_format_instructions('carousel')}"
            system_prompt += f"\n## Format Instructions\n{format_instructions}"
        elif post_type != 'auto':
            enforced_format = post_type
            format_instructions = get_format_specific_instructions(post_type)
            system_prompt += f"\n\n## Format Instructions\n{format_instructions}"
        else:
            enforced_format = None
        
        # Build JSON response format based on post type
        json_format = get_json_format(post_type)
        
        # Add JSON response instruction
        system_prompt += f"\n\n{RESPONSE_FORMAT_REQUIREMENTS}\n{json_format}"
        
        # Generate post
        try:
            raw_response = await generate_completion(
                system_prompt=system_prompt,
                user_message=request.message,
                temperature=0.8
            )
        except Exception as e:
            error_trace = traceback.format_exc()
            print(f"AI generation error: {str(e)}")
            print(f"Traceback: {error_trace}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate post: {str(e)}"
            )
        
        # Parse JSON response
        try:
            # Remove markdown code blocks if present
            cleaned_response = raw_response.strip()
            if cleaned_response.startswith("```"):
                cleaned_response = re.sub(r'^```json\s*\n?', '', cleaned_response)
                cleaned_response = re.sub(r'\n?```$', '', cleaned_response)
            
            response_data = json.loads(cleaned_response)
            post_content = response_data.get("post_content", raw_response)
            
            # Clean post_content: Remove any slide prompts or image descriptions that might have leaked in
            if post_content:
                # Remove common patterns that indicate prompts leaked into content
                lines = post_content.split('\n')
                cleaned_lines = []
                skip_next_n_lines = 0
                
                for i, line in enumerate(lines):
                    if skip_next_n_lines > 0:
                        skip_next_n_lines -= 1
                        continue
                    
                    line_stripped = line.strip()
                    line_lower = line_stripped.lower()
                    
                    # Skip lines that look like prompts or headers
                    if any(pattern in line_lower for pattern in [
                        'slide 1:', 'slide 2:', 'slide 3:', 'slide 4:', 'slide 5:', 'slide 6:', 'slide 7:', 'slide 8:', 'slide 9:', 'slide 10:',
                        'image prompt:', 'visual description:', 'image description:', 'prompt:', 'description:',
                        'prompt for slide', 'image for slide', 'visual for slide',
                        'cover slide:', 'final slide:', 'slide (cover):',
                        'image generation prompt', 'ai image prompt', 'image generation description'
                    ]):
                        # Skip this line and potentially the next few lines if it's a header
                        skip_next_n_lines = 2  # Skip next 2 lines after a prompt header
                        continue
                    
                    # Skip lines that are just numbers or very short (likely slide numbers)
                    if re.match(r'^\d+$', line_stripped) or (len(line_stripped) < 5 and line_stripped.isdigit()):
                        continue
                    
                    cleaned_lines.append(line)
                
                post_content = '\n'.join(cleaned_lines).strip()
                
                # Additional cleanup: Remove any remaining prompt-like patterns
                # Remove sections that start with "Image prompt" or similar
                post_content = re.sub(r'(?i)(image prompt|visual description|image description):.*?\n', '', post_content)
                # Remove standalone prompt indicators
                post_content = re.sub(r'(?i)^(prompt|description|image|visual):\s*', '', post_content, flags=re.MULTILINE)
            
            # Enforce format type based on user selection
            if post_type == 'image':
                format_type = 'image'
            elif post_type == 'carousel':
                format_type = 'carousel'
            else:
                format_type = response_data.get("format_type", post_type)
            
            # Handle image prompts based on format
            image_prompt = None
            image_prompts = None
            
            if format_type == 'carousel':
                # Carousel should have multiple image prompts
                image_prompts = response_data.get("image_prompts")
                if not image_prompts or not isinstance(image_prompts, list):
                    # Fallback: try single image_prompt and convert to array
                    single_prompt = response_data.get("image_prompt")
                    if single_prompt:
                        image_prompts = [single_prompt]
                    else:
                        # Generate prompts if missing
                        image_prompts = await generate_carousel_image_prompts(post_content, profile.context_json or {})
                # Use first prompt as primary for backward compatibility
                image_prompt = image_prompts[0] if image_prompts and len(image_prompts) > 0 else None
            elif format_type == 'image':
                # Image should have single image prompt
                image_prompt = response_data.get("image_prompt")
                if not image_prompt:
                    # Enforce: generate image prompt if missing
                    image_prompt = await generate_image_prompt(post_content, profile.context_json or {})
            
            metadata_dict = response_data.get("metadata", {})
        except json.JSONDecodeError:
            # Fallback to plain text response
            post_content = raw_response
            if post_type == 'image':
                format_type = 'image'
                # Generate image prompt even for fallback
                image_prompt = await generate_image_prompt(post_content, profile.context_json or {})
            elif post_type == 'carousel':
                format_type = 'carousel'
                image_prompts = await generate_carousel_image_prompts(post_content, profile.context_json or {})
                image_prompt = image_prompts[0] if image_prompts and len(image_prompts) > 0 else None
            else:
                format_type = post_type
                image_prompt = None
            metadata_dict = {}
        
        # Convert "auto" to actual format for database
        actual_format = format_type if format_type != "auto" else "text"
        
        # Prepare generation options with AI-generated data
        generation_options = request.options.copy() if request.options else {}
        if actual_format == 'carousel' and image_prompts:
            generation_options["image_prompts"] = image_prompts  # Store array for carousel
            generation_options["image_prompt"] = image_prompt  # Also store first for compatibility
        elif image_prompt:
            generation_options["image_prompt"] = image_prompt
        if metadata_dict:
            generation_options["metadata"] = metadata_dict
        
        # Handle conversation
        conversation_id = request.conversation_id
        if not conversation_id and request.options.get("create_conversation", True):
            # Create new conversation
            title = await generate_conversation_title(request.message)
            conversation = Conversation(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title=title
            )
            db.add(conversation)
            db.flush()
            conversation_id = conversation.id
        elif conversation_id:
            # Update conversation timestamp
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()
            if conversation:
                conversation.updated_at = datetime.utcnow()
        
        # Save to database
        post_id = str(uuid.uuid4())
        post = GeneratedPost(
            id=post_id,
            user_id=user_id,
            conversation_id=conversation_id,
            topic=request.message[:500],
            content=post_content,
            format=actual_format,
            generation_options=generation_options,  # Now includes image_prompt and metadata
            attachments=request.attachments
        )
        
        db.add(post)
        db.commit()
        db.refresh(post)
        
        # Save conversation messages (user prompt + AI response)
        if conversation_id:
            # Save user message
            user_message = ConversationMessage(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role=MessageRole.USER,
                content=request.message
            )
            db.add(user_message)
            
            # Save assistant message (linked to the generated post)
            assistant_message = ConversationMessage(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role=MessageRole.ASSISTANT,
                content=post_content,
                post_id=post_id
            )
            db.add(assistant_message)
            db.commit()
        
        # Build metadata
        metadata = PostMetadata(
            hashtags=metadata_dict.get("hashtags", []),
            tone=metadata_dict.get("tone", "professional"),
            estimated_engagement=metadata_dict.get("estimated_engagement", "medium")
        )
        
        return PostGenerationResponse(
            id=post.id,
            post_content=post_content,
            format_type=actual_format,
            image_prompt=image_prompt,
            image_prompts=image_prompts if actual_format == 'carousel' else None,
            metadata=metadata,
            conversation_id=conversation_id,
            created_at=post.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Post generation error: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {str(e)}"
        )

@router.get("/history", response_model=List[GenerationHistoryResponse])
async def get_generation_history(
    type: Optional[str] = None,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get user's generation history
    """
    query = db.query(GeneratedPost).filter(GeneratedPost.user_id == user_id)
    
    query = query.order_by(GeneratedPost.created_at.desc()).limit(limit)
    posts = query.all()
    
    return [
        GenerationHistoryResponse(
            id=post.id,
            content=post.content,
            format=post.format.value,
            topic=post.topic,
            created_at=post.created_at,
            user_rating=post.user_rating
        )
        for post in posts
    ]

@router.put("/{post_id}")
async def update_generation(
    post_id: str,
    request: UpdateGenerationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update/edit a generated post
    """
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.user_edited_content = request.content
    db.commit()
    
    return {
        "success": True,
        "message": "Post updated successfully"
    }

@router.post("/{post_id}/rating")
async def rate_generation(
    post_id: str,
    rating: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Rate a generated post (1-5 stars)
    """
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.user_rating = rating
    db.commit()
    
    return {
        "success": True,
        "message": "Rating saved"
    }

async def generate_image_prompt(post_content: str, context: dict) -> str:
    """
    Generate AI image prompt for Canva/DALL-E
    """
    try:
        prompt = await generate_completion(
            system_prompt="""Generate a detailed AI image prompt for Canva AI or DALL-E.

Format:
Create a [style] image featuring [main elements].

Style: [professional/modern/clean/minimalist]
Color scheme: [colors]
Composition: [layout description]
Key elements: [what to include]
Text overlay: [if any]
Dimensions: 1200x628px (LinkedIn optimal)

Make it specific and actionable.""",
            user_message=f"Create an image prompt for this LinkedIn post:\n\n{post_content}\n\nIndustry: {context.get('industry', 'business')}",
            temperature=0.7
        )
        
        return prompt
    except:
        return "Professional LinkedIn post image, clean modern design, brand colors, 1200x628px"

async def generate_carousel_image_prompts(post_content: str, context: dict) -> list[str]:
    """
    Generate multiple AI image prompts for carousel slides
    """
    try:
        # Extract slide count from content (estimate based on structure)
        slide_count = max(4, min(8, post_content.count('\n\n') + 1))
        
        prompt = await generate_completion(
            system_prompt="""Generate multiple detailed AI image prompts for a LinkedIn carousel post.

You need to create an array of image prompts, one for each slide.

Format each prompt as:
- Slide [number]: [detailed description]

Each prompt should:
- Describe the visual concept for that specific slide
- Include style (professional, modern, clean, minimalist)
- Include color scheme
- Include key visual elements
- Include any text overlays
- Be specific and actionable
- Dimensions: 1200x628px (LinkedIn optimal)

Return ONLY a JSON array of strings, like:
["prompt for slide 1", "prompt for slide 2", "prompt for slide 3", ...]""",
            user_message=f"Create {slide_count} image prompts for this LinkedIn carousel post:\n\n{post_content}\n\nIndustry: {context.get('industry', 'business')}\n\nGenerate exactly {slide_count} prompts, one for each slide.",
            temperature=0.7
        )
        
        # Try to parse as JSON array
        try:
            import json
            prompts = json.loads(prompt)
            if isinstance(prompts, list) and len(prompts) > 0:
                return prompts
        except:
            pass
        
        # Fallback: split by lines or create default prompts
        lines = [line.strip() for line in prompt.split('\n') if line.strip() and not line.strip().startswith('-')]
        if len(lines) >= slide_count:
            return lines[:slide_count]
        
        # Ultimate fallback: create generic prompts
        return [f"Professional LinkedIn carousel slide {i+1}, clean modern design, brand colors, 1200x628px" for i in range(slide_count)]
    except:
        # Fallback: return default prompts
        return ["Professional LinkedIn carousel slide, clean modern design, brand colors, 1200x628px" for _ in range(4)]
