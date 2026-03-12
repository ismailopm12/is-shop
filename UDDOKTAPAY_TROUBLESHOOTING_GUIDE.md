# 🔧 Fix: UddoktaPay Payment Creation Error

## Error Message
```
পেমেন্ট তৈরি করতে সমস্যা হয়েছে।
(Payment create problem)
```

Or more specific errors:
- "Payment gateway configuration error"
- "API key missing"
- "Failed to create order"

## Common Causes & Solutions

### Cause 1: Missing or Invalid API Key ✅ MOST COMMON

**Check:** Open browser console (F12) and look for:
```
=== UDDOKTAPAY PAYMENT DEBUG ===
Request sent: {...}
Response received: {error: "...", data: null}
```

**Solution:**

1. **Verify .env file exists:**
   ```bash
   supabase/functions/.env
   ```

2. **Check API key is set:**
   ```
   UDDOKTAPAY_API_KEY="VDEUkEE1ByktFymDc4TfSsy6CPUs3SOyCZFxhvIZ"
   ```

3. **If missing, add it and redeploy:**
   ```bash
   cd supabase/functions
   # Edit .env file
   # Then deploy edge function again
   ```

---

### Cause 2: Database Schema Issues

**Symptoms:** Payment record creation fails

**Run Diagnostic SQL:**
```sql
-- Check if payment_records has required columns
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'payment_records'
ORDER BY ordinal_position;
```

**Expected columns:**
- id (uuid)
- user_id (uuid)
- type (text)
- amount (numeric)
- status (text)
- invoice_id (uuid, nullable)
- variant_id (uuid, nullable) ← Must exist!
- package_id (uuid, nullable) ← Must exist!

**Fix if columns missing:**
```sql
-- Add missing columns
ALTER TABLE payment_records 
ADD COLUMN IF NOT EXISTS variant_id UUID,
ADD COLUMN IF NOT EXISTS package_id UUID;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_records_variant_id 
ON payment_records(variant_id);

CREATE INDEX IF NOT EXISTS idx_payment_records_package_id 
ON payment_records(package_id);
```

---

### Cause 3: RLS Policies Blocking Inserts

**Symptoms:** "permission denied" or "new row violates row-level security policy"

**Check RLS:**
```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'payment_records';
```

**Fix RLS:**
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Users can create payment records" ON payment_records;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON payment_records;

-- Create new policy allowing authenticated users to create payments
CREATE POLICY "Authenticated users can create payments" ON payment_records
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own payments
CREATE POLICY "Users can view own payments" ON payment_records
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

---

### Cause 4: UddoktaPay API Issues

**Symptoms:** Error from UddoktaPay API itself

**Test API Key:**
```bash
curl -X POST https://gamesbazarnet.paymently.io/api/checkout-v2 \
  -H "RT-UDDOKTAPAY-API-KEY: VDEUkEE1ByktFymDc4TfSsy6CPUs3SOyCZFxhvIZ" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","email":"test@test.com","amount":1,"redirect_url":"https://example.com"}'
```

**Expected Response:** Should return JSON with `payment_url` or error message.

**If API returns error:**
- Contact UddoktaPay support
- Verify API key is active
- Check if account has sufficient balance

---

### Cause 5: Webhook Not Configured

**Symptoms:** Payment succeeds but order not marked as completed

**Solution:** Configure webhook in UddoktaPay dashboard:

**Webhook URL:**
```
https://nsrexmmxegueqacawpjj.supabase.co/functions/v1/verify-payment
```

**Steps:**
1. Login to UddoktaPay dashboard
2. Go to Settings → Webhooks
3. Add webhook URL above
4. Save changes
5. Test webhook

---

## Debugging Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) → Console tab

Look for:
```javascript
=== UDDOKTAPAY PAYMENT DEBUG ===
Request sent: {
  type: "product",
  product_name: "Demo Product",
  amount: 90,
  product_id: "...",
  variant_id: "...",
  ...
}
Response received: {data: {...}, error: null}
```

**Good Response:**
```javascript
Response received: {
  data: {
    payment_url: "https://gamesbazarnet.paymently.io/..."
  },
  error: null
}
```

**Bad Response:**
```javascript
Response received: {
  data: null,
  error: {
    message: "Payment gateway configuration error"
  }
}
```

---

### Step 2: Check Supabase Logs

Go to: **Supabase Dashboard → Logs Explorer**

Filter by:
- Function: `create-payment`
- Time: Last 5 minutes

Look for errors like:
- "UDDOKTAPAY_API_KEY is not set"
- "Failed to create order"
- Database constraint errors

---

### Step 3: Test Payment Record Creation

Run this in browser console while on product page:

```javascript
const { data, error } = await supabase
  .from('payment_records')
  .insert({
    user_id: supabase.auth.user().id,
    type: 'product',
    amount: 90,
    status: 'pending'
  });

console.log('Test insert:', { data, error });
```

**Success:** No error, returns inserted record
**Failure:** Shows permission error or constraint violation

---

### Step 4: Run Diagnostic SQL

Copy and run `DIAGNOSE_UDDOKTAPAY_ISSUES.sql` in Supabase SQL Editor.

This will check:
- Table structure
- Recent payment records
- Failed attempts
- RLS policies
- Required functions

---

## Quick Fixes

### Fix 1: Redeploy Edge Functions

```bash
cd sweet-build-wizard-main
supabase functions deploy create-payment
supabase functions deploy verify-payment
```

---

### Fix 2: Clear Browser Cache

Sometimes cached code causes issues:
```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```

---

### Fix 3: Check Environment Variables

In Supabase Dashboard:
1. Go to **Edge Functions** → **Secrets**
2. Verify these secrets exist:
   - `UDDOKTAPAY_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## Testing Checklist

After applying fixes:

- [ ] Can click "Instant Pay" button
- [ ] No console errors when creating payment
- [ ] Redirected to UddoktaPay payment page
- [ ] Can complete payment (test mode or real)
- [ ] Redirected back to callback page
- [ ] Payment verified successfully
- [ ] Order status updated to "completed"
- [ ] Voucher code assigned (if voucher product)
- [ ] Code appears in "My Codes"

---

## Error Messages & Meanings

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "পেমেন্ট গেটওয়ে কনফিগারেশন সমস্যা" | API key missing | Check .env file |
| "Failed to create order" | Database issue | Check RLS/columns |
| "Payment gateway error" | UddoktaPay API down | Contact UddoktaPay |
| "Permission denied" | RLS blocking | Fix RLS policies |
| "variant_id not found" | Schema mismatch | Add variant_id column |

---

## Files Modified

✅ `src/pages/ProductDetail.tsx` - Enhanced error logging and messages
✅ `DIAGNOSE_UDDOKTAPAY_ISSUES.sql` - Diagnostic queries
✅ `UDDOKTAPAY_TROUBLESHOOTING_GUIDE.md` - This guide

---

## Need More Help?

If still having issues after trying all fixes:

1. **Share browser console logs** (F12 → Console)
2. **Share Supabase Edge Function logs** (Dashboard → Logs)
3. **Share diagnostic SQL results**
4. **Share exact error message**

With this info, can pinpoint the exact issue!

---

**Last Updated:** March 12, 2026  
**Status:** Ready to Deploy ✅  
**Priority:** HIGH 🔴  
**Estimated Time:** 10-15 minutes to diagnose and fix
