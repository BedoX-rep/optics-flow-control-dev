
-- Required Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ENUM TYPES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_type') THEN
    CREATE TYPE subscription_type AS ENUM ('Trial', 'Monthly', 'Quarterly', 'Lifetime');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('Active', 'Suspended', 'Cancelled', 'inActive', 'Expired');
  END IF;
END $$;

-- Add access_code to subscriptions table (remove role column since we're making it session-based)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS access_code VARCHAR(5) UNIQUE;

-- Remove role column if it exists (since we want session-based roles only)
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS role;

-- Generate default access codes for existing users who don't have one
UPDATE public.subscriptions 
SET access_code = UPPER(LEFT(MD5(RANDOM()::text), 5))
WHERE access_code IS NULL;

-- Make access_code required for new users
ALTER TABLE public.subscriptions 
ALTER COLUMN access_code SET NOT NULL;

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  can_manage_products BOOLEAN DEFAULT true,
  can_manage_clients BOOLEAN DEFAULT true,
  can_manage_receipts BOOLEAN DEFAULT true,
  can_view_financial BOOLEAN DEFAULT false,
  can_manage_purchases BOOLEAN DEFAULT false,
  can_access_dashboard BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for permissions
DROP POLICY IF EXISTS "Users can view their own permissions" ON permissions;
CREATE POLICY "Users can view their own permissions" ON permissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all permissions" ON permissions;
CREATE POLICY "Admins can manage all permissions" ON permissions
  FOR ALL USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM subscriptions WHERE access_code IS NOT NULL
  ));

-- Create default permissions for existing users who don't have permissions yet
INSERT INTO public.permissions (user_id, can_view_financial, can_manage_purchases)
SELECT user_id, false, false
FROM public.subscriptions
WHERE NOT EXISTS (
  SELECT 1 FROM public.permissions WHERE permissions.user_id = subscriptions.user_id
);

-- Update the handle_new_user function to create access code and default permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    email,
    display_name,
    start_date,
    end_date,
    subscription_type,
    subscription_status,
    trial_used,
    access_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW(),
    NOW() + INTERVAL '7 days',
    'Trial',
    'Active',
    TRUE,
    COALESCE(NEW.raw_user_meta_data->>'access_code', UPPER(LEFT(MD5(RANDOM()::text), 5)))
  );

  -- Create default Store Staff permissions
  INSERT INTO public.permissions (
    user_id,
    can_manage_products,
    can_manage_clients, 
    can_manage_receipts,
    can_view_financial,
    can_manage_purchases,
    can_access_dashboard
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    false,
    false,
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if access code is valid (for session elevation)
CREATE OR REPLACE FUNCTION public.check_access_code(input_access_code VARCHAR(5))
RETURNS TABLE (valid BOOLEAN, message TEXT) AS $$
DECLARE
  code_exists BOOLEAN;
BEGIN
  -- Check if access code exists
  SELECT EXISTS(
    SELECT 1 FROM subscriptions WHERE access_code = input_access_code
  ) INTO code_exists;
  
  IF code_exists THEN
    RETURN QUERY SELECT true, 'Valid access code';
  ELSE
    RETURN QUERY SELECT false, 'Invalid access code';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin permissions (for session-based admin role)
CREATE OR REPLACE FUNCTION public.get_admin_permissions()
RETURNS TABLE (
  can_manage_products BOOLEAN,
  can_manage_clients BOOLEAN,
  can_manage_receipts BOOLEAN,
  can_view_financial BOOLEAN,
  can_manage_purchases BOOLEAN,
  can_access_dashboard BOOLEAN
) AS $$
BEGIN
  RETURN QUERY SELECT true, true, true, true, true, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the old promote_to_admin function since we don't need permanent role changes
DROP FUNCTION IF EXISTS public.promote_to_admin(VARCHAR(5));

-- Remove the old create_default_permissions function and trigger
DROP TRIGGER IF EXISTS create_permissions_on_subscription ON subscriptions;
DROP FUNCTION IF EXISTS public.create_default_permissions();
