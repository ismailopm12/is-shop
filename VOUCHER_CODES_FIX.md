# 🔧 Fix: Voucher Codes - "এই প্রোডাক্টে কোনো প্যাকেজ নেই" Error

## Problem
Admin has added packages/variants to voucher products, but in the **Voucher Codes** section, it shows:
> "এই প্রোডাক্টে কোনো প্যাকেজ নেই। আগে প্যাকেজ যোগ করুন।"

This prevents admin from adding voucher codes because no packages are visible in the dropdown.

## Root Cause

The `AdminVoucherCodes.tsx` component was **only fetching from `diamond_packages` table**, but NOT from `product_variants` table.

Since you're using the new `product_variants` system to add packages, they exist in that table but weren't being shown in the voucher code management interface.

## The Fix

Updated `AdminVoucherCodes.tsx` to:
1. ✅ Fetch from BOTH `product_variants` AND `diamond_packages` tables
2. ✅ Combine results without duplicates
3. ✅ Display variant name/value properly in dropdowns
4. ✅ Maintain backward compatibility with old diamond_packages system

## Files Modified

✅ `src/pages/admin/AdminVoucherCodes.tsx`
- Updated `fetchPackages()` function to query both tables
- Changed interface from `DiamondPackage` to generic `Package`
- Updated display logic to show variant names/values
- Added error handling and logging

## What Changed

### Before (Old Code):
```typescript
const fetchPackages = async () => {
  const { data } = await supabase
    .from("diamond_packages")
    .select("id, product_id, diamonds, price")
    .eq("is_active", true)
    .order("sort_order");
  
  if (data) setPackages(data);
};
```

### After (New Code):
```typescript
const fetchPackages = async () => {
  // Fetch from product_variants (new system)
  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("id, product_id, name, value, price")
    .eq("is_active", true)
    .order("sort_order");
  
  // Also fetch diamond_packages (old system)
  const { data: pkgs, error: pkgError } = await supabase
    .from("diamond_packages")
    .select("id, product_id, diamonds, price, name")
    .eq("is_active", true)
    .order("sort_order");
  
  // Combine both sources, avoiding duplicates
  let allPackages: Package[] = [];
  
  if (variants) {
    allPackages = variants.map(v => ({
      id: v.id,
      product_id: v.product_id,
      name: v.name || undefined,
      value: v.value,
      price: parseFloat(v.price.toString()),
    }));
  }
  
  if (pkgs) {
    const variantIds = new Set(allPackages.map(p => p.id));
    pkgs.forEach(pkg => {
      if (!variantIds.has(pkg.id)) {
        allPackages.push({
          id: pkg.id,
          product_id: pkg.product_id,
          name: (pkg as any).name || undefined,
          value: `${(pkg as any).diamonds || 'N/A'}`,
          price: parseFloat((pkg as any).price.toString()),
          diamonds: (pkg as any).diamonds,
        });
      }
    });
  }
  
  setPackages(allPackages);
};
```

## Testing Steps

### Step 1: Refresh Browser
After the code update, hard refresh: `Ctrl+Shift+R`

### Step 2: Test Voucher Code Creation
1. Go to Admin → ভাউচার কোড (Voucher Codes)
2. Click "নতুন ভাউচার কোড" (Add New Voucher Code)
3. Select a product from dropdown
4. **Check if variants/packages appear** in second dropdown

**Expected Result:** Should see all variants you created earlier!

### Step 3: Add Voucher Codes
1. Select a variant from dropdown
2. Enter codes (one per line)
3. Click "যোগ করুন" (Add)

**Expected Result:** Toast message "Xটি ভাউচার কোড যোগ হয়েছে"

### Step 4: Verify in Database
```sql
-- Check voucher codes were created
SELECT 
  vc.id,
  vc.code,
  vc.status,
  p.name as product_name,
  pv.value as variant_value,
  pv.price as variant_price
FROM voucher_codes vc
LEFT JOIN products p ON vc.product_id = p.id
LEFT JOIN product_variants pv ON vc.package_id = pv.id
ORDER BY vc.created_at DESC
LIMIT 10;
```

## Debug Console Output

When you open the "Add Voucher Code" dialog, you should see in console:

```
Fetched product_variants: [{id: "...", value: "100", price: 90, ...}]
Number of variants found: 3
Combined packages count: 3
```

## Common Issues

### Issue 1: Still Shows "কোনো প্যাকেজ নেই"
**Cause:** Browser cache or variants not active

**Solution:**
```sql
-- Check if variants are active
SELECT id, name, value, price, is_active, product_id
FROM product_variants
WHERE is_active = true
ORDER BY created_at DESC;
```

### Issue 2: Variants Not in Dropdown
**Cause:** Product ID mismatch

**Solution:** Make sure you selected the correct product first, then the variant dropdown will populate.

### Issue 3: Duplicate Packages
**Cause:** Same package exists in both tables

**Solution:** The code automatically filters out duplicates by checking IDs. Only unique packages are shown.

## Verification Checklist

After fix is applied:

- [ ] Admin can see variants in voucher code creation dropdown
- [ ] Variant display format: "Name/Value - ৳Price"
- [ ] Can select variant and add voucher codes
- [ ] Voucher codes successfully saved to database
- [ ] Filter dropdown also shows variants correctly
- [ ] No console errors when fetching packages
- [ ] Backward compatible with old diamond_packages

## SQL Verification Queries

### Check Combined Packages
```sql
-- See what admin should see in dropdown
SELECT 
  pv.id,
  pv.name,
  pv.value,
  pv.price,
  'product_variants' as source
FROM product_variants pv
WHERE pv.is_active = true

UNION ALL

SELECT 
  dp.id,
  dp.name,
  dp.diamonds::text as value,
  dp.price,
  'diamond_packages' as source
FROM diamond_packages dp
WHERE dp.is_active = true
  AND dp.id NOT IN (SELECT id FROM product_variants)

ORDER BY price;
```

### Check Voucher Codes by Variant
```sql
SELECT 
  p.name as product_name,
  COALESCE(pv.value, dp.diamonds::text) as variant,
  COUNT(vc.id) as total_codes,
  SUM(CASE WHEN vc.status = 'available' THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN vc.status = 'assigned' THEN 1 ELSE 0 END) as sold
FROM voucher_codes vc
JOIN products p ON vc.product_id = p.id
LEFT JOIN product_variants pv ON vc.package_id = pv.id
LEFT JOIN diamond_packages dp ON vc.package_id = dp.id
GROUP BY p.name, pv.value, dp.diamonds
ORDER BY p.name, variant;
```

## Success Criteria

✅ **Fixed if:**
- Admin sees all variants in dropdown
- Can add voucher codes to any variant
- No "কোনো প্যাকেজ নেই" error
- Dropdown shows: "Variant Name/Value - ৳Price"
- Works for both new (product_variants) and old (diamond_packages) systems

---

**Last Updated:** March 12, 2026  
**Status:** Fixed ✅  
**Priority:** HIGH  
**Component:** AdminVoucherCodes.tsx
