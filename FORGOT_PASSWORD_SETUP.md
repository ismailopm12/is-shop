# Forgot Password OTP Email Setup Guide

## Overview
The forgot password feature allows users to reset their password via email OTP verification.

## Features Implemented ✅

1. **Live Order Ticker** - Now shows FULL customer names (no masking)
2. **Forgot Password Flow**:
   - Step 1: Enter email address
   - Step 2: Receive 6-digit OTP via email
   - Step 3: Verify OTP (5-minute expiry)
   - Step 4: Set new password

## Setup Instructions

### 1. Run Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Execute the migration file
-- File: supabase/migrations/000_add_password_reset_otps.sql
```

Or copy and run the SQL from the migration file directly in Supabase Dashboard → SQL Editor.

### 2. Configure Email Service (Resend)

The Edge Function uses **Resend** to send emails. You need to:

#### A. Get Resend API Key
1. Go to https://resend.com
2. Sign up/Login
3. Create an API key from Dashboard
4. Copy your API key

#### B. Set Environment Variables

Edit `supabase/functions/send-password-reset-otp/.env`:

```env
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=your_verified_domain@resend.dev
```

For testing, you can use: `FROM_EMAIL=onboarding@resend.dev` (Resend's default)

#### C. Deploy Edge Function

Deploy the function to Supabase:

```bash
cd supabase/functions
supabase functions deploy send-password-reset-otp
```

### 3. Test the Feature

1. Go to `/forgot-password` page
2. Enter your registered email
3. Click "OTP পান" (Get OTP)
4. Check your email for the 6-digit code
5. Enter OTP and verify
6. Set new password

## Email Template Features

✅ Beautiful Bengali email template
✅ Professional gradient header
✅ Large, clear OTP display
✅ Expiry warning (5 minutes)
✅ Security warnings
✅ Branded footer

## How It Works

### Flow Diagram:
```
User clicks "Forgot Password"
    ↓
Enters email address
    ↓
System generates 6-digit OTP
    ↓
OTP stored in database (5 min expiry)
    ↓
Email sent via Resend
    ↓
User enters OTP
    ↓
System verifies OTP
    ↓
User sets new password
    ↓
Password updated in Supabase Auth
```

### Database Schema:
- Table: `password_reset_otps`
- Fields:
  - `id`: UUID primary key
  - `user_id`: Reference to auth.users
  - `email`: User's email
  - `otp_code`: 6-digit code
  - `expires_at`: 5 minutes from creation
  - `created_at`: Timestamp
  - `used`: Boolean flag

### Security Features:
✅ OTP expires after 5 minutes
✅ OTP deleted after successful use
✅ Can only update password for verified user
✅ Rate limiting via edge function
✅ RLS policies configured

## Troubleshooting

### Email not sending?
1. Check Resend API key is correct
2. Verify domain/email in Resend dashboard
3. Check Supabase logs: `supabase functions logs send-password-reset-otp`

### OTP not verifying?
1. Check `password_reset_otps` table exists
2. Verify OTP expiry time
3. Check console for errors

### Function deployment fails?
```bash
# Login to Supabase first
supabase login

# Link to your project
supabase link --project-ref nsrexmmxegueqacawpjj

# Redeploy
supabase functions deploy send-password-reset-otp
```

## Files Created/Modified

1. ✅ `src/components/LiveOrderTicker.tsx` - Shows full names
2. ✅ `src/pages/ForgotPassword.tsx` - Complete OTP flow (already existed)
3. ✅ `supabase/functions/send-password-reset-otp/index.ts` - Email sending function
4. ✅ `supabase/migrations/000_add_password_reset_otps.sql` - Database schema

## Next Steps

1. Run the SQL migration
2. Set up Resend account and get API key
3. Update `.env` file with Resend credentials
4. Deploy the edge function
5. Test with real email

## Support

If you encounter issues:
- Check Supabase logs for edge function errors
- Verify database table exists
- Test with a known working email address
