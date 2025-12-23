-- Seed subscription plans if they don't exist
-- This script is safe to run multiple times

-- Delete existing plans (optional - comment out if you want to keep existing data)
-- DELETE FROM subscription_plan_configs;

-- Insert or update subscription plans
INSERT INTO subscription_plan_configs (id, plan_name, display_name, description, price_monthly, price_yearly, posts_limit, features, is_active, sort_order) VALUES
(UUID(), 'free', 'Free Plan', 'Perfect for getting started with LinkedIn content generation', 0, 0, 5, 
'["5 posts per month", "Basic AI generation", "Text-only posts", "Email support"]', TRUE, 1)
ON DUPLICATE KEY UPDATE 
    display_name = 'Free Plan',
    description = 'Perfect for getting started with LinkedIn content generation',
    price_monthly = 0,
    price_yearly = 0,
    posts_limit = 5,
    features = '["5 posts per month", "Basic AI generation", "Text-only posts", "Email support"]',
    is_active = TRUE,
    sort_order = 1;

INSERT INTO subscription_plan_configs (id, plan_name, display_name, description, price_monthly, price_yearly, posts_limit, features, is_active, sort_order) VALUES
(UUID(), 'pro', 'Pro Plan', 'For professionals who want to scale their LinkedIn presence', 2900, 29000, 50, 
'["50 posts per month", "Advanced AI generation", "All post formats (text, image, carousel, video)", "Priority support", "Custom writing style", "Analytics dashboard"]', TRUE, 2)
ON DUPLICATE KEY UPDATE 
    display_name = 'Pro Plan',
    description = 'For professionals who want to scale their LinkedIn presence',
    price_monthly = 2900,
    price_yearly = 29000,
    posts_limit = 50,
    features = '["50 posts per month", "Advanced AI generation", "All post formats (text, image, carousel, video)", "Priority support", "Custom writing style", "Analytics dashboard"]',
    is_active = TRUE,
    sort_order = 2;

INSERT INTO subscription_plan_configs (id, plan_name, display_name, description, price_monthly, price_yearly, posts_limit, features, is_active, sort_order) VALUES
(UUID(), 'agency', 'Agency Plan', 'For agencies managing multiple clients', 9900, 99000, 500, 
'["500 posts per month", "Premium AI generation", "All post formats", "Dedicated support", "Multi-user access", "White-label options", "API access", "Custom integrations"]', TRUE, 3)
ON DUPLICATE KEY UPDATE 
    display_name = 'Agency Plan',
    description = 'For agencies managing multiple clients',
    price_monthly = 9900,
    price_yearly = 99000,
    posts_limit = 500,
    features = '["500 posts per month", "Premium AI generation", "All post formats", "Dedicated support", "Multi-user access", "White-label options", "API access", "Custom integrations"]',
    is_active = TRUE,
    sort_order = 3;
