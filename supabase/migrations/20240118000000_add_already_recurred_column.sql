
-- Add already_recurred column to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS already_recurred BOOLEAN DEFAULT FALSE;

-- Create index for better performance when filtering recurring purchases
CREATE INDEX IF NOT EXISTS idx_purchases_already_recurred ON purchases(already_recurred);
