from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import uuid

from ..database import get_db
from ..models import UserProfile, GeneratedPost, Conversation, ConversationMessage, MessageRole, PostFormat, GeneratedImage, GeneratedPDF, AdminSetting
from ..routers.auth import get_current_user_id
from ..schemas.generation import (
    PostGenerationRequest,
    PostGenerationResponse,
    PostMetadata,
    GenerationHistoryResponse,
    UpdateGenerationRequest,
    TokenUsage,
    SchedulePostRequest,
    ScheduledPostResponse,
    ScheduledPostsListResponse
)
from ..services.ai_service import generate_completion, generate_conversation_title, research_topic_with_search
from ..services.linkedin_service import LinkedInService
from ..services.post_publishing_service import publish_post_to_linkedin
from ..models import User
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

def check_maintenance_mode(db: Session) -> tuple[bool, str]:
    """Check if maintenance mode is enabled and return status with message"""
    setting = db.query(AdminSetting).filter(AdminSetting.key == "maintenance_mode").first()
    if setting and setting.value.lower() == "true":
        message_setting = db.query(AdminSetting).filter(AdminSetting.key == "maintenance_message").first()
        message = message_setting.value if message_setting else "System is under maintenance. Please try again later."
        return True, message
    return False, ""

def get_recent_post_titles(db: Session, user_id: str, hours: int = 24) -> List[str]:
    """
    Retrieve titles/topics of posts generated in the last N hours for a user.
    Only extracts titles to avoid passing full content to AI.
    
    Args:
        db: Database session
        user_id: User ID to filter posts
        hours: Number of hours to look back (default 24)
    
    Returns:
        List of post titles/topics from recent posts
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    recent_posts = db.query(GeneratedPost).filter(
        GeneratedPost.user_id == user_id,
        GeneratedPost.created_at >= cutoff_time
    ).order_by(GeneratedPost.created_at.desc()).all()
    
    titles = []
    for post in recent_posts:
        # Extract title from generation_options metadata if available
        if post.generation_options and isinstance(post.generation_options, dict):
            metadata = post.generation_options.get('metadata', {})
            if isinstance(metadata, dict):
                title = metadata.get('title')
                if title and isinstance(title, str) and title.strip():
                    titles.append(title.strip())
                    continue
        
        # Fallback: use topic field (truncated user message)
        if post.topic and post.topic.strip():
            titles.append(post.topic.strip())
        # Last resort: extract first line from content as title
        elif post.content:
            first_line = post.content.split('\n')[0].strip()
            # Only use if it's reasonably short (likely a title)
            if first_line and len(first_line) < 150:
                titles.append(first_line[:100])  # Truncate to 100 chars
    
    return titles

def extract_compact_writing_style(writing_style_md: str) -> str:
    """
    Extract compact writing style summary from full markdown.
    Returns only essential style information to reduce tokens.
    """
    if not writing_style_md:
        return "Professional, engaging, value-driven"
    
    # Extract key style elements using regex
    tone_match = re.search(r'tone[:\s]+([^\n]+)', writing_style_md, re.IGNORECASE)
    sentence_match = re.search(r'sentence.*?(\d+[-\s]*\d*)', writing_style_md, re.IGNORECASE)
    structure_match = re.search(r'structure[:\s]+([^\n]+)', writing_style_md, re.IGNORECASE)
    
    tone = tone_match.group(1).strip() if tone_match else "professional"
    sentence_length = sentence_match.group(1) if sentence_match else "10-12"
    structure = structure_match.group(1).strip() if structure_match else "Hook → Context → Insight → Takeaway"
    
    # Build compact summary
    compact = f"Tone: {tone}. Sentence length: {sentence_length} words. Structure: {structure}. Format: Small statements with spacing."
    
    return compact

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
        # Check maintenance mode first
        is_maintenance, maintenance_msg = check_maintenance_mode(db)
        if is_maintenance:
            raise HTTPException(
                status_code=503,
                detail=f"Service unavailable: {maintenance_msg}"
            )
        
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
        
        # Parse user message for length and hashtag preferences (prompt has priority)
        def parse_prompt_preferences(user_message: str, current_options: dict) -> dict:
            """
            Parse user prompt for length and hashtag preferences.
            User prompt takes priority over UI settings.
            """
            message_lower = user_message.lower()
            parsed_options = current_options.copy()
            
            # Parse length preferences
            if any(keyword in message_lower for keyword in ['long', 'lengthy', 'extended', 'detailed']):
                parsed_options['length'] = 'long'
            elif any(keyword in message_lower for keyword in ['short', 'brief', 'concise', 'quick']):
                parsed_options['length'] = 'short'
            elif any(keyword in message_lower for keyword in ['medium', 'moderate']):
                parsed_options['length'] = 'medium'
            
            # Parse hashtag count preferences
            hashtag_patterns = [
                (r'(\d+)\s*hashtags?', lambda m: int(m.group(1))),
                (r'hashtags?.*?(\d+)', lambda m: int(m.group(1))),
                (r'(\d+)\s*tags?', lambda m: int(m.group(1))),
                (r'tags?.*?(\d+)', lambda m: int(m.group(1))),
            ]
            
            hashtag_count = parsed_options.get('hashtag_count', 4)
            
            # Check for explicit numbers first
            for pattern, extractor in hashtag_patterns:
                match = re.search(pattern, user_message, re.IGNORECASE)
                if match:
                    try:
                        count = extractor(match)
                        if 0 <= count <= 10:
                            hashtag_count = count
                            break
                    except:
                        pass
            
            # Check for relative requests (more/fewer/no)
            if re.search(r'\b(more|add|include|extra)\s+hashtags?\b', user_message, re.IGNORECASE):
                hashtag_count = min(10, hashtag_count + 3)
            elif re.search(r'\b(fewer|less)\s+hashtags?\b', user_message, re.IGNORECASE):
                hashtag_count = max(0, hashtag_count - 2)
            elif re.search(r'\b(no|without|zero)\s+hashtags?\b', user_message, re.IGNORECASE):
                hashtag_count = 0
            
            parsed_options['hashtag_count'] = hashtag_count
            
            # Parse slide count preferences for carousel posts
            slide_count = None
            slide_patterns = [
                (r'(\d+)\s*slides?', lambda m: int(m.group(1))),
                (r'slides?.*?(\d+)', lambda m: int(m.group(1))),
                (r'(\d+)\s*images?', lambda m: int(m.group(1))),
                (r'images?.*?(\d+)', lambda m: int(m.group(1))),
            ]
            
            # Check for explicit numbers first
            for pattern, extractor in slide_patterns:
                match = re.search(pattern, user_message, re.IGNORECASE)
                if match:
                    try:
                        count = extractor(match)
                        if 4 <= count <= 15:  # Valid range
                            slide_count = count
                            break
                        elif count > 15:
                            # Cap at 15 maximum
                            slide_count = 15
                            break
                    except:
                        pass
            
            if slide_count:
                parsed_options['slide_count'] = slide_count
            
            return parsed_options
        
        # Override options with prompt preferences (prompt has priority)
        request_options = request.options.copy() if request.options else {}
        request_options = parse_prompt_preferences(request.message, request_options)
        
        # Extract attachments from options if not provided at top level
        # This allows frontend to pass attachments through options
        image_attachments = request.attachments
        if not image_attachments and request_options.get('attachments'):
            image_attachments = request_options.pop('attachments')
        
        # If we have image attachments, add context about them to the message
        attachment_context = ""
        if image_attachments and len(image_attachments) > 0:
            image_count = len(image_attachments)
            attachment_context = f"""

