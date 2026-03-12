-- Add coin-related columns to existing tables
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS reward_coins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- Create coin_settings table for global coin configuration
CREATE TABLE IF NOT EXISTS public.coin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin_value NUMERIC NOT NULL DEFAULT 1, -- 1 coin = X taka
  min_coin_usage INTEGER DEFAULT 100, -- Minimum coins required to use at checkout
  max_discount_percent INTEGER DEFAULT 50, -- Maximum discount percentage using coins
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default coin settings
INSERT INTO public.coin_settings (coin_value, min_coin_usage, max_discount_percent) 
VALUES (0.10, 100, 50)
ON CONFLICT DO NOTHING;

-- Create coin_transactions table for tracking coin history
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for earned, negative for spent
  transaction_type TEXT NOT NULL, -- 'purchase_reward', 'checkout_used', 'admin_adjustment', 'refund'
  reference_id UUID, -- Reference to order/payment
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

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

-- Function to add coins to user
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

-- Function to spend coins
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
