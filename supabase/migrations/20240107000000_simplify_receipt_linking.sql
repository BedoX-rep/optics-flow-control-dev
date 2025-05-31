
-- Add linking_category field to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS linking_category TEXT;

-- Drop the existing triggers and functions for automatic linking
DROP TRIGGER IF EXISTS trigger_link_new_receipts ON receipts;
DROP FUNCTION IF EXISTS link_new_receipts_to_purchases();

-- Create a simple index for linking_category
CREATE INDEX IF NOT EXISTS idx_purchases_linking_category ON purchases(linking_category);

-- Comment explaining the new approach
-- Receipt linking is now handled on the frontend when the purchases page loads
-- This allows for more flexible linking categories and simpler maintenance
