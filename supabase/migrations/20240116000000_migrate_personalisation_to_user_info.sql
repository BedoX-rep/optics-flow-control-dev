
-- Add personalization fields to user_information table
ALTER TABLE user_information 
ADD COLUMN IF NOT EXISTS auto_additional_costs BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sv_lens_cost DECIMAL(10,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS progressive_lens_cost DECIMAL(10,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS frames_cost DECIMAL(10,2) DEFAULT 10.00;

-- Migrate existing data from user_personalisation to user_information
UPDATE user_information 
SET 
    auto_additional_costs = up.auto_additional_costs,
    sv_lens_cost = up.sv_lens_cost,
    progressive_lens_cost = up.progressive_lens_cost,
    frames_cost = up.frames_cost
FROM user_personalisation up
WHERE user_information.user_id = up.user_id;

-- Drop the old user_personalisation table
DROP TABLE IF EXISTS user_personalisation CASCADE;

-- Update the initialize function to work with user_information
CREATE OR REPLACE FUNCTION public.initialize_user_personalisation(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update or insert user information with default personalization settings
  INSERT INTO public.user_information (
    user_id, 
    auto_additional_costs,
    sv_lens_cost,
    progressive_lens_cost,
    frames_cost
  )
  VALUES (
    user_uuid, 
    true,
    10.00,
    20.00,
    10.00
  )
  ON CONFLICT (user_id) DO UPDATE SET
    auto_additional_costs = COALESCE(user_information.auto_additional_costs, true),
    sv_lens_cost = COALESCE(user_information.sv_lens_cost, 10.00),
    progressive_lens_cost = COALESCE(user_information.progressive_lens_cost, 20.00),
    frames_cost = COALESCE(user_information.frames_cost, 10.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
