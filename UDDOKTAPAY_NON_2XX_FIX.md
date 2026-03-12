# 🔧 Fix: Edge Function Non-2xx Status Code Error

## Error Message
```
Edge Function returned a non-2xx status code
```

Or more specific errors in console:
```
Edge function invocation error: {
  name: "FunctionsHttpError",
  message: "Edge Function returned a non-2xx status code"
}
```

## What This Means

A **non-2xx status code** means the `create-payment` edge function encountered an error and returned:
- **500** - Internal server error (most common)
- **401** - Unauthorized
- **400** - Bad request
- **503** - Service unavailable

## Common Causes & Solutions

### Cause 1: Missing Environment Variables ✅ MOST COMMON

**Symptoms:** Function returns 500 immediately

**Check Supabase Logs:**
1. Go to: **Supabase Dashboard → Edge Functions → Logs**
2. Look for error like: `"UDDOKTAPAY_API_KEY is not set"`

**Solution:**

The `.env` file in `supabase/functions` is NOT automatically loaded. You need to set secrets in Supabase dashboard:

**Method 1: Via Dashboard**
```bash
# Go to: https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj/functions/secrets
# Add these secrets:
UDDOKTAPAY_API_KEY=VDEUkEE1ByktFymDc4TfSsy6CPUs3SOyCZFxhvIZ
SUPABASE_URL=https://nsrexmmxegueqacawpjj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Method 2: Via CLI**
```bash
cd supabase/functions
npx supabase secrets set UDDOKTAPAY_API_KEY=VDEUkEE1ByktFymDc4TfSsy6CPUs3SOyCZFxhvIZ
npx supabase secrets set SUPABASE_URL=https://nsrexmmxegueqacawpjj.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

---

### Cause 2: Database Schema Issues

**Symptoms:** Order creation fails with database error

**Run Diagnostic SQL:**
```sql
-- Check if orders table has required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name IN ('variant_id', 'package_id')
ORDER BY ordinal_position;
```

**Fix if columns missing:**
```sql
-- Add missing columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS variant_id UUID,
ADD COLUMN IF NOT EXISTS package_id UUID;

-- Drop old FK constraints that might cause issues
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_variant_id_fkey;

-- Don't add FK constraint back - app validates instead
```

---

### Cause 3: RLS Policies Blocking Insert

**Symptoms:** "new row violates row-level security policy"

**Check RLS:**
```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'orders';
```

**Fix RLS:**
```sql
-- Allow authenticated users to create orders
CREATE POLICY "Users can create orders" ON orders
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own orders
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);
```

---

### Cause 4: UddoktaPay API Key Invalid

**Symptoms:** Error from UddoktaPay API

**Test API Key:**
```bash
curl -X POST https://gamesbazarnet.paymently.io/api/checkout-v2 \
  -H "RT-UDDOKTAPAY-API-KEY: VDEUkEE1ByktFymDc4TfSsy6CPUs3SOyCZFxhvIZ" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","amount":1,"redirect_url":"https://example.com"}'
```

**Expected:** Should return JSON with `payment_url`
**If Error:** Contact UddoktaPay support or verify API key

---

### Cause 5: Function Not Deployed Properly

**Symptoms:** Old code running, missing recent fixes

**Redeploy Functions:**
```bash
cd sweet-build-wizard-main
supabase functions deploy create-payment
supabase functions deploy verify-payment
```

Look for deployment success messages:
```
✔ Created new Deployment
✔ Function deployed successfully
```

---

## Debugging Steps

### Step 1: Check Browser Console

Open DevTools (F12) → Console tab

Look for detailed error:
```javascript
=== UDDOKTAPAY PAYMENT DEBUG ===
Request body: {...}
Invoking create-payment function...
Edge function invocation error: {
  name: "FunctionsHttpError",
  message: "Edge Function returned a non-2xx status code"
}
```

---

### Step 2: Check Supabase Edge Function Logs

Go to: **Supabase Dashboard → Edge Functions → Logs Explorer**

