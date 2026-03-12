-- ============================================
-- DIAGNOSE UDDOKTAPAY PAYMENT ISSUES
-- Run these queries to find the problem
-- ============================================

-- Step 1: Check if payment_records table has required columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payment_records'
  AND column_name IN ('variant_id', 'package_id', 'invoice_id', 'user_id', 'type', 'amount', 'status')
ORDER BY ordinal_position;

-- Step 2: Check recent payment records to see if they're being created
SELECT 
  pr.id,
  pr.user_id,
  pr.type,
  pr.amount,
  pr.status,
  pr.invoice_id,
  pr.variant_id,
  pr.package_id,
  pr.created_at,
  o.status as order_status
FROM payment_records pr
LEFT JOIN orders o ON pr.order_id = o.id
ORDER BY pr.created_at DESC
LIMIT 10;

-- Step 3: Check if there are any failed payment attempts
SELECT 
  status,
  COUNT(*) as count,
  AVG(amount) as avg_amount
FROM payment_records
WHERE status IN ('pending', 'failed', 'cancelled')
GROUP BY status;

-- Step 4: Verify user has proper permissions to create payment records
-- Test insert (will be rolled back)
BEGIN;
INSERT INTO payment_records (user_id, type, amount, status)
VALUES (
  (SELECT user_id FROM auth.users LIMIT 1), -- Get first user for testing
  'product',
  100,
  'pending'
);
ROLLBACK; -- Don't actually save

-- If above fails, check RLS policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'payment_records';

-- Step 5: Check if edge function can access environment variables
-- This is logged in the function, so check Supabase Logs dashboard:
-- https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj/logs/explorer

-- Step 6: Verify assign_voucher_to_order function exists (needed for voucher products)
SELECT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'assign_voucher_to_order'
) as assign_voucher_exists;

-- Step 7: Check product_variants table structure (for variant_id support)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'product_variants'
ORDER BY ordinal_position;

-- Success check - should show all tables properly configured
SELECT 
  'payment_records' as table_name,
  COUNT(*) as records_count
FROM payment_records
UNION ALL
SELECT 'product_variants', COUNT(*) FROM product_variants
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
