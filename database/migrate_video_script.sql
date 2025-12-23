-- Migration script to add 'video_script' to the format ENUM in generated_posts table
-- Run this if you already have an existing database

USE linkedin_content_saas;

-- Alter the ENUM to include 'video_script'
-- Note: MySQL requires recreating the column to modify ENUM values
ALTER TABLE generated_posts 
MODIFY COLUMN format ENUM('text', 'carousel', 'image', 'video', 'video_script') DEFAULT 'text';

SELECT 'Video script format migration completed successfully!' as status;

