"""
Master seed file - Seeds all required data for the LinkedIn Content SaaS application.
This script is idempotent - safe to run multiple times.

Seeds:
- Admin settings (AI rules and configurations)
- Subscription plans (Free, Starter, Pro)
- Notification actions and preferences
"""
import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models import AdminSetting, SubscriptionPlanConfig, NotificationAction, NotificationPreference
import uuid


def seed_admin_settings(db):
    """Seed admin settings with AI rules and configurations"""
    print("\n🌱 Seeding admin settings...")
    
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
        },
        {
            "key": "credit_price_per_unit",
            "value": "10",
            "description": "Price per credit in cents (e.g., 10 = $0.10 per credit)"
        },
        {
            "key": "credit_purchase_steps",
            "value": "[10, 25, 50, 100, 250, 500]",
            "description": "Available credit purchase amounts (JSON array)"
        },
        {
            "key": "credit_bulk_discounts",
            "value": '[{"min": 100, "discount": 0.1}, {"min": 250, "discount": 0.15}]',
            "description": "Bulk discount tiers - min credits required and discount percentage (JSON array)"
        },
        {
            "key": "credit_max_purchase",
            "value": "1000",
            "description": "Maximum credits that can be purchased in a single transaction"
        },
        {
            "key": "credit_purchase_enabled",
            "value": "true",
            "description": "Enable/disable credit purchase feature (true/false)"
        }
    ]
    
    for setting_data in settings_data:
        existing = db.query(AdminSetting).filter(AdminSetting.key == setting_data["key"]).first()
        if not existing:
            setting = AdminSetting(
                id=str(uuid.uuid4()),
                **setting_data
            )
            db.add(setting)
            print(f"  ✅ Added admin setting: {setting_data['key']}")
        else:
            print(f"  ⚠️  Admin setting already exists: {setting_data['key']}")
    
    print("✅ Admin settings seeding completed")


def seed_subscription_plans(db):
    """Seed subscription plans (Free, Starter, Pro)"""
    print("\n🌱 Seeding subscription plans...")
    
    plans_data = [
        {
            "plan_name": "FREE",
            "display_name": "Free Plan",
            "description": "Perfect for getting started with LinkedIn content generation",
            "price_monthly": 0,
            "price_yearly": 0,
            "credits_limit": 5,
            "features": ["5 credits per month (~2-10 posts)", "All post formats", "Email support"],
            "stripe_product_id": None,
            "stripe_price_id_monthly": None,
            "stripe_price_id_yearly": None,
            "is_active": True,
            "sort_order": 1
        },
        {
            "plan_name": "STARTER",
            "display_name": "Starter Plan",
            "description": "Perfect for professionals getting started",
            "price_monthly": 1200,
            "price_yearly": 12000,
            "credits_limit": 40,
            "features": ["40 credits per month (~16-80 posts)", "All post formats (text, image, carousel, video)", "Priority support", "Unlimited regenerations", "AI research included"],
            "stripe_product_id": None,
            "stripe_price_id_monthly": None,
            "stripe_price_id_yearly": None,
            "is_active": True,
            "sort_order": 2
        },
        {
            "plan_name": "PRO",
            "display_name": "Pro Plan",
            "description": "For creators who post frequently",
            "price_monthly": 2500,
            "price_yearly": 25000,
            "credits_limit": 100,
            "features": ["100 credits per month (~40-200 posts)", "All post formats", "Priority support", "Unlimited regenerations", "AI research included", "Advanced analytics"],
            "stripe_product_id": None,
            "stripe_price_id_monthly": None,
            "stripe_price_id_yearly": None,
            "is_active": True,
            "sort_order": 3
        }
    ]
    
    for plan_data in plans_data:
        existing = db.query(SubscriptionPlanConfig).filter(
            SubscriptionPlanConfig.plan_name == plan_data["plan_name"]
        ).first()
        
        if existing:
            for key, value in plan_data.items():
                if key != "plan_name":
                    setattr(existing, key, value)
            print(f"  ✅ Updated subscription plan: {plan_data['plan_name']}")
        else:
            plan = SubscriptionPlanConfig(
                id=str(uuid.uuid4()),
                **plan_data
            )
            db.add(plan)
            print(f"  ✅ Added subscription plan: {plan_data['plan_name']}")
    
    print("✅ Subscription plans seeding completed")


def get_default_notification_preferences(action_code: str) -> tuple:
    """Get default email and push preferences for a notification action"""
    defaults = {
        "credits_exhausted": (False, False),
        "credits_low": (False, False),
        "credits_reset": (False, False),
        "linkedin_connected": (False, False),
        "linkedin_token_expired": (False, False),
        "admin_error_critical": (True, True),
        "admin_payment_failed": (True, True),
        "post_failed": (True, True),
        "post_published": (True, True),
        "post_scheduled": (False, True),
        "payment_failed": (True, True),
        "subscription_activated": (True, True),
        "subscription_canceled": (True, True),
        "subscription_renewed": (True, True),
        "subscription_upgraded": (True, True),
        "subscription_downgrade_scheduled": (True, True),
        "subscription_downgraded": (True, True),
        "subscription_credits_reset": (False, True),
        "credits_purchased": (True, True),
    }
    return defaults.get(action_code, (True, True))


