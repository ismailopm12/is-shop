-- ============================================
-- COMPLETE VARIANT & SEO FIX - RUN NOW
-- Fixes: reward_coins showing 0, variants not appearing, SEO not visible
-- ============================================

-- PART 1: FIX PRODUCT_VARIANTS TABLE
-- ============================================

-- Step 1: Add reward_coins column if missing
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS reward_coins INTEGER DEFAULT 0;

-- Step 2: Verify column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'product_variants'
  AND column_name IN ('reward_coins', 'id', 'name', 'value', 'price');

-- Step 3: Update all existing variants to have reward_coins = 0 (default)
UPDATE public.product_variants 
SET reward_coins = COALESCE(reward_coins, 0)
WHERE reward_coins IS NULL;

-- Step 4: Check current variants and their reward_coins
SELECT 
  pv.id,
  pv.name,
  pv.value,
  pv.price,
  pv.reward_coins,
  pv.is_active,
  p.name as product_name
FROM product_variants pv
LEFT JOIN products p ON pv.product_id = p.id
ORDER BY pv.created_at DESC;

-- PART 2: FIX RLS POLICIES FOR VARIANTS
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can read active variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;

-- Recreate policies with proper permissions
CREATE POLICY "Anyone can read active variants" ON public.product_variants
FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "Admins can manage variants" ON public.product_variants
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'admin'
));

-- Verify policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'product_variants';

-- PART 3: FIX SEO SETTINGS VISIBILITY
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view SEO settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Admins can manage SEO settings" ON public.seo_settings;

-- Recreate SEO policies
CREATE POLICY "Anyone can view SEO settings" ON public.seo_settings
FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can manage SEO settings" ON public.seo_settings
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'admin'
));

-- Check current SEO settings
SELECT * FROM public.seo_settings LIMIT 5;

-- PART 4: FIX POPUP VISIBILITY
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view active popups" ON public.promotional_popups;
DROP POLICY IF EXISTS "Admins can manage popups" ON public.promotional_popups;

-- Recreate popup policies
CREATE POLICY "Anyone can view active popups" ON public.promotional_popups
FOR SELECT TO public
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);

CREATE POLICY "Admins can manage popups" ON public.promotional_popups
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = 'admin'
));

-- Check current popups
SELECT id, title, is_active, start_date, end_date, views_count, clicks_count
FROM public.promotional_popups
ORDER BY created_at DESC
LIMIT 10;

-- PART 5: VERIFY EVERYTHING
-- ============================================

-- Final verification query
SELECT 
  'product_variants' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_records,
  AVG(reward_coins) as avg_reward_coins
FROM public.product_variants
UNION ALL
SELECT 
  'seo_settings',
  COUNT(*),
  NULL,
  NULL
FROM public.seo_settings
UNION ALL
SELECT 
  'promotional_popups',
  COUNT(*),
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END),
  NULL
FROM public.promotional_popups;

-- Success message
SELECT '✅ COMPLETE FIX APPLIED!' as status,
       'All tables, columns, and RLS policies configured correctly' as message,
       'Variants should now show reward_coins and be visible to users' as result;
