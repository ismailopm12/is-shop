-- ============================================
-- COIN SYSTEM FIX - Complete Implementation
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure coins column exists in profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- Step 2: Create coin_settings table if not exists
CREATE TABLE IF NOT EXISTS public.coin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_value NUMERIC NOT NULL DEFAULT 0.10,
  min_coin_usage INTEGER DEFAULT 100,
  max_discount_percent INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings if none exist
INSERT INTO public.coin_settings (coin_value, min_coin_usage, max_discount_percent) 
VALUES (0.10, 100, 50)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create coin_transactions table
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Admins can manage coin transactions" ON public.coin_transactions;

-- Users can view their own transactions
CREATE POLICY "Users can view own coin transactions" ON public.coin_transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all transactions
CREATE POLICY "Admins can manage coin transactions" ON public.coin_transactions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can read active coin settings
DROP POLICY IF EXISTS "Anyone can read coin settings" ON public.coin_settings;
CREATE POLICY "Anyone can read coin settings" ON public.coin_settings
FOR SELECT TO public
USING (is_active = true);

-- Admins can update coin settings
DROP POLICY IF EXISTS "Admins can update coin settings" ON public.coin_settings;
CREATE POLICY "Admins can update coin settings" ON public.coin_settings
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 4: Create spend_coins function
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
  -- Get current coins
  SELECT coins INTO current_coins FROM public.profiles WHERE user_id = _user_id FOR UPDATE;
  
  -- Check if enough coins
  IF current_coins < _amount THEN
    RETURN FALSE;
  END IF;
  
  -- Update profile coins
  UPDATE public.profiles 
  SET coins = coins - _amount
  WHERE user_id = _user_id;
  
  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (_user_id, -_amount, _transaction_type, _reference_id, _description);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create add_coins_to_user function
CREATE OR REPLACE FUNCTION public.add_coins_to_user(
  _user_id UUID,
  _amount INTEGER,
  _transaction_type TEXT,
  _reference_id UUID DEFAULT NULL,
  _description TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Update profile coins
  UPDATE public.profiles 
  SET coins = COALESCE(coins, 0) + _amount
  WHERE user_id = _user_id;
  
  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (_user_id, _amount, _transaction_type, _reference_id, _description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.spend_coins TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_coins_to_user TO authenticated;

-- Step 6: Add reward_coins to diamond_packages if not exists
ALTER TABLE public.diamond_packages 
ADD COLUMN IF NOT EXISTS reward_coins INTEGER DEFAULT 0;

-- Step 7: Add reward_coins to product_variants if not exists
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS reward_coins INTEGER DEFAULT 0;

-- Step 8: Verify setup
SELECT 
  'coin_settings' as table_name, 
  COUNT(*) as row_count 
FROM public.coin_settings
UNION ALL
SELECT 
  'coin_transactions', 
  COUNT(*) 
FROM public.coin_transactions
UNION ALL
SELECT 
  'profiles with coins', 
  COUNT(*) 
FROM public.profiles 
WHERE coins IS NOT NULL;

-- Test function calls (commented out - uncomment to test)
-- SELECT public.spend_coins('your-user-id-here', 100, 'test', null, 'Test transaction');
-- SELECT public.add_coins_to_user('your-user-id-here', 50, 'test_reward', null, 'Test reward');
