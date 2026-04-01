-- ============================================
-- FIX PRODUCTS LOAD FAILED ERROR
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create products table if not exists
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image text,
  image_url text,
  category text,
  category_id uuid,
  description text,
  is_active boolean DEFAULT true,
  is_voucher boolean DEFAULT false,
  user_info_fields jsonb,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create product_categories table if not exists
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Create product_variants table if not exists
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  name text,
  value text NOT NULL,
  price numeric NOT NULL,
  reward_coins integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Create diamond_packages table (legacy support)
CREATE TABLE IF NOT EXISTS public.diamond_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  name text,
  diamonds integer NOT NULL,
  price numeric NOT NULL,
  reward_coins integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_diamond_packages_product_id ON public.diamond_packages(product_id);

-- 6. Enable RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_packages ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products insertable by admins" ON public.products;
DROP POLICY IF EXISTS "Products updatable by admins" ON public.products;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.product_categories;
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Packages are viewable by everyone" ON public.diamond_packages;

-- 8. Create policies for public read access
CREATE POLICY "Products are viewable by everyone"
  ON public.products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Products insertable by admins"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Products updatable by admins"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Categories are viewable by everyone"
  ON public.product_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Variants are viewable by everyone"
  ON public.product_variants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Packages are viewable by everyone"
  ON public.diamond_packages
  FOR SELECT
  TO public
  USING (true);

-- 9. Insert sample data for testing
INSERT INTO public.product_categories (name, slug)
VALUES 
  ('FREE FIRE', 'free-fire'),
  ('PUBG', 'pubg'),
  ('Mobile Legends', 'mobile-legends')
ON CONFLICT (slug) DO NOTHING;

-- 10. Grant necessary permissions
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.product_categories TO authenticated;
GRANT ALL ON public.product_variants TO authenticated;
GRANT ALL ON public.diamond_packages TO authenticated;

-- ============================================
-- VERIFICATION QUERY
-- Run this after to check if tables exist
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('products', 'product_categories', 'product_variants', 'diamond_packages')
ORDER BY table_name;
