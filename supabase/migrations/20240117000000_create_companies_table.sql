
-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own companies" ON companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies" ON companies
  FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);

-- Insert default companies for all existing users
INSERT INTO companies (name, user_id, is_default)
SELECT 'Indo', id, TRUE FROM auth.users
ON CONFLICT (name, user_id) DO NOTHING;

INSERT INTO companies (name, user_id, is_default)
SELECT 'ABlens', id, TRUE FROM auth.users
ON CONFLICT (name, user_id) DO NOTHING;

INSERT INTO companies (name, user_id, is_default)
SELECT 'Essilor', id, TRUE FROM auth.users
ON CONFLICT (name, user_id) DO NOTHING;

INSERT INTO companies (name, user_id, is_default)
SELECT 'GLASSANDLENS', id, TRUE FROM auth.users
ON CONFLICT (name, user_id) DO NOTHING;

INSERT INTO companies (name, user_id, is_default)
SELECT 'Optifak', id, TRUE FROM auth.users
ON CONFLICT (name, user_id) DO NOTHING;

-- Function to create default companies for new users
CREATE OR REPLACE FUNCTION create_default_companies_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO companies (name, user_id, is_default) VALUES
    ('Indo', NEW.id, TRUE),
    ('ABlens', NEW.id, TRUE),
    ('Essilor', NEW.id, TRUE),
    ('GLASSANDLENS', NEW.id, TRUE),
    ('Optifak', NEW.id, TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default companies when new user signs up
CREATE TRIGGER create_companies_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_companies_for_new_user();
