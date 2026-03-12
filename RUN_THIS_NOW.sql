-- ============================================
-- QUICK FIX - COPY PASTE THIS ENTIRE SCRIPT
-- Run in Supabase SQL Editor NOW
-- ============================================

-- 1. Add reward_coins column to product_variants
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS reward_coins INTEGER DEFAULT 0;

-- 2. Update existing variants
UPDATE public.product_variants 
SET reward_coins = COALESCE(reward_coins, 0)
WHERE reward_coins IS NULL;

-- 3. Fix RLS for product_variants (allow public read)
DROP POLICY IF EXISTS "Anyone can read active variants" ON public.product_variants;
CREATE POLICY "Anyone can read active variants" ON public.product_variants
FOR SELECT TO public
USING (is_active = true);

-- 4. Fix RLS for seo_settings (allow public read)
DROP POLICY IF EXISTS "Anyone can view SEO settings" ON public.seo_settings;
CREATE POLICY "Anyone can view SEO settings" ON public.seo_settings
FOR SELECT TO public
USING (true);

-- 5. Fix RLS for promotional_popups (allow public read of active popups)
DROP POLICY IF EXISTS "Anyone can view active popups" ON public.promotional_popups;
CREATE POLICY "Anyone can view active popups" ON public.promotional_popups
FOR SELECT TO public
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);

-- 6. Verify everything is working
SELECT 'product_variants' as table, COUNT(*) as count, AVG(reward_coins) as avg_coins FROM product_variants WHERE is_active = true
UNION ALL
SELECT 'seo_settings', COUNT(*), NULL FROM seo_settings
UNION ALL
SELECT 'promotional_popups', COUNT(*), NULL FROM promotional_popups WHERE is_active = true;

-- Done! You should see counts for all tables.
-- Refresh your browser now (Ctrl+Shift+R)