[IMPORTANT: The user has attached {image_count} image(s) to this message. You MUST:
1. Carefully analyze each image to understand its content, context, and visual elements
2. Use the image content as PRIMARY input for generating the LinkedIn post
3. Reference specific details, themes, or elements from the image(s) in your post
4. If the images show products, events, achievements, or visuals - incorporate them into your content
5. The post should be directly inspired by and relevant to what's shown in the images]"""
        
        # Detect if user wants a random/new topic
        user_message_lower = request.message.lower().strip()
        is_random_request = any(keyword in user_message_lower for keyword in [
            'random', 'any', 'surprise me', 'pick a topic', 'choose a topic', 
            'new topic', 'different topic', 'something new'
        ]) or len(user_message_lower.split()) <= 3
        
        # Load conversation history if conversation_id is provided
        conversation_history = []
        previous_post_content = None
        is_refinement_request = False
        
        if request.conversation_id:
            # Load conversation messages
            conv_messages = db.query(ConversationMessage).filter(
                ConversationMessage.conversation_id == request.conversation_id
            ).order_by(ConversationMessage.created_at.asc()).all()
            
            # Build conversation history for AI context
            for msg in conv_messages:
                conversation_history.append({
                    "role": msg.role.value,  # "user" or "assistant"
                    "content": msg.content
                })
            
            # Get the most recent assistant message (previous post) if it exists
            assistant_messages = [msg for msg in conv_messages if msg.role == MessageRole.ASSISTANT]
            if assistant_messages:
                previous_post_content = assistant_messages[-1].content
            
            # Detect if this is a refinement request
            # Refinement keywords that indicate user wants to modify existing content
            # More specific patterns that clearly indicate refinement
            refinement_patterns = [
                'make this', 'make it', 'make the', 'make that',
                'shorter', 'longer', 'change the', 'change this', 'change it',
                'improve this', 'improve it', 'edit this', 'edit it',
                'refine this', 'refine it', 'adjust this', 'adjust it',
                'modify this', 'modify it', 'update this', 'update it',
                'revise this', 'revise it', 'rewrite this', 'rewrite it',
                'remove this', 'remove it', 'remove that',
                'keep this', 'keep it', 'keep that',
                'make it more', 'make it less', 'make this more', 'make this less',
                'change tone', 'change style', 'change format'
            ]
            
            # Check if user message contains refinement patterns AND we have previous content
            # Also check for pronouns/pointers that suggest referring to previous content
            # But exclude if user explicitly wants a new/random topic
            has_refinement_pattern = any(pattern in user_message_lower for pattern in refinement_patterns)
            has_reference_pronouns = any(pronoun in user_message_lower for pronoun in ['this', 'it', 'that']) and len(user_message_lower.split()) <= 10
            explicitly_new_topic = any(keyword in user_message_lower for keyword in [
                'new topic', 'different topic', 'another topic', 'random topic', 
                'new post', 'different post', 'another post'
            ])
            
            if previous_post_content and (has_refinement_pattern or has_reference_pronouns) and not explicitly_new_topic:
                is_refinement_request = True
                # Override random request detection - refinement takes priority
                is_random_request = False
        
        # Get recent post titles to avoid duplicate topics (only for new posts, not refinements)
        recent_titles_section = ""
        if not is_refinement_request:
            recent_titles = get_recent_post_titles(db, user_id, hours=24)
            if recent_titles:
                recent_titles_section = f"""

## RECENT POST TOPICS (AVOID DUPLICATES):
You have recently written posts on the following topics in the last 24 hours:
{chr(10).join(f"- {title}" for title in recent_titles)}

IMPORTANT: Generate a NEW and DIFFERENT topic. Do NOT create content about any of these recent topics.
Choose a fresh angle, different subject matter, or completely new theme.
"""
        
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
            
            # Add refinement context if this is a refinement request
            refinement_context = ""
            if is_refinement_request and previous_post_content:
                refinement_context = f"""

## REFINEMENT REQUEST:
The user wants to refine the previous post. Keep the SAME TOPIC and MAIN MESSAGE, but apply the requested changes.

PREVIOUS POST CONTENT:
{previous_post_content}

IMPORTANT: 
- Maintain the same core topic and message
- Apply the user's requested changes (e.g., make it shorter, change tone, etc.)
- Keep the same format unless explicitly asked to change
- Preserve key insights and value from the original post
"""
            
            # Get hashtag count from parsed options
            hashtag_count = request_options.get('hashtag_count', 4)
            length_pref = request_options.get('length', 'medium')
            
            # Extract compact writing style to reduce tokens
            compact_style = extract_compact_writing_style(profile.writing_style_md or "")
            
            system_prompt = f"""LinkedIn content expert. Generate posts matching user's style and expertise.

## RULES:
- Language: English only
- Format: Small statements, blank line between each
- Additional context: Overrides all if provided{additional_context_section}

## CONTEXT USAGE:
Profile context is for ALIGNMENT ONLY (tone, style, expertise level, audience) - NOT for topic selection.
DO NOT pull topics from CV projects/experiences unless user explicitly references them.{topic_instruction}{refinement_context}{recent_titles_section}

## GENERATION OPTIONS:
- Length: {length_pref}
- Hashtag count: {hashtag_count} (ALWAYS include this many hashtags unless user explicitly requests zero)

## CRITICAL: Hashtags
- ALWAYS include exactly {hashtag_count} relevant hashtags at the end of the post
- Hashtags should be relevant to the content and industry
- Only skip hashtags if user explicitly requests "no hashtags" or "zero hashtags"
- Include hashtags in the metadata field as an array

USER CONTEXT (TOON format):
{toon_context}

WRITING STYLE:
{compact_style}

Generate content matching their tone/expertise/audience. Use small statements with spacing. English only.

User request: {request.message}
"""
        else:
            # Fallback to legacy prompt - try to use TOON if available, otherwise use markdown
            # Check if we can generate TOON from context_json
            fallback_toon = None
            if profile.context_json:
                try:
                    from ..utils.toon_parser import dict_to_toon
                    fallback_toon = dict_to_toon(profile.context_json)
                except:
                    pass
            
            if fallback_toon:
                # Use TOON format even in fallback
                compact_style = extract_compact_writing_style(profile.writing_style_md or "")
                hashtag_count = request_options.get('hashtag_count', 4)
                length_pref = request_options.get('length', 'medium')
                
                base_prompt = f"""LinkedIn content expert. Generate posts matching user's style and expertise.

## RULES:
- Language: English only
- Format: Small statements, blank line between each

## GENERATION OPTIONS:
- Length: {length_pref}
- Hashtag count: {hashtag_count} (ALWAYS include this many hashtags unless user explicitly requests zero)

## CRITICAL: Hashtags
- ALWAYS include exactly {hashtag_count} relevant hashtags at the end of the post
- Hashtags should be relevant to the content and industry
- Only skip hashtags if user explicitly requests "no hashtags" or "zero hashtags"
- Include hashtags in the metadata field as an array

USER CONTEXT (TOON format):
{fallback_toon}

WRITING STYLE:
{compact_style}

Generate content matching their tone/expertise/audience. Use small statements with spacing. English only.
"""
            else:
                # True fallback - use markdown but with compact writing style
                compact_style = extract_compact_writing_style(profile.writing_style_md or "")
                base_prompt = build_post_generation_prompt(
                    profile_md=profile.profile_md or "",
                    writing_style_md=compact_style,  # Use compact version
                    context_json=profile.context_json or {},
                    user_message=request.message,
                    options=request_options
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
            
            # Add refinement context if this is a refinement request
            refinement_context = ""
            if is_refinement_request and previous_post_content:
                refinement_context = f"""

## REFINEMENT REQUEST:
The user wants to refine the previous post. Keep the SAME TOPIC and MAIN MESSAGE, but apply the requested changes.

PREVIOUS POST CONTENT:
{previous_post_content}

IMPORTANT: 
- Maintain the same core topic and message
- Apply the user's requested changes (e.g., make it shorter, change tone, etc.)
- Keep the same format unless explicitly asked to change
- Preserve key insights and value from the original post
"""
            
            system_prompt = f"""{base_prompt}

## RULES:
- Language: English only
- Format: Small statements, blank line between each
- Additional context: Overrides all if provided{additional_context_section}

## CONTEXT USAGE:
Profile context is for ALIGNMENT ONLY (tone, style, expertise level, audience) - NOT for topic selection.
DO NOT pull topics from CV projects/experiences unless user explicitly references them.{topic_instruction}{refinement_context}{recent_titles_section}
"""
        
        # Add format-specific instructions
        post_type = request_options.get('post_type', 'text')
        
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
        elif post_type == 'video_script':
            enforced_format = 'video_script'
            format_instructions = get_format_specific_instructions('video_script')
            system_prompt += f"\n\n{get_format_instructions('video_script')}"
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
        
        # Determine if web search should be used and how
        use_web_search = False
        use_trending_topic = request_options.get('use_trending_topic', False)
        use_web_search_flag = request_options.get('use_web_search', False)
        
        # Modify user message based on flags
        # Note: Trending takes priority if both flags are set
        modified_user_message = request.message + attachment_context
        
        # If "Trending" is clicked: use web search to find trending topics or latest info
        # This takes priority over the web search toggle
        if use_trending_topic:
            use_web_search = True
            # Modify the message to emphasize trending/latest information
            if is_random_request or len(user_message_lower.split()) <= 3:
                # User wants a random topic - find trending topics
                industry_context = profile.profile_md.split('##')[0].strip() if profile.profile_md else "the user's industry"
                modified_user_message = f"Find a trending topic or current news item relevant to {industry_context} and create a LinkedIn post about it. Focus on what's trending or in the news right now."
            else:
                # User provided a topic - find latest info about it
                modified_user_message = f"Find the latest information, recent developments, or trending news about: {request.message}. Create a LinkedIn post using the most current and relevant information available."
            print(f"Trending mode enabled - searching for trending/latest info: {modified_user_message[:100]}...")
        
        # If only "Web Search" is toggled (without Trending): use web search to learn about the subject
        elif use_web_search_flag:
            use_web_search = True
            # Modify the message to emphasize learning about the subject first
            modified_user_message = f"First, use web search to learn about and gather current information on: {request.message}. Then, based on what you learn, create a LinkedIn post about this topic."
            print(f"Web search enabled - learning about subject before generating: {request.message[:50]}...")
        
        # Fallback: Check if message contains search-worthy keywords (legacy behavior)
        else:
            search_keywords = ['trending', 'current', 'latest', 'recent', 'statistics', 'data', 'research', 'news', 'update']
            message_lower = request.message.lower()
            if any(keyword in message_lower for keyword in search_keywords):
                use_web_search = True
                print(f"Enabling web search for keyword-based request: {request.message[:50]}...")
        
        # Also check if user explicitly requested trending topics via topic_mode (legacy support)
        topic_mode = request_options.get('topic_mode', 'auto')
        if topic_mode == 'trending' and not use_trending_topic and not use_web_search_flag:
            use_web_search = True
            if modified_user_message == request.message:  # Only modify if not already modified
                modified_user_message = f"Find a trending topic or current news item and create a LinkedIn post about it."
            print("Enabling web search for legacy trending topic request")
        
        # Initialize token usage tracking
        token_usage_details = {}
        total_input_tokens = 0
        total_output_tokens = 0
        # total_tokens will be calculated as input + output at the end
        model_name = None
        provider_name = None
        
        # Separate tracking for image prompt generation (uses different provider)
        image_prompt_input_tokens = 0
        image_prompt_output_tokens = 0
        image_prompt_model = None
        image_prompt_provider = None
        
        # Generate post
        try:
            # Pass conversation history to AI (current message hasn't been saved yet, so all history is previous)
            # Include image attachments for vision analysis if present
            raw_response, main_token_usage = await generate_completion(
                system_prompt=system_prompt,
                user_message=modified_user_message,
                temperature=0.8,
                use_search=use_web_search,
                conversation_history=conversation_history if conversation_history else None,
                image_attachments=image_attachments if image_attachments else None
            )
            
            # Track main generation tokens
            total_input_tokens += main_token_usage.get("input_tokens", 0)
            total_output_tokens += main_token_usage.get("output_tokens", 0)
            # Don't accumulate total_tokens - calculate it at the end as input + output
            model_name = main_token_usage.get("model")
            provider_name = main_token_usage.get("provider")
            token_usage_details["post_generation"] = {
                "input_tokens": main_token_usage.get("input_tokens", 0),
                "output_tokens": main_token_usage.get("output_tokens", 0),
                "total_tokens": main_token_usage.get("total_tokens", 0)
            }
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
            
            # Extract title from response if available (before processing post_content)
            post_title = None
            if isinstance(response_data, dict):
                post_title = response_data.get("title")
            
            # Handle case where response_data might be the post_content directly
            if isinstance(response_data, dict):
                post_content = response_data.get("post_content", raw_response)
                
                # CRITICAL: If post_content contains JSON-like structure, try to parse it
                if isinstance(post_content, str) and post_content.strip().startswith('{'):
                    try:
                        # Try to parse if it's a JSON string
                        parsed_inner = json.loads(post_content)
                        if isinstance(parsed_inner, dict) and "post_content" in parsed_inner:
                            post_content = parsed_inner.get("post_content", post_content)
                    except (json.JSONDecodeError, TypeError):
                        # If parsing fails, keep original post_content
                        pass
            else:
                # If response_data is not a dict, use it as post_content
                post_content = response_data if isinstance(response_data, str) else str(response_data)
            
            # Ensure post_content is a string
            if not isinstance(post_content, str):
                # If post_content is still a dict or other type, try to extract or convert
                if isinstance(post_content, dict):
                    # Check if this is a video script dict structure (use post_type since actual_format not set yet)
                    if post_type == 'video_script' and any(key in post_content for key in ['Hook', 'Introduction', 'Main Content', 'Summary', 'CTA']):
                        # Convert video script dict to formatted string
                        post_content = format_video_script_dict(post_content)
                    else:
                        # Try to get post_content from nested dict
                        post_content = post_content.get("post_content", str(post_content))
                else:
                    post_content = str(post_content)
            
            # Final safety check: if post_content looks like a JSON object string, try to extract the actual content
            if isinstance(post_content, str) and post_content.strip().startswith('{') and '"post_content"' in post_content:
                try:
                    # Try to parse and extract post_content from JSON string
                    parsed_json = json.loads(post_content)
                    if isinstance(parsed_json, dict) and "post_content" in parsed_json:
                        extracted_content = parsed_json.get("post_content")
                        if isinstance(extracted_content, str) and len(extracted_content) > 0:
                            post_content = extracted_content
                            print("Extracted post_content from JSON string")
                except (json.JSONDecodeError, TypeError, AttributeError):
                    # If parsing fails, keep original post_content
                    pass
            
            # Final validation: Ensure post_content is not the entire JSON response
            if isinstance(post_content, str):
                # Check if post_content is actually a JSON string containing the full response
                post_content_stripped = post_content.strip()
                # More robust check: if it starts with { and looks like JSON, try to parse it
                if post_content_stripped.startswith('{') and ('"post_content"' in post_content_stripped or '"format_type"' in post_content_stripped or '"image_prompts"' in post_content_stripped):
                    try:
                        # Try to parse and extract the actual post_content
                        parsed_full = json.loads(post_content_stripped)
                        if isinstance(parsed_full, dict):
                            # Try to extract post_content from the parsed JSON
                            actual_post_content = parsed_full.get("post_content")
                            if isinstance(actual_post_content, str) and len(actual_post_content.strip()) > 0:
                                print("WARNING: Extracted post_content from JSON string that was stored in post_content field")
                                post_content = actual_post_content
                                # Also update metadata, format_type, and image_prompts if available
                                if "metadata" in parsed_full:
                                    metadata_dict = parsed_full.get("metadata", {})
                                if "format_type" in parsed_full and not format_type:
                                    format_type = parsed_full.get("format_type")
                                if "image_prompts" in parsed_full and not image_prompts:
                                    image_prompts = parsed_full.get("image_prompts")
                            else:
                                # If post_content is not found or empty, but we have a dict, 
                                # check if the entire dict was meant to be the response
                                # In this case, log an error and use a fallback
                                print("ERROR: post_content field contains JSON but no valid post_content found")
                                # Try to use the first meaningful string value as fallback
                                for key, value in parsed_full.items():
                                    if isinstance(value, str) and len(value.strip()) > 50 and key != "image_prompts":
                                        post_content = value
                                        print(f"Using {key} as fallback post_content")
                                        break
                    except (json.JSONDecodeError, TypeError, AttributeError) as e:
                        # If parsing fails, keep original post_content
                        print(f"Failed to parse post_content as JSON: {e}")
                        pass
            
            # Clean post_content: Remove any slide prompts or image descriptions that might have leaked in
            if post_content and isinstance(post_content, str):
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
            elif post_type == 'video_script':
                format_type = 'video_script'
            else:
                # format_type removed from output - use post_type from input
                format_type = post_type
            
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
                        # Pass slide_count from request_options if available
                        requested_slide_count = request_options.get('slide_count')
                        image_prompts_result, carousel_token_usage = await generate_carousel_image_prompts(
                            post_content, 
                            profile.context_json or {}, 
                            requested_slide_count=requested_slide_count
                        )
                        image_prompts = image_prompts_result
                        # Track image prompt tokens separately (different provider)
                        image_prompt_input_tokens += carousel_token_usage.get("input_tokens", 0)
                        image_prompt_output_tokens += carousel_token_usage.get("output_tokens", 0)
                        image_prompt_model = carousel_token_usage.get("model")
                        image_prompt_provider = carousel_token_usage.get("provider")
                        token_usage_details["carousel_prompts"] = {
                            "input_tokens": carousel_token_usage.get("input_tokens", 0),
                            "output_tokens": carousel_token_usage.get("output_tokens", 0),
                            "total_tokens": carousel_token_usage.get("total_tokens", 0)
                        }
                # Use first prompt as primary for backward compatibility
                image_prompt = image_prompts[0] if image_prompts and len(image_prompts) > 0 else None
            elif format_type == 'image':
                # Image should have single image prompt
                image_prompt = response_data.get("image_prompt")
                if not image_prompt:
                    # Enforce: generate image prompt if missing
                    image_prompt_result, image_token_usage = await generate_image_prompt(post_content, profile.context_json or {})
                    image_prompt = image_prompt_result
                    # Track image prompt tokens separately (different provider)
                    image_prompt_input_tokens += image_token_usage.get("input_tokens", 0)
                    image_prompt_output_tokens += image_token_usage.get("output_tokens", 0)
                    image_prompt_model = image_token_usage.get("model")
                    image_prompt_provider = image_token_usage.get("provider")
                    token_usage_details["image_prompt"] = {
                        "input_tokens": image_token_usage.get("input_tokens", 0),
                        "output_tokens": image_token_usage.get("output_tokens", 0),
                        "total_tokens": image_token_usage.get("total_tokens", 0)
                    }
            
            # Extract metadata - hashtags are now at top level, but support legacy format
            metadata_dict = response_data.get("metadata", {})
            # If hashtags are at top level (new format), move to metadata for compatibility
            if "hashtags" in response_data and "hashtags" not in metadata_dict:
                metadata_dict["hashtags"] = response_data.get("hashtags", [])
        except json.JSONDecodeError:
            # Fallback to plain text response
            post_content = raw_response
            post_title = None  # No title available in fallback case
            if post_type == 'image':
                format_type = 'image'
                # Generate image prompt even for fallback
                image_prompt_result, image_token_usage = await generate_image_prompt(post_content, profile.context_json or {})
                image_prompt = image_prompt_result
                # Track image prompt tokens separately (different provider)
                image_prompt_input_tokens += image_token_usage.get("input_tokens", 0)
                image_prompt_output_tokens += image_token_usage.get("output_tokens", 0)
                image_prompt_model = image_token_usage.get("model")
                image_prompt_provider = image_token_usage.get("provider")
                token_usage_details["image_prompt"] = {
                    "input_tokens": image_token_usage.get("input_tokens", 0),
                    "output_tokens": image_token_usage.get("output_tokens", 0),
                    "total_tokens": image_token_usage.get("total_tokens", 0)
                }
            elif post_type == 'carousel':
                format_type = 'carousel'
                # Pass slide_count from request_options if available
                requested_slide_count = request_options.get('slide_count')
                image_prompts_result, carousel_token_usage = await generate_carousel_image_prompts(
                    post_content, 
                    profile.context_json or {}, 
                    requested_slide_count=requested_slide_count
                )
                image_prompts = image_prompts_result
                image_prompt = image_prompts[0] if image_prompts and len(image_prompts) > 0 else None
                # Track image prompt tokens separately (different provider)
                image_prompt_input_tokens += carousel_token_usage.get("input_tokens", 0)
                image_prompt_output_tokens += carousel_token_usage.get("output_tokens", 0)
                image_prompt_model = carousel_token_usage.get("model")
                image_prompt_provider = carousel_token_usage.get("provider")
                token_usage_details["carousel_prompts"] = {
                    "input_tokens": carousel_token_usage.get("input_tokens", 0),
                    "output_tokens": carousel_token_usage.get("output_tokens", 0),
                    "total_tokens": carousel_token_usage.get("total_tokens", 0)
                }
            elif post_type == 'video_script':
                format_type = 'video_script'
                image_prompt = None
            else:
                format_type = post_type
                image_prompt = None
            metadata_dict = {}
        
        # Convert "auto" to actual format for database
        actual_format = format_type if format_type != "auto" else "text"
        
        # Ensure image_prompts is initialized (may not be set in all code paths)
        if 'image_prompts' not in locals():
            image_prompts = None
        
        # Calculate Cloudflare image generation costs if image/carousel post
        cloudflare_cost_for_storage = None
        cloudflare_settings = None
        try:
            from ..utils.cost_calculator import calculate_cloudflare_image_cost
            from ..config import get_settings
            cloudflare_settings = get_settings()
            
            if actual_format == 'image':
                # Single image post - estimate cost for 1 image (1200x1200, 25 steps)
                cloudflare_cost_for_storage = calculate_cloudflare_image_cost(
                    image_count=1,
                    height=1200,
                    width=1200,
                    num_steps=25,
                    model=cloudflare_settings.cloudflare_image_model if cloudflare_settings else None
                )
            elif actual_format == 'carousel':
                # Carousel post - estimate cost for multiple images (typically 4-6 slides)
                # Use number of image prompts if available, otherwise default to 4
                carousel_image_count = len(image_prompts) if image_prompts and isinstance(image_prompts, list) else 4
                cloudflare_cost_for_storage = calculate_cloudflare_image_cost(
                    image_count=carousel_image_count,
                    height=1200,
                    width=1200,
                    num_steps=25,
                    model=cloudflare_settings.cloudflare_image_model if cloudflare_settings else None
                )
        except Exception as e:
            # If Cloudflare cost calculation fails, log but don't break the request
            print(f"Warning: Failed to calculate Cloudflare cost: {e}")
            cloudflare_cost_for_storage = None
        
        # Format video scripts with special markers for better presentation (after format_type is determined)
        if actual_format == 'video_script' and post_content and isinstance(post_content, str):
            # Only format if not already formatted (check for markers)
            if not post_content.startswith('**HEADER**') and not post_content.startswith('*SCRIPT*'):
                post_content = format_video_script_string(post_content)
        
        # CRITICAL: Final check before saving - ensure post_content is never JSON
        if isinstance(post_content, str):
            post_content_clean = post_content.strip()
            # If it looks like JSON (starts with { and contains JSON-like structure), try to extract content
            if post_content_clean.startswith('{') and ('"post_content"' in post_content_clean or '"format_type"' in post_content_clean):
                try:
                    parsed_check = json.loads(post_content_clean)
                    if isinstance(parsed_check, dict):
                        extracted = parsed_check.get("post_content")
                        if isinstance(extracted, str) and len(extracted.strip()) > 0:
                            print("CRITICAL: Final extraction - post_content was JSON, extracted actual content")
                            post_content = extracted
                        else:
                            # Last resort: if we can't extract, log error and use a placeholder
                            print("CRITICAL ERROR: post_content is JSON but no valid content found. Using error message.")
                            post_content = "Error: Invalid response format. Please try regenerating."
                except:
                    # If parsing fails, it's not valid JSON, so keep as-is
                    pass
        
        # Convert format string to PostFormat enum
        format_enum_map = {
            "text": PostFormat.TEXT,
            "carousel": PostFormat.CAROUSEL,
            "image": PostFormat.IMAGE,
            "video": PostFormat.VIDEO,
            "video_script": PostFormat.VIDEO_SCRIPT
        }
        format_enum = format_enum_map.get(actual_format, PostFormat.TEXT)
        
        # Prepare generation options with AI-generated data
        generation_options = request_options.copy()
        if actual_format == 'carousel' and image_prompts:
            generation_options["image_prompts"] = image_prompts  # Store array for carousel
            generation_options["image_prompt"] = image_prompt  # Also store first for compatibility
        elif image_prompt:
            generation_options["image_prompt"] = image_prompt
        if metadata_dict:
            generation_options["metadata"] = metadata_dict
        
        # Calculate costs BEFORE storing in generation_options
        from ..utils.cost_calculator import calculate_cost
        calculated_total_tokens = total_input_tokens + total_output_tokens
        main_cost = calculate_cost(
            provider=provider_name or "unknown",
            model=model_name,
            input_tokens=total_input_tokens,
            output_tokens=total_output_tokens
        )
        
        # Calculate image prompt costs if any
        image_prompt_cost_for_storage = None
        image_prompt_tokens_for_storage = None
        if image_prompt_input_tokens > 0 or image_prompt_output_tokens > 0:
            image_prompt_cost_for_storage = calculate_cost(
                provider=image_prompt_provider or "unknown",
                model=image_prompt_model,
                input_tokens=image_prompt_input_tokens,
                output_tokens=image_prompt_output_tokens
            )
            image_prompt_tokens_for_storage = {
                "input_tokens": image_prompt_input_tokens,
                "output_tokens": image_prompt_output_tokens,
                "total_tokens": image_prompt_input_tokens + image_prompt_output_tokens
            }
        
        # Store token usage in generation_options for later retrieval
        if calculated_total_tokens > 0 or (total_input_tokens > 0 or total_output_tokens > 0):
            # Include cost in stored token_usage
            stored_token_usage = {
                "input_tokens": total_input_tokens,
                "output_tokens": total_output_tokens,
                "total_tokens": calculated_total_tokens,
                "model": model_name or "unknown",
                "provider": provider_name or "unknown",
                "details": token_usage_details if token_usage_details else None
            }
            # Add cost if calculated
            if main_cost and (total_input_tokens > 0 or total_output_tokens > 0):
                stored_token_usage["cost"] = main_cost
            # Add image prompt tokens and cost if present
            if image_prompt_tokens_for_storage:
                stored_token_usage["image_prompt_tokens"] = image_prompt_tokens_for_storage
            if image_prompt_cost_for_storage and (image_prompt_input_tokens > 0 or image_prompt_output_tokens > 0):
                stored_token_usage["image_prompt_cost"] = image_prompt_cost_for_storage
            if image_prompt_provider:
                stored_token_usage["image_prompt_provider"] = image_prompt_provider
            if image_prompt_model:
                stored_token_usage["image_prompt_model"] = image_prompt_model
            # Add Cloudflare cost if image/carousel post
            if cloudflare_cost_for_storage and cloudflare_settings:
                stored_token_usage["cloudflare_cost"] = cloudflare_cost_for_storage
                stored_token_usage["cloudflare_model"] = cloudflare_settings.cloudflare_image_model
            
            generation_options["token_usage"] = stored_token_usage
        
        # Handle conversation (post_title was extracted earlier during JSON parsing)
        conversation_id = request.conversation_id
        if not conversation_id and request_options.get("create_conversation", True):
            # Create new conversation - use title from post if available, otherwise generate one
            if post_title and post_title.strip():
                title = post_title.strip()
            else:
                title_result, title_token_usage = await generate_conversation_title(request.message)
                title = title_result
                total_input_tokens += title_token_usage.get("input_tokens", 0)
                total_output_tokens += title_token_usage.get("output_tokens", 0)
                # Don't accumulate total_tokens - calculate it at the end as input + output
                token_usage_details["conversation_title"] = {
                    "input_tokens": title_token_usage.get("input_tokens", 0),
                    "output_tokens": title_token_usage.get("output_tokens", 0),
                    "total_tokens": title_token_usage.get("total_tokens", 0)
                }
            conversation = Conversation(
                id=str(uuid.uuid4()),
                user_id=user_id,
                title=title
            )
            db.add(conversation)
            db.flush()
            conversation_id = conversation.id
        elif conversation_id:
            # Update conversation timestamp and title if post title is available
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()
            if conversation:
                conversation.updated_at = datetime.utcnow()
                # Update title if we have a new title from the post
                if post_title and post_title.strip():
                    conversation.title = post_title.strip()
                    db.flush()
        
        # Save to database
        post_id = str(uuid.uuid4())
        post = GeneratedPost(
            id=post_id,
            user_id=user_id,
            conversation_id=conversation_id,
            topic=request.message[:500],
            content=post_content,
            format=format_enum,
            generation_options=generation_options,  # Now includes image_prompt and metadata
            attachments=image_attachments
        )
        
        db.add(post)
        db.commit()
        db.refresh(post)
        
        # Save conversation messages (user prompt + AI response)
        if conversation_id:
            # Save user message with attachments if present
            user_message = ConversationMessage(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role=MessageRole.USER,
                content=request.message,
                attachments=image_attachments if image_attachments else None
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
        
        # Build metadata - ensure hashtags are always included
        hashtags_from_metadata = metadata_dict.get("hashtags", [])
        hashtag_count_requested = request_options.get('hashtag_count', 4)
        
        # Extract hashtags from post content to see what's actually there
        hashtags_in_content = re.findall(r'#(\w+)', post_content)
        
        # If hashtags are missing or fewer than requested, try to get them from metadata or content
        if hashtag_count_requested > 0:
            # First, try to use hashtags from metadata (they should be formatted correctly)
            # Filter out empty strings and invalid hashtags
            valid_hashtags_from_metadata = []
            if hashtags_from_metadata:
                for tag in hashtags_from_metadata:
                    if isinstance(tag, str) and tag.strip():
                        # Ensure hashtag starts with #
                        tag = tag.strip()
                        if not tag.startswith('#'):
                            tag = f"#{tag}"
                        # Only add if it's a valid hashtag (has content after #)
                        if len(tag) > 1:
                            valid_hashtags_from_metadata.append(tag)
            
            # If we have valid hashtags from metadata, use them
            if len(valid_hashtags_from_metadata) >= hashtag_count_requested:
                hashtags_from_metadata = valid_hashtags_from_metadata[:hashtag_count_requested]
            # If metadata doesn't have enough, try extracting from content
            elif hashtags_in_content:
                hashtags_from_metadata = [f"#{tag}" for tag in hashtags_in_content[:hashtag_count_requested]]
            # If still not enough, we'll append what we have (even if less than requested)
            elif valid_hashtags_from_metadata:
                hashtags_from_metadata = valid_hashtags_from_metadata
            
            # CRITICAL: If hashtags are not in post_content, append them from metadata
            if hashtags_from_metadata and len(hashtags_from_metadata) > 0:
                # Check if hashtags are already in post_content (more robust check)
                post_content_lower = post_content.lower()
                hashtags_in_post = False
                for tag in hashtags_from_metadata:
                    tag_text = tag.lower().replace('#', '').strip()
                    if tag_text and tag_text in post_content_lower:
                        hashtags_in_post = True
                        break
                
                # If hashtags are not in post_content, append them
                if not hashtags_in_post:
                    # Format hashtags nicely: add blank line before if not present, then hashtags
                    hashtags_text = ' '.join(hashtags_from_metadata)
                    if not post_content.strip().endswith('\n'):
                        post_content = post_content.rstrip() + '\n\n' + hashtags_text
                    else:
                        post_content = post_content.rstrip() + hashtags_text
                    print(f"Appended {len(hashtags_from_metadata)} hashtags to post_content: {hashtags_text}")
            else:
                # If no hashtags at all, log a warning
                print(f"WARNING: No hashtags found in metadata or content. Requested: {hashtag_count_requested}")
        
        # Build metadata for response (hashtags only - tone and estimated_engagement removed)
        metadata = PostMetadata(
            hashtags=hashtags_from_metadata if hashtag_count_requested > 0 else [],
            tone="professional",  # Default value, not from AI output
            estimated_engagement="medium"  # Default value, not from AI output
        )
        
        # Get the conversation title to return in response
        conversation_title = None
        if conversation_id:
            conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if conversation:
                conversation_title = conversation.title
        
        # Build token usage response (costs already calculated above)
        # Use the same cost variables calculated earlier
        image_prompt_cost = image_prompt_cost_for_storage
        image_prompt_tokens = image_prompt_tokens_for_storage
        
        token_usage_response = None
        if calculated_total_tokens > 0 or (total_input_tokens > 0 or total_output_tokens > 0) or image_prompt_tokens or cloudflare_cost_for_storage:
            token_usage_response = TokenUsage(
                input_tokens=total_input_tokens,
                output_tokens=total_output_tokens,
                total_tokens=calculated_total_tokens,
                model=model_name or "unknown",
                provider=provider_name or "unknown",
                details=token_usage_details if token_usage_details else None,
                cost=main_cost if (total_input_tokens > 0 or total_output_tokens > 0) else None,
                image_prompt_tokens=image_prompt_tokens,
                image_prompt_cost=image_prompt_cost if (image_prompt_input_tokens > 0 or image_prompt_output_tokens > 0) else None,
                image_prompt_provider=image_prompt_provider,
                image_prompt_model=image_prompt_model,
                cloudflare_cost=cloudflare_cost_for_storage,
                cloudflare_model=cloudflare_settings.cloudflare_image_model if (cloudflare_cost_for_storage and cloudflare_settings) else None
            )
        
        return PostGenerationResponse(
            id=post.id,
            post_content=post_content,
            format_type=actual_format,
            image_prompt=image_prompt,
            image_prompts=image_prompts if actual_format == 'carousel' else None,
            metadata=metadata,
            conversation_id=conversation_id,
            title=conversation_title,
            created_at=post.created_at,
            token_usage=token_usage_response
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
            user_rating=post.user_rating,
            published_to_linkedin=post.published_to_linkedin,
            conversation_id=post.conversation_id,
            scheduled_at=post.scheduled_at,
            generation_options=post.generation_options
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


@router.post("/{post_id}/publish")
async def publish_post(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Publish a generated post to LinkedIn.
    Requires LinkedIn account to be connected.
    """
    # Get the post
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Note: We allow republishing - the frontend will show a confirmation dialog
    
    try:
        result = await publish_post_to_linkedin(post_id, db)
        return result
    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(status_code=404, detail=error_message)
        elif "not connected" in error_message.lower():
            raise HTTPException(status_code=400, detail=error_message)
        elif "expired" in error_message.lower():
            raise HTTPException(status_code=401, detail=error_message)
        else:
            raise HTTPException(status_code=400, detail=error_message)
    except Exception as e:
        error_message = str(e)
        # Provide more helpful error messages
        if "401" in error_message or "unauthorized" in error_message.lower():
            raise HTTPException(
                status_code=401, 
                detail="LinkedIn authorization failed. Please reconnect your LinkedIn account."
            )
        elif "403" in error_message or "forbidden" in error_message.lower():
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to post to LinkedIn. Please check your LinkedIn app permissions."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to publish post to LinkedIn: {error_message}"
            )

@router.post("/posts/{post_id}/schedule")
async def schedule_post(
    post_id: str,
    request: SchedulePostRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Schedule a post for future publication.
    """
    # Get the post
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Don't allow scheduling if already published
    if post.published_to_linkedin:
        raise HTTPException(status_code=400, detail="Cannot schedule a post that is already published. Please mark it as not published first.")
    
    # Validate scheduled time is in the future
    # Ensure both datetimes are timezone-aware for comparison
    now_utc = datetime.now(timezone.utc)
    scheduled_at_utc = request.scheduled_at
    
    # If scheduled_at is timezone-aware, convert to UTC; if naive, assume UTC
    if scheduled_at_utc.tzinfo is not None:
        scheduled_at_utc = scheduled_at_utc.astimezone(timezone.utc)
    else:
        scheduled_at_utc = scheduled_at_utc.replace(tzinfo=timezone.utc)
    
    if scheduled_at_utc <= now_utc:
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")
    
    # Update post with scheduled time (store as naive UTC datetime for database)
    post.scheduled_at = scheduled_at_utc.replace(tzinfo=None)
    db.commit()
    
    return {
        "success": True,
        "message": "Post scheduled successfully",
        "scheduled_at": post.scheduled_at
    }

@router.delete("/posts/{post_id}/schedule")
async def cancel_schedule(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Cancel a scheduled post.
    """
    # Get the post
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
        ).first()
        
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if not post.scheduled_at:
        raise HTTPException(status_code=400, detail="Post is not scheduled")
    
    # Clear scheduled time
    post.scheduled_at = None
    db.commit()
    
    return {
        "success": True,
        "message": "Schedule cancelled successfully"
    }

@router.post("/posts/{post_id}/publish-now")
async def publish_scheduled_post_now(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Publish a scheduled post immediately.
    """
    # Get the post
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
    ).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Allow scheduling even if already published - user can repost
    try:
        result = await publish_post_to_linkedin(post_id, db)
        return result
    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(status_code=404, detail=error_message)
        elif "not connected" in error_message.lower():
            raise HTTPException(status_code=400, detail=error_message)
        elif "expired" in error_message.lower():
            raise HTTPException(status_code=401, detail=error_message)
        else:
            raise HTTPException(status_code=400, detail=error_message)
    except Exception as e:
        error_message = str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to publish post: {error_message}"
        )

@router.get("/scheduled-posts", response_model=ScheduledPostsListResponse)
async def get_scheduled_posts(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all scheduled posts for the current user.
    Includes both unpublished and published posts that are scheduled.
    """
    # Get all scheduled posts (including those that are already published)
    posts = db.query(GeneratedPost).filter(
        GeneratedPost.user_id == user_id,
        GeneratedPost.scheduled_at.isnot(None)
    ).order_by(GeneratedPost.scheduled_at.asc()).all()
    
    scheduled_posts = []
    for post in posts:
        scheduled_posts.append(ScheduledPostResponse(
            id=post.id,
            content=post.user_edited_content if post.user_edited_content else post.content,
            format=post.format.value if post.format else None,
            scheduled_at=post.scheduled_at,
            conversation_id=post.conversation_id,
            generation_options=post.generation_options
        ))
    
    return ScheduledPostsListResponse(posts=scheduled_posts)

@router.patch("/posts/{post_id}/published-status")
async def toggle_published_status(
    post_id: str,
    published: bool,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Manually toggle the published status of a post.
    """
    # Get the post
    post = db.query(GeneratedPost).filter(
        GeneratedPost.id == post_id,
        GeneratedPost.user_id == user_id
        ).first()
        
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Update published status
    post.published_to_linkedin = published
    
    # If marking as not published and it's scheduled, clear the schedule
    if not published and post.scheduled_at:
        post.scheduled_at = None
    
        db.commit()
        
        return {
            "success": True,
        "message": f"Post marked as {'published' if published else 'not published'}",
        "published_to_linkedin": post.published_to_linkedin
    }

def format_video_script_dict(script_dict: dict) -> str:
    """
    Convert a video script dictionary to a formatted string.
    Handles various dict structures that AI might return.
    """
    lines = []
    
    # Hook section
    hook_key = next((k for k in script_dict.keys() if 'hook' in k.lower()), None)
    if hook_key:
        lines.append("**HEADER** [Hook - 3-5 seconds]")
        hook_content = script_dict[hook_key]
        if isinstance(hook_content, str):
            lines.append(f"*SCRIPT* {hook_content}")
        else:
            lines.append(f"*SCRIPT* {str(hook_content)}")
        lines.append("")
    
    # Introduction section
    intro_key = next((k for k in script_dict.keys() if 'introduction' in k.lower() or 'context' in k.lower()), None)
    if intro_key:
        lines.append("**HEADER** [Introduction - 10-15 seconds]")
        intro_content = script_dict[intro_key]
        if isinstance(intro_content, str):
            lines.append(f"*SCRIPT* {intro_content}")
        else:
            lines.append(f"*SCRIPT* {str(intro_content)}")
        lines.append("")
    
    # Main Content section
    main_key = next((k for k in script_dict.keys() if 'main' in k.lower() and 'content' in k.lower()), None)
    if main_key:
        lines.append("**HEADER** [Main Content - 40-60 seconds]")
        main_content = script_dict[main_key]
        
        if isinstance(main_content, list):
            # Handle list of points
            for i, point in enumerate(main_content, 1):
                if isinstance(point, dict):
                    point_title = point.get('point', point.get('title', f'Point {i}'))
                    point_script = point.get('script', point.get('content', ''))
                    visual_cues = point.get('visual_cues', point.get('visual', ''))
                    
                    lines.append(f"**SUBHEADER** Point {i}: {point_title}")
                    if visual_cues:
                        lines.append(f"*VISUAL* {visual_cues}")
                    if point_script:
                        lines.append(f"*SCRIPT* {point_script}")
                    lines.append("")
                else:
                    lines.append(f"**SUBHEADER** Point {i}: {str(point)}")
                    lines.append("")
        elif isinstance(main_content, str):
            lines.append(f"*SCRIPT* {main_content}")
        else:
            lines.append(f"*SCRIPT* {str(main_content)}")
        lines.append("")
    
    # Summary section
    summary_key = next((k for k in script_dict.keys() if 'summary' in k.lower() or 'takeaway' in k.lower()), None)
    if summary_key:
        lines.append("**HEADER** [Summary - 10-15 seconds]")
        summary_content = script_dict[summary_key]
        if isinstance(summary_content, str):
            lines.append(f"*SCRIPT* {summary_content}")
        else:
            lines.append(f"*SCRIPT* {str(summary_content)}")
        lines.append("")
    
    # CTA section
    cta_key = next((k for k in script_dict.keys() if 'cta' in k.lower() or 'call' in k.lower() and 'action' in k.lower()), None)
    if cta_key:
        lines.append("**HEADER** [CTA - 5-10 seconds]")
        cta_content = script_dict[cta_key]
        if isinstance(cta_content, str):
            lines.append(f"*SCRIPT* {cta_content}")
        else:
            lines.append(f"*SCRIPT* {str(cta_content)}")
        lines.append("")
    
    # If no structured sections found, format the entire dict
    if len(lines) == 0:
        for key, value in script_dict.items():
            lines.append(f"[{key}]")
            if isinstance(value, (dict, list)):
                lines.append(json.dumps(value, indent=2))
            else:
                lines.append(str(value))
            lines.append("")
    
    return '\n'.join(lines).strip()

def format_video_script_string(script_text: str) -> str:
    """
    Format a video script string to add markers for better presentation.
    Adds **HEADER**, **SUBHEADER**, *VISUAL*, and *SCRIPT* markers.
    """
    lines = script_text.split('\n')
    formatted_lines = []
    
    for line in lines:
        trimmed = line.strip()
        
        # Check if line is a section header (starts with [Section Name])
        if trimmed.startswith('[') and ']' in trimmed and any(keyword in trimmed.lower() for keyword in ['hook', 'introduction', 'context', 'main content', 'summary', 'takeaway', 'cta', 'call']):
            formatted_lines.append(f"**HEADER** {trimmed}")
        # Check if line is a point header (Point 1:, Point 2:, etc.)
        elif trimmed.lower().startswith('point') and ':' in trimmed:
            formatted_lines.append(f"**SUBHEADER** {trimmed}")
        # Check if line contains visual cues (brackets with show, gesture, pause, etc.)
        elif trimmed.startswith('[') and any(keyword in trimmed.lower() for keyword in ['show', 'gesture', 'pause', 'visual', 'screen', 'highlight']):
            formatted_lines.append(f"*VISUAL* {trimmed}")
        # Check if line is empty
        elif not trimmed:
            formatted_lines.append("")
        # Otherwise, treat as script text
        else:
            formatted_lines.append(f"*SCRIPT* {trimmed}")
    
    return '\n'.join(formatted_lines)

async def generate_image_prompt(post_content: str, context: dict) -> tuple[str, Dict[str, Any]]:
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
        
        prompt, token_usage = await generate_completion(
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
        
        final_prompt = prompt if prompt else "Professional LinkedIn post image, modern design, diverse professional characters, clean composition, brand colors, 1200x628px"
        return final_prompt, token_usage
    except Exception as e:
        print(f"Error generating image prompt: {str(e)}")
        return "Professional LinkedIn post image, modern design, diverse professional characters, clean composition, brand colors, 1200x628px", {
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "model": "unknown",
            "provider": "unknown"
        }

async def generate_carousel_image_prompts(post_content: str, context: dict, requested_slide_count: Optional[int] = None) -> tuple[list[str], Dict[str, Any]]:
    """
    Generate multiple AI image prompts for carousel slides that match the post content and are LinkedIn-friendly
    
    Args:
        post_content: The post content
        context: User context dict
        requested_slide_count: Optional explicit slide count from user (will be capped at 15)
    """
    try:
        # Use requested slide count if provided, otherwise estimate from content
        if requested_slide_count:
            # Cap at 15 maximum
            slide_count = max(4, min(15, requested_slide_count))
        else:
            # Extract slide count from content (estimate based on structure)
            slide_count = max(4, min(15, post_content.count('\n\n') + 1))
        
        industry = context.get('industry', 'business')
        expertise = context.get('expertise_areas', [])
        if isinstance(expertise, list):
            expertise_str = ', '.join(expertise[:3]) if expertise else industry
        else:
            expertise_str = str(expertise) if expertise else industry
        
        # Detect if content is educational/tutorial/how-to
        educational_keywords = ['how to', 'step', 'tutorial', 'guide', 'explain', 'learn', 'teach', 'solution', 'process', 'method', 'technique', 'way to', 'tips', 'best practices', 'example', 'demonstrate']
        is_educational = any(keyword in post_content.lower() for keyword in educational_keywords)
        
        # Extract key educational points if educational
        educational_instruction = ""
        if is_educational:
            educational_instruction = """

CRITICAL FOR EDUCATIONAL CONTENT:
- This post is educational/tutorial/how-to content
- Each slide MUST include TEXT OVERLAYS with:
  * Clear explanations of concepts being taught
  * Step-by-step instructions if applicable
  * Key takeaways or solutions
  * Specific details that educate the viewer
- Text should be readable, well-positioned, and complement the visuals
- For "how to" content: Include numbered steps or sequential instructions in text
- For explanatory content: Include key concepts, definitions, or solutions in text
- Visuals should support the text, not replace it
- Example: If explaining a process, the slide should show BOTH the visual representation AND text explaining what's happening
- Text overlays are REQUIRED - slides cannot be images only"""
        
        prompt, token_usage = await generate_completion(
            system_prompt=f"""You are a creative expert at writing image generation prompts for LinkedIn carousel posts. Your prompts create a cohesive visual story with consistent theming.

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
{educational_instruction}
5. LINKEDIN OPTIMIZATION:
   - Professional, polished, engaging aesthetic
   - 1200×628px landscape format
   - Text overlay space consideration

Return ONLY a valid JSON array of strings. Each prompt should be creative, detailed, and ready for image generation. Output ONLY the JSON array - no explanations.""",
            user_message=f"""Create {slide_count} creative, detailed image prompts for this LinkedIn carousel post (maximum 15 slides allowed):

POST CONTENT:
{post_content}

INDUSTRY: {industry}
EXPERTISE: {expertise_str}

TASK:
1. Analyze content: If specific tools/platforms mentioned → use real-world style. If general/abstract → use cartoon/illustration style with characters
2. Determine if content is educational/tutorial/how-to: {"YES - This is educational content. Each slide MUST include text overlays with explanations, steps, or solutions." if is_educational else "NO - Standard content"}
3. Break the post into {slide_count} logical sections/points (one per slide)
4. Choose ONE consistent visual theme: same colors, same style (realistic OR cartoon), same composition for ALL slides
5. Create {slide_count} prompts where:
   - Each slide represents ONE specific point from the post
   - All slides share the SAME color palette and visual style
   - If using characters: They do actions matching each slide's point
   - Slides build on each other visually (like a story)
   {"- CRITICAL: Each slide MUST include text overlays with:" if is_educational else ""}
   {"  * Clear explanations of what is being taught" if is_educational else ""}
   {"  * Step-by-step instructions if applicable" if is_educational else ""}
   {"  * Key solutions or takeaways" if is_educational else ""}
   {"  * Specific educational content that helps viewers understand" if is_educational else ""}
   {"- Text should be readable and well-integrated with visuals" if is_educational else ""}

CRITICAL: All slides must be visually consistent - same colors, same style (realistic OR cartoon), same type of elements. They should feel like a cohesive series.{" For educational content, text overlays are REQUIRED on every slide." if is_educational else ""}

CRITICAL: Return EXACTLY {slide_count} prompts (maximum 15 slides). Do NOT exceed 15 slides even if requested.

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
                # CRITICAL: Limit to 15 slides maximum (even if AI generated more)
                if len(prompts) > 15:
                    print(f"WARNING: AI generated {len(prompts)} prompts, limiting to 15")
                    prompts = prompts[:15]
                
                # Ensure we have the right number of prompts (within 4-15 range)
                if len(prompts) >= slide_count:
                    return prompts[:slide_count], token_usage
                elif len(prompts) < slide_count:
                    # Pad with variations of the last prompt
                    while len(prompts) < slide_count:
                        prompts.append(prompts[-1] if prompts else "Professional LinkedIn carousel slide, modern design, diverse professional characters, clean composition, brand colors, 1200x628px")
                    return prompts[:slide_count], token_usage
                return prompts, token_usage
        except json.JSONDecodeError as e:
            print(f"Failed to parse carousel prompts as JSON: {str(e)}")
            print(f"Raw response: {prompt[:200]}")
        
        # Fallback: split by lines or create default prompts
        lines = [line.strip() for line in prompt.split('\n') if line.strip() and not line.strip().startswith('-') and not line.strip().startswith('Slide')]
        if len(lines) >= slide_count:
            return lines[:slide_count], token_usage
        
        # Ultimate fallback: create generic but LinkedIn-friendly prompts
        return [f"Professional LinkedIn carousel slide {i+1}, modern design, diverse professional characters, clean composition, consistent brand colors, 1200x628px" for i in range(slide_count)], token_usage
    except Exception as e:
        print(f"Error generating carousel image prompts: {str(e)}")
        # Fallback: return default LinkedIn-friendly prompts
        return ["Professional LinkedIn carousel slide, modern design, diverse professional characters, clean composition, consistent brand colors, 1200x628px" for _ in range(4)], {
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "model": "unknown",
            "provider": "unknown"
        }
