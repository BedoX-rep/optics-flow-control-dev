
-- Add renewal fields to clients table
ALTER TABLE clients 
ADD COLUMN renewal_date DATE,
ADD COLUMN need_renewal BOOLEAN DEFAULT FALSE,
ADD COLUMN renewal_times INTEGER DEFAULT 0;

-- Set default renewal_date to creation_date + 1.5 years for existing clients
UPDATE clients 
SET renewal_date = (created_at::date + INTERVAL '1.5 years')::date
WHERE renewal_date IS NULL;

-- Create function to automatically set renewal_date for new clients
CREATE OR REPLACE FUNCTION set_default_renewal_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.renewal_date IS NULL THEN
    NEW.renewal_date := (NEW.created_at::date + INTERVAL '1.5 years')::date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set renewal_date on insert
CREATE TRIGGER trigger_set_default_renewal_date
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_default_renewal_date();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_renewal_date ON clients(renewal_date);
CREATE INDEX IF NOT EXISTS idx_clients_need_renewal ON clients(need_renewal);
CREATE INDEX IF NOT EXISTS idx_clients_renewal_times ON clients(renewal_times);
