-- ============================================
-- FINAL VARIANT CHECKOUT FIX - RUN NOW
-- This fixes the product variant checkout error
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Verify product_variants table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'product_variants'
) as product_variants_exists;

-- Step 2: Check current orders table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- Step 3: Check all foreign key constraints on orders table
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'orders'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Step 4: Drop ALL existing variant_id constraints
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_variant_id_fkey;

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS fk_orders_variant;

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_variant_id_fkey1;

-- Step 5: Recreate variant_id FK to product_variants with explicit type casting
ALTER TABLE public.orders
ADD CONSTRAINT orders_variant_id_fkey 
FOREIGN KEY (variant_id) 
REFERENCES public.product_variants(id) 
ON DELETE SET NULL;

-- Step 6: Ensure package_id column exists for diamond_packages backward compatibility
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'package_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN package_id UUID;
  END IF;
END $$;

-- Step 7: Add FK to diamond_packages for backward compatibility
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_package_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_package_id_fkey 
FOREIGN KEY (package_id) 
REFERENCES public.diamond_packages(id) 
ON DELETE SET NULL;

-- Step 8: Verify the constraints were created successfully
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'orders'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;

-- Step 9: Test insert with variant_id (simulate what the app does)
-- Uncomment below to test (you'll need a valid variant_id from your database)
-- INSERT INTO public.orders (user_id, product_name, package_info, amount, status, payment_method, variant_id)
-- VALUES (
--   (SELECT user_id FROM public.profiles LIMIT 1), -- Get first user for testing
--   'Test Product',
--   'Test Package',
--   100,
--   'pending',
--   'wallet',
--   (SELECT id FROM public.product_variants LIMIT 1) -- Get first variant for testing
-- );

-- Step 10: Success message
SELECT '✅ VARIANT CHECKOUT FIX COMPLETE!' as status,
       'Foreign key constraints have been properly set up' as message,
       'variant_id -> product_variants(id)' as variant_fk,
       'package_id -> diamond_packages(id)' as package_fk;
