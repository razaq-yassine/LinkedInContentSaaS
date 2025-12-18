-- Migration script to add LinkedIn OAuth fields to existing database
-- Run this if you already have an existing database

USE linkedin_content_saas;

-- Add LinkedIn OAuth columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS linkedin_access_token TEXT AFTER account_type,
ADD COLUMN IF NOT EXISTS linkedin_refresh_token TEXT AFTER linkedin_access_token,
ADD COLUMN IF NOT EXISTS linkedin_token_expires_at TIMESTAMP NULL AFTER linkedin_refresh_token,
ADD COLUMN IF NOT EXISTS linkedin_profile_data JSON AFTER linkedin_token_expires_at,
ADD COLUMN IF NOT EXISTS linkedin_connected BOOLEAN DEFAULT FALSE AFTER linkedin_profile_data,
ADD COLUMN IF NOT EXISTS linkedin_last_sync TIMESTAMP NULL AFTER linkedin_connected;

-- Add index for linkedin_connected
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_linkedin_connected (linkedin_connected);

SELECT 'LinkedIn OAuth migration completed successfully!' as status;
