DROP POLICY "Service role can manage" ON public.payment_records;
CREATE POLICY "Users can view own records" ON public.payment_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own records" ON public.payment_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
