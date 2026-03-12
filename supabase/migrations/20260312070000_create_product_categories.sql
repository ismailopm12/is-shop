-- ============================================
-- CATEGORY MANAGEMENT SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create product_categories table
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

-- Step 2: Insert default categories
INSERT INTO public.product_categories (name, slug, description, icon, sort_order) VALUES
  ('Free Fire', 'free-fire', 'Free Fire game topups and vouchers', '🔥', 1),
  ('SMM Services', 'smm-services', 'Social Media Marketing services', '📱', 2),
  ('Digital Products', 'digital-products', 'Themes, plugins, and digital files', '💻', 3)
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Add category_id to products table (if not exists)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id);

-- Step 4: Update existing products with default category
UPDATE public.products p
SET category_id = (SELECT id FROM public.product_categories WHERE slug = 'free-fire')
WHERE p.category_id IS NULL;

-- Step 5: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- Step 6: Verify data
SELECT 
  c.name as category_name,
  COUNT(p.id) as product_count,
  COUNT(DISTINCT pv.id) as variant_count
FROM public.product_categories c
LEFT JOIN public.products p ON p.category_id = c.id
LEFT JOIN public.product_variants pv ON pv.product_id = p.id AND pv.is_active = true
GROUP BY c.id, c.name, c.sort_order
ORDER BY c.sort_order;
