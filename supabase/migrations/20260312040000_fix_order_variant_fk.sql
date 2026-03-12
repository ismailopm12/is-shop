-- Fix orders table foreign key constraint for variant_id
-- Make variant_id nullable and allow references to diamond_packages

-- First, drop the existing constraint if it exists
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_variant_id_fkey;

-- Recreate with proper nullable reference
ALTER TABLE public.orders 
ADD CONSTRAINT orders_variant_id_fkey 
FOREIGN KEY (variant_id) REFERENCES public.diamond_packages(id) ON DELETE SET NULL;

-- Also add comment for documentation
COMMENT ON COLUMN public.orders.variant_id IS 'References diamond_packages.id (nullable)';
