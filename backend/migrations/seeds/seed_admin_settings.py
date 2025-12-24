"""
Seed admin settings with AI rules and configurations.
This script is idempotent - safe to run multiple times.
"""
import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models import AdminSetting
import uuid


def seed_admin_settings():
    """Seed admin settings with AI rules and configurations"""
    db = SessionLocal()
    
    try:
        settings_data = [
            {
                "key": "system_prompt",
                "value": """You are a LinkedIn content generation specialist. Your role is to help create authentic, high-quality LinkedIn posts and comments.

## Primary Rules:
- **NEVER** generate generic LinkedIn content
- **ALWAYS** match the person's authentic writing style
- **MUST** use "Top Creator" format: Hook → Context → Insight → Takeaway

## For Posts (Top Creator Format):
- **SINGLE-LINE FORMATTING** - One thought per line, never walls of text
- **MOBILE-FIRST** - Lots of white space, easy to scan on phone
- **HOOK FIRST** - First 1-2 lines must stop the scroll (bold claim, data, question)
- **SHORT SENTENCES** - Max 15 words, average 8-12 words per sentence
- **DATA-DRIVEN** - Include specific metrics/achievements from profile
- **BULLET POINTS** - Use for lists and key points
- **POWERFUL ENDING** - End with question, takeaway, or bold statement
- **HASHTAGS** - 3-5 at end of post, separated from content

## For Comments:
- **EVALUATE FIRST**: Should we even comment? Provide recommendation.
- **Only comment if**: Clear unique angle, substantial value, advances conversation
- **Skip if**: Nothing unique to add, would seem like engagement farming
- Be authentic and conversational (not salesy)
- Add REAL value to the discussion
- Keep it concise (2-4 sentences typically)
- Match their tone and voice
- **NEVER make generic comments** - quality over quantity""",
                "description": "Core AI system prompt for content generation"
            },
            {
                "key": "content_format_guidelines",
                "value": """## Content Format Variety (CRITICAL):
Mix these formats regularly for algorithm optimization:
- **Text-only** (40%) - Pure written insights
- **Text + Image** (30%) - Visual + substance
- **Carousel** (20%) - Multi-slide guides (LinkedIn favors these!)
- **Video** (10%) - Demos and tutorials

**When generating "best practices" content → Default to CAROUSEL format suggestion**

**Determine optimal format**:
- Best practices/tutorials → Suggest CAROUSEL format
- Data/results → Suggest TEXT + IMAGE
- Quick tips → TEXT only
- Demos/how-tos → Suggest VIDEO or CAROUSEL""",
                "description": "Content format distribution and selection guidelines"
            },
            {
                "key": "comment_worthiness_rubric",
                "value": """## Comment Worthiness Evaluation (24-point scale):

**Unique Perspective (8 points)**
- 7-8: Completely unique angle nobody else would have
- 5-6: Some unique elements based on expertise
- 3-4: Slightly different take but not unique
- 1-2: Generic perspective anyone could have
- 0: No unique value

**Value Addition (8 points)**
- 7-8: Substantial value, advances conversation significantly
- 5-6: Good value, adds context or insight
- 3-4: Minimal value, mostly agreement
- 1-2: Very little value added
- 0: No value, just engagement farming

**Expertise Match (8 points)**
- 7-8: Perfect match with their core expertise
- 5-6: Related to their expertise area
- 3-4: Tangentially related
- 1-2: Barely related to expertise
- 0: No expertise connection

**Scoring:**
- 20-24: DEFINITELY COMMENT - High value
- 16-19: COMMENT - Good opportunity
- 12-15: BORDERLINE - Use judgment
- 0-11: SKIP - Not worth it""",
                "description": "Rubric for evaluating whether to comment on a post"
            },
            {
                "key": "default_preferences",
                "value": '{"post_type_distribution": {"text_only": 40, "text_with_image": 30, "carousel": 25, "video": 5}, "content_mix": {"best_practices": 35, "technical_tutorials": 25, "career_advice": 15, "industry_trends": 15, "personal_journey": 10}, "tone": "professional_yet_accessible", "hashtag_count": 4, "emoji_usage": "minimal", "sentence_max_length": 15, "hook_style": "data_driven"}',
                "description": "Default user preferences for content generation"
            },
            {
                "key": "trending_topics",
                "value": '["AI and automation in business", "Remote work best practices", "Career growth strategies", "Leadership lessons", "Industry-specific technical updates", "Productivity tips", "Workplace culture", "Professional development", "Tech trends", "Data-driven insights"]',
                "description": "Sample trending topics for suggestions"
            }
        ]
        
        for setting_data in settings_data:
            # Check if setting already exists
            existing = db.query(AdminSetting).filter(AdminSetting.key == setting_data["key"]).first()
            if not existing:
                setting = AdminSetting(
                    id=str(uuid.uuid4()),
                    **setting_data
                )
                db.add(setting)
                print(f"✅ Added admin setting: {setting_data['key']}")
            else:
                print(f"⚠️  Admin setting already exists: {setting_data['key']}")
        
        db.commit()
        print("✅ Admin settings seeding completed")
        
    except Exception as e:
        print(f"❌ Error seeding admin settings: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin_settings()

