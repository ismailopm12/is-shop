-- ============================================
-- DEVELOPER & API MANAGEMENT SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create api_settings table
CREATE TABLE IF NOT EXISTS public.api_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  endpoint_url TEXT NOT NULL,
  region TEXT DEFAULT 'SG',
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active API settings" ON public.api_settings;
DROP POLICY IF EXISTS "Admins can manage API settings" ON public.api_settings;

-- Anyone can read active API settings
CREATE POLICY "Anyone can read active API settings" ON public.api_settings
FOR SELECT TO public
USING (is_active = true);

-- Admins can manage API settings
CREATE POLICY "Admins can manage API settings" ON public.api_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default player verification API
INSERT INTO public.api_settings (name, endpoint_url, region, description, is_active) VALUES
('player_verification', 'https://api.freefirecommunity.com/player', 'SG', 
 'Player UID verification API - Free Fire Community', true)
ON CONFLICT (name) DO UPDATE SET
  endpoint_url = EXCLUDED.endpoint_url,
  region = EXCLUDED.region,
  description = EXCLUDED.description,
  updated_at = now();

-- Step 2: Create developers table
CREATE TABLE IF NOT EXISTS public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Developer',
  image_url TEXT,
  bio TEXT,
  email TEXT,
  phone TEXT,
  facebook_url TEXT,
  whatsapp_url TEXT,
  telegram_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active developers" ON public.developers;
DROP POLICY IF EXISTS "Admins can manage developers" ON public.developers;

-- Anyone can read active developers
CREATE POLICY "Anyone can read active developers" ON public.developers
FOR SELECT TO public
USING (is_active = true);

-- Admins can manage developers
CREATE POLICY "Admins can manage developers" ON public.developers
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_developers_sort_order ON public.developers(sort_order);
CREATE INDEX IF NOT EXISTS idx_api_settings_name ON public.api_settings(name);

-- Insert default developer (Ismail)
INSERT INTO public.developers (name, role, bio, is_active, sort_order) VALUES
('Ismail', 'Lead Developer', 'Full-stack developer specializing in web applications and mobile solutions', true, 1)
ON CONFLICT DO NOTHING;

-- Step 3: Create social_links table for footer buttons
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT 'link',
  button_color TEXT DEFAULT 'primary',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active social links" ON public.social_links;
DROP POLICY IF EXISTS "Admins can manage social links" ON public.social_links;

-- Anyone can read active social links
CREATE POLICY "Anyone can read active social links" ON public.social_links
FOR SELECT TO public
USING (is_active = true);

-- Admins can manage social links
CREATE POLICY "Admins can manage social links" ON public.social_links
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default social links
INSERT INTO public.social_links (platform, display_name, url, icon, button_color, sort_order) VALUES
('telegram', 'Join Telegram', 'https://t.me/yourchannel', 'send', 'blue', 1),
('whatsapp', 'Follow WhatsApp', 'https://wa.me/yournumber', 'message-circle', 'green', 2)
ON CONFLICT (platform) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  url = EXCLUDED.url,
  updated_at = now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_social_links_sort_order ON public.social_links(sort_order);

-- Step 4: Verify installation
SELECT 'API Settings:' as info, COUNT(*) as count FROM public.api_settings
UNION ALL
SELECT 'Developers:', COUNT(*) FROM public.developers
UNION ALL
SELECT 'Social Links:', COUNT(*) FROM public.social_links;
