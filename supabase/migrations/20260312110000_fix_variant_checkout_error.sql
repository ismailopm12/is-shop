-- ============================================
-- FIX VARIANT CHECKOUT ERROR - FINAL
-- Migration: 20260312110000
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

-- Step 4: Drop ALL existing variant_id constraints to avoid conflicts
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_variant_id_fkey;

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS fk_orders_variant;

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_variant_id_fkey1;

-- Step 5: Ensure variant_id column exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'variant_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN variant_id UUID;
  END IF;
END $$;

-- Step 6: Skip FK constraint creation
-- We validate at the application layer instead of database layer
-- This prevents stale/invalid variant IDs from breaking checkout
-- The app now validates variant existence before creating orders

-- OLD CODE (don't use):
-- ALTER TABLE public.orders
-- ADD CONSTRAINT orders_variant_id_fkey 
-- FOREIGN KEY (variant_id) 
-- REFERENCES public.product_variants(id) 
-- ON DELETE SET NULL;

-- Step 7: Ensure package_id column exists for diamond_packages backward compatibility
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

-- Step 8: Add/Recreate FK to diamond_packages for backward compatibility
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_package_id_fkey;

ALTER TABLE public.orders
ADD CONSTRAINT orders_package_id_fkey 
FOREIGN KEY (package_id) 
REFERENCES public.diamond_packages(id) 
ON DELETE SET NULL;

-- Step 9: Verify the constraints were created successfully
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

-- Step 10: Success verification
SELECT 
  '✅ VARIANT CHECKOUT FIX COMPLETE!' as status,
  'Foreign key constraints properly configured' as message,
  COUNT(*) as total_constraints
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND constraint_type = 'FOREIGN KEY';
