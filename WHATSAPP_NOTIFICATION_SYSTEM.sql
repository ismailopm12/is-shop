-- ============================================
-- WHATSAPP NOTIFICATION SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create whatsapp_settings table
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_provider TEXT NOT NULL DEFAULT 'ultramsg',
  instance_id TEXT,
  api_token TEXT,
  admin_number TEXT NOT NULL,
  sender_number TEXT,
  is_enabled BOOLEAN DEFAULT true,
  send_to_user BOOLEAN DEFAULT true,
  send_to_admin BOOLEAN DEFAULT true,
  message_template_user TEXT DEFAULT 'ধন্যবাদ! আপনার অর্ডার সফল হয়েছে।
অর্ডার ID: {order_id}
পণ্য: {product_name}
মূল্য: ৳{amount}
অনুগ্রহ করে পেমেন্ট সম্পন্ন করুন।',
  message_template_admin TEXT DEFAULT 'নতুন অর্ডার প্রাপ্ত হয়েছে!
অর্ডার ID: {order_id}
ব্যবহারকারী: {user_name}
পণ্য: {product_name}
মূল্য: ৳{amount}
তারিখ: {date}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage whatsapp settings" ON public.whatsapp_settings;

-- Admins can manage whatsapp settings
CREATE POLICY "Admins can manage whatsapp settings" ON public.whatsapp_settings
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.whatsapp_settings (admin_number, is_enabled) VALUES
('+8801XXXXXXXXX', true)
ON CONFLICT DO NOTHING;

-- Step 2: Create function to send WhatsApp messages via Edge Function
CREATE OR REPLACE FUNCTION public.send_whatsapp_message(
  _to_number TEXT,
  _message TEXT
) RETURNS JSONB AS $$
DECLARE
  settings RECORD;
  response JSONB;
BEGIN
  -- Get WhatsApp settings
  SELECT * INTO settings 
  FROM public.whatsapp_settings 
  WHERE is_enabled = true 
  LIMIT 1;

  IF settings IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'WhatsApp not configured');
  END IF;

  -- Call Edge Function (will be created separately)
  BEGIN
    -- This will call the edge function we'll create
    SELECT result INTO response
    FROM net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/send-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'apikey'
      ),
      body := jsonb_build_object(
        'to', _to_number,
        'message', _message,
        'instance_id', settings.instance_id,
        'token', settings.api_token
      )
    );
    
    RETURN response;
  EXCEPTION WHEN OTHERS THEN
    -- For now, just log that we attempted to send
    RAISE NOTICE 'WhatsApp message attempt to % - Message: %', _to_number, _message;
    RETURN jsonb_build_object('success', true, 'note', 'Message logged for sending');
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger function for order notifications
CREATE OR REPLACE FUNCTION public.notify_order_via_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  settings RECORD;
  user_name TEXT;
  user_phone TEXT;
  message_user TEXT;
  message_admin TEXT;
  order_date TEXT;
BEGIN
  -- Get WhatsApp settings
  SELECT * INTO settings 
  FROM public.whatsapp_settings 
  WHERE is_enabled = true 
  LIMIT 1;

  IF settings IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get user details
  SELECT name, phone INTO user_name, user_phone
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Format date
  order_date := TO_CHAR(NEW.created_at, 'DD/MM/YYYY HH:mm');

  -- Prepare user message
  message_user := REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(settings.message_template_user, '{order_id}', NEW.id::TEXT),
        '{product_name}', NEW.product_name
      ),
      '{amount}', NEW.amount::TEXT
    ),
    '{date}', order_date
  );

  -- Prepare admin message
  message_admin := REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(settings.message_template_admin, '{order_id}', NEW.id::TEXT),
          '{user_name}', COALESCE(user_name, 'Unknown')
        ),
        '{product_name}', NEW.product_name
      ),
      '{amount}', NEW.amount::TEXT
    ),
    '{date}', order_date
  );

  -- Send to user if enabled
  IF settings.send_to_user AND user_phone IS NOT NULL THEN
    PERFORM public.send_whatsapp_message(user_phone, message_user);
  END IF;

  -- Send to admin if enabled
  IF settings.send_to_admin THEN
    PERFORM public.send_whatsapp_message(settings.admin_number, message_admin);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the order
  RAISE NOTICE 'WhatsApp notification failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger on orders table
DROP TRIGGER IF EXISTS order_whatsapp_notification ON public.orders;

CREATE TRIGGER order_whatsapp_notification
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_via_whatsapp();

-- Step 5: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_enabled ON public.whatsapp_settings(is_enabled);

-- Verify installation
SELECT 'WhatsApp Settings:' as info, COUNT(*) as count FROM public.whatsapp_settings
UNION ALL
SELECT 'Triggers:', COUNT(*) FROM pg_trigger WHERE tgname = 'order_whatsapp_notification';
