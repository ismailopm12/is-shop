-- 🔐 Google OAuth Authentication Setup
-- Run this in Supabase SQL Editor to prepare your database for Google OAuth users

-- =====================================================
-- 1. Ensure profiles table can handle OAuth users
-- =====================================================

-- Add columns if they don't exist (for OAuth metadata)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_id TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON public.profiles(google_id);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON public.profiles(provider);

-- =====================================================
-- 2. Create trigger to auto-create profile on signup
-- =====================================================

-- Function to create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url, provider, google_id, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    COALESCE(NEW.app_metadata->>'provider', 'google'),
    NEW.raw_user_meta_data->>'provider_id',
    (NEW.email_confirmed_at IS NOT NULL)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_oauth_user();

-- =====================================================
-- 3. Update Row Level Security (RLS) policies
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated users to view other users' profiles (for order display)
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 4. Create helper function to get current user profile
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  balance NUMERIC,
  coins NUMERIC,
  phone TEXT,
  provider TEXT,
  google_id TEXT,
  email_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.display_name,
    p.avatar_url,
    p.balance,
    p.coins,
    p.phone,
    p.provider,
    p.google_id,
    p.email_verified
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Grant necessary permissions
-- =====================================================

-- Allow authenticated users to insert their own profile
GRANT INSERT ON public.profiles TO authenticated;

-- Ensure service role can manage all profiles
GRANT ALL ON public.profiles TO service_role;

-- =====================================================
-- 6. Create view for admin user management
-- =====================================================

CREATE OR REPLACE VIEW public.admin_user_view AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as joined_date,
  u.last_sign_in_at,
  p.display_name,
  p.avatar_url,
  p.balance,
  p.coins,
  p.phone,
  p.provider,
  p.google_id,
  CASE 
    WHEN p.google_id IS NOT NULL THEN 'Google OAuth'
    WHEN p.provider = 'email' THEN 'Email/Password'
    ELSE 'Other'
  END as auth_method,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.amount), 0) as total_spent
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.orders o ON u.id = o.user_id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, p.*
ORDER BY u.created_at DESC;

-- Grant access to authenticated users (admins)
GRANT SELECT ON public.admin_user_view TO authenticated;

-- =====================================================
-- 7. Add useful indexes for performance
-- =====================================================

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);

-- Index for last sign in
CREATE INDEX IF NOT EXISTS idx_users_last_sign_in ON auth.users(last_sign_in_at);

-- Composite index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_balance ON public.profiles(user_id, balance);

-- =====================================================
-- 8. Create function to count users by provider
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_auth_stats()
RETURNS TABLE (
  total_users BIGINT,
  google_users BIGINT,
  email_users BIGINT,
  verified_users BIGINT,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_users,
    COUNT(*) FILTER (WHERE p.google_id IS NOT NULL)::BIGINT as google_users,
    COUNT(*) FILTER (WHERE p.provider = 'email')::BIGINT as email_users,
    COUNT(*) FILTER (WHERE p.email_verified = true)::BIGINT as verified_users,
    COUNT(*) FILTER (WHERE u.last_sign_in_at > NOW() - INTERVAL '30 days')::BIGINT as active_users
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ✅ Setup Complete!
-- =====================================================

-- Verify setup by running:
-- SELECT * FROM public.get_auth_stats();
