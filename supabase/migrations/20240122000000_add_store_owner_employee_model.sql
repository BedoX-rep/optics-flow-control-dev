-- ============================================================
-- MIGRATION: Store Owner / Employee Model
-- Replaces access-code-based admin elevation with store owner/employee hierarchy
-- ============================================================

-- 1. Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'My Store',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id)
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;



-- 2. Create store_employees table
CREATE TABLE IF NOT EXISTS public.store_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, email)
);

ALTER TABLE public.store_employees ENABLE ROW LEVEL SECURITY;

-- Store owners can manage employees
CREATE POLICY "Store owners can manage employees" ON public.store_employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores WHERE id = store_employees.store_id AND owner_id = auth.uid()
    )
  );

-- Employees can view their own record
CREATE POLICY "Employees can view own record" ON public.store_employees
  FOR SELECT USING (auth.uid() = user_id);

-- 2.5 Add RLS policies for stores (moved here so store_employees exists)
-- Store owner can do everything with their store
CREATE POLICY "Store owners can manage their store" ON public.stores
  FOR ALL USING (auth.uid() = owner_id);

-- Employees can view their store
CREATE POLICY "Employees can view their store" ON public.stores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.store_employees
      WHERE store_id = stores.id AND user_id = auth.uid() AND status = 'active'
    )
  );

-- 3. Add role column to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'owner'
    CHECK (role IN ('owner', 'employee'));

-- Set all existing users as owners
UPDATE public.subscriptions SET role = 'owner' WHERE role IS NULL;

-- 4. Add store_id to subscriptions for employees
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);

-- 5. Create stores for all existing users (they become owners)
INSERT INTO public.stores (owner_id, name)
SELECT s.user_id, COALESCE(s.store_name, 'My Store')
FROM public.subscriptions s
WHERE NOT EXISTS (SELECT 1 FROM public.stores WHERE owner_id = s.user_id)
ON CONFLICT (owner_id) DO NOTHING;

-- 6. Make access_code nullable (deprecated)
ALTER TABLE public.subscriptions ALTER COLUMN access_code DROP NOT NULL;

-- 7. Update permissions RLS to use store model
DROP POLICY IF EXISTS "Users can view their own permissions" ON permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON permissions;

-- Users can always view their own permissions
CREATE POLICY "Users can view their own permissions" ON permissions
  FOR SELECT USING (auth.uid() = user_id);

-- Store owners can manage permissions of their employees
CREATE POLICY "Store owners can manage employee permissions" ON permissions
  FOR ALL USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.store_employees se ON se.store_id = s.id
      WHERE s.owner_id = auth.uid() AND se.user_id = permissions.user_id AND se.status = 'active'
    )
  );

-- 8. Add RLS policy for store owners to view employee subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Store owners can view employee subscriptions' AND tablename = 'subscriptions'
  ) THEN
    CREATE POLICY "Store owners can view employee subscriptions" ON subscriptions
      FOR SELECT USING (
        auth.uid() = user_id
        OR
        EXISTS (
          SELECT 1 FROM public.stores s
          JOIN public.store_employees se ON se.store_id = s.id
          WHERE s.owner_id = auth.uid() AND se.user_id = subscriptions.user_id
        )
      );
  END IF;
END $$;

-- 9. Updated handle_new_user trigger for the new model
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
  v_employee_record RECORD;
BEGIN
  -- Check if this user was pre-registered as an employee (by a store owner)
  SELECT * INTO v_employee_record
  FROM public.store_employees
  WHERE email = NEW.email AND user_id IS NULL
  LIMIT 1;

  IF v_employee_record IS NOT NULL THEN
    -- This is an employee account created by a store owner
    INSERT INTO public.subscriptions (
      user_id, email, display_name, start_date, end_date,
      subscription_type, subscription_status, trial_used,
      access_code, store_name, role, store_id
    ) VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      NOW(), NOW() + INTERVAL '7 days',
      'Trial', 'Active', TRUE,
      UPPER(LEFT(MD5(RANDOM()::text), 5)),
      (SELECT name FROM stores WHERE id = v_employee_record.store_id),
      'employee', v_employee_record.store_id
    );

    -- Link the employee record to this user
    UPDATE public.store_employees
    SET user_id = NEW.id, updated_at = NOW()
    WHERE id = v_employee_record.id;

    -- Create restricted default permissions for employee
    INSERT INTO public.permissions (
      user_id, can_manage_products, can_manage_clients,
      can_manage_receipts, can_view_financial, can_manage_purchases,
      can_access_dashboard
    ) VALUES (
      NEW.id, true, true, true, false, false, true
    );

  ELSE
    -- This is a new store owner signing up
    INSERT INTO public.subscriptions (
      user_id, email, display_name, start_date, end_date,
      subscription_type, subscription_status, trial_used,
      access_code, store_name, referral_code, referred_by, role
    ) VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      NOW(), NOW() + INTERVAL '7 days',
      'Trial', 'Active', TRUE,
      UPPER(LEFT(MD5(RANDOM()::text), 5)),
      COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store'),
      CASE WHEN NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
        UPPER(LEFT(MD5(RANDOM()::text), 4))
        ELSE NULL
      END,
      NEW.raw_user_meta_data->>'referred_by',
      'owner'
    );

    -- Create the store
    INSERT INTO public.stores (owner_id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store'));

    -- Create full permissions for owner
    INSERT INTO public.permissions (
      user_id, can_manage_products, can_manage_clients,
      can_manage_receipts, can_view_financial, can_manage_purchases,
      can_access_dashboard
    ) VALUES (
      NEW.id, true, true, true, true, true, true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Helper function: get user's role and store info
CREATE OR REPLACE FUNCTION public.get_user_store_role()
RETURNS TABLE (
  user_role VARCHAR,
  store_id UUID,
  store_name VARCHAR
) AS $$
BEGIN
  -- Check if user is a store owner
  IF EXISTS (SELECT 1 FROM public.stores WHERE owner_id = auth.uid()) THEN
    RETURN QUERY
      SELECT 'owner'::VARCHAR, s.id, s.name::VARCHAR
      FROM public.stores s WHERE s.owner_id = auth.uid();
  ELSE
    -- Check if user is an employee
    RETURN QUERY
      SELECT 'employee'::VARCHAR, se.store_id, st.name::VARCHAR
      FROM public.store_employees se
      JOIN public.stores st ON st.id = se.store_id
      WHERE se.user_id = auth.uid() AND se.status = 'active'
      LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Clean up old functions
DROP FUNCTION IF EXISTS public.check_access_code(VARCHAR);
DROP FUNCTION IF EXISTS public.get_admin_permissions();
DROP FUNCTION IF EXISTS public.promote_to_admin(VARCHAR);
