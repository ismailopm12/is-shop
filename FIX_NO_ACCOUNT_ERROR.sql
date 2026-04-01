-- Quick Fix for "No Account Found" Error in Forgot Password
-- Run this in Supabase SQL Editor to check and fix user accounts

-- 1. Check if password_reset_otps table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'password_reset_otps'
) AS table_exists;

-- 2. If table doesn't exist, create it (run the migration first)
-- Copy and paste from: supabase/migrations/000_add_password_reset_otps.sql

-- 3. Check which users exist in auth but not in profiles
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at,
  p.user_id as profile_user_id,
  CASE 
    WHEN p.user_id IS NULL THEN 'Missing Profile'
    ELSE 'Has Profile'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY au.created_at DESC;

-- 4. Create missing profiles for users without them
INSERT INTO profiles (user_id, display_name, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)) as display_name,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 5. Verify all users now have profiles
SELECT 
  COUNT(DISTINCT au.id) as total_auth_users,
  COUNT(DISTINCT p.user_id) as users_with_profiles,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT p.user_id) as missing_profiles
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id;

-- 6. Test: Check if a specific email exists (replace with test email)
SELECT 
  au.email,
  au.id as auth_id,
  p.user_id as profile_id,
  p.display_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'test@example.com'; -- Replace with actual email to test

-- ℹ️ After running this:
-- 1. All auth users will have profiles
-- 2. Forgot password will work for all registered users
-- 3. The error "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট নেই" will only show for truly non-existent accounts
