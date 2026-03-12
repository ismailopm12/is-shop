
-- Voucher codes table
CREATE TABLE public.voucher_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available',
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voucher_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage all voucher codes
CREATE POLICY "Admins can manage voucher codes" ON public.voucher_codes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own assigned voucher codes
CREATE POLICY "Users can view own voucher codes" ON public.voucher_codes
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Add voucher_code_id to orders for linking
ALTER TABLE public.orders ADD COLUMN voucher_code_id UUID REFERENCES public.voucher_codes(id);

-- Add is_voucher flag to products to distinguish voucher products
ALTER TABLE public.products ADD COLUMN is_voucher BOOLEAN NOT NULL DEFAULT false;

-- Edge function will handle assigning voucher on order completion
-- For now we create a DB function to assign voucher code
CREATE OR REPLACE FUNCTION public.assign_voucher_to_order(_order_id UUID, _product_id UUID, _user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _voucher_id UUID;
  _voucher_code TEXT;
BEGIN
  -- Find an available voucher code for this product
  SELECT id, code INTO _voucher_id, _voucher_code
  FROM public.voucher_codes
  WHERE product_id = _product_id AND status = 'available'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF _voucher_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Assign the voucher
  UPDATE public.voucher_codes
  SET user_id = _user_id, order_id = _order_id, status = 'assigned', assigned_at = now()
  WHERE id = _voucher_id;

  -- Link voucher to order
  UPDATE public.orders
  SET voucher_code_id = _voucher_id
  WHERE id = _order_id;

  RETURN _voucher_code;
END;
$$;
