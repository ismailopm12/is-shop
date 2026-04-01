-- ========================================
-- CRITICAL FIX: Products Loading Issue
-- Run this in Supabase SQL Editor NOW
-- ========================================

-- 1. First, check if products table exists and has data
SELECT 'products' as table_name, COUNT(*) as count FROM products;

-- 2. Check if products have is_active column
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column';
  END IF;
END $$;

-- 3. Make sure all existing products are active
UPDATE products SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- 4. Check product_variants table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'is_active') THEN
    ALTER TABLE product_variants ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active to product_variants';
  END IF;
END $$;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);

-- 6. Grant proper permissions to anon and authenticated users
GRANT ALL ON products TO anon;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO anon;
GRANT ALL ON product_variants TO authenticated;

-- 7. Verify data exists
SELECT 
  'Total Products' as info, 
  COUNT(*) as count 
FROM products
UNION ALL
SELECT 
  'Active Products', 
  COUNT(*) 
FROM products WHERE is_active = true
UNION ALL
SELECT 
  'Total Variants', 
  COUNT(*) 
FROM product_variants;

-- 8. Check for any RLS policies that might block access
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('products', 'product_variants')
ORDER BY tablename, policyname;

-- 9. If RLS is enabled and blocking access, disable it temporarily for testing
-- Uncomment ONLY if you're having permission issues:
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- 10. Final verification - this should return your products
SELECT 
  id, 
  name, 
  slug, 
  category, 
  is_active,
  created_at
FROM products
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- IMPORTANT: After running this script
-- 1. Refresh your browser (Ctrl+Shift+R)
-- 2. Check console for any errors
-- 3. Products should now load correctly
-- ========================================
