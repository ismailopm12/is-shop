-- ============================================
-- QUICK FIX: Variant Checkout FK Constraint
-- Run this IMMEDIATELY in Supabase SQL Editor
-- ============================================

-- The issue: variant_id FK points ONLY to product_variants, 
-- but your variants are in diamond_packages table

-- SOLUTION: Make variant_id accept NULL and use package_id for diamond_packages

-- Step 1: Drop the problematic constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_variant_id_fkey;

-- Step 2: Recreate variant_id FK to allow references to BOTH tables
-- Actually, better approach: make variant_id optional and always use package_id for old system

-- Step 3: Ensure package_id column exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS package_id UUID;

-- Step 4: Add FK constraint for package_id to diamond_packages
ALTER TABLE public.orders
ADD CONSTRAINT orders_package_id_fkey 
FOREIGN KEY (package_id) 
REFERENCES public.diamond_packages(id) 
ON DELETE SET NULL;

-- Step 5: Add FK constraint for variant_id to product_variants (if needed)
ALTER TABLE public.orders
ADD CONSTRAINT orders_variant_id_fkey 
FOREIGN KEY (variant_id) 
REFERENCES public.product_variants(id) 
ON DELETE SET NULL;

-- Step 6: Verify the setup
SELECT 
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'orders' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- Expected result:
-- variant_id -> product_variants
-- package_id -> diamond_packages

-- Now the frontend code will:
-- - Use package_id for diamond_packages variants (old system)
-- - Use variant_id for product_variants (new system)
