-- ✅ WhatsApp Settings Table for UltraMsg Integration
-- Admins can manage API credentials from admin panel
-- Created: March 14, 2026

-- Create whatsapp_settings table
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_provider TEXT DEFAULT 'ultramsg',
  instance_id TEXT,
  api_token TEXT,
  admin_number TEXT,
  sender_number TEXT,
  is_enabled BOOLEAN DEFAULT true,
  send_to_user BOOLEAN DEFAULT true,
  send_to_admin BOOLEAN DEFAULT true,
  message_template_user TEXT DEFAULT '✅ অর্ডার কনফার্মেশন!

আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।

অর্ডার ID: {order_id}
পরিমাণ: ৳{amount}
সময়: {date}

ধন্যবাদ!',
  message_template_admin TEXT DEFAULT '🔔 নতুন অর্ডার!

গ্রাহক: {customer_name}
অর্ডার ID: {order_id}
পরিমাণ: ৳{amount}
সময়: {date}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated read access"
ON public.whatsapp_settings FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow admins to manage settings
CREATE POLICY "Allow admin full access"
ON public.whatsapp_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default settings if not exists
INSERT INTO public.whatsapp_settings (
  api_provider,
  instance_id,
  api_token,
  admin_number,
  is_enabled,
  send_to_user,
  send_to_admin
)
SELECT 
  'ultramsg',
  NULL,
  NULL,
  '+8801XXXXXXXXX',
  true,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.whatsapp_settings LIMIT 1
);

-- Create function to get WhatsApp settings
CREATE OR REPLACE FUNCTION public.get_whatsapp_settings()
RETURNS TABLE (
  id UUID,
  api_provider TEXT,
  instance_id TEXT,
  api_token TEXT,
  admin_number TEXT,
  sender_number TEXT,
  is_enabled BOOLEAN,
  send_to_user BOOLEAN,
  send_to_admin BOOLEAN,
  message_template_user TEXT,
  message_template_admin TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.api_provider,
    s.instance_id,
    s.api_token,
    s.admin_number,
    s.sender_number,
    s.is_enabled,
    s.send_to_user,
    s.send_to_admin,
    s.message_template_user,
    s.message_template_admin
  FROM public.whatsapp_settings s
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_whatsapp_settings IS 'Returns WhatsApp settings for authenticated users';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_updated 
ON public.whatsapp_settings(updated_at DESC);
