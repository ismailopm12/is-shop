-- Fix order status for wallet and coin payments
-- These payment methods should auto-complete orders

-- Add comment to document order status behavior
COMMENT ON COLUMN public.orders.status IS 'Order status: pending (requires approval), completed (auto-completed for wallet/coin), cancelled, processing';

-- No schema changes needed - this is handled in application logic
-- Wallet and Coin payments insert orders with status = 'completed'
-- UddoktaPay inserts orders with status = 'pending' then updates to 'completed' via webhook

-- Optional: Update any existing pending wallet/coin orders to completed
UPDATE public.orders 
SET status = 'completed' 
WHERE payment_method IN ('wallet', 'coin') 
AND status = 'pending';
