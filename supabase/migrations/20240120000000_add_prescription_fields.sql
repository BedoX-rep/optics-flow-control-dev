
-- Add store_prescription and optician_prescribed_by fields to clients table
ALTER TABLE clients
ADD COLUMN store_prescription BOOLEAN DEFAULT false,
ADD COLUMN optician_prescribed_by TEXT;
