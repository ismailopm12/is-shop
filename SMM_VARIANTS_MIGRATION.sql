-- ============================================
-- SMM PRODUCTS VARIANTS SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create smm_variants table
CREATE TABLE IF NOT EXISTS public.smm_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.smm_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER NOT NULL DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smm_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active SMM variants" ON public.smm_variants;
DROP POLICY IF EXISTS "Admins can manage SMM variants" ON public.smm_variants;

-- Anyone can read active SMM variants
CREATE POLICY "Anyone can read active SMM variants" ON public.smm_variants
FOR SELECT TO public
USING (is_active = true);

-- Admins can manage SMM variants
CREATE POLICY "Admins can manage SMM variants" ON public.smm_variants
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_smm_variants_product_id ON public.smm_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_smm_variants_price ON public.smm_variants(price);

-- Step 3: Verify installation
SELECT 
  p.name as product_name,
  COUNT(v.id) as variant_count,
  COALESCE(MIN(v.price), 0) as min_price,
  COALESCE(MAX(v.price), 0) as max_price
FROM public.smm_products p
LEFT JOIN public.smm_variants v ON v.product_id = p.id AND v.is_active = true
GROUP BY p.id, p.name
ORDER BY p.sort_order, p.name;
