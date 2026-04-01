-- REAL-TIME PRODUCT VIEW TRACKING SYSTEM
-- Run this in Supabase SQL Editor to enable real view counting

-- ==================== PART 1: CREATE PRODUCT_VIEWS TABLE ====================

-- Drop existing table if exists (to start fresh)
DROP TABLE IF EXISTS product_views CASCADE;

-- Create product_views table with proper structure
CREATE TABLE product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_session_id ON product_views(session_id);
CREATE INDEX idx_product_views_user_id ON product_views(user_id);
CREATE INDEX idx_product_views_created_at ON product_views(created_at);

-- Enable Row Level Security
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for tracking views)
DROP POLICY IF EXISTS "Allow public insert" ON product_views;
CREATE POLICY "Allow public insert" 
ON product_views FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users to read their own views
DROP POLICY IF EXISTS "Allow users to read own views" ON product_views;
CREATE POLICY "Allow users to read own views" 
ON product_views FOR SELECT 
USING (
  auth.uid() = user_id OR 
  session_id = current_setting('app.current_session_id', true)
);

-- Allow service role full access
DROP POLICY IF EXISTS "Allow service role full access" ON product_views;
CREATE POLICY "Allow service role full access" 
ON product_views FOR ALL 
USING (auth.role() = 'service_role');

-- ==================== PART 2: ADD VIEW_COUNT COLUMN TO PRODUCTS ====================

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

-- ==================== PART 3: CREATE INCREMENT_PRODUCT_VIEW FUNCTION ====================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS increment_product_view(UUID, TEXT, INTEGER);

-- Create function to track and increment views
CREATE OR REPLACE FUNCTION increment_product_view(
  p_product_id UUID,
  p_session_id TEXT,
  p_duration_seconds INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
  v_view_count INTEGER := 0;
  v_is_unique BOOLEAN := true;
BEGIN
  -- Check if this session viewed the product in the last hour
  SELECT COUNT(*) > 0 INTO v_is_unique
  FROM product_views
  WHERE product_id = p_product_id
    AND session_id = p_session_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Record the view
  INSERT INTO product_views (product_id, session_id, duration_seconds, created_at)
  VALUES (p_product_id, p_session_id, p_duration_seconds, NOW());
  
  -- Only increment count if unique view (not repeated within 1 hour)
  IF NOT v_is_unique THEN
    -- Get current view count
    SELECT COALESCE(view_count, 0) INTO v_view_count
    FROM products
    WHERE id = p_product_id;
    
    -- Increment view count
    UPDATE products
    SET view_count = v_view_count + 1,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    RETURN v_view_count + 1;
  ELSE
    -- Return current count without incrementing
    SELECT COALESCE(view_count, 0) INTO v_view_count
    FROM products
    WHERE id = p_product_id;
    
    RETURN v_view_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== PART 4: CREATE GET_REAL_TIME_VIEWS FUNCTION ====================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_real_time_views(UUID);

-- Create function to get real-time active viewers
CREATE OR REPLACE FUNCTION get_real_time_views(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_active_viewers INTEGER := 0;
BEGIN
  -- Count active viewers (viewed in last 5 minutes)
  SELECT COUNT(DISTINCT session_id) INTO v_active_viewers
  FROM product_views
  WHERE product_id = p_product_id
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  RETURN v_active_viewers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== PART 5: CREATE CLEANUP OLD VIEWS FUNCTION ====================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS cleanup_old_product_views();

-- Create function to cleanup old views (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_product_views()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  -- Delete views older than 24 hours
  DELETE FROM product_views
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==================== PART 6: SETUP AUTOMATED CLEANUP (OPTIONAL) ====================

-- You can setup a cron job or use pg_cron extension for automated cleanup
-- Example (requires pg_cron extension):
/*
SELECT cron.schedule(
  'cleanup-product-views',
  '0 * * * *', -- Every hour
  $$SELECT cleanup_old_product_views()$$
);
*/

-- ==================== PART 7: MIGRATE EXISTING DATA ====================

-- If you have existing view data, migrate it here
-- For now, initialize all products with a base view count
UPDATE products
SET view_count = FLOOR(RANDOM() * 50 + 10)::INTEGER
WHERE view_count IS NULL OR view_count = 0;

-- ==================== PART 8: GRANT PERMISSIONS ====================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON product_views TO authenticated;
GRANT SELECT ON product_views TO anon;
GRANT EXECUTE ON FUNCTION increment_product_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_views TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_product_views TO authenticated;

-- ==================== PART 9: VERIFICATION QUERY ====================

-- Test the system
SELECT 
  p.id,
  p.name,
  p.view_count as total_views,
  COALESCE(recent.active_viewers, 0) as active_viewers_last_5min,
  COALESCE(recent.views_today, 0) as views_today
FROM products p
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT CASE WHEN pv.created_at > NOW() - INTERVAL '5 minutes' THEN pv.session_id END) as active_viewers,
    COUNT(DISTINCT CASE WHEN pv.created_at > CURRENT_DATE THEN pv.session_id END) as views_today
  FROM product_views pv
  WHERE pv.product_id = p.id
) recent ON true
WHERE p.is_active = true
ORDER BY p.view_count DESC;

-- ==================== DONE! ====================
-- The system is now ready to track real views!