def seed_notification_actions(db):
    """Seed notification actions and default preferences"""
    print("\n🌱 Seeding notification actions...")
    
    actions_data = [
        {"action_code": "post_published", "action_name": "Post Published", "description": "When a post is successfully published to LinkedIn", "category": "post"},
        {"action_code": "post_failed", "action_name": "Post Failed", "description": "When publishing a post to LinkedIn fails", "category": "post"},
        {"action_code": "post_scheduled", "action_name": "Post Scheduled", "description": "When a post is scheduled for future publishing", "category": "post"},
        {"action_code": "subscription_activated", "action_name": "Subscription Activated", "description": "When user subscribes to a new plan", "category": "subscription"},
        {"action_code": "subscription_renewed", "action_name": "Subscription Renewed", "description": "When subscription is renewed", "category": "subscription"},
        {"action_code": "subscription_canceled", "action_name": "Subscription Canceled", "description": "When subscription is canceled", "category": "subscription"},
        {"action_code": "payment_failed", "action_name": "Payment Failed", "description": "When a payment fails", "category": "subscription"},
        {"action_code": "subscription_upgraded", "action_name": "Subscription Upgraded", "description": "When user upgrades to a higher plan", "category": "subscription"},
        {"action_code": "subscription_downgrade_scheduled", "action_name": "Downgrade Scheduled", "description": "When downgrade to free plan is scheduled", "category": "subscription"},
        {"action_code": "subscription_downgraded", "action_name": "Subscription Downgraded", "description": "When downgrade to free plan takes effect", "category": "subscription"},
        {"action_code": "credits_low", "action_name": "Credits Low", "description": "When user has less than 20% credits remaining", "category": "account"},
        {"action_code": "credits_exhausted", "action_name": "Credits Exhausted", "description": "When user runs out of credits", "category": "account"},
        {"action_code": "credits_reset", "action_name": "Credits Reset", "description": "When monthly credits are reset", "category": "account"},
        {"action_code": "subscription_credits_reset", "action_name": "Subscription Credits Reset", "description": "When subscription credits reset (purchased credits unaffected)", "category": "account"},
        {"action_code": "credits_purchased", "action_name": "Credits Purchased", "description": "When user successfully purchases credits", "category": "account"},
        {"action_code": "linkedin_connected", "action_name": "LinkedIn Connected", "description": "When LinkedIn account is successfully connected", "category": "account"},
        {"action_code": "linkedin_token_expired", "action_name": "LinkedIn Token Expired", "description": "When LinkedIn token expires and needs reconnection", "category": "account"},
        {"action_code": "admin_error_critical", "action_name": "Critical Error", "description": "Critical system errors for admins", "category": "error"},
        {"action_code": "admin_payment_failed", "action_name": "Payment Processing Failed", "description": "Payment processing failures for admins", "category": "error"}
    ]
    
    for action_data in actions_data:
        existing_action = db.query(NotificationAction).filter(
            NotificationAction.action_code == action_data["action_code"]
        ).first()
        
        if not existing_action:
            action = NotificationAction(
                id=str(uuid.uuid4()),
                action_code=action_data["action_code"],
                action_name=action_data["action_name"],
                description=action_data["description"],
                category=action_data["category"]
            )
            db.add(action)
            db.flush()
            
            email_enabled, push_enabled = get_default_notification_preferences(action_data["action_code"])
            preference = NotificationPreference(
                id=str(uuid.uuid4()),
                action_id=action.id,
                email_enabled=email_enabled,
                push_enabled=push_enabled
            )
            db.add(preference)
            print(f"  ✅ Created notification action: {action_data['action_code']}")
        else:
            updated = False
            if existing_action.action_name != action_data["action_name"]:
                existing_action.action_name = action_data["action_name"]
                updated = True
            if existing_action.description != action_data["description"]:
                existing_action.description = action_data["description"]
                updated = True
            if existing_action.category != action_data["category"]:
                existing_action.category = action_data["category"]
                updated = True
            
            if updated:
                print(f"  ✅ Updated notification action: {action_data['action_code']}")
            
            existing_preference = db.query(NotificationPreference).filter(
                NotificationPreference.action_id == existing_action.id
            ).first()
            
            if not existing_preference:
                email_enabled, push_enabled = get_default_notification_preferences(action_data["action_code"])
                preference = NotificationPreference(
                    id=str(uuid.uuid4()),
                    action_id=existing_action.id,
                    email_enabled=email_enabled,
                    push_enabled=push_enabled
                )
                db.add(preference)
                print(f"  ✅ Created preference for action: {action_data['action_code']}")
    
    print("✅ Notification actions seeding completed")


def run_master_seed():
    """Run all seed operations"""
    print("=" * 60)
    print("🌱 Running Master Seed - LinkedIn Content SaaS")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        seed_admin_settings(db)
        seed_subscription_plans(db)
        seed_notification_actions(db)
        
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ All seeds completed successfully!")
        print("=" * 60)
        print("\nSeeded data:")
        print("  • 10 Admin settings (AI rules, credit config)")
        print("  • 3 Subscription plans (Free, Starter, Pro)")
        print("  • 19 Notification actions with preferences")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_master_seed()
