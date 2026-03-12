
-- SMM Products table
CREATE TABLE public.smm_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'SMM',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER NOT NULL DEFAULT 10000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.smm_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active smm products" ON public.smm_products
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage smm products" ON public.smm_products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SMM Orders table
CREATE TABLE public.smm_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  smm_product_id UUID NOT NULL REFERENCES public.smm_products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  target_link TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.smm_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create smm orders" ON public.smm_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own smm orders" ON public.smm_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all smm orders" ON public.smm_orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update smm orders" ON public.smm_orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow public SELECT on orders for live ticker (anonymous)
CREATE POLICY "Anyone can read orders for ticker" ON public.orders
  FOR SELECT TO public USING (true);
