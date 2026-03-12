-- ============================================
-- MANUAL FIX FOR WALLET/COIN ORDER COMPLETION
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure orders table has payment_method column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'wallet';

-- Step 2: Add comment to document payment methods
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method: wallet, coin, or instant';

-- Step 3: Update any existing pending wallet/coin orders to completed
UPDATE public.orders 
SET status = 'completed' 
WHERE payment_method IN ('wallet', 'coin') 
AND status = 'pending';

-- Step 4: Verify the changes
SELECT 
  id,
  product_name,
  amount,
  status,
  payment_method,
  created_at
FROM public.orders
WHERE payment_method IN ('wallet', 'coin')
ORDER BY created_at DESC
LIMIT 10;
