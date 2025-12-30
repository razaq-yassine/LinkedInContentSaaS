from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, LargeBinary, JSON, Enum as SQLEnum
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
    PRO = "pro"
    AGENCY = "agency"

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

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    plan = Column(SQLEnum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    posts_this_month = Column(Integer, default=0)
    posts_limit = Column(Integer, default=5)
    
    # Stripe integration (for future)
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    period_end = Column(DateTime)
    
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
    posts_limit = Column(Integer, default=5)
    features = Column(JSON)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

