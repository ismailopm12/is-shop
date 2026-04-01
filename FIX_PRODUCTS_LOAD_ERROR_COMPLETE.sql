-- ========================================
-- COMPLETE PRODUCTS ERROR FIX
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Check if products table has all required columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Check if product_variants table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'product_variants' 
ORDER BY ordinal_position;

-- 3. Check if diamond_packages table exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'diamond_packages' 
ORDER BY ordinal_position;

-- 4. Add missing columns to products table if they don't exist
-- Check and add user_info_fields column
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_info_fields') THEN
    ALTER TABLE products ADD COLUMN user_info_fields JSONB;
    RAISE NOTICE 'Added user_info_fields column to products table';
  END IF;
END $$;

-- Check and add view_count column
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'view_count') THEN
    ALTER TABLE products ADD COLUMN view_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added view_count column to products table';
  END IF;
END $$;

-- 5. Ensure is_active column exists and has default value
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column to products table';
  ELSE
    -- Set default value if column exists
    ALTER TABLE products ALTER COLUMN is_active SET DEFAULT true;
  END IF;
END $$;

-- 6. Update all existing products to be active
UPDATE products SET is_active = true WHERE is_active IS NULL;

-- 7. Check product_variants table structure
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'reward_coins') THEN
    ALTER TABLE product_variants ADD COLUMN reward_coins INTEGER DEFAULT 0;
    RAISE NOTICE 'Added reward_coins column to product_variants table';
  END IF;
END $$;

-- 8. Ensure product_variants has is_active column
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'is_active') THEN
    ALTER TABLE product_variants ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column to product_variants table';
  ELSE
    ALTER TABLE product_variants ALTER COLUMN is_active SET DEFAULT true;
  END IF;
END $$;

-- 9. Create index on products for better performance
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 10. Create index on product_variants for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);

-- 11. Grant proper permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 12. Verify the fixes
SELECT 
  'products' as table_name, 
  COUNT(*) as row_count 
FROM products
UNION ALL
SELECT 
  'product_variants' as table_name, 
  COUNT(*) as row_count 
FROM product_variants
UNION ALL
SELECT 
  'diamond_packages' as table_name, 
  COUNT(*) as row_count 
FROM diamond_packages;

-- 13. Check for any products without variants (for debugging)
SELECT 
  p.id, 
  p.name, 
  p.slug, 
  p.category,
  COUNT(pv.id) as variant_count,
  COUNT(dp.id) as package_count
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN diamond_packages dp ON p.id = dp.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.slug, p.category
ORDER BY p.created_at DESC;
