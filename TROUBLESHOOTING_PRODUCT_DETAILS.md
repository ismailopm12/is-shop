# 🔧 Troubleshooting - Can't See Product Details

## Problem: "I don't see products details section"

---

## ✅ Solution Steps

### Step 1: Check if SQL Migration Ran

The `user_info_fields` column must exist in the database first!

**Run this SQL in Supabase:**

```sql
-- Quick test - Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('user_info_fields', 'category_id');
```

**Expected Result:**
```
column_name      | data_type
-----------------|----------
user_info_fields | jsonb
category_id      | uuid
```

**If you DON'T see these columns:**
→ Run the complete SQL migration: `COMPLETE_DYNAMIC_FIELDS.sql`

---

### Step 2: Add Fields to a Product (Admin)

Even after SQL runs, products won't show fields until you configure them!

**Do this:**
1. Go to Admin Panel → Products
2. Edit an existing product (or add new one)
3. Scroll to "ব্যবহারকারীর তথ্য ফিল্ডসমূহ" section
4. Click "+ Game UID" button (or "+ Add Field")
5. Configure the field
6. **Save the product**

**Verify it saved:**
```sql
-- Check if product has fields configured
SELECT name, user_info_fields 
FROM products 
WHERE slug = 'your-product-slug';
```

**Expected Result:**
```json
user_info_fields
----------------
[{"id": "game_uid", "label": "Player UID", ...}]
```

---

### Step 3: View Product Page

After SQL + Configuration:

1. Visit product page (e.g., `/product/your-product-slug`)
2. Scroll down past variants selection
3. Look for **"Account Info"** section
4. You should see the fields you configured!

---

## 🐛 Common Issues

### Issue 1: "Product not found"
**Cause:** Product doesn't exist or isn't active

**Fix:**
```sql
-- Check product exists and is active
SELECT id, name, slug, is_active 
FROM products 
WHERE slug = 'your-slug';
```

Make sure `is_active = true`

---

### Issue 2: "Loading forever"
**Cause:** Error fetching data (check browser console)

**Check:**
1. Open browser console (F12)
2. Look for red errors
3. Common errors:
   - `column does not exist` → Run SQL migration
   - `relation does not exist` → Tables not created
   - `null value returned` → Product not found

---

### Issue 3: "No Account Info section showing"
**Cause:** Product has no fields configured yet

**Solution:**
The Account Info section only shows if:
- Product is NOT a voucher, AND
- Product has `user_info_fields` configured

**Temporary fix (show old Player UID field):**

If you want to see SOMETHING while testing, add this fallback code to ProductDetail.tsx around line 758:

```tsx
{/* Fallback - Old Player UID field */}
{!product.is_voucher && (!product.user_info_fields || product.user_info_fields.length === 0) && (
  <section className="bg-card rounded-xl p-4 card-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">3</span>
        <h2 className="font-bold">Account Info</h2>
      </div>
    </div>
    <label className="text-sm font-medium mb-1 block">Player UID</label>
    <Input 
      placeholder="Player UID" 
      value={playerId} 
      onChange={(e) => setUserInfoData({ ...userInfoData, game_uid: e.target.value })} 
    />
  </section>
)}
```

This will show the old Player UID field as a fallback!

---

## 📋 Complete Test Checklist

### Backend (Database):
- [ ] SQL migration ran successfully
- [ ] `user_info_fields` column exists (JSONB type)
- [ ] `category_id` column exists (UUID type)
- [ ] At least one product has fields configured

### Frontend (Browser):
- [ ] Dev server running (http://localhost:8082/)
- [ ] Can access product pages
- [ ] No console errors
- [ ] Product has variants/packages
- [ ] "Account Info" section visible
- [ ] Input fields rendering

### Admin Panel:
- [ ] Can access `/admin/products`
- [ ] Can edit product
- [ ] See "+ Add Field" button
- [ ] Can add fields
- [ ] Can save product

---

## 🎯 Quick Fix (Right Now!)

If you want to see results IMMEDIATELY:

### Option A: Use Fallback Field
Add the fallback code above to ProductDetail.tsx

### Option B: Configure a Test Product
1. **Run SQL** (if not done):
   ```
   File: COMPLETE_DYNAMIC_FIELDS.sql
   Location: Supabase SQL Editor
   ```

2. **Add field to product**:
   ```
   URL: http://localhost:8082/admin/products
   Action: Edit any product → Add "Game UID" field → Save
   ```

3. **View product**:
   ```
   URL: http://localhost:8082/product/[your-slug]
   Look for: "Account Info" section
   ```

---

## 🔍 Debug Mode

Add this to your ProductDetail.tsx to see what's happening:

```tsx
// After line 84 (after setProduct)
console.log("=== PRODUCT DEBUG ===");
console.log("Product loaded:", prod);
console.log("Has user_info_fields?", !!prod?.user_info_fields);
console.log("Fields count:", prod?.user_info_fields?.length || 0);
console.log("Is voucher?", prod?.is_voucher);
console.log("=====================");
```

Then check browser console (F12) to see what's being fetched!

---

## 📞 Still Not Working?

**Check these in order:**

1. ✅ Is dev server running? (`npm run dev`)
2. ✅ Are you logged in as admin?
3. ✅ Does the product exist and is active?
4. ✅ Did SQL migration run successfully?
5. ✅ Did you add fields to the product?
6. ✅ Any errors in browser console?

**Most likely cause:** SQL migration not run OR product has no fields configured yet!

---

## ✨ What Should Happen (Normal Flow)

```
1. Run SQL Migration
   ↓
2. Database has user_info_fields column
   ↓
3. Admin adds fields to product
   ↓
4. Product saves with JSONB field config
   ↓
5. User visits product page
   ↓
6. Fetches product + fields
   ↓
7. Renders dynamic inputs
   ↓
8. Shows "Account Info" section with fields
```

If ANY step is missing, the section won't show!

---

**Next Action:** Run SQL migration OR add fields to a product, then refresh! 🚀
