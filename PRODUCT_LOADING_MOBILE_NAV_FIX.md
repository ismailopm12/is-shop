# 🔧 Quick Fix Guide: Products Not Loading

## ✅ Mobile Navigation - FIXED!

The mobile admin menu is now working using shadcn/ui's built-in sidebar:

**How to Test**:
1. Open any admin page on mobile (< 768px width)
2. Click hamburger menu (☰) in top-left
3. Sidebar slides in from left
4. See ALL menu items clearly
5. Scroll through menu if needed
6. Click X or outside to close

---

## 🛒 Product Loading Issue - Debug Steps

### Step 1: Check Browser Console

When you visit a product page, press **F12** and look for:

```javascript
=== PRODUCT DETAIL DEBUG ===
Looking for slug: free-fire-diamond
Product response: { prod: {...}, productError: null }
```

**If you see this**: The code is working, check database  
**If you don't see this**: Check browser console for errors

---

### Step 2: Verify Database Has Products

Go to **Supabase Dashboard**:
1. https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj
2. Click **Table Editor** (left sidebar)
3. Click **products** table
4. Check if products exist

**Run this SQL query** (SQL Editor → New Query):

```sql
-- Check active products
SELECT 
  id, 
  name, 
  slug, 
  category, 
  is_active,
  created_at
FROM products
WHERE is_active = true
ORDER BY created_at DESC;
```

**Expected Result**: You should see at least 1-2 products

---

### Step 3: Activate Products (If Needed)

If no products show or `is_active = false`:

```sql
-- Activate all products
UPDATE products 
SET is_active = true 
WHERE is_active = false;

-- Verify
SELECT COUNT(*) as activated_count 
FROM products 
WHERE is_active = true;
```

---

### Step 4: Check Product Variants

Products need variants to display properly:

```sql
-- Check if products have variants
SELECT 
  p.name as product_name,
  p.slug,
  COUNT(pv.id) as variant_count
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
WHERE p.is_active = true
GROUP BY p.id, p.name, p.slug
ORDER BY variant_count DESC;
```

**If variant_count = 0**, add variants:

```sql
-- Sample variant for testing
INSERT INTO product_variants (
  product_id,
  name,
  value,
  price,
  is_active,
  sort_order
)
SELECT 
  p.id,
  'Test Variant',
  '100',
  99.99,
  true,
  1
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
)
LIMIT 1;
```

---

### Step 5: Test Specific Product

Find out which product isn't loading:

```sql
-- Replace 'your-slug-here' with actual slug from URL
SELECT * FROM products WHERE slug = 'free-fire-diamond';

-- Check its variants
SELECT * FROM product_variants 
WHERE product_id = (
  SELECT id FROM products WHERE slug = 'free-fire-diamond'
);
```

---

### Step 6: Check RLS Policies

Make sure users can read products:

```sql
-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'products';

-- Should show: rowsecurity = true

-- Add policy if missing (run in SQL Editor)
CREATE POLICY "Allow public read access"
ON products FOR SELECT
USING (true);
```

---

## 🎯 Common Issues & Solutions

### Issue 1: "প্রোডাক্ট পাওয়া যায়নি: [slug]"

**Cause**: Product doesn't exist or not active  
**Fix**: Run Step 2 & 3 SQL queries above

---

### Issue 2: Page loads but shows nothing

**Cause**: No variants or database connection issue  
**Fix**: 
1. Check console logs (F12)
2. Run Step 4 SQL query
3. Verify Supabase URL in `.env`

---

### Issue 3: Infinite loading spinner

**Cause**: API timeout or error not handled  
**Fix**: 
1. Wait 15 seconds (timeout duration)
2. Should show error toast
3. Auto-redirects to home after 2s

---

### Issue 4: Works on desktop, not mobile

**Cause**: Network issue or caching  
**Fix**:
1. Clear browser cache
2. Try incognito mode
3. Check mobile data/WiFi connection

---

## 📊 Expected Product Structure

A properly configured product looks like:

**products table**:
```
id: uuid
name: "Free Fire Diamonds"
slug: "free-fire-diamonds"
category: "Free Fire Top Up"
description: "Top up Free Fire diamonds instantly"
image: "freefire-banner.jpg"
is_voucher: false
is_active: true
view_count: 150
```

**product_variants table**:
```
id: uuid
product_id: (matches product above)
name: "100 Diamonds"
value: "100"
price: 99.99
is_active: true
sort_order: 1
reward_coins: 10
```

---

## 🚀 Quick Test Checklist

1. **Homepage** (`/`)
   - [ ] Can see product grid
   - [ ] Products have images
   - [ ] Prices visible
   - [ ] Can click on product

2. **Product Detail** (`/product/[slug]`)
   - [ ] Page loads within 3 seconds
   - [ ] Product name visible
   - [ ] Description readable
   - [ ] Variants/prices shown
   - [ ] Can select variant
   - [ ] Purchase button works

3. **Mobile Admin** (`/admin`)
   - [ ] Hamburger menu visible (< 768px)
   - [ ] Tap hamburger → sidebar slides in
   - [ ] All menu items visible
   - [ ] Can scroll menu
   - [ ] Menu closes on X or outside tap

---

## 🔍 Debug Console Commands

Open browser console (F12) and run:

```javascript
// Check current slug
console.log('Current slug:', window.location.pathname.split('/').pop());

// Test Supabase connection
import { supabase } from "@/integrations/supabase/client";

supabase
  .from("products")
  .select("*")
  .eq("is_active", true)
  .limit(1)
  .then(({ data, error }) => {
    console.log('Products:', data);
    console.log('Error:', error);
  });
```

---

## 📞 Support Resources

**Supabase Dashboard**:
- URL: https://supabase.com/dashboard/project/nsrexmmxegueqacawpjj
- Go to: Table Editor → products
- Check products exist and are active

**GitHub Repository**:
- URL: https://github.com/ismailopm12/is-shop
- Check latest commits for fixes

**Vercel Deployment**:
- Auto-deploys on push to main
- Check deployment status at vercel.com

---

## ✅ Success Criteria

Your products are working correctly when:

1. ✅ Homepage shows product grid
2. ✅ Clicking product opens detail page
3. ✅ Detail page loads within 3 seconds
4. ✅ Shows product name, description, variants
5. ✅ Can select variant and see price
6. ✅ Purchase flow works

Your mobile nav is working when:

1. ✅ Hamburger appears on mobile (< 768px)
2. ✅ Tap hamburger → sidebar slides in
3. ✅ All menu items visible and scrollable
4. ✅ Can navigate to any admin page
5. ✅ Closes smoothly on X or outside tap

---

## 🎯 Next Steps

1. **Test on Live Site**:
   - Wait 30 seconds for Vercel deploy
   - Refresh site (Ctrl+Shift+R)
   - Test mobile menu
   - Test product pages

2. **If Still Issues**:
   - Check console logs (F12)
   - Run SQL queries from Step 2
   - Verify products exist in database
   - Check RLS policies allow reading

3. **Monitor**:
   - Watch for debug logs in console
   - Check error messages
   - Verify database queries succeed

---

**Status**: ✅ Mobile Nav Fixed | 🔄 Product Loading Debugging  
**Deployed**: Automatically via Vercel  
**Last Updated**: March 14, 2026
