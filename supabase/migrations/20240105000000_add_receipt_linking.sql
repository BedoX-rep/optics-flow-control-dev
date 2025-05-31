
-- Add receipt linking fields to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS linked_receipts TEXT[];
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS link_date_from DATE;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS link_date_to DATE;

-- Create index for linked receipts for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_linked_receipts ON purchases USING GIN(linked_receipts);
