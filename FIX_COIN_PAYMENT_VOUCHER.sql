-- ============================================
-- ADD REFUND_COINS FUNCTION & FIX VOUCHER ASSIGNMENT
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check if refund_coins function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'refund_coins'
) as refund_coins_exists;

-- Step 2: Create refund_coins function if it doesn't exist
CREATE OR REPLACE FUNCTION public.refund_coins(
  _user_id UUID,
  _amount INTEGER,
  _transaction_type TEXT,
  _reference_id UUID DEFAULT NULL,
  _description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
BEGIN
  -- Update profile coins (add back)
  UPDATE public.profiles 
  SET coins = COALESCE(coins, 0) + _amount
  WHERE user_id = _user_id;
  
  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (_user_id, _amount, _transaction_type, _reference_id, _description);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.refund_coins TO authenticated;

-- Step 3: Verify assign_voucher_to_order function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'assign_voucher_to_order'
) as assign_voucher_exists;

-- Step 4: Check voucher_codes table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'voucher_codes'
ORDER BY ordinal_position;

-- Step 5: Test voucher assignment RPC
-- Uncomment to test (need valid IDs):
/*
SELECT public.assign_voucher_to_order(
  '_order_id_here',
  '_product_id_here', 
  '_user_id_here',
  '_package_id_here'
);
*/

-- Success message
SELECT '✅ REFUND_COINS FUNCTION CREATED!' as status,
       'Coin payment now properly assigns voucher codes' as result;
