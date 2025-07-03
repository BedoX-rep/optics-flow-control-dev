
-- Add renewal date and renewed status fields to clients table
ALTER TABLE clients 
ADD COLUMN renewal_date DATE,
ADD COLUMN renewed BOOLEAN DEFAULT false;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_renewal_date ON clients(renewal_date);
CREATE INDEX IF NOT EXISTS idx_clients_renewed ON clients(renewed);
