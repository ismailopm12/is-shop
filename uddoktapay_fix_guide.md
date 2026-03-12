# Uddokta Pay Payment Error Fix Guide

## Problem
Error message: "পেমেন্ট তৈরি করতে সমস্যা হয়েছে।" (Payment creation failed)

## Root Cause
The UddoktaPay API key is not configured in your Supabase Edge Functions environment variables.

## Solution Steps

### 1. Get Your UddoktaPay API Key
- Login to your UddoktaPay dashboard at: https://gamesbazarnet.paymently.io
- Go to Settings → API Keys
- Copy your API key

### 2. Configure Supabase Edge Function Secrets

Run this command in your terminal to set the API key:

```bash
npx supabase functions serve --env-file .env
```

OR deploy with the secret:

```bash
npx supabase secrets set UDDOKTAPAY_API_KEY=your_api_key_here
```

**Example:**
```bash
npx supabase secrets set UDDOKTAPAY_API_KEY=sk_test_abc123xyz789
```

### 3. Verify Environment Variable

In your Supabase Dashboard:
1. Go to **Edge Functions** → **Secrets**
2. Check if `UDDOKTAPAY_API_KEY` exists
3. If not, add it with your API key value

### 4. Test Payment Flow

After setting the API key:

1. **Test Product Purchase:**
   - Go to any product page
   - Select a variant
   - Enter Player UID
   - Choose "Instant Pay" (UddoktaPay)
   - Click "অর্ডার করুন"

2. **Check Console Logs:**
   - Open browser DevTools (F12)
   - Look for these logs:
     ```
     Creating payment with data: {...}
     Payment function response: {...}
     ```

3. **Expected Behavior:**
   - Should redirect to UddoktaPay payment page
   - No error messages
   - Smooth payment flow

## Debugging

### Check Function Logs

```bash
npx supabase functions logs create-payment
npx supabase functions logs verify-payment
```

### Common Errors

**Error: "Payment gateway configuration error"**
- ✅ Fix: Set UDDOKTAPAY_API_KEY secret

**Error: "Payment gateway error"**
- ✅ Check UddoktaPay API key is correct
- ✅ Verify UddoktaPay account is active

**Error: HTTP 401/403**
- ✅ API key is invalid or expired
- ✅ Contact UddoktaPay support

**Error: HTTP 500**
- ✅ Check UddoktaPay service status
- ✅ Verify webhook URL is accessible

## Enhanced Error Messages

The code now shows specific error messages:

1. **Before:** Generic "পেমেন্ট তৈরি করতে সমস্যা হয়েছে।"
2. **After:** Shows actual error from payment gateway

Example errors:
- "Payment gateway configuration error: API key missing"
- "Payment gateway error: Invalid API key"
- "Payment gateway error: HTTP 401 Unauthorized"

## Testing Checklist

- [ ] UDDOKTAPAY_API_KEY is set in Supabase secrets
- [ ] API key is valid and active
- [ ] Edge functions are deployed
- [ ] Browser console shows no errors
- [ ] Can redirect to UddoktaPay payment page
- [ ] Payment callback works correctly
- [ ] Orders are created successfully

## Files Modified

All payment-related files now have enhanced error logging:

1. ✅ `src/pages/ProductDetail.tsx` - Product purchases
2. ✅ `src/pages/AddMoney.tsx` - Wallet deposits
3. ✅ `src/pages/DigitalProductDetail.tsx` - Digital products
4. ✅ `supabase/functions/create-payment/index.ts` - Payment creation
5. ✅ `supabase/functions/verify-payment/index.ts` - Payment verification

## Quick Fix Command

Copy and run this (replace with your actual API key):

```bash
npx supabase secrets set UDDOKTAPAY_API_KEY=your_actual_api_key_from_uddoktapay
```

Then redeploy functions:

```bash
npx supabase functions deploy create-payment
npx supabase functions deploy verify-payment
```

## Support

If issues persist:
1. Check UddoktaPay dashboard for account status
2. Verify API key permissions
3. Contact UddoktaPay support for API issues
4. Check Supabase function logs for detailed errors

---

**Status**: ✅ Enhanced error handling implemented
**Next**: Set UDDOKTAPAY_API_KEY secret to fix payment errors
