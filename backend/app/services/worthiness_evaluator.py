from typing import Dict
from .ai_service import generate_completion
from ..prompts.system_prompts import WORTHINESS_EVALUATION_PROMPT
import json
import re

async def evaluate_comment_worthiness(
    original_post_text: str,
    user_expertise: str,
    user_profile: str
) -> Dict:
    """
    Evaluate if a post is worth commenting on using 24-point rubric
    Returns: {score, reasoning, recommendation, breakdown}
    """
    
    evaluation_prompt = f"""{WORTHINESS_EVALUATION_PROMPT}

## User's Expertise
{user_expertise}

## User's Profile
{user_profile}

## Post to Evaluate
{original_post_text}

Evaluate this post and provide a structured response with:
1. Unique Perspective score (0-8)
2. Value Addition score (0-8)
3. Expertise Match score (0-8)
4. Total score
5. Recommendation (COMMENT or SKIP)
6. Brief reasoning (2-3 sentences)

Format as JSON:
{{
    "unique_perspective": X,
    "value_addition": X,
    "expertise_match": X,
    "total_score": X,
    "recommendation": "COMMENT/SKIP",
    "reasoning": "..."
}}"""

    try:
        result = await generate_completion(
            system_prompt="You are a comment worthiness evaluator. Provide objective assessments.",
            user_message=evaluation_prompt,
            temperature=0.3
        )
        
        # Try to parse JSON from response
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
            result = result.strip()
        
        evaluation = json.loads(result)
        
        # Validate structure
        if "total_score" not in evaluation:
            evaluation["total_score"] = sum([
                evaluation.get("unique_perspective", 0),
                evaluation.get("value_addition", 0),
                evaluation.get("expertise_match", 0)
            ])
        
        if "recommendation" not in evaluation:
            evaluation["recommendation"] = "COMMENT" if evaluation["total_score"] >= 16 else "SKIP"
        
        return evaluation
        
    except json.JSONDecodeError:
        # Fallback: try to extract scores from text
        try:
            scores = re.findall(r'(\d+)/8|score[:\s]+(\d+)', result.lower())
            if scores:
                total = sum(int(s[0] or s[1]) for s in scores[:3])
                return {
                    "total_score": total,
                    "recommendation": "COMMENT" if total >= 16 else "SKIP",
                    "reasoning": result[:200],
                    "unique_perspective": 0,
                    "value_addition": 0,
                    "expertise_match": 0
                }
        except:
            pass
        
        # Complete fallback
        return {
            "total_score": 12,
            "recommendation": "BORDERLINE",
            "reasoning": "Unable to fully evaluate. Manual review recommended.",
            "unique_perspective": 4,
            "value_addition": 4,
            "expertise_match": 4
        }

async def extract_post_from_screenshot(screenshot_path: str) -> str:
    """
    Extract text content from screenshot image
    For now, this is a placeholder - in production, you'd use OCR (Tesseract, Google Vision, etc.)
    """
    # TODO: Implement actual OCR
    # For MVP, we'll ask user to paste the text alongside screenshot
    
    return """[Post text would be extracted from screenshot using OCR]

For MVP: Please paste the post text alongside the screenshot."""

def should_comment(worthiness_score: int) -> bool:
    """
    Determine if should comment based on score
    """
    return worthiness_score >= 16


