-- ============================================
-- COMPLETE FIX - Run This NOW in Supabase
-- ============================================

-- Step 1: Remove ALL existing FK constraints on orders table
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_variant_id_fkey;

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_package_id_fkey;

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS fk_orders_variant;

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS fk_orders_package;

-- Step 2: Ensure both columns exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS variant_id UUID;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS package_id UUID;

-- Step 3: Create FK to diamond_packages (for old system)
ALTER TABLE public.orders
ADD CONSTRAINT orders_package_id_fkey 
FOREIGN KEY (package_id) 
REFERENCES public.diamond_packages(id) 
ON DELETE SET NULL;

-- Step 4: Create FK to product_variants (for new system)
ALTER TABLE public.orders
ADD CONSTRAINT orders_variant_id_fkey 
FOREIGN KEY (variant_id) 
REFERENCES public.product_variants(id) 
ON DELETE SET NULL;

-- Step 5: Create coin functions (if they don't exist)
CREATE OR REPLACE FUNCTION public.spend_coins(
  _user_id UUID,
  _amount INTEGER,
  _transaction_type TEXT,
  _reference_id UUID DEFAULT NULL,
  _description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  current_coins INTEGER;
BEGIN
  SELECT coins INTO current_coins FROM public.profiles WHERE user_id = _user_id FOR UPDATE;
  
  IF current_coins < _amount THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.profiles 
  SET coins = coins - _amount
  WHERE user_id = _user_id;
  
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (_user_id, -_amount, _transaction_type, _reference_id, _description);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_coins_to_user(
  _user_id UUID,
  _amount INTEGER,
  _transaction_type TEXT,
  _reference_id UUID DEFAULT NULL,
  _description TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET coins = COALESCE(coins, 0) + _amount
  WHERE user_id = _user_id;
  
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (_user_id, _amount, _transaction_type, _reference_id, _description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.spend_coins TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_coins_to_user TO authenticated;

-- Step 6: Ensure coin_transactions table exists
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
DROP POLICY IF EXISTS "Users can view own coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Admins can manage coin transactions" ON public.coin_transactions;

CREATE POLICY "Users can view own coin transactions" ON public.coin_transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage coin transactions" ON public.coin_transactions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 7: Verify everything is set up correctly
SELECT 
  'FK Constraints' as check_type,
  COUNT(*) as result
FROM information_schema.table_constraints
WHERE table_name = 'orders' 
  AND constraint_type = 'FOREIGN KEY'
UNION ALL
SELECT 
  'Coin Functions',
  COUNT(*)
FROM information_schema.routines 
WHERE routine_name IN ('spend_coins', 'add_coins_to_user')
UNION ALL
SELECT 
  'Coin Transactions Table',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'coin_transactions'
  ) THEN 1 ELSE 0 END;

-- Should return:
-- FK Constraints | 2
-- Coin Functions | 2
-- Coin Transactions Table | 1
