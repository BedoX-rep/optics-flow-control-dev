
-- Add client_assurance and prescription fields to invoices table
ALTER TABLE invoices 
ADD COLUMN client_assurance TEXT,
ADD COLUMN right_eye_sph DECIMAL(4,2),
ADD COLUMN right_eye_cyl DECIMAL(4,2), 
ADD COLUMN right_eye_axe INTEGER,
ADD COLUMN left_eye_sph DECIMAL(4,2),
ADD COLUMN left_eye_cyl DECIMAL(4,2),
ADD COLUMN left_eye_axe INTEGER,
ADD COLUMN add_value DECIMAL(4,2);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_client_assurance ON invoices(client_assurance);
