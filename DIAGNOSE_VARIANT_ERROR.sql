-- ============================================
-- DIAGNOSE VARIANT CHECKOUT ERROR
-- Run these queries to find the issue
-- ============================================

-- Step 1: Check what variants actually exist
SELECT id, name, value, price, product_id, is_active 
FROM public.product_variants 
ORDER BY created_at DESC;

-- Step 2: Check if the problematic variant ID exists
SELECT EXISTS (
  SELECT 1 FROM public.product_variants 
  WHERE id = 'fed22629-1945-4327-8a56-ad2b0d42b918'
) as variant_exists;

-- Step 3: Check what products exist and their relationship
SELECT 
  p.id as product_id,
  p.name as product_name,
  pv.id as variant_id,
  pv.value as variant_value,
  pv.price as variant_price
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true
ORDER BY p.name, pv.value;

-- Step 4: Check if there are any orders with this variant_id already
SELECT 
  o.id,
  o.product_name,
  o.variant_id,
  o.status,
  o.created_at
FROM orders o
WHERE o.variant_id IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- Step 5: Verify the FK constraint is pointing to correct table
SELECT
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'orders' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'variant_id';

-- Step 6: Check diamond_packages (old system) to see if variant might be there instead
SELECT id, 'diamond_packages' as source_table, diamonds as value, price, product_id
FROM diamond_packages
WHERE id = 'fed22629-1945-4327-8a56-ad2b0d42b918';
