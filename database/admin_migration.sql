-- Admin system migration
-- Add admin authentication and subscription plan configuration tables

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription plan configurations table
CREATE TABLE IF NOT EXISTS subscription_plan_configs (
    id VARCHAR(36) PRIMARY KEY,
    plan_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    price_monthly INT DEFAULT 0,
    price_yearly INT DEFAULT 0,
    posts_limit INT DEFAULT 5,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_plan_name (plan_name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default subscription plans
INSERT INTO subscription_plan_configs (id, plan_name, display_name, description, price_monthly, price_yearly, posts_limit, features, sort_order) VALUES
(UUID(), 'free', 'Free Plan', 'Perfect for getting started with LinkedIn content generation', 0, 0, 5, 
'["5 posts per month", "Basic AI generation", "Text-only posts", "Email support"]', 1),

(UUID(), 'pro', 'Pro Plan', 'For professionals who want to scale their LinkedIn presence', 2900, 29000, 50, 
'["50 posts per month", "Advanced AI generation", "All post formats (text, image, carousel, video)", "Priority support", "Custom writing style", "Analytics dashboard"]', 2),

(UUID(), 'agency', 'Agency Plan', 'For agencies managing multiple clients', 9900, 99000, 500, 
'["500 posts per month", "Premium AI generation", "All post formats", "Dedicated support", "Multi-user access", "White-label options", "API access", "Custom integrations"]', 3);

-- Create default super admin (password: Admin@123456)
-- Password hash generated with bcrypt
INSERT INTO admins (id, email, password_hash, name, role, is_active) VALUES
(UUID(), 'admin@linkedincontent.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqgDzuTxqK', 'Super Admin', 'super_admin', TRUE);
