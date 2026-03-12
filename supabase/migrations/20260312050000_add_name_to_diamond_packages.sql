-- Add name column to diamond_packages for custom package names
ALTER TABLE public.diamond_packages 
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT NULL;

-- Update existing packages to have null name (will display as "—" in UI)
UPDATE public.diamond_packages SET name = NULL WHERE name IS NULL;

-- Add comment
COMMENT ON COLUMN public.diamond_packages.name IS 'Custom package name (optional). If null, displays value only.';
