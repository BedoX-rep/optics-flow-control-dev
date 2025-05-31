
-- Add tax_percentage field to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 20.00;

-- Add comment to explain the field
COMMENT ON COLUMN purchases.tax_percentage IS 'Tax percentage applied to the purchase (default 20%)';
