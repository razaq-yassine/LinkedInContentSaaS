-- Create database
CREATE DATABASE IF NOT EXISTS linkedin_content_saas;
USE linkedin_content_saas;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    linkedin_id VARCHAR(255) UNIQUE,
    account_type ENUM('person', 'business') DEFAULT 'person',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_linkedin (linkedin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(36) PRIMARY KEY,
    cv_filename VARCHAR(255),
    cv_data MEDIUMBLOB,
    cv_text TEXT,
    profile_md TEXT,
    context_json JSON,
    writing_samples JSON,
    writing_style_md TEXT,
    custom_instructions TEXT,
    preferences JSON,
    onboarding_step TINYINT DEFAULT 1,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FULLTEXT INDEX ft_profile (profile_md, writing_style_md)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversation messages table (stores both user and AI messages)
CREATE TABLE IF NOT EXISTS conversation_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    post_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES generated_posts(id) ON DELETE SET NULL,
    INDEX idx_conversation_created (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generated posts table
CREATE TABLE IF NOT EXISTS generated_posts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    conversation_id VARCHAR(36),
    topic VARCHAR(500),
    content TEXT NOT NULL,
    format ENUM('text', 'carousel', 'image', 'video') DEFAULT 'text',
    generation_options JSON,
    attachments JSON,
    user_edited_content TEXT,
    user_rating TINYINT,
    published_to_linkedin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_conversation (conversation_id),
    FULLTEXT INDEX ft_content (content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generated images table (stores AI-generated images for posts)
CREATE TABLE IF NOT EXISTS generated_images (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    image_data TEXT NOT NULL,  -- Base64 encoded image
    prompt TEXT NOT NULL,
    model VARCHAR(255),
    image_metadata JSON,  -- Renamed from metadata to avoid SQLAlchemy conflict
    is_current BOOLEAN DEFAULT FALSE,  -- Mark current image for post
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES generated_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id),
    INDEX idx_post_current (post_id, is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generated PDFs table (stores AI-generated PDFs for carousel posts)
CREATE TABLE IF NOT EXISTS generated_pdfs (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    pdf_data TEXT NOT NULL,  -- Base64 encoded PDF
    slide_images JSON,  -- Array of base64 slide images for preview
    slide_count INT NOT NULL,
    prompts JSON NOT NULL,  -- Array of prompts used for each slide
    model VARCHAR(255),
    pdf_metadata JSON,
    is_current BOOLEAN DEFAULT FALSE,  -- Mark current PDF for post
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES generated_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id),
    INDEX idx_post_current (post_id, is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generated comments table
CREATE TABLE IF NOT EXISTS generated_comments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    original_post_screenshot VARCHAR(500),
    original_post_text TEXT,
    worthiness_score TINYINT,
    worthiness_reasoning TEXT,
    recommendation VARCHAR(20),
    content TEXT,
    user_edited_content TEXT,
    user_rating TINYINT,
    published_to_linkedin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    user_id VARCHAR(36) PRIMARY KEY,
    plan ENUM('free', 'pro', 'agency') DEFAULT 'free',
    posts_this_month INT DEFAULT 0,
    posts_limit INT DEFAULT 5,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    period_end TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id VARCHAR(36) PRIMARY KEY,
    `key` VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed admin settings with AI rules
INSERT INTO admin_settings (id, `key`, value, description) VALUES
(UUID(), 'system_prompt', 'You are a LinkedIn content generation specialist. Your role is to help create authentic, high-quality LinkedIn posts and comments.

## Primary Rules:
- **NEVER** generate generic LinkedIn content
- **ALWAYS** match the person\'s authentic writing style
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
- **NEVER make generic comments** - quality over quantity', 'Core AI system prompt for content generation'),

(UUID(), 'content_format_guidelines', '## Content Format Variety (CRITICAL):
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
- Demos/how-tos → Suggest VIDEO or CAROUSEL', 'Content format distribution and selection guidelines'),

(UUID(), 'comment_worthiness_rubric', '## Comment Worthiness Evaluation (24-point scale):

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
- 0-11: SKIP - Not worth it', 'Rubric for evaluating whether to comment on a post'),

(UUID(), 'default_preferences', '{
  "post_type_distribution": {
    "text_only": 40,
    "text_with_image": 30,
    "carousel": 25,
    "video": 5
  },
  "content_mix": {
    "best_practices": 35,
    "technical_tutorials": 25,
    "career_advice": 15,
    "industry_trends": 15,
    "personal_journey": 10
  },
  "tone": "professional_yet_accessible",
  "hashtag_count": 4,
  "emoji_usage": "minimal",
  "sentence_max_length": 15,
  "hook_style": "data_driven"
}', 'Default user preferences for content generation'),

(UUID(), 'trending_topics', '["AI and automation in business", "Remote work best practices", "Career growth strategies", "Leadership lessons", "Industry-specific technical updates", "Productivity tips", "Workplace culture", "Professional development", "Tech trends", "Data-driven insights"]', 'Sample trending topics for suggestions');


