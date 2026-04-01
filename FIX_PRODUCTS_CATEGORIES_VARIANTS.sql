-- Fix Products, Categories, and Variants Connection
-- Run this in Supabase SQL Editor

-- 1. Ensure products table has proper category_id FK
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_category_id_fkey;

ALTER TABLE products
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES product_categories(id) 
ON DELETE SET NULL;

-- 2. Ensure product_variants table exists with proper structure
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT,
  value TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  reward_coins INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON products(category_id);

-- 4. Add RLS policies if not exists
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON product_variants;
CREATE POLICY "Allow public read access" 
ON product_variants FOR SELECT 
USING (true);

-- Allow authenticated users to insert/update/delete
DROP POLICY IF EXISTS "Allow authenticated users full access" ON product_variants;
CREATE POLICY "Allow authenticated users full access" 
ON product_variants FOR ALL 
USING (auth.role() = 'authenticated');

-- 5. Update products to have proper category connections
-- Example: Update existing products to use category_id from product_categories
UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE p.category = pc.name
AND p.category_id IS NULL;

-- 6. Create view for products with categories and variants
CREATE OR REPLACE VIEW products_with_categories AS
SELECT 
  p.*,
  pc.name as category_name,
  pc.slug as category_slug,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', pv.id,
        'name', pv.name,
        'value', pv.value,
        'price', pv.price,
        'reward_coins', pv.reward_coins
      )
    ) FILTER (WHERE pv.id IS NOT NULL),
    '[]'::json
  ) as variants
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
WHERE p.is_active = true
GROUP BY p.id, pc.id;

-- Grant access to the view
GRANT SELECT ON products_with_categories TO authenticated;
GRANT SELECT ON products_with_categories TO anon;

-- 7. Insert sample variants for testing (optional)
-- Uncomment if you want to add test data
/*
INSERT INTO product_variants (product_id, name, value, price, reward_coins)
SELECT 
  p.id,
  CASE 
    WHEN p.category ILIKE '%diamond%' THEN 'Diamond Package'
    ELSE 'Standard'
  END as name,
  CASE 
    WHEN p.category ILIKE '%diamond%' THEN '100 Diamonds'
    ELSE 'Default Variant'
  END as value,
  CASE 
    WHEN p.category ILIKE '%diamond%' THEN 100
    ELSE 50
  END as price,
  CASE 
    WHEN p.category ILIKE '%diamond%' THEN 10
    ELSE 5
  END as reward_coins
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
);
*/

-- 8. Verify the setup
SELECT 
  p.name as product_name,
  pc.name as category_name,
  COUNT(pv.id) as variant_count
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.is_active = true
GROUP BY p.id, pc.id
ORDER BY p.created_at DESC;
