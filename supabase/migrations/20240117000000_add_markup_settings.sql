
-- Add markup settings columns to user_information table
ALTER TABLE user_information 
ADD COLUMN IF NOT EXISTS markup_sph_range_1_min DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_sph_range_1_max DECIMAL(5,2) DEFAULT 4,
ADD COLUMN IF NOT EXISTS markup_sph_range_1_markup DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_sph_range_2_min DECIMAL(5,2) DEFAULT 4,
ADD COLUMN IF NOT EXISTS markup_sph_range_2_max DECIMAL(5,2) DEFAULT 8,
ADD COLUMN IF NOT EXISTS markup_sph_range_2_markup DECIMAL(5,2) DEFAULT 15,
ADD COLUMN IF NOT EXISTS markup_sph_range_3_min DECIMAL(5,2) DEFAULT 8,
ADD COLUMN IF NOT EXISTS markup_sph_range_3_max DECIMAL(5,2) DEFAULT 999,
ADD COLUMN IF NOT EXISTS markup_sph_range_3_markup DECIMAL(5,2) DEFAULT 30,
ADD COLUMN IF NOT EXISTS markup_cyl_range_1_min DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_cyl_range_1_max DECIMAL(5,2) DEFAULT 2,
ADD COLUMN IF NOT EXISTS markup_cyl_range_1_markup DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_cyl_range_2_min DECIMAL(5,2) DEFAULT 2,
ADD COLUMN IF NOT EXISTS markup_cyl_range_2_max DECIMAL(5,2) DEFAULT 4,
ADD COLUMN IF NOT EXISTS markup_cyl_range_2_markup DECIMAL(5,2) DEFAULT 15,
ADD COLUMN IF NOT EXISTS markup_cyl_range_3_min DECIMAL(5,2) DEFAULT 4,
ADD COLUMN IF NOT EXISTS markup_cyl_range_3_max DECIMAL(5,2) DEFAULT 999,
ADD COLUMN IF NOT EXISTS markup_cyl_range_3_markup DECIMAL(5,2) DEFAULT 30;

-- Update the initialize function to include markup settings
CREATE OR REPLACE FUNCTION public.initialize_user_information(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update or insert user information with default personalization and markup settings
  INSERT INTO public.user_information (
    user_id, 
    auto_additional_costs,
    sv_lens_cost,
    progressive_lens_cost,
    frames_cost,
    markup_sph_range_1_min,
    markup_sph_range_1_max,
    markup_sph_range_1_markup,
    markup_sph_range_2_min,
    markup_sph_range_2_max,
    markup_sph_range_2_markup,
    markup_sph_range_3_min,
    markup_sph_range_3_max,
    markup_sph_range_3_markup,
    markup_cyl_range_1_min,
    markup_cyl_range_1_max,
    markup_cyl_range_1_markup,
    markup_cyl_range_2_min,
    markup_cyl_range_2_max,
    markup_cyl_range_2_markup,
    markup_cyl_range_3_min,
    markup_cyl_range_3_max,
    markup_cyl_range_3_markup
  )
  VALUES (
    user_uuid, 
    true,
    10.00,
    20.00,
    10.00,
    0, 4, 0,
    4, 8, 15,
    8, 999, 30,
    0, 2, 0,
    2, 4, 15,
    4, 999, 30
  )
  ON CONFLICT (user_id) DO UPDATE SET
    auto_additional_costs = COALESCE(user_information.auto_additional_costs, true),
    sv_lens_cost = COALESCE(user_information.sv_lens_cost, 10.00),
    progressive_lens_cost = COALESCE(user_information.progressive_lens_cost, 20.00),
    frames_cost = COALESCE(user_information.frames_cost, 10.00),
    markup_sph_range_1_min = COALESCE(user_information.markup_sph_range_1_min, 0),
    markup_sph_range_1_max = COALESCE(user_information.markup_sph_range_1_max, 4),
    markup_sph_range_1_markup = COALESCE(user_information.markup_sph_range_1_markup, 0),
    markup_sph_range_2_min = COALESCE(user_information.markup_sph_range_2_min, 4),
    markup_sph_range_2_max = COALESCE(user_information.markup_sph_range_2_max, 8),
    markup_sph_range_2_markup = COALESCE(user_information.markup_sph_range_2_markup, 15),
    markup_sph_range_3_min = COALESCE(user_information.markup_sph_range_3_min, 8),
    markup_sph_range_3_max = COALESCE(user_information.markup_sph_range_3_max, 999),
    markup_sph_range_3_markup = COALESCE(user_information.markup_sph_range_3_markup, 30),
    markup_cyl_range_1_min = COALESCE(user_information.markup_cyl_range_1_min, 0),
    markup_cyl_range_1_max = COALESCE(user_information.markup_cyl_range_1_max, 2),
    markup_cyl_range_1_markup = COALESCE(user_information.markup_cyl_range_1_markup, 0),
    markup_cyl_range_2_min = COALESCE(user_information.markup_cyl_range_2_min, 2),
    markup_cyl_range_2_max = COALESCE(user_information.markup_cyl_range_2_max, 4),
    markup_cyl_range_2_markup = COALESCE(user_information.markup_cyl_range_2_markup, 15),
    markup_cyl_range_3_min = COALESCE(user_information.markup_cyl_range_3_min, 4),
    markup_cyl_range_3_max = COALESCE(user_information.markup_cyl_range_3_max, 999),
    markup_cyl_range_3_markup = COALESCE(user_information.markup_cyl_range_3_markup, 30);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
