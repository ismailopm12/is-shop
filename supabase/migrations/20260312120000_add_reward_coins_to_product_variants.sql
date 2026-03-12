-- ============================================
-- ADD reward_coins TO product_variants TABLE
-- This fixes the "No packages" issue
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check if reward_coins column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'product_variants' 
  AND column_name = 'reward_coins'
) as reward_coins_exists;

-- Step 2: Add reward_coins column if it doesn't exist
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS reward_coins INTEGER DEFAULT 0;

-- Step 3: Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'product_variants'
ORDER BY ordinal_position;

-- Step 4: Update existing variants to have 0 reward coins
UPDATE public.product_variants 
SET reward_coins = 0 
WHERE reward_coins IS NULL;

-- Step 5: Migrate any existing diamond_packages reward_coins
-- This ensures data consistency between old and new systems
UPDATE public.product_variants pv
SET reward_coins = dp.reward_coins
FROM public.diamond_packages dp
WHERE pv.product_id = dp.product_id 
  AND pv.value::TEXT = dp.diamonds::TEXT
  AND dp.reward_coins IS NOT NULL 
  AND dp.reward_coins > 0
  AND (pv.reward_coins = 0 OR pv.reward_coins IS NULL);

-- Step 6: Verify the data
SELECT 
  pv.id,
  pv.name,
  pv.value,
  pv.price,
  pv.reward_coins,
  pv.product_id,
  p.name as product_name
FROM product_variants pv
LEFT JOIN products p ON pv.product_id = p.id
ORDER BY pv.created_at DESC
LIMIT 10;

-- Success message
SELECT '✅ reward_coins column added successfully!' as status,
       'Admin can now add variants with reward coins' as message;
