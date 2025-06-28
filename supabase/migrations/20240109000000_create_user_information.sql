
-- Create user_information table for storing optician details
CREATE TABLE IF NOT EXISTS public.user_information (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name VARCHAR(255),
  display_name VARCHAR(255),
  address TEXT,
  vat_number VARCHAR(50),
  ice VARCHAR(50),
  inpe VARCHAR(50),
  company_legal_status VARCHAR(100),
  logo_url TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_information ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own information" ON public.user_information
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own information" ON public.user_information
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own information" ON public.user_information
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_information_updated_at
  BEFORE UPDATE ON public.user_information
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize user information from subscription data
CREATE OR REPLACE FUNCTION public.initialize_user_information(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  sub_data RECORD;
BEGIN
  -- Get subscription data
  SELECT store_name, display_name, email 
  INTO sub_data
  FROM public.subscriptions 
  WHERE user_id = user_uuid;
  
  -- Insert user information if it doesn't exist
  INSERT INTO public.user_information (
    user_id, 
    store_name, 
    display_name, 
    email
  )
  VALUES (
    user_uuid, 
    sub_data.store_name, 
    sub_data.display_name, 
    sub_data.email
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
