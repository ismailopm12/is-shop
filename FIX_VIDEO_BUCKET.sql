-- Fix for "Bucket not found" error in Add Money video tutorial
-- This script ensures the video_tutorial_url is set to a valid YouTube embed URL

-- First, check current value
SELECT * FROM site_settings WHERE key = 'video_tutorial_url';

-- If the current URL is pointing to a Supabase Storage bucket that doesn't exist,
-- update it to a proper YouTube embed URL

-- Option 1: Update to a default YouTube video (replace VIDEO_ID with your video ID)
UPDATE site_settings 
SET value = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
WHERE key = 'video_tutorial_url' 
AND (value LIKE '%supabase.co/storage%' OR value = '' OR value IS NULL);

-- Option 2: If you have a specific YouTube tutorial, replace YOUR_VIDEO_ID below
-- UPDATE site_settings 
-- SET value = 'https://www.youtube.com/embed/YOUR_VIDEO_ID'
-- WHERE key = 'video_tutorial_url';

-- Verify the update
SELECT * FROM site_settings WHERE key = 'video_tutorial_url';

-- Common YouTube URL formats that work:
-- ✅ https://www.youtube.com/embed/VIDEO_ID
-- ✅ https://www.youtube-nocookie.com/embed/VIDEO_ID
-- ❌ https://www.youtube.com/watch?v=VIDEO_ID (won't work in iframe)
-- ❌ https://youtu.be/VIDEO_ID (needs conversion to embed format)