Filter by:
- Function: `create-payment`
- Time: Last 5 minutes

Look for errors like:
- `"UDDOKTAPAY_API_KEY is not set in environment variables"`
- `"Failed to create order: ..."`
- `"Cannot read properties of undefined"`
- Database constraint errors

**Common Log Errors:**

#### Error: "UDDOKTAPAY_API_KEY is not set"
**Fix:** Set secret in Supabase dashboard (see Cause 1 above)

#### Error: "invalid input syntax for type uuid"
**Fix:** Check variant_id or package_id format - must be valid UUID

#### Error: "violates foreign key constraint"
**Fix:** Remove FK constraint from orders.variant_id (see DIAGNOSE_UDDOKTAPAY_ISSUES.sql)

---

### Step 3: Test Function Locally (Optional)

If you have Deno installed:
```bash
cd supabase/functions/create-payment
deno run --allow-net --allow-env index.ts
```

Test with curl:
```bash
curl -X POST http://localhost:8000 \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"product","product_name":"Test","amount":90,...}'
```

---

### Step 4: Enable Verbose Logging

Temporarily add to `create-payment/index.ts` line 15:
```typescript
console.log("=== CREATE-PAYMENT DEBUG ===");
console.log("Request body:", body);
console.log("Environment check:", {
  has_api_key: !!Deno.env.get("UDDOKTAPAY_API_KEY"),
  has_supabase_url: !!Deno.env.get("SUPABASE_URL"),
  has_service_key: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
});
```

This will log detailed info to Edge Function logs.

---

## Quick Fixes

### Fix 1: Verify Secrets Are Set

In Supabase Dashboard:
1. Go to **Settings → API**
2. Copy your **service_role key**
3. Go to **Edge Functions → Secrets**
4. Ensure these secrets exist:
   - `UDDOKTAPAY_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

### Fix 2: Redeploy Edge Functions

```bash
# Navigate to project
cd sweet-build-wizard-main

# Deploy both functions
supabase functions deploy create-payment
supabase functions deploy verify-payment

# Watch for success messages
```

---

### Fix 3: Clear Browser Cache

Sometimes cached code causes issues:
```
Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
Clear cache: Ctrl+Shift+Delete
```

---

## Testing Checklist

After applying fixes:

- [ ] Secrets are set in Supabase dashboard
- [ ] Edge functions deployed successfully
- [ ] No console errors when invoking function
- [ ] Supabase logs show successful execution
- [ ] Can redirect to UddoktaPay payment page
- [ ] Payment callback works correctly

---

## Error Messages & Meanings

| Console Error | Likely Cause | Solution |
|---------------|--------------|----------|
| "non-2xx status code" | Function threw exception | Check Edge Function logs |
| "UDDOKTAPAY_API_KEY is not set" | Missing secret | Set in dashboard |
| "Failed to create order" | Database issue | Check RLS/columns |
| "invalid uuid format" | Bad variant_id | Validate UUID before sending |
| "violates FK constraint" | Orders table FK issue | Remove FK constraint |

---

## Success Criteria

✅ **Fixed when:**
- No "non-2xx" error in console
- Edge Function logs show: `"Payment created successfully"`
- User redirected to UddoktaPay payment URL
- Payment flow completes successfully

---

## Files Modified

✅ `src/pages/ProductDetail.tsx` - Better error handling for edge function calls
✅ `DIAGNOSE_UDDOKTAPAY_ISSUES.sql` - Diagnostic queries
✅ `UDDOKTAPAY_NON_2XX_FIX.md` - This guide

---

## Need More Help?

If still getting non-2xx error after trying all fixes:

1. **Share Edge Function logs** (from Supabase dashboard)
2. **Share browser console logs** (full error details)
3. **Confirm secrets are set** (screenshot of Secrets page)
4. **Share exact error message**

With this info, can pinpoint the exact cause!

---

**Last Updated:** March 12, 2026  
**Status:** Ready to Deploy ✅  
**Priority:** CRITICAL 🔴  
**Estimated Time:** 10-15 minutes to diagnose and fix
