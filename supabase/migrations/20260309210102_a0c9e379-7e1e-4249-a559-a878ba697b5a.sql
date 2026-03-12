
-- Hero banners table for multiple sliding banners
CREATE TABLE public.hero_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.hero_banners
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage banners" ON public.hero_banners
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add page content settings (video_tutorial_url, contact_us, privacy_policy, faq, terms_of_service)
INSERT INTO public.site_settings (key, value) VALUES
  ('video_tutorial_url', ''),
  ('page_contact_us', 'আমাদের সাথে যোগাযোগ করুন।'),
  ('page_privacy_policy', 'আমাদের প্রাইভেসি পলিসি এখানে।'),
  ('page_faq', 'প্রায়শই জিজ্ঞাসিত প্রশ্নাবলী।'),
  ('page_terms', 'শর্তাবলী এখানে।')
ON CONFLICT DO NOTHING;
