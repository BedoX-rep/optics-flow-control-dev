
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

-- First, safely remove the role column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'role') THEN
    ALTER TABLE public.subscriptions DROP COLUMN role;
  END IF;
END $$;

-- Add access_code to subscriptions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'access_code') THEN
    ALTER TABLE public.subscriptions ADD COLUMN access_code VARCHAR(5);
  END IF;
END $$;

-- Generate default access codes for existing users who don't have one
UPDATE public.subscriptions 
SET access_code = UPPER(LEFT(MD5(RANDOM()::text), 5))
WHERE access_code IS NULL;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_access_code_key') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_access_code_key UNIQUE (access_code);
  END IF;
END $$;

-- Make access_code required for new users
ALTER TABLE public.subscriptions 
ALTER COLUMN access_code SET NOT NULL;

-- Create permissions table if it doesn't exist
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own permissions" ON permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON permissions;

-- RLS policies for permissions
CREATE POLICY "Users can view their own permissions" ON permissions
  FOR SELECT USING (auth.uid() = user_id);

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

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Update the handle_new_user function to create access code and default permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert subscription record
  INSERT INTO public.subscriptions (
    user_id,
    email,
    display_name,
    start_date,
    end_date,
    subscription_type,
    subscription_status,
    trial_used,
    access_code,
    store_name,
    referral_code,
    referred_by
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
    COALESCE(NEW.raw_user_meta_data->>'access_code', UPPER(LEFT(MD5(RANDOM()::text), 5))),
    COALESCE(NEW.raw_user_meta_data->>'store_name', 'Optique'),
    CASE WHEN NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN 
      UPPER(LEFT(MD5(RANDOM()::text), 4)) 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'referred_by'
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

-- Create trigger for new user registration
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if access code is valid and belongs to current user (for session elevation)
CREATE OR REPLACE FUNCTION public.check_access_code(input_access_code VARCHAR(5))
RETURNS TABLE (valid BOOLEAN, message TEXT) AS $$
DECLARE
  code_belongs_to_user BOOLEAN;
BEGIN
  -- Check if access code exists and belongs to the current authenticated user
  SELECT EXISTS(
    SELECT 1 FROM subscriptions 
    WHERE access_code = input_access_code AND user_id = auth.uid()
  ) INTO code_belongs_to_user;
  
  IF code_belongs_to_user THEN
    RETURN QUERY SELECT true, 'Valid access code - session elevated to Admin';
  ELSE
    RETURN QUERY SELECT false, 'Invalid access code or access code does not belong to your account';
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

-- Clean up old functions that are no longer needed
DROP FUNCTION IF EXISTS public.promote_to_admin(VARCHAR(5));
DROP TRIGGER IF EXISTS create_permissions_on_subscription ON subscriptions;
DROP FUNCTION IF EXISTS public.create_default_permissions();
