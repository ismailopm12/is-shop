
-- Site settings key-value store
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings
CREATE POLICY "Anyone can read site settings" ON public.site_settings
FOR SELECT USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage site settings" ON public.site_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add description to products
ALTER TABLE public.products ADD COLUMN description TEXT DEFAULT '';

-- Seed default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'GAMES BAZAR'),
  ('site_tagline', 'মুহূর্তেই টপআপ'),
  ('announcement_text', 'টপআপ করুন ২৪ ঘন্টা । যেকোনো প্রয়োজনে আমাদের সাপোর্টে যোগাযোগ করুন'),
  ('announcement_active', 'true'),
  ('footer_phone', '09613827683'),
  ('footer_email', 'bdgamesbazar.net@gmail.com'),
  ('footer_copyright', '© 2026 BD Games Bazar All rights reserved.'),
  ('footer_developer', 'FR Nahin'),
  ('footer_complaint_text', 'ওয়েবসাইটে কোন সমস্যা থাকলে এখানে অভিযোগ জানাতে পারে।'),
  ('social_telegram', '#'),
  ('social_whatsapp', '#'),
  ('social_facebook', '#'),
  ('social_youtube', '#'),
  ('logo_url', '');
