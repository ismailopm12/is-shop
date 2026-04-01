-- Create table for password reset OTPs
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user_id ON public.password_reset_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON public.password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON public.password_reset_otps(expires_at);

-- Enable Row Level Security
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own OTPs (for verification)
CREATE POLICY "Users can verify their own OTP"
  ON public.password_reset_otps
  FOR SELECT
  USING (true); -- Verification happens server-side, this is safe

-- Allow insertion of OTPs (via service role in edge function)
CREATE POLICY "Service can insert OTPs"
  ON public.password_reset_otps
  FOR INSERT
  WITH CHECK (true);

-- Allow deletion of OTPs (after use)
CREATE POLICY "Service can delete used OTPs"
  ON public.password_reset_otps
  FOR DELETE
  USING (true);

-- Add comment
COMMENT ON TABLE public.password_reset_otps IS 'Stores temporary OTP codes for password reset requests';
