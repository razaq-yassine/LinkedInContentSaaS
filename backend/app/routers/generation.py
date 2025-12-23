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
from ..services.ai_service import generate_completion, generate_conversation_title, research_topic_with_search
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
        
        # Extract TOON context - prioritize regenerating from context_json
        toon_context = None
        additional_context = ""
        
        # First, try to get TOON from context_json (most up-to-date)
        if profile.context_json:
            from ..utils.toon_parser import dict_to_toon
            try:
                toon_context = dict_to_toon(profile.context_json)
                # Extract additional_context for prioritization
                additional_context = profile.context_json.get("additional_context", "")
            except Exception as e:
                print(f"Warning: Could not generate TOON from context_json: {str(e)}")
        
        # Fallback: try to extract from custom_instructions if TOON not generated
        if not toon_context and profile.custom_instructions and profile.custom_instructions.startswith("TOON_CONTEXT:"):
            toon_context = profile.custom_instructions.replace("TOON_CONTEXT:\n", "")
            # Try to parse TOON to extract additional_context
            if toon_context:
                try:
                    from ..utils.toon_parser import parse_toon_to_dict
                    parsed = parse_toon_to_dict(toon_context)
                    additional_context = parsed.get("additional_context", "")
                except:
                    pass
        
        # Detect if user wants a random/new topic
        user_message_lower = request.message.lower().strip()
        is_random_request = any(keyword in user_message_lower for keyword in [
            'random', 'any', 'surprise me', 'pick a topic', 'choose a topic', 
            'new topic', 'different topic', 'something new'
        ]) or len(user_message_lower.split()) <= 3
        
        # Build system prompt with user context
        # If TOON context is available, use it for token efficiency
        if toon_context:
            # Prioritize additional_context if it exists
            additional_context_section = ""
            if additional_context and additional_context.strip():
                additional_context_section = f"""

## ADDITIONAL CONTEXT (HIGHEST PRIORITY):
{additional_context}
[These rules override all other instructions in case of conflict]
"""
            
            # Topic generation instruction
            topic_instruction = ""
            if is_random_request:
                topic_instruction = """
- User wants random/new topic. Generate FRESH topic based on industry/expertise, NOT from CV projects/work history.
"""
            
            system_prompt = f"""LinkedIn content expert. Generate posts matching user's style and expertise.

## RULES:
- Language: English only
- Format: Small statements, blank line between each
- Additional context: Overrides all if provided{additional_context_section}

## CONTEXT USAGE:
Profile context is for ALIGNMENT ONLY (tone, style, expertise level, audience) - NOT for topic selection.
DO NOT pull topics from CV projects/experiences unless user explicitly references them.{topic_instruction}

USER CONTEXT:
{toon_context}

WRITING STYLE:
{profile.writing_style_md or "Professional, engaging, value-driven"}

Generate content matching their tone/expertise/audience. Use small statements with spacing. English only.

User request: {request.message}
"""
        else:
            # Fallback to legacy JSON-based prompt
            base_prompt = build_post_generation_prompt(
                profile_md=profile.profile_md or "",
                writing_style_md=profile.writing_style_md or "",
                context_json=profile.context_json or {},
                user_message=request.message,
                options=request.options
            )
            # Add critical instructions to legacy prompt as well
            additional_context = profile.context_json.get("additional_context", "") if profile.context_json else ""
            additional_context_section = ""
            if additional_context and additional_context.strip():
                additional_context_section = f"""

## ADDITIONAL CONTEXT (HIGHEST PRIORITY):
{additional_context}
[Overrides all other instructions in case of conflict]
"""
            
            # Topic generation instruction
            topic_instruction = ""
            if is_random_request:
                topic_instruction = """
- User wants random/new topic. Generate FRESH topic based on industry/expertise, NOT from CV projects/work history.
"""
            
            system_prompt = f"""{base_prompt}

## RULES:
- Language: English only
- Format: Small statements, blank line between each
- Additional context: Overrides all if provided{additional_context_section}

## CONTEXT USAGE:
Profile context is for ALIGNMENT ONLY (tone, style, expertise level, audience) - NOT for topic selection.
DO NOT pull topics from CV projects/experiences unless user explicitly references them.{topic_instruction}
"""
        
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
        
        # Determine if web search should be used
        # Use web search for trending topics, current events, statistics, or research-heavy requests
        use_web_search = False
        search_keywords = ['trending', 'current', 'latest', 'recent', 'statistics', 'data', 'research', 'news', 'update']
        message_lower = request.message.lower()
        
        # Check if message contains search-worthy keywords
        if any(keyword in message_lower for keyword in search_keywords):
            use_web_search = True
            print(f"Enabling web search for request: {request.message[:50]}...")
        
        # Also check if user explicitly requested trending topics
        topic_mode = request.options.get('topic_mode', 'auto')
        if topic_mode == 'trending':
            use_web_search = True
            print("Enabling web search for trending topic request")
        
        # Generate post
        try:
            raw_response = await generate_completion(
                system_prompt=system_prompt,
                user_message=request.message,
                temperature=0.8,
                use_search=use_web_search
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
    Generate AI image prompt for Canva/DALL-E that matches the post content and is LinkedIn-friendly
    """
    try:
        # Extract key themes and concepts from the post content
        industry = context.get('industry', 'business')
        expertise = context.get('expertise_areas', [])
        if isinstance(expertise, list):
            expertise_str = ', '.join(expertise[:3]) if expertise else industry
        else:
            expertise_str = str(expertise) if expertise else industry
        
        prompt = await generate_completion(
            system_prompt="""You are a creative expert at writing image generation prompts for LinkedIn posts. Your prompts create vivid, concrete visuals that perfectly match the post's content.

VISUAL STRATEGY:
- If post mentions specific tools/platforms/concrete scenarios: Use real-world visuals (photography style, dashboards on screens, offices, devices, professional photos)
- If post is general/abstract/conceptual: Use friendly cartoon/illustration style with diverse professional characters doing actions that match the post's message
- For before/after comparisons: Use split-screen with cartoon characters or illustrations showing the transformation

Your prompts should:
- Be specific and concrete (show actual tools, screens, people, settings OR cartoon characters doing relevant actions)
- Use appropriate visual style based on content specificity
- Include diverse professional characters (realistic OR cartoon style)
- Be LinkedIn-optimized: 1200×628px, professional aesthetic, clear composition, engaging
- Create visuals that enhance the post's message

AVOID abstract descriptions like "data flow visualization". Instead use:
- Specific content: "Salesforce dashboard on laptop screen" or "professionals reviewing analytics"
- General content: "Friendly cartoon professional character [doing action that matches post]" or "Illustration showing [concept] with diverse characters"

Write creative, detailed prompts that image generators can easily visualize. Output ONLY the final prompt text - no explanations.""",
            user_message=f"""Create a creative, detailed image generation prompt for this LinkedIn post:

POST CONTENT:
{post_content}

INDUSTRY: {industry}
EXPERTISE: {expertise_str}

Analyze the content:
- If it mentions specific tools/platforms: Create real-world visual (photography, dashboards, devices)
- If it's general/abstract: Create cartoon/illustration with characters doing actions matching the post
- For comparisons: Use split-screen with characters showing transformation

Create a vivid visual description that:
- Directly represents the post's main message and key concepts
- Uses appropriate style (realistic OR cartoon/illustration based on content)
- Shows characters/people doing actions that match the post's concepts
- Is optimized for LinkedIn (1200×628px, professional, engaging, mobile-friendly)

Write the complete prompt as a single, detailed description ready for image generation.""",
            temperature=0.8
        )
        
        # Clean up the prompt (remove markdown formatting if present)
        prompt = prompt.strip()
        if prompt.startswith("```"):
            prompt = re.sub(r'^```.*?\n?', '', prompt)
            prompt = re.sub(r'\n?```$', '', prompt)
        prompt = prompt.strip()
        
        return prompt if prompt else "Professional LinkedIn post image, modern design, diverse professional characters, clean composition, brand colors, 1200x628px"
    except Exception as e:
        print(f"Error generating image prompt: {str(e)}")
        return "Professional LinkedIn post image, modern design, diverse professional characters, clean composition, brand colors, 1200x628px"

async def generate_carousel_image_prompts(post_content: str, context: dict) -> list[str]:
    """
    Generate multiple AI image prompts for carousel slides that match the post content and are LinkedIn-friendly
    """
    try:
        # Extract slide count from content (estimate based on structure)
        slide_count = max(4, min(8, post_content.count('\n\n') + 1))
        
        industry = context.get('industry', 'business')
        expertise = context.get('expertise_areas', [])
        if isinstance(expertise, list):
            expertise_str = ', '.join(expertise[:3]) if expertise else industry
        else:
            expertise_str = str(expertise) if expertise else industry
        
        prompt = await generate_completion(
            system_prompt="""You are a creative expert at writing image generation prompts for LinkedIn carousel posts. Your prompts create a cohesive visual story with consistent theming.

CRITICAL REQUIREMENTS:

1. VISUAL CONSISTENCY (MOST IMPORTANT):
   - ALL slides must use the SAME color palette (specify exact colors)
   - ALL slides must use the SAME visual style (choose ONE: photography OR cartoon/illustration)
   - ALL slides must use the SAME composition approach
   - Create visual continuity - each slide feels like part of the same series

2. VISUAL STYLE SELECTION:
   - If post mentions specific tools/platforms: Use real-world style (photography, dashboards, devices)
   - If post is general/abstract: Use cartoon/illustration style with characters
   - Choose ONE style for entire carousel and maintain it across all slides

3. CONCRETE VISUALS:
   - Each slide represents ONE specific point from the post
   - Real-world style: "Salesforce dashboard on laptop", "professionals in office"
   - Cartoon style: "Friendly cartoon professional character [doing action matching slide's point]"
   - Characters should be diverse, professional, doing actions that match each slide's concept
   - Avoid abstract concepts - use either realistic visuals OR character illustrations

4. VISUAL STORY PROGRESSION:
   - Slide 1: Introduces the topic with established visual theme
   - Slides 2-N: Each shows a specific point/concept, maintaining the theme
   - Final slide: Summarizes or provides takeaway, maintains theme
   - Slides build on each other visually like a story

5. LINKEDIN OPTIMIZATION:
   - Professional, polished, engaging aesthetic
   - 1200×628px landscape format
   - Text overlay space consideration

Return ONLY a valid JSON array of strings. Each prompt should be creative, detailed, and ready for image generation. Output ONLY the JSON array - no explanations.""",
            user_message=f"""Create {slide_count} creative, detailed image prompts for this LinkedIn carousel post:

POST CONTENT:
{post_content}

INDUSTRY: {industry}
EXPERTISE: {expertise_str}

TASK:
1. Analyze content: If specific tools/platforms mentioned → use real-world style. If general/abstract → use cartoon/illustration style with characters
2. Break the post into {slide_count} logical sections/points (one per slide)
3. Choose ONE consistent visual theme: same colors, same style (realistic OR cartoon), same composition for ALL slides
4. Create {slide_count} prompts where:
   - Each slide represents ONE specific point from the post
   - All slides share the SAME color palette and visual style
   - If using characters: They do actions matching each slide's point
   - Slides build on each other visually (like a story)

CRITICAL: All slides must be visually consistent - same colors, same style (realistic OR cartoon), same type of elements. They should feel like a cohesive series.

Return ONLY a JSON array with exactly {slide_count} detailed prompts:""",
            temperature=0.8
        )
        
        # Try to parse as JSON array
        try:
            import json
            # Clean up markdown code blocks if present
            cleaned_prompt = prompt.strip()
            if cleaned_prompt.startswith("```"):
                cleaned_prompt = re.sub(r'^```json\s*\n?', '', cleaned_prompt)
                cleaned_prompt = re.sub(r'\n?```$', '', cleaned_prompt)
            
            prompts = json.loads(cleaned_prompt)
            if isinstance(prompts, list) and len(prompts) > 0:
                # Ensure we have the right number of prompts
                if len(prompts) >= slide_count:
                    return prompts[:slide_count]
                elif len(prompts) < slide_count:
                    # Pad with variations of the last prompt
                    while len(prompts) < slide_count:
                        prompts.append(prompts[-1] if prompts else "Professional LinkedIn carousel slide, modern design, diverse professional characters, clean composition, brand colors, 1200x628px")
                    return prompts[:slide_count]
                return prompts
        except json.JSONDecodeError as e:
            print(f"Failed to parse carousel prompts as JSON: {str(e)}")
            print(f"Raw response: {prompt[:200]}")
        
        # Fallback: split by lines or create default prompts
        lines = [line.strip() for line in prompt.split('\n') if line.strip() and not line.strip().startswith('-') and not line.strip().startswith('Slide')]
        if len(lines) >= slide_count:
            return lines[:slide_count]
        
        # Ultimate fallback: create generic but LinkedIn-friendly prompts
        return [f"Professional LinkedIn carousel slide {i+1}, modern design, diverse professional characters, clean composition, consistent brand colors, 1200x628px" for i in range(slide_count)]
    except Exception as e:
        print(f"Error generating carousel image prompts: {str(e)}")
        # Fallback: return default LinkedIn-friendly prompts
        return ["Professional LinkedIn carousel slide, modern design, diverse professional characters, clean composition, consistent brand colors, 1200x628px" for _ in range(4)]
