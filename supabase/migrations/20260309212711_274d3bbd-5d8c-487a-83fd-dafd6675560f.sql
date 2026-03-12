
-- Allow admins to update payment_records (for approve/reject)
CREATE POLICY "Admins can update payment records"
ON public.payment_records
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all payment records
CREATE POLICY "Admins can view all payment records"
ON public.payment_records
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
