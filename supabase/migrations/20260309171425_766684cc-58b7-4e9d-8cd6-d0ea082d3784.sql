CREATE TABLE public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'product',
  order_id uuid,
  product_id uuid,
  is_voucher boolean DEFAULT false,
  invoice_id text,
  status text DEFAULT 'pending',
  amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage" ON public.payment_records FOR ALL USING (true) WITH CHECK (true);
