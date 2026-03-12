-- ============================================
-- FIX VARIANT CHECKOUT ERROR - SQL Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current orders table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- Step 2: Check foreign key constraints on orders table
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

-- Step 3: Fix variant_id foreign key constraint
-- Drop old constraint if exists (might be pointing to wrong table)
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_variant_id_fkey;

-- Drop constraint with different name if exists
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS fk_orders_variant;

-- Create correct foreign key to product_variants
ALTER TABLE public.orders
ADD CONSTRAINT orders_variant_id_fkey 
FOREIGN KEY (variant_id) 
REFERENCES public.product_variants(id) 
ON DELETE SET NULL;

-- Also add FK to diamond_packages for backward compatibility
-- First add a separate column if needed
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS package_id UUID;

-- Add FK to diamond_packages
ALTER TABLE public.orders
ADD CONSTRAINT orders_package_id_fkey 
FOREIGN KEY (package_id) 
REFERENCES public.diamond_packages(id) 
ON DELETE SET NULL;

-- Step 4: Verify coin functions exist
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

-- Step 5: Ensure coin_transactions table exists
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

-- Step 6: Test the setup
SELECT 
  'Orders table columns' as test_name,
  COUNT(*) as result
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
UNION ALL
SELECT 
  'Coin functions',
  COUNT(*)
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('spend_coins', 'add_coins_to_user')
UNION ALL
SELECT 
  'FK constraints',
  COUNT(*)
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND constraint_type = 'FOREIGN KEY';
