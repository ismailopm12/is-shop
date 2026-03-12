-- Add missing columns to orders table for coin payment support
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.diamond_packages(id);

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'wallet';

-- Add comment to document the column
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method: wallet, coin, or instant';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_variant_id ON public.orders(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
