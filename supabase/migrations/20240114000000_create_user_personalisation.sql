
-- Create user_personalisation table for storing user preferences
CREATE TABLE user_personalisation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    auto_additional_costs BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE user_personalisation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personalisation"
    ON user_personalisation FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personalisation"
    ON user_personalisation FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personalisation"
    ON user_personalisation FOR UPDATE
    USING (auth.uid() = user_id);

-- Create function to initialize user personalisation
CREATE OR REPLACE FUNCTION initialize_user_personalisation(user_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO user_personalisation (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_personalisation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_personalisation_updated_at
    BEFORE UPDATE ON user_personalisation
    FOR EACH ROW
    EXECUTE FUNCTION update_user_personalisation_updated_at();
