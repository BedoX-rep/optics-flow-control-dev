
-- Add access_code and role to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN access_code VARCHAR(5) UNIQUE,
ADD COLUMN role TEXT DEFAULT 'Store Staff' CHECK (role IN ('Admin', 'Store Staff'));

-- Generate default access codes for existing users
UPDATE public.subscriptions 
SET access_code = UPPER(LEFT(MD5(RANDOM()::text), 5))
WHERE access_code IS NULL;

-- Make access_code required for new users
ALTER TABLE public.subscriptions 
ALTER COLUMN access_code SET NOT NULL;

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
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
CREATE POLICY "Users can view their own permissions" ON permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions" ON permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE user_id = auth.uid() AND role = 'Admin'
    )
  );

-- Create default permissions for existing users
INSERT INTO public.permissions (user_id, can_view_financial, can_manage_purchases)
SELECT user_id, true, true
FROM public.subscriptions
WHERE NOT EXISTS (
  SELECT 1 FROM public.permissions WHERE permissions.user_id = subscriptions.user_id
);

-- Function to create default permissions for new users
CREATE OR REPLACE FUNCTION public.create_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.user_id,
    true,
    true,
    true,
    CASE WHEN NEW.role = 'Admin' THEN true ELSE false END,
    CASE WHEN NEW.role = 'Admin' THEN true ELSE false END,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create permissions when subscription is created
DROP TRIGGER IF EXISTS create_permissions_on_subscription ON subscriptions;
CREATE TRIGGER create_permissions_on_subscription
AFTER INSERT ON subscriptions
FOR EACH ROW EXECUTE FUNCTION public.create_default_permissions();

-- Function to promote user to admin with access code
CREATE OR REPLACE FUNCTION public.promote_to_admin(input_access_code VARCHAR(5))
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user with matching access code
  SELECT user_id INTO target_user_id
  FROM subscriptions
  WHERE access_code = input_access_code;
  
  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid access code';
    RETURN;
  END IF;
  
  -- Update role to Admin
  UPDATE subscriptions
  SET role = 'Admin'
  WHERE user_id = target_user_id;
  
  -- Update permissions to admin level
  UPDATE permissions
  SET 
    can_view_financial = true,
    can_manage_purchases = true,
    updated_at = NOW()
  WHERE user_id = target_user_id;
  
  RETURN QUERY SELECT true, 'Successfully promoted to Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
