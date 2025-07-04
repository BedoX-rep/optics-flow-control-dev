
-- Add is_favorite column to clients table
ALTER TABLE clients ADD COLUMN is_favorite BOOLEAN DEFAULT false;

-- Add index for better performance on favorite queries
CREATE INDEX idx_clients_is_favorite ON clients(is_favorite) WHERE is_favorite = true;
