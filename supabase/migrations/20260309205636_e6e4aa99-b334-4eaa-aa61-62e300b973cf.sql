
-- Digital products table
CREATE TABLE public.digital_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'THEMES',
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  file_type TEXT DEFAULT 'zip',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Digital purchases table
CREATE TABLE public.digital_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  digital_product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for digital_products
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active digital products" ON public.digital_products
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage digital products" ON public.digital_products
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS for digital_purchases
ALTER TABLE public.digital_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.digital_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.digital_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" ON public.digital_purchases
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for digital files
INSERT INTO storage.buckets (id, name, public) VALUES ('digital-files', 'digital-files', false);

-- Storage policies: only admin can upload, authenticated purchasers can download
CREATE POLICY "Admins can upload digital files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'digital-files' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update digital files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'digital-files' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete digital files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'digital-files' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read digital files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'digital-files');

-- Updated_at trigger
CREATE TRIGGER update_digital_products_updated_at
  BEFORE UPDATE ON public.digital_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
