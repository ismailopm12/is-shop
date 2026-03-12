-- Direct SQL to create product_variants table if it doesn't exist
-- Run this in your Supabase SQL Editor at: https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj/sql

-- Step 1: Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  price NUMERIC NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;

-- Anyone can read active variants
CREATE POLICY "Anyone can read active variants" ON public.product_variants
FOR SELECT USING (is_active = true);

-- Admins can manage variants
CREATE POLICY "Admins can manage variants" ON public.product_variants
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 2: Migrate existing diamond_packages to product_variants
INSERT INTO public.product_variants (id, product_id, name, value, price, sort_order, is_active, reward_coins)
SELECT 
  dp.id,
  dp.product_id,
  'Diamond Package' as name,
  dp.diamonds::TEXT || ' Diamonds' as value,
  dp.price,
  dp.sort_order,
  dp.is_active,
  0 as reward_coins
FROM public.diamond_packages dp
ON CONFLICT (id) DO NOTHING;

-- Step 3: Add variant_id columns to related tables
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id);
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id);
ALTER TABLE public.voucher_codes ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id);

-- Step 4: Create coin_settings table
CREATE TABLE IF NOT EXISTS public.coin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_value NUMERIC NOT NULL DEFAULT 0.10,
  min_coin_usage INTEGER DEFAULT 100,
  max_discount_percent INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default coin settings
INSERT INTO public.coin_settings (coin_value, min_coin_usage, max_discount_percent) 
VALUES (0.10, 100, 50)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create coin_transactions table
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
DROP POLICY IF EXISTS "Anyone can read coin settings" ON public.coin_settings;
DROP POLICY IF EXISTS "Admins can update coin settings" ON public.coin_settings;

-- Users can view their own transactions
CREATE POLICY "Users can view own coin transactions" ON public.coin_transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all transactions
CREATE POLICY "Admins can manage coin transactions" ON public.coin_transactions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can read coin settings
CREATE POLICY "Anyone can read coin settings" ON public.coin_settings
FOR SELECT TO public
USING (is_active = true);

-- Admins can update coin settings
CREATE POLICY "Admins can update coin settings" ON public.coin_settings
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 6: Ensure coins column exists in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- Step 7: Create helper functions
CREATE OR REPLACE FUNCTION public.add_coins_to_user(
  _user_id UUID,
  _amount INTEGER,
  _transaction_type TEXT,
  _reference_id UUID DEFAULT NULL,
  _description TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  current_coins INTEGER;
BEGIN
  -- Get current coins
  SELECT coins INTO current_coins FROM public.profiles WHERE user_id = _user_id FOR UPDATE;
  
  -- Update profile coins
  UPDATE public.profiles 
  SET coins = COALESCE(coins, 0) + _amount
  WHERE user_id = _user_id;
  
  -- Log transaction
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (_user_id, _amount, _transaction_type, _reference_id, _description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_coins_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_coins TO authenticated;
