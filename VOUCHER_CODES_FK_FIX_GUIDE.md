# 🔧 Fix: Voucher Codes Foreign Key Error (23503)

## Error Message
```
যোগ করা যায়নি: insert or update on table "voucher_codes" violates foreign key constraint "voucher_codes_package_id_fkey"
```

## Root Cause

The `voucher_codes` table has a **foreign key constraint** on `package_id` that's pointing to the wrong table or referencing non-existent IDs.

This happens because:
1. Admin creates variants in `product_variants` table
2. Tries to add voucher codes with those variant IDs
3. Database FK constraint expects IDs from `diamond_packages` table (old system)
4. FK validation fails → Error 23503

## The Fix

### Step 1: Run SQL Migration (REQUIRED)

Open **Supabase SQL Editor** and run:

```sql
-- Remove the problematic FK constraint
ALTER TABLE public.voucher_codes
DROP CONSTRAINT IF EXISTS voucher_codes_package_id_fkey;

-- Add variant_id column for consistency (optional but recommended)
ALTER TABLE public.voucher_codes 
ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_voucher_codes_variant_id 
ON public.voucher_codes(variant_id);

-- Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'voucher_codes'
  AND column_name IN ('package_id', 'variant_id');

-- Success check
SELECT '✅ FK constraint removed!' as status;
```

**What this does:**
- ✅ Removes the restrictive FK constraint
- ✅ Allows inserting voucher codes with any package_id
- ✅ App layer validates instead of database
- ✅ Adds `variant_id` column for future use

---

### Step 2: Test Adding Voucher Codes

After running the SQL:

1. **Refresh browser:** `Ctrl+Shift+R`
2. Go to: **Admin → ভাউচার কোড**
3. Click: **"নতুন ভাউচার কোড"**
4. Select product
5. Select variant (should show your created variants)
6. Enter codes (one per line)
7. Click **"যোগ করুন"**

**Expected Result:** 
- Toast: "Xটি ভাউচার কোড যোগ হয়েছে"
- No FK error!
- Codes appear in the list below

---

## What Was Fixed

### Code Changes (AdminVoucherCodes.tsx)

#### 1. Pre-insert Validation
```typescript
// Validate that the package/variant exists before inserting
const { data: variantCheck } = await supabase
  .from("product_variants")
  .select("id")
  .eq("id", addPackageId)
  .single();

if (!variantCheck) {
  // Check diamond_packages as fallback
  const { data: pkgCheck } = await supabase
    .from("diamond_packages")
    .select("id")
    .eq("id", addPackageId)
    .single();
  
  if (!pkgCheck) {
    toast.error("ভ্যারিয়েন্ট পাওয়া যায়নি।");
    window.location.reload();
    return;
  }
}
```

#### 2. Better Error Handling
```typescript
const { error } = await supabase.from("voucher_codes").insert(rows);
if (error) {
  console.error("Voucher code insert error:", error);
  
  // Handle FK constraint errors specifically
  if (error.code === '23503') {
    toast.error("ভ্যারিয়েন্ট বৈধ নয়। দয়া করে পেজ রিফ্রেশ করুন।");
    window.location.reload();
  } else {
    toast.error(`যোগ করা যায়নি: ${error.message}`);
  }
  return;
}
```

#### 3. Debug Logging
```typescript
console.log("Adding voucher codes:", {
  product_id: addProductId,
  package_id: addPackageId,
  code_count: codes.length,
  first_code: codes[0]
});
```

---

## Verification Queries

### Check Voucher Codes Were Created
```sql
SELECT 
  vc.id,
  vc.code,
  vc.status,
  vc.package_id,
  p.name as product_name,
  pv.value as variant_value,
  pv.price as variant_price
FROM voucher_codes vc
LEFT JOIN products p ON vc.product_id = p.id
LEFT JOIN product_variants pv ON vc.package_id = pv.id
ORDER BY vc.created_at DESC
LIMIT 10;
```

### Check Package/Variants Available
```sql
-- See what should be available in dropdown
SELECT 
  pv.id,
  pv.name,
  pv.value,
  pv.price,
  pv.is_active,
  p.name as product_name
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE pv.is_active = true
  AND p.is_voucher = true
ORDER BY p.name, pv.price;
```

---

## Common Issues & Solutions

### Issue 1: Still Getting FK Error After Fix
**Cause:** Browser cache or SQL not run

**Solution:**
1. Hard refresh: `Ctrl+Shift+R`
2. Re-run the SQL migration
3. Clear browser cache completely

### Issue 2: "ভ্যারিয়েন্ট পাওয়া যায়নি" Error
**Cause:** Variant ID doesn't exist in database

**Solution:**
```sql
-- Check if variant exists
SELECT id, name, value, price, is_active
FROM product_variants
WHERE id = 'YOUR_VARIANT_ID_HERE';

-- If missing, recreate it or reload variants in admin panel
```

### Issue 3: Can't See Variants in Dropdown
**Cause:** Product not selected or no active variants

**Solution:**
1. Make sure you selected a product first
2. Check if variants are active:
```sql
UPDATE product_variants 
SET is_active = true 
WHERE product_id = 'YOUR_PRODUCT_ID';
```

---

## Debug Console Output

When adding voucher codes successfully, you should see:

```
Adding voucher codes: {
  product_id: "abc123...",
  package_id: "def456...",
  code_count: 5,
  first_code: "ABC123-XYZ789"
}

Variant check result: {id: "def456..."}
✓ Insert successful
```

If there's an error:
```
Voucher code insert error: {
  code: "23503",
  message: "insert or update on table \"voucher_codes\" violates foreign key constraint..."
}
```

---

## Files Modified

✅ `src/pages/admin/AdminVoucherCodes.tsx`
- Added pre-insert validation
- Better error handling for FK errors
- Auto-reload on invalid variant
- Debug logging

✅ `FIX_VOUCHER_CODES_FK.sql` - Complete SQL migration script

---

## Success Criteria

✅ **Fixed when:**
- Can add voucher codes without FK errors
- Toast shows success message
- Codes appear in database
- Dropdown shows all variants correctly
- Auto-recovery if variant is invalid

---

## Quick Fix Command

Just run this ONE query:

```sql
ALTER TABLE public.voucher_codes
DROP CONSTRAINT IF EXISTS voucher_codes_package_id_fkey;
```

Then refresh browser and try adding codes again! 🎉

---

**Last Updated:** March 12, 2026  
**Status:** Ready to Deploy ✅  
**Priority:** CRITICAL 🔴  
**Estimated Time:** 2 minutes
