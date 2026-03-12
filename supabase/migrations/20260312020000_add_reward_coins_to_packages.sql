-- Add reward_coins column to diamond_packages if it doesn't exist
ALTER TABLE public.diamond_packages 
ADD COLUMN IF NOT EXISTS reward_coins INTEGER DEFAULT 0;

-- Create function to update package reward coins
CREATE OR REPLACE FUNCTION public.update_package_reward_coins(
  _package_id UUID,
  _reward_coins INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE public.diamond_packages 
  SET reward_coins = _reward_coins 
  WHERE id = _package_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_package_reward_coins TO authenticated;
