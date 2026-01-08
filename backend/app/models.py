from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, LargeBinary, JSON, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base
import enum

def generate_uuid():
    return str(uuid.uuid4())

class AccountType(str, enum.Enum):
    PERSON = "person"
    BUSINESS = "business"

class PostFormat(str, enum.Enum):
    TEXT = "text"
    CAROUSEL = "carousel"
    IMAGE = "image"
    VIDEO = "video"
    VIDEO_SCRIPT = "video_script"

class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    UNLIMITED = "unlimited"
    AGENCY = "agency"  # Legacy, keeping for backwards compatibility

class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Null for OAuth-only users
    name = Column(String(255))
    email_verified = Column(Boolean, default=False)
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    linkedin_id = Column(String(255), unique=True, index=True)
    account_type = Column(SQLEnum(AccountType), default=AccountType.PERSON)
    linkedin_access_token = Column(Text)
    linkedin_refresh_token = Column(Text)
    linkedin_token_expires_at = Column(DateTime)
    linkedin_profile_data = Column(JSON)
    linkedin_connected = Column(Boolean, default=False, index=True)
    linkedin_last_sync = Column(DateTime)
    registration_provider = Column(String(50), nullable=True)  # "email", "google", "linkedin"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    posts = relationship("GeneratedPost", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("GeneratedComment", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    images = relationship("GeneratedImage", back_populates="user", cascade="all, delete-orphan")
    pdfs = relationship("GeneratedPDF", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # CV storage
    cv_filename = Column(String(255))
    cv_data = Column(LargeBinary)
    cv_text = Column(Text)
    
    # Generated context
    profile_md = Column(Text)
    context_json = Column(JSON)
    
    # Writing style
    writing_samples = Column(JSON)  # Array of sample posts
    writing_style_md = Column(Text)
    
    # Custom instructions
    custom_instructions = Column(Text)
    
    # Preferences
    preferences = Column(JSON)  # Post type percentages, topics, etc.
    
    # Onboarding status
    onboarding_step = Column(Integer, default=1)
    onboarding_completed = Column(Boolean, default=False)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="profile")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="conversations")
    posts = relationship("GeneratedPost", back_populates="conversation")
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(SQLEnum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    post_id = Column(String(36), ForeignKey("generated_posts.id", ondelete="SET NULL"))
    attachments = Column(JSON)  # Image attachments for user messages
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    post = relationship("GeneratedPost")

class GeneratedPost(Base):
    __tablename__ = "generated_posts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="SET NULL"), index=True)
    
    topic = Column(String(500))
    content = Column(Text, nullable=False)
    format = Column(SQLEnum(PostFormat), default=PostFormat.TEXT)
    
    # Generation context
    generation_options = Column(JSON)  # Toggles used during generation
    attachments = Column(JSON)  # File references
    
    # User interaction
    user_edited_content = Column(Text)
    user_rating = Column(Integer)  # 1-5 stars
    published_to_linkedin = Column(Boolean, default=False)
    scheduled_at = Column(DateTime, nullable=True, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="posts")
    conversation = relationship("Conversation", back_populates="posts")
    images = relationship("GeneratedImage", back_populates="post", cascade="all, delete-orphan")
    pdfs = relationship("GeneratedPDF", back_populates="post", cascade="all, delete-orphan")

class GeneratedImage(Base):
    __tablename__ = "generated_images"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("generated_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    image_data = Column(Text, nullable=False)  # Base64 encoded image
    prompt = Column(Text, nullable=False)
    model = Column(String(255))
    image_metadata = Column(JSON)  # Renamed from 'metadata' to avoid SQLAlchemy conflict
    is_current = Column(Boolean, default=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    post = relationship("GeneratedPost", back_populates="images")
    user = relationship("User")

class GeneratedPDF(Base):
    __tablename__ = "generated_pdfs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    post_id = Column(String(36), ForeignKey("generated_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    pdf_data = Column(Text, nullable=False)  # Base64 encoded PDF
    slide_images = Column(JSON)  # Array of base64 slide images for preview
    slide_count = Column(Integer, nullable=False)
    prompts = Column(JSON, nullable=False)  # Array of prompts used for each slide
    model = Column(String(255))
    pdf_metadata = Column(JSON)
    is_current = Column(Boolean, default=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    post = relationship("GeneratedPost", back_populates="pdfs")
    user = relationship("User")

class GeneratedComment(Base):
    __tablename__ = "generated_comments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Original post being commented on
    original_post_screenshot = Column(String(500))  # File path
    original_post_text = Column(Text)
    
    # Worthiness evaluation
    worthiness_score = Column(Integer)  # 1-24 scale
    worthiness_reasoning = Column(Text)
    recommendation = Column(String(20))  # COMMENT or SKIP
    
    # Generated comment
    content = Column(Text)
    
    # User interaction
    user_edited_content = Column(Text)
    user_rating = Column(Integer)
    published_to_linkedin = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="comments")

class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    plan = Column(SQLEnum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    credits_used_this_month = Column(Float, default=0.0)
    credits_limit = Column(Float, default=5.0)
    
    # Billing
    billing_cycle = Column(SQLEnum(BillingCycle), default=BillingCycle.MONTHLY, nullable=True)
    subscription_status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    
    # Stripe integration
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True, index=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="subscription")

class AdminSetting(Base):
    __tablename__ = "admin_settings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text)
    description = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TokenType(str, enum.Enum):
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"


class UserToken(Base):
    """Stores tokens for email verification and password reset"""
    __tablename__ = "user_tokens"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    verification_code = Column(String(6), nullable=True, index=True)
    token_type = Column(SQLEnum(TokenType), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")


class AdminRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"


class Admin(Base):
    """Admin users with access to dashboard"""
    __tablename__ = "admins"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(SQLEnum(AdminRole), default=AdminRole.ADMIN)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SubscriptionPlanConfig(Base):
    """Configurable subscription plans"""
    __tablename__ = "subscription_plan_configs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=False)
    description = Column(Text)
    price_monthly = Column(Integer, default=0)
    price_yearly = Column(Integer, default=0)
    credits_limit = Column(Float, default=5.0)
    features = Column(JSON)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    stripe_product_id = Column(String(255), nullable=True)
    stripe_price_id_monthly = Column(String(255), nullable=True)
    stripe_price_id_yearly = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CreditTransaction(Base):
    """Track all credit usage for transparency"""
    __tablename__ = "credit_transactions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(String(36), ForeignKey("generated_posts.id", ondelete="CASCADE"), nullable=True)
    admin_id = Column(String(36), ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)
    
    action_type = Column(String(100), nullable=False)  # 'text_post', 'image_generation', 'admin_grant', etc.
    credits_used = Column(Float, nullable=False)  # Negative for deductions, positive for grants
    credits_before = Column(Integer, nullable=False)
    credits_after = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User")
    admin = relationship("Admin")


class ServiceType(str, enum.Enum):
    TEXT_GENERATION = "text_generation"
    IMAGE_GENERATION = "image_generation"
    SEARCH = "search"


class UsageTracking(Base):
    """Tracks usage metrics for AI services"""
    __tablename__ = "usage_tracking"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(String(36), ForeignKey("generated_posts.id", ondelete="CASCADE"), nullable=True, index=True)
    
    service_type = Column(SQLEnum(ServiceType), nullable=False, index=True)
    
    # Token metrics
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    # Cost tracking
    estimated_cost = Column(Integer, default=0)  # Store in cents to avoid float precision issues
    model = Column(String(255))
    provider = Column(String(100))
    
    # Image generation specific
    image_count = Column(Integer, default=0)
    tiles = Column(Integer, default=0)
    steps = Column(Integer, default=0)
    
    # Search specific
    search_count = Column(Integer, default=0)
    search_query = Column(Text, nullable=True)
    
    # Additional metadata
    usage_metadata = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User")
    post = relationship("GeneratedPost")


class LogLevel(str, enum.Enum):
    """Log levels for system logs"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class SystemLog(Base):
    """System logs for admin monitoring and debugging"""
    __tablename__ = "system_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Log metadata
    level = Column(SQLEnum(LogLevel), nullable=False, index=True)
    logger_name = Column(String(255), index=True)
    message = Column(Text, nullable=False)
    
    # Context
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    admin_id = Column(String(36), ForeignKey("admins.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Request context
    endpoint = Column(String(500), index=True)
    method = Column(String(10))
    ip_address = Column(String(45))
    user_agent = Column(Text)
    
    # Additional metadata
    extra_data = Column(JSON)
    stack_trace = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User")
    admin = relationship("Admin")

