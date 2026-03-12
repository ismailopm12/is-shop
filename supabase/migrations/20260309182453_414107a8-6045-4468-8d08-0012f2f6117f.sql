
ALTER TABLE public.voucher_codes ADD COLUMN package_id uuid REFERENCES public.diamond_packages(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.assign_voucher_to_order(_order_id uuid, _product_id uuid, _user_id uuid, _package_id uuid DEFAULT NULL)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _voucher_id UUID;
  _voucher_code TEXT;
BEGIN
  IF _package_id IS NOT NULL THEN
    SELECT id, code INTO _voucher_id, _voucher_code
    FROM public.voucher_codes
    WHERE product_id = _product_id AND package_id = _package_id AND status = 'available'
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  ELSE
    SELECT id, code INTO _voucher_id, _voucher_code
    FROM public.voucher_codes
    WHERE product_id = _product_id AND status = 'available'
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  IF _voucher_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.voucher_codes
  SET user_id = _user_id, order_id = _order_id, status = 'assigned', assigned_at = now()
  WHERE id = _voucher_id;

  UPDATE public.orders
  SET voucher_code_id = _voucher_id
  WHERE id = _order_id;

  RETURN _voucher_code;
END;
$function$;
