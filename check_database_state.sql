-- ============================================
-- DIAGNOSTIC QUERY - Check Database State
-- Run this to see what's wrong
-- ============================================

-- 1. Check orders table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Check FK constraints on orders table
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
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'orders'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Check if coin functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('spend_coins', 'add_coins_to_user');

-- 4. Check coin_transactions table
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'coin_transactions'
) as coin_transactions_exists;

-- 5. Sample variant from diamond_packages
SELECT id, diamonds, price, name, product_id, is_active
FROM diamond_packages 
LIMIT 1;

-- 6. Sample variant from product_variants
SELECT id, value, price, name, product_id, is_active
FROM product_variants 
LIMIT 1;

-- 7. Count variants in each table
SELECT 
  'diamond_packages' as table_name,
  COUNT(*) as count
FROM diamond_packages
UNION ALL
SELECT 
  'product_variants' as table_name,
  COUNT(*) as count
FROM product_variants;

-- 8. Check coin_settings
SELECT * FROM coin_settings LIMIT 1;
