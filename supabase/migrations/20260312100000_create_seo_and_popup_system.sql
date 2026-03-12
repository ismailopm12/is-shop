-- ============================================
-- SEO SETTINGS & POPUP MANAGER MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create seo_settings table
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT,
  site_description TEXT,
  site_keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  twitter_card TEXT DEFAULT 'summary_large_image',
  canonical_url TEXT,
  robots_meta TEXT DEFAULT 'index, follow',
  schema_markup JSONB,
  google_site_verification TEXT,
  facebook_app_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default SEO settings
INSERT INTO public.seo_settings (
  site_title, 
  site_description, 
  site_keywords,
  og_title,
  og_description
) VALUES (
  'BD Games Bazar - Your Trusted Digital Gaming Platform',
  'Top up Free Fire, buy vouchers, and get digital products at BD Games Bazar. Fast, secure, and reliable gaming platform with instant delivery.',
  'free fire topup, game recharge, digital products, vouchers, bd games, gaming platform',
  'BD Games Bazar - Premium Gaming Platform',
  'Instant game topups, digital products, and vouchers. Secure payments and fast delivery.'
) ON CONFLICT DO NOTHING;

-- Step 2: Create promotional_popups table
CREATE TABLE IF NOT EXISTS public.promotional_popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  media_url TEXT NOT NULL,
  media_alt TEXT,
  cta_text TEXT,
  cta_link TEXT,
  display_delay INTEGER DEFAULT 3000, -- milliseconds before showing
  display_frequency TEXT DEFAULT 'once_per_session', -- 'once_per_session', 'every_visit', 'once_per_day'
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_audience TEXT DEFAULT 'all', -- 'all', 'new_users', 'returning_users'
  priority INTEGER DEFAULT 1,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Create popup_analytics table
CREATE TABLE IF NOT EXISTS public.popup_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id UUID REFERENCES public.promotional_popups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'view', 'click', 'close'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view SEO settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Admins can manage SEO settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Anyone can view active popups" ON public.promotional_popups;
DROP POLICY IF EXISTS "Admins can manage popups" ON public.promotional_popups;
DROP POLICY IF EXISTS "Users can view own popup analytics" ON public.popup_analytics;
DROP POLICY IF EXISTS "Admins can manage popup analytics" ON public.popup_analytics;

-- SEO Settings Policies
CREATE POLICY "Anyone can view SEO settings" ON public.seo_settings
FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can manage SEO settings" ON public.seo_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Popup Policies
CREATE POLICY "Anyone can view active popups" ON public.promotional_popups
FOR SELECT TO public
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);

CREATE POLICY "Admins can manage popups" ON public.promotional_popups
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Popup Analytics Policies
CREATE POLICY "Users can view own popup analytics" ON public.popup_analytics
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage popup analytics" ON public.popup_analytics
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 4: Create function to track popup views
CREATE OR REPLACE FUNCTION public.track_popup_event(
  _popup_id UUID,
  _event_type TEXT,
  _metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.popup_analytics (popup_id, user_id, event_type, metadata)
  VALUES (_popup_id, auth.uid(), _event_type, _metadata);
  
  -- Update counters
  IF _event_type = 'view' THEN
    UPDATE public.promotional_popups 
    SET views_count = views_count + 1 
    WHERE id = _popup_id;
  ELSIF _event_type = 'click' THEN
    UPDATE public.promotional_popups 
    SET clicks_count = clicks_count + 1 
    WHERE id = _popup_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.track_popup_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_popup_event TO anon;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_popups_active_dates ON public.promotional_popups(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_popup_analytics_popup ON public.popup_analytics(popup_id);
CREATE INDEX IF NOT EXISTS idx_popup_analytics_user ON public.popup_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_popup_analytics_event ON public.popup_analytics(event_type);

-- Step 6: Verify setup
SELECT 
  'seo_settings' as table_name,
  COUNT(*) as row_count
FROM public.seo_settings
UNION ALL
SELECT 
  'promotional_popups',
  COUNT(*)
FROM public.promotional_popups
UNION ALL
SELECT 
  'popup_analytics',
  COUNT(*)
FROM public.popup_analytics;
