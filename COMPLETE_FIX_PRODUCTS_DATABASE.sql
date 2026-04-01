-- COMPLETE FIX FOR PRODUCTS, CATEGORIES, VARIANTS, AND VIEW COUNT
-- Run this in Supabase SQL Editor to fix all issues

-- ==================== PART 1: FIX PRODUCTS TABLE ====================

-- Add view_count column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE products ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add user_info_fields column if it doesn't exist  
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'user_info_fields'
  ) THEN
    ALTER TABLE products ADD COLUMN user_info_fields JSONB;
  END IF;
END $$;

-- ==================== PART 2: FIX FOREIGN KEYS ====================

-- Drop old FK constraint if exists
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Add proper FK constraint
ALTER TABLE products
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES product_categories(id) 
ON DELETE SET NULL;

-- ==================== PART 3: CREATE/UPDATE PRODUCT_VARIANTS TABLE ====================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT,
  value TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  reward_coins INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_is_active 
ON product_variants(is_active);

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON product_variants;
CREATE POLICY "Allow public read access" 
ON product_variants FOR SELECT 
USING (true);

-- Allow authenticated users full access
DROP POLICY IF EXISTS "Allow authenticated users full access" ON product_variants;
CREATE POLICY "Allow authenticated users full access" 
ON product_variants FOR ALL 
USING (auth.role() = 'authenticated');

-- ==================== PART 4: CREATE INCREMENT_PRODUCT_VIEW FUNCTION ====================

-- Create or replace the increment_product_view function
CREATE OR REPLACE FUNCTION increment_product_view(
  p_product_id UUID,
  p_session_id TEXT,
  p_duration_seconds INTEGER DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if session already tracked (prevent duplicate views)
  SELECT EXISTS (
    SELECT 1 FROM product_views 
    WHERE product_id = p_product_id 
    AND session_id = p_session_id
    AND created_at > NOW() - INTERVAL '1 hour'
  ) INTO v_exists;
  
  -- Only increment if not recently viewed by this session
  IF NOT v_exists THEN
    -- Record the view
    INSERT INTO product_views (product_id, session_id, duration_seconds)
    VALUES (p_product_id, p_session_id, p_duration_seconds);
    
    -- Increment view count
    UPDATE products 
    SET view_count = COALESCE(view_count, 0) + 1,
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==================== PART 5: CREATE PRODUCT_VIEWS TABLE IF NOT EXISTS ====================

CREATE TABLE IF NOT EXISTS product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  session_id TEXT,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_id 
ON product_views(product_id);

CREATE INDEX IF NOT EXISTS idx_product_views_session_id 
ON product_views(session_id);

-- Enable RLS
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Allow insert access
DROP POLICY IF EXISTS "Allow public insert" ON product_views;
CREATE POLICY "Allow public insert" 
ON product_views FOR INSERT 
WITH CHECK (true);

-- ==================== PART 6: CREATE REFUND_COINS FUNCTION ====================

-- Create or replace refund_coins function
CREATE OR REPLACE FUNCTION refund_coins(
  _user_id UUID,
  _amount NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_coins INTEGER;
BEGIN
  -- Get current coin balance
  SELECT coins INTO v_coins FROM profiles WHERE id = _user_id;
  
  -- Refund coins (add back to user's account)
  UPDATE profiles 
  SET coins = COALESCE(coins, 0) + (_amount * 10)::INTEGER  -- Assuming 1 coin = ৳0.10
  WHERE id = _user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== PART 7: SYNC EXISTING PRODUCTS WITH CATEGORIES ====================

-- Update products to have category_id based on category name
UPDATE products p
SET category_id = pc.id
FROM product_categories pc
WHERE TRIM(UPPER(p.category)) = TRIM(UPPER(pc.name))
AND p.category_id IS NULL;

-- ==================== PART 8: CREATE SAMPLE VARIANTS (OPTIONAL) ====================

-- Add variants to products that don't have any (example)
INSERT INTO product_variants (product_id, name, value, price, reward_coins, sort_order)
SELECT 
  p.id,
  CASE 
    WHEN LOWER(p.category) LIKE '%diamond%' THEN 'Diamond Package'
    WHEN LOWER(p.category) LIKE '%voucher%' THEN 'Voucher'
    ELSE 'Standard Package'
  END as name,
  CASE 
    WHEN LOWER(p.category) LIKE '%diamond%' THEN '100 Diamonds'
    WHEN LOWER(p.category) LIKE '%voucher%' THEN '৳500 Value'
    ELSE 'Default'
  END as value,
  CASE 
    WHEN LOWER(p.category) LIKE '%diamond%' THEN 100
    WHEN LOWER(p.category) LIKE '%voucher%' THEN 500
    ELSE 50
  END as price,
  CASE 
    WHEN LOWER(p.category) LIKE '%diamond%' THEN 10
    WHEN LOWER(p.category) LIKE '%voucher%' THEN 50
    ELSE 5
  END as reward_coins,
  1 as sort_order
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
)
AND p.is_active = true;

-- ==================== PART 9: VERIFICATION QUERY ====================

-- Show all products with their categories and variant counts
SELECT 
  p.id,
  p.name,
  p.category,
  pc.name as category_name,
  p.view_count,
  COUNT(DISTINCT pv.id) as variant_count,
  CASE 
    WHEN COUNT(DISTINCT pv.id) > 0 THEN 'Has Variants'
    ELSE 'No Variants'
  END as status
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
WHERE p.is_active = true
GROUP BY p.id, pc.id
ORDER BY p.created_at DESC;

-- ==================== DONE! ====================
