# Admin Category & User Info Control Fix Guide

## Problem Summary
1. Admin created categories but products don't properly use category_id
2. ProductDetail page shows "details not found" 
3. Need admin control over what user info to collect (Game UID, WhatsApp, Gmail, etc.)
4. Admin needs to see which users added what information

## Solution Overview

### Step 1: Run Database Migration SQL
**File:** `FIX_CATEGORY_AND_USER_INFO.sql`

This SQL script will:
- ✅ Add `user_info_fields` column to products table (TEXT array)
- ✅ Add `category_id` column to products table (UUID reference)
- ✅ Add `whatsapp` field to profiles table  
- ✅ Update existing products with default user info fields
- ✅ Update existing products with proper category_id references
- ✅ Create indexes for better performance
- ✅ Create helper function to get product user info fields

**Action:** Run this SQL in Supabase SQL Editor

### Step 2: Updated Admin Products Page
**File:** `src/pages/admin/AdminProducts.tsx`

Changes:
- ✅ Added category dropdown (select from product_categories)
- ✅ Added user info fields checkboxes (Game UID, WhatsApp, Email, Phone, Username)
- ✅ Stores category_id reference instead of just text
- ✅ Stores user_info_fields array in database

**Features:**
- Admin can now select which category a product belongs to
- Admin can control what information to collect from users for each product
- Example: Free Fire products → require Game UID
- Example: Voucher products → require Email
- Example: SMM Services → require WhatsApp + Username

### Step 3: Updated ProductDetail Page
**File:** `src/pages/ProductDetail.tsx`

Changes:
- Reads `user_info_fields` from product settings
- Dynamically renders input fields based on admin configuration
- Collects user data (Game UID, WhatsApp, Email, etc.) before order
- Validates required fields before allowing purchase

**Example Behavior:**
- If product has `user_info_fields: ['game_uid']` → Shows Game UID input
- If product has `user_info_fields: ['whatsapp', 'email']` → Shows both inputs
- If product is voucher → Shows Email input only

### Step 4: View User Information in Admin Panel
**File:** `src/pages/admin/AdminUsers.tsx` (needs update)

Admin can see:
- User's profile info (name, phone, balance, coins)
- User's submitted information (Game UIDs, WhatsApp numbers, emails)
- Order history with submitted user data

## How To Use (After Applying Fixes)

### For Admin:
1. Go to Admin Panel → Categories
   - Create categories: Free Fire, SMM Services, Digital Products, etc.

2. Go to Admin Panel → Products
   - Click "নতুন প্রোডাক্ট" (Add New Product)
   - Fill in name, slug, upload image
   - **Select Category** from dropdown
   - **Check User Info Fields** you want to collect:
     - ☑ Game UID (for game topups)
     - ☑ WhatsApp Number (for support/contact)
     - ☑ Gmail/Email (for voucher delivery)
     - ☑ Phone Number
     - ☑ Username
   - Save product

3. Go to Admin Panel → Users
   - See all registered users
   - View their submitted information
   - See who ordered what with what details

### For Users:
1. Browse products by category
2. Select product variant
3. Enter required information based on product type:
   - **Game Topup:** Enter Game UID
   - **Voucher Code:** Enter Email (for code delivery)
   - **SMM Service:** Enter WhatsApp + Username
4. Complete payment
5. Receive product/service

## Database Schema Changes

### products table:
```sql
ALTER TABLE products ADD COLUMN user_info_fields TEXT[];
ALTER TABLE products ADD COLUMN category_id UUID REFERENCES product_categories(id);
```

### profiles table:
```sql
ALTER TABLE profiles ADD COLUMN whatsapp TEXT;
```

## Testing Checklist

- [ ] Run SQL migration script
- [ ] Create at least one category in admin panel
- [ ] Create/edit a product and select category
- [ ] Check user info fields for that product
- [ ] Test product detail page as user
- [ ] Verify correct input fields appear
- [ ] Place test order with user info
- [ ] Check admin users page to see submitted data

## Troubleshooting

### Error: "column category_id does not exist"
→ Run the SQL migration script first

### Error: "product_categories relation not found"
→ Ensure category system migration ran successfully
→ Check `supabase/migrations/20260312070000_create_product_categories.sql`

### No categories showing in dropdown
→ Create categories in Admin → Categories page first
→ Default categories should be: Free Fire, SMM Services, Digital Products

### User info fields not saving
→ Ensure SQL migration ran
→ Check browser console for errors
→ Verify RLS policies allow writes

## Next Steps

After applying these fixes:
1. Test with real products and categories
2. Add admin view to see all user-submitted information in one place
3. Export user data reports (optional)
4. Add email/SMS notifications with user info
