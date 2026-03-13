-- ============================================
-- COMPLETE FIX - CATEGORY & USER INFO SYSTEM
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- PART 1: CREATE PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.product_categories;

-- Anyone can read active categories
CREATE POLICY "Anyone can read active categories" ON public.product_categories
FOR SELECT TO public
USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON public.product_categories
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.product_categories (name, slug, description, icon, sort_order) VALUES
  ('Free Fire', 'free-fire', 'Free Fire game topups and vouchers', '🔥', 1),
  ('SMM Services', 'smm-services', 'Social Media Marketing services', '📱', 2),
  ('Digital Products', 'digital-products', 'Themes, plugins, and digital files', '💻', 3)
ON CONFLICT (slug) DO NOTHING;

-- PART 2: ADD USER INFO FIELDS TO PRODUCTS
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS user_info_fields TEXT[] DEFAULT '{}';

-- PART 3: ADD CATEGORY_ID TO PRODUCTS
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id);

-- Update existing products with default category
UPDATE public.products p
SET category_id = (SELECT id FROM public.product_categories WHERE slug = 'free-fire' LIMIT 1)
WHERE p.category_id IS NULL 
  AND (p.category ILIKE '%free fire%' OR p.category ILIKE '%game%');

-- PART 4: ADD WHATSAPP TO PROFILES
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '';

-- PART 5: UPDATE DEFAULT USER INFO FIELDS
-- Set Game UID for Free Fire products
UPDATE public.products
SET user_info_fields = ARRAY['game_uid']
WHERE category ILIKE '%free fire%' OR category ILIKE '%game%';

-- Set email for voucher products
UPDATE public.products
SET user_info_fields = ARRAY['email']
WHERE is_voucher = true AND (user_info_fields IS NULL OR user_info_fields = '{}');

-- PART 6: CREATE HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.get_product_user_info_fields(_product_slug TEXT)
RETURNS TEXT[] AS $$
DECLARE
  fields TEXT[];
BEGIN
  SELECT user_info_fields INTO fields
  FROM public.products
  WHERE slug = _product_slug
  LIMIT 1;
  
  RETURN COALESCE(fields, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 7: CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_user_info_fields ON public.products USING GIN(user_info_fields);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- PART 8: VERIFY INSTALLATION
SELECT 
  c.name as category_name,
  c.icon,
  COUNT(DISTINCT p.id) as product_count,
  COUNT(DISTINCT pv.id) as variant_count
FROM public.product_categories c
LEFT JOIN public.products p ON p.category_id = c.id
LEFT JOIN public.product_variants pv ON pv.product_id = p.id AND pv.is_active = true
GROUP BY c.id, c.name, c.icon, c.sort_order
ORDER BY c.sort_order;

-- Show products with their user info fields
SELECT 
  p.name as product_name,
  pc.name as category_name,
  p.user_info_fields,
  p.is_voucher
FROM public.products p
LEFT JOIN public.product_categories pc ON p.category_id = pc.id
ORDER BY p.created_at DESC;
