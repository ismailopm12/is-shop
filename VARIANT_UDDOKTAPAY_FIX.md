# 🔧 Fix: Variant Products UddoktaPay Not Working

## Problem

✅ SMM orders working with UddoktaPay  
✅ Digital products working with UddoktaPay  
❌ **Variant products NOT working** with UddoktaPay

Error: "Edge Function returned a non-2xx status code"

## Root Cause

When sending variant product data to `create-payment` function, we were sending **BOTH** `package_id` AND `variant_id` with the same value:

```typescript
// BROKEN CODE - Sends both IDs!
package_id: variant?.id || null,        // Always sends ID
variant_id: variant?.id || null,        // Also always sends ID
```

This confused the backend because:
- For **new system** (`product_variants` table): Should send ONLY `variant_id`
- For **old system** (`diamond_packages` table): Should send ONLY `package_id`

## The Fix

Changed the logic to send **ONLY the correct ID** based on variant source:

### Before (Broken):
```typescript
package_id: variant?.id || null,           // ❌ Always set
variant_id: variant?.id || null,           // ❌ Always set
```

### After (Fixed):
```typescript
// Send ONLY the correct ID based on variant source
// New system (product_variants): send variant_id only
// Old system (diamond_packages): send package_id only
package_id: variant?.isFromDiamondPackages ? variant.id : null,  // ✅ Only if old system
variant_id: variant && !variant.isFromDiamondPackages ? variant.id : null, // ✅ Only if new system
```

## How It Works Now

### Scenario 1: New System Variant (product_variants table)
```javascript
variant = {
  id: "abc123...",
  isFromDiamondPackages: false,
  name: "৳90",
  value: "90",
  price: 90
}

// Request sent to create-payment:
{
  package_id: null,              // ✅ NULL for new system
  variant_id: "abc123...",       // ✅ SET for new system
}
```

### Scenario 2: Old System Package (diamond_packages table)
```javascript
variant = {
  id: "xyz789...",
  isFromDiamondPackages: true,
  name: "100 Diamonds",
  diamonds: 100,
  price: 90
}

// Request sent to create-payment:
{
  package_id: "xyz789...",       // ✅ SET for old system
  variant_id: null,              // ✅ NULL for old system
}
```

## Files Modified

✅ `src/pages/ProductDetail.tsx` (lines 514-526)
- Fixed request body to send correct ID
- Enhanced debug logging

## Debug Output

Now when you try variant payment, console shows:

```javascript
=== UDDOKTAPAY PAYMENT DEBUG ===
Variant source: product_variants (NEW)
Request body: {
  type: "product",
  product_name: "Demo Product",
  amount: 90,
  package_id: null,              // ✅ Correct!
  variant_id: "abc123...",       // ✅ Correct!
}
Sending IDs: {
  package_id: null,
  variant_id: "abc123...",
  logic: "Using variant_id (new system)"
}
```

## Testing Steps

### Test 1: New System Variant
1. Go to any voucher product with variants
2. Select a variant (e.g., "৳90")
3. Choose "Instant Pay"
4. Click "অর্ডার করুন"

**Expected Console:**
```
Variant source: product_variants (NEW)
Sending IDs: {logic: "Using variant_id (new system)"}
✅ Redirects to UddoktaPay successfully
```

### Test 2: Old System Package
1. Go to product using diamond_packages
2. Select package
3. Choose "Instant Pay"
4. Click "অর্ডার করুন"

**Expected Console:**
```
Variant source: diamond_packages (OLD)
Sending IDs: {logic: "Using package_id (old system)"}
✅ Redirects to UddoktaPay successfully
```

## Why This Fixes The Issue

The `create-payment` edge function now receives **clear, unambiguous data**:

- ✅ Only ONE ID is set (either `package_id` OR `variant_id`)
- ✅ Backend doesn't have to guess which ID to use
- ✅ Payment record created with correct foreign key reference
- ✅ Voucher assignment works correctly
- ✅ No more "non-2xx status code" errors

## Verification Queries

Check recent payments to verify correct IDs are being saved:

```sql
SELECT 
  pr.id,
  pr.amount,
  pr.package_id,
  pr.variant_id,
  CASE 
    WHEN pr.variant_id IS NOT NULL THEN 'New System (product_variants)'
    WHEN pr.package_id IS NOT NULL THEN 'Old System (diamond_packages)'
    ELSE 'ERROR: Both NULL!'
  END as system_used,
  pv.value as variant_value,
  dp.diamonds as package_diamonds,
  pr.created_at
FROM payment_records pr
LEFT JOIN product_variants pv ON pr.variant_id = pv.id
LEFT JOIN diamond_packages dp ON pr.package_id = dp.id
WHERE pr.type = 'product'
ORDER BY pr.created_at DESC
LIMIT 10;
```

**Expected Result:**
- Each row should have EITHER `package_id` OR `variant_id` set (not both!)
- `system_used` column shows which system was used
- No rows with "ERROR: Both NULL!"

## Success Criteria

✅ **Fixed when:**
- Can select variant and click "Instant Pay"
- No "non-2xx" error in console
- Console shows correct variant source (NEW or OLD)
- Redirects to UddoktaPay payment page
- Payment completes successfully
- Voucher code assigned instantly

---

**Last Updated:** March 12, 2026  
**Status:** Ready to Deploy ✅  
**Priority:** HIGH 🔴  
**Test Time:** 2 minutes
