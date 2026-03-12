
-- Diamond packages table
CREATE TABLE public.diamond_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  diamonds INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diamond_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can read active packages
CREATE POLICY "Anyone can read active packages" ON public.diamond_packages
FOR SELECT USING (is_active = true);

-- Admins can manage packages
CREATE POLICY "Admins can manage packages" ON public.diamond_packages
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add banner_url to site_settings
INSERT INTO public.site_settings (key, value) VALUES
  ('banner_url', '')
ON CONFLICT (key) DO NOTHING;

-- Seed diamond packages for existing products
DO $$
DECLARE
  uid_topup_id UUID;
BEGIN
  SELECT id INTO uid_topup_id FROM public.products WHERE slug = 'uid-topup' LIMIT 1;
  IF uid_topup_id IS NOT NULL THEN
    INSERT INTO public.diamond_packages (product_id, diamonds, price, sort_order) VALUES
      (uid_topup_id, 25, 22, 1),
      (uid_topup_id, 50, 38, 2),
      (uid_topup_id, 115, 77, 3),
      (uid_topup_id, 240, 153, 4),
      (uid_topup_id, 355, 230, 5),
      (uid_topup_id, 480, 305, 6),
      (uid_topup_id, 505, 327, 7),
      (uid_topup_id, 610, 390, 8),
      (uid_topup_id, 725, 460, 9),
      (uid_topup_id, 850, 540, 10),
      (uid_topup_id, 1015, 655, 11),
      (uid_topup_id, 1090, 700, 12),
      (uid_topup_id, 1240, 760, 13),
      (uid_topup_id, 1480, 925, 14),
      (uid_topup_id, 1595, 1000, 15),
      (uid_topup_id, 1850, 1160, 16);
  END IF;
END $$;

-- Add image_url column to products for external image URLs
ALTER TABLE public.products ADD COLUMN image_url TEXT DEFAULT '';
