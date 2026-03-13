-- 📊 Add Real View Counts and Analytics to Products
-- Run this in Supabase SQL Editor to enable real-time view tracking

-- =====================================================
-- 1. Add view_count column to products table
-- =====================================================

-- Add view_count column if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_view_count ON public.products(view_count DESC);

-- =====================================================
-- 2. Add view_count to product_variants table
-- =====================================================

ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_product_variants_view_count ON public.product_variants(view_count DESC);

-- =====================================================
-- 3. Create product_views tracking table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  duration_seconds INTEGER DEFAULT 0
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_variant_id ON public.product_views(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON public.product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON public.product_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_session_id ON public.product_views(session_id);

-- Enable RLS
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (view tracking)
CREATE POLICY "Anyone can insert product views"
  ON public.product_views
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view
CREATE POLICY "Authenticated users can view product views"
  ON public.product_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to view all (using service role)
GRANT ALL ON public.product_views TO service_role;

-- =====================================================
-- 4. Create function to increment view count
-- =====================================================

CREATE OR REPLACE FUNCTION public.increment_product_view(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID if logged in
  v_user_id := auth.uid();
  
  -- Insert view record
  INSERT INTO public.product_views (
    product_id,
    variant_id,
    user_id,
    session_id,
    ip_address,
    user_agent,
    duration_seconds
  ) VALUES (
    p_product_id,
    p_variant_id,
    v_user_id,
    p_session_id,
    p_ip_address::INET,
    p_user_agent,
    p_duration_seconds
  );
  
  -- Increment product view count
  UPDATE public.products
  SET view_count = view_count + 1
  WHERE id = p_product_id;
  
  -- Increment variant view count if variant_id provided
  IF p_variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET view_count = view_count + 1
    WHERE id = p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Create analytics views for admin
-- =====================================================

-- Product views summary
CREATE OR REPLACE VIEW public.admin_product_views_summary AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.view_count,
  COUNT(DISTINCT pv.user_id) as unique_users,
  COUNT(DISTINCT pv.session_id) as unique_sessions,
  AVG(pv.duration_seconds) as avg_duration,
  MAX(pv.viewed_at) as last_viewed,
  COUNT(*) FILTER (WHERE pv.viewed_at > NOW() - INTERVAL '1 hour') as views_last_hour,
  COUNT(*) FILTER (WHERE pv.viewed_at > NOW() - INTERVAL '24 hours') as views_last_24h,
  COUNT(*) FILTER (WHERE pv.viewed_at > NOW() - INTERVAL '7 days') as views_last_7d,
  COUNT(*) FILTER (WHERE pv.viewed_at > NOW() - INTERVAL '30 days') as views_last_30d
FROM public.products p
LEFT JOIN public.product_views pv ON p.id = pv.product_id
GROUP BY p.id, p.name, p.view_count
ORDER BY p.view_count DESC;

-- Variant views summary
CREATE OR REPLACE VIEW public.admin_variant_views_summary AS
SELECT 
  pv.id as variant_id,
  pv.value as variant_value,
  pv.price,
  pv.view_count,
  p.name as product_name,
  COUNT(DISTINCT v.user_id) as unique_users,
  AVG(v.duration_seconds) as avg_duration,
  MAX(v.viewed_at) as last_viewed
FROM public.product_variants pv
LEFT JOIN public.products p ON pv.product_id = p.id
LEFT JOIN public.product_views v ON pv.id = v.variant_id
GROUP BY pv.id, pv.value, pv.price, pv.view_count, p.name
ORDER BY pv.view_count DESC;

-- Grant access to authenticated users (admins)
GRANT SELECT ON public.admin_product_views_summary TO authenticated;
GRANT SELECT ON public.admin_variant_views_summary TO authenticated;

-- =====================================================
-- 6. Create hourly/daily stats functions
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_product_view_stats(
  p_product_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  hour_timestamp TIMESTAMP WITH TIME ZONE,
  view_count BIGINT,
  unique_users BIGINT,
  avg_duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', pv.viewed_at) as hour_timestamp,
    COUNT(*)::BIGINT as view_count,
    COUNT(DISTINCT pv.user_id)::BIGINT as unique_users,
    AVG(pv.duration_seconds)::NUMERIC as avg_duration
  FROM public.product_views pv
  WHERE pv.product_id = p_product_id
    AND pv.viewed_at > NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY date_trunc('hour', pv.viewed_at)
  ORDER BY hour_timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Create popular products view
-- =====================================================

CREATE OR REPLACE VIEW public.popular_products AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.image,
  p.view_count,
  COUNT(DISTINCT o.id) as order_count,
  COALESCE(SUM(o.amount), 0) as total_revenue,
  ROUND(
    CASE 
      WHEN p.view_count > 0 THEN (COUNT(DISTINCT o.id)::NUMERIC / p.view_count::NUMERIC * 100)
      ELSE 0 
    END, 
    2
  ) as conversion_rate
FROM public.products p
LEFT JOIN public.orders o ON p.id = o.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.slug, p.image, p.view_count
ORDER BY p.view_count DESC
LIMIT 20;

GRANT SELECT ON public.popular_products TO authenticated;

-- =====================================================
-- 8. Add real-time view counter trigger
-- =====================================================

-- Function to get live view count (last 5 minutes)
CREATE OR REPLACE FUNCTION public.get_live_views(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  live_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO live_count
  FROM public.product_views
  WHERE product_id = p_product_id
    AND viewed_at > NOW() - INTERVAL '5 minutes';
  
  RETURN live_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 9. Clean up old views (optional maintenance)
-- =====================================================

-- Create function to clean up views older than 90 days
CREATE OR REPLACE FUNCTION public.cleanup_old_product_views()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.product_views
  WHERE viewed_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ✅ Setup Complete!
-- =====================================================

-- Test the setup:
-- SELECT * FROM admin_product_views_summary LIMIT 10;
-- SELECT * FROM popular_products LIMIT 10;
-- SELECT increment_product_view('your-product-id');
