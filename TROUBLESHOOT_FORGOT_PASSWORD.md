# 🔧 Forgot Password "Try Again" Error - Quick Fix Guide

## ❌ Problem
When entering Gmail address, it shows "সমস্যা হয়েছে। আবার চেষ্টা করুন।" (Try again) error.

## ✅ Root Causes & Solutions

### **Cause 1: Database Table Doesn't Exist**
The `password_reset_otps` table hasn't been created yet.

**Fix:**
```sql
-- Run this in Supabase SQL Editor first!
-- File: supabase/migrations/000_add_password_reset_otps.sql
```

Copy and paste the entire content of `supabase/migrations/000_add_password_reset_otps.sql` into Supabase SQL Editor and run it.

### **Cause 2: Edge Function Not Deployed**
The email sending function isn't deployed to Supabase.

**Check:**
```bash
# In terminal, check if function exists
supabase functions list
```

**Deploy:**
```bash
cd supabase/functions
supabase functions deploy send-password-reset-otp
```

### **Cause 3: Email Service Not Configured**
Resend API key is missing or invalid.

**Fix:**
1. Go to https://resend.com
2. Get your API key
3. Edit `supabase/functions/send-password-reset-otp/.env`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   FROM_EMAIL=onboarding@resend.dev
   ```

## 🧪 Step-by-Step Testing

### **Step 1: Verify Database Table Exists**
Run in Supabase SQL Editor:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'password_reset_otps'
) AS table_exists;
```
Should return: `true`

### **Step 2: Check Your Email in Auth**
Verify your Gmail is registered:
```sql
SELECT email, id, created_at 
FROM auth.users 
WHERE email = 'your.email@gmail.com';
```

### **Step 3: Test Forgot Password Flow**

1. **Open browser console** (F12)
2. Go to `/forgot-password`
3. Enter your Gmail address
4. Click "OTP পান"
5. **Watch console for errors**

Expected console output:
```
✅ Auth error: (none)
✅ User exists!
✅ OTP generated: 123456
✅ OTP saved to database
✅ Email sent successfully
```

Common errors to watch for:
```
❌ "relation password_reset_otps does not exist"
   → Run the SQL migration first!

❌ "Function not found"
   → Deploy the edge function!

❌ "Invalid Resend API key"
   → Check .env configuration!

❌ "User not found"
   → This email isn't registered in Supabase Auth
```

## 🎯 Quick Debug Commands

### Check if user exists:
```sql
SELECT email FROM auth.users WHERE email = 'your.email@gmail.com';
```

### Check table exists:
```sql
\d password_reset_otps
```

### Manual test insert:
```sql
INSERT INTO password_reset_otps (user_id, email, otp_code, expires_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your.email@gmail.com'),
  'your.email@gmail.com',
  '123456',
  NOW() + INTERVAL '5 minutes'
);
```

## 📋 Complete Setup Checklist

- [ ] Run SQL migration (`000_add_password_reset_otps.sql`)
- [ ] Get Resend API key from https://resend.com
- [ ] Configure `.env` file with Resend credentials
- [ ] Deploy edge function: `supabase functions deploy send-password-reset-otp`
- [ ] Test with real Gmail address
- [ ] Check browser console for errors
- [ ] Verify email arrives in inbox

## 🚨 Still Not Working?

### Enable Detailed Logging:

Edit `src/pages/ForgotPassword.tsx` line 42:
```typescript
console.error("Auth error:", otpError);
// Change to:
console.error("Auth error FULL:", {
  error: otpError,
  message: otpError?.message,
  status: otpError?.status,
  details: otpError
});
```

### Check Supabase Logs:
```bash
supabase functions logs send-password-reset-otp
```

## ✅ Expected Behavior

When everything works correctly:
1. ✅ Enter Gmail → No immediate error
2. ✅ Click "OTP পান" → Shows "OTP ইমেইলে পাঠানো হয়েছে!"
3. ✅ Check email → See beautiful Bengali email with OTP
4. ✅ Enter OTP → Verified successfully
5. ✅ Set new password → Password reset complete!

## 💡 Pro Tips

- **Test emails go to spam?** Add your sender email to contacts
- **Using Resend sandbox?** Emails go to `onboarding@resend.dev` instead
- **Need production emails?** Verify your domain in Resend dashboard
- **Want to skip email setup for testing?** Comment out line 80-90 temporarily

---

**Website URL:** http://localhost:5174/  
**Forgot Password:** http://localhost:5174/forgot-password
