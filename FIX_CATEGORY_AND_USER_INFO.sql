-- ============================================
-- FIX PRODUCT CATEGORY & USER INFO FIELDS
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add user_info_fields column to products table
-- This allows admin to specify what info to collect from users
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS user_info_fields TEXT[] DEFAULT '{}';

-- Step 2: Add phone field to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '';

-- Step 3: Update existing products with default user_info_fields
-- Set Game UID for Free Fire products
UPDATE public.products
SET user_info_fields = ARRAY['game_uid']
WHERE category ILIKE '%free fire%' OR category ILIKE '%game%';

-- Set email for voucher products
UPDATE public.products
SET user_info_fields = ARRAY['email']
WHERE is_voucher = true AND (user_info_fields IS NULL OR user_info_fields = '{}');

-- Step 4: Add category_id column if not exists
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id);

-- Step 5: Update existing products with default category_id
UPDATE public.products p
SET category_id = (
  SELECT id FROM public.product_categories 
  WHERE slug = 'free-fire' 
  LIMIT 1
)
WHERE p.category_id IS NULL 
  AND (p.category ILIKE '%free fire%' OR p.category ILIKE '%game%');

-- Step 6: Create function to get user info fields by product slug
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

-- Step 7: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_user_info_fields ON public.products USING GIN(user_info_fields);

-- Step 8: Verify the changes
SELECT 
  p.name,
  p.category,
  pc.name as category_name,
  p.user_info_fields,
  p.is_voucher
FROM public.products p
LEFT JOIN public.product_categories pc ON p.category_id = pc.id
ORDER BY p.created_at DESC;
