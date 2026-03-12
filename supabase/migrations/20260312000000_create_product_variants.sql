-- Create product_variants table for flexible variants (text or number)
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Anyone can read active variants
CREATE POLICY "Anyone can read active variants" ON public.product_variants
FOR SELECT USING (is_active = true);

-- Admins can manage variants
CREATE POLICY "Admins can manage variants" ON public.product_variants
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migrate existing diamond_packages data to product_variants
DO $$
DECLARE
  pkg RECORD;
BEGIN
  FOR pkg IN 
    SELECT dp.id, dp.product_id, dp.diamonds, dp.price, dp.sort_order, dp.is_active
    FROM public.diamond_packages dp
  LOOP
    INSERT INTO public.product_variants (id, product_id, name, value, price, sort_order, is_active)
    VALUES (
      pkg.id,
      pkg.product_id,
      'Diamond Package',
      pkg.diamonds::TEXT || ' Diamonds',
      pkg.price,
      pkg.sort_order,
      pkg.is_active
    );
  END LOOP;
END $$;

-- Add variant_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id);

-- Add variant_id to payment_records
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id);

-- Add variant_id to voucher_codes
ALTER TABLE public.voucher_codes ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id);
