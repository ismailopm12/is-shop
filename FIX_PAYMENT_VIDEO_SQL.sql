-- ✅ CORRECTED: Add video upload support for Add Money section
-- Fixed: Using app_role instead of is_admin
-- Created: March 14, 2026

-- Create table for payment method videos
CREATE TABLE IF NOT EXISTS public.payment_method_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_mb NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.payment_method_videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
ON public.payment_method_videos FOR SELECT
USING (true);

-- Allow authenticated users with admin role to insert/update/delete
-- FIXED: Using app_role = 'admin' instead of is_admin
CREATE POLICY "Allow admin full access"
ON public.payment_method_videos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.app_role = 'admin'
  )
);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_payment_videos_sort 
ON public.payment_method_videos(sort_order, created_at DESC);

-- Insert sample data
INSERT INTO public.payment_method_videos (title, description, video_url, is_active, sort_order)
VALUES 
  (
    'বিকাশে টাকা জমা দেওয়ার নিয়ম',
    'কিভাবে বিকাশ ব্যবহার করে আপনার ওয়ালেটে টাকা যোগ করবেন',
    '',
    true,
    1
  ),
  (
    'নগদে টাকা জমা দেওয়ার নিয়ম',
    'কিভাবে নগদ ব্যবহার করে আপনার ওয়ালেটে টাকা যোগ করবেন',
    '',
    true,
    2
  ),
  (
    'রকেট থেকে টাকা জমা দেওয়ার নিয়ম',
    'কিভাবে রকেট ব্যবহার করে দ্রুত টাকা যোগ করবেন',
    '',
    true,
    3
  );

-- Add function to get active videos
CREATE OR REPLACE FUNCTION public.get_payment_videos()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.title,
    v.description,
    v.video_url,
    v.thumbnail_url,
    v.duration_seconds,
    v.sort_order
  FROM public.payment_method_videos v
  WHERE v.is_active = true
  ORDER BY v.sort_order ASC, v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_payment_videos IS 'Returns all active payment method videos ordered by sort order';
