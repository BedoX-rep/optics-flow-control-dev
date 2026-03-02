-- ============================================================
-- FIX: Employee Creation, Verification Bypass, Role Assignment, and Passwords
-- ============================================================

-- 1. Ensure the temporary_password column exists
ALTER TABLE public.store_employees ADD COLUMN IF NOT EXISTS temporary_password TEXT;

-- 2. Update handle_new_user to be more robust and handle pre-selected permissions + passwords
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
  v_employee_record RECORD;
  v_user_type TEXT;
  v_perms_data JSONB;
BEGIN
  -- Get user type and store_id from metadata (passed from Access.tsx)
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  v_perms_data := NEW.raw_user_meta_data->'permissions';
  
  -- Use a safe cast for store_id
  BEGIN
    IF NEW.raw_user_meta_data->>'store_id' IS NOT NULL THEN
      v_store_id := (NEW.raw_user_meta_data->>'store_id')::UUID;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_store_id := NULL;
  END;

  -- Check if this user was pre-registered as an employee (by a store owner)
  -- Use LOWER() for case-insensitive comparison
  SELECT * INTO v_employee_record
  FROM public.store_employees
  WHERE (LOWER(email) = LOWER(NEW.email) OR (v_user_type = 'employee' AND store_id = v_store_id))
    AND user_id IS NULL
  LIMIT 1;

  IF v_employee_record IS NOT NULL OR v_user_type = 'employee' THEN
    -- This is an employee account
    
    -- Link or create the employee record
    IF v_employee_record IS NOT NULL THEN
      UPDATE public.store_employees
      SET user_id = NEW.id, 
          updated_at = NOW(),
          temporary_password = COALESCE(NEW.raw_user_meta_data->>'password', temporary_password)
      WHERE id = v_employee_record.id;
      v_store_id := v_employee_record.store_id;
    ELSE
      -- Fallback: create the employee record (e.g. if metadata passed store_id)
      IF v_store_id IS NOT NULL THEN
        INSERT INTO public.store_employees (store_id, user_id, email, display_name, status, temporary_password)
        VALUES (
          v_store_id, 
          NEW.id, 
          LOWER(NEW.email), 
          COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
          'active',
          NEW.raw_user_meta_data->>'password'
        ) 
        ON CONFLICT (store_id, email) DO UPDATE SET 
          user_id = EXCLUDED.user_id,
          temporary_password = EXCLUDED.temporary_password,
          updated_at = NOW()
        RETURNING * INTO v_employee_record;
      END IF;
    END IF;

    -- Create permissions using provided metadata or defaults
    INSERT INTO public.permissions (
      user_id, 
      can_manage_products, 
      can_manage_clients,
      can_manage_receipts, 
      can_view_financial, 
      can_manage_purchases,
      can_access_dashboard, 
      can_manage_invoices, 
      can_access_appointments
    ) VALUES (
      NEW.id, 
      COALESCE((v_perms_data->>'can_manage_products')::BOOLEAN, true), 
      COALESCE((v_perms_data->>'can_manage_clients')::BOOLEAN, true), 
      COALESCE((v_perms_data->>'can_manage_receipts')::BOOLEAN, true), 
      COALESCE((v_perms_data->>'can_view_financial')::BOOLEAN, false), 
      COALESCE((v_perms_data->>'can_manage_purchases')::BOOLEAN, false), 
      COALESCE((v_perms_data->>'can_access_dashboard')::BOOLEAN, true), 
      COALESCE((v_perms_data->>'can_manage_invoices')::BOOLEAN, true), 
      COALESCE((v_perms_data->>'can_access_appointments')::BOOLEAN, true)
    ) ON CONFLICT (user_id) DO UPDATE SET
      can_manage_products = EXCLUDED.can_manage_products,
      can_manage_clients = EXCLUDED.can_manage_clients,
      can_manage_receipts = EXCLUDED.can_manage_receipts,
      can_view_financial = EXCLUDED.can_view_financial,
      can_manage_purchases = EXCLUDED.can_manage_purchases,
      can_access_dashboard = EXCLUDED.can_access_dashboard,
      can_manage_invoices = EXCLUDED.can_manage_invoices,
      can_access_appointments = EXCLUDED.can_access_appointments;

    -- BYPASS EMAIL VERIFICATION for employees
    -- Mark email as confirmed immediately so they can log in without waiting
    BEGIN
      UPDATE auth.users 
      SET email_confirmed_at = NOW(), 
          confirmed_at = NOW(),
          last_sign_in_at = NOW()
      WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      -- Log error if needed, but don't fail the signup transaction
      RAISE WARNING 'Could not auto-confirm employee email: %', SQLERRM;
    END;

  ELSE
    -- This is a new store owner signing up (no employee record and no employee metadata)
    
    -- 1. Create the store FIRST to get its ID
    INSERT INTO public.stores (owner_id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store'))
    ON CONFLICT (owner_id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_store_id;

    -- 2. Create the subscription and attach the store_id
    INSERT INTO public.subscriptions (
      user_id, email, display_name, start_date, end_date,
      subscription_type, subscription_status, trial_used,
      store_name, referral_code, referred_by, role, store_id
    ) VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      NOW(), NOW() + INTERVAL '7 days',
      'Trial', 'Active', TRUE,
      COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store'),
      CASE WHEN NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
        UPPER(LEFT(MD5(RANDOM()::text), 4))
        ELSE NULL
      END,
      NEW.raw_user_meta_data->>'referred_by',
      'owner', v_store_id
    ) ON CONFLICT (user_id) DO UPDATE SET
      role = 'owner',
      store_id = v_store_id,
      store_name = EXCLUDED.store_name;

    -- Create full permissions for owner
    INSERT INTO public.permissions (
      user_id, 
      can_manage_products, 
      can_manage_clients,
      can_manage_receipts, 
      can_view_financial, 
      can_manage_purchases,
      can_access_dashboard, 
      can_manage_invoices, 
      can_access_appointments
    ) VALUES (
      NEW.id, true, true, true, true, true, true, true, true
    ) ON CONFLICT (user_id) DO UPDATE SET
      can_manage_products = true,
      can_manage_clients = true,
      can_manage_receipts = true,
      can_view_financial = true,
      can_manage_purchases = true,
      can_access_dashboard = true,
      can_manage_invoices = true,
      can_access_appointments = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach the trigger
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
