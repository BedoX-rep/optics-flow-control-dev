
-- Add additional costs settings to user_personalisation table
ALTER TABLE user_personalisation 
ADD COLUMN IF NOT EXISTS sv_lens_cost DECIMAL(10,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS progressive_lens_cost DECIMAL(10,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS frames_cost DECIMAL(10,2) DEFAULT 10.00;

-- Update existing records with default values
UPDATE user_personalisation 
SET 
    sv_lens_cost = 10.00,
    progressive_lens_cost = 20.00,
    frames_cost = 10.00
WHERE 
    sv_lens_cost IS NULL OR 
    progressive_lens_cost IS NULL OR 
    frames_cost IS NULL;
