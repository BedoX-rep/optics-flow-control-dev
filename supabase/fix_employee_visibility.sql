-- ============================================================
-- FIX: Employee Data Visibility and Store ID Backfill
-- This script ensures that all users (owners and employees) 
-- have their store_id set correctly in the subscriptions table
-- and updates the shares_store function for better reliability.
-- ============================================================

-- 1. Backfill store_id for all owners in subscriptions table
-- Owners are identified by having a record in the stores table as owner_id
UPDATE public.subscriptions s
SET store_id = st.id, role = 'owner'
FROM public.stores st
WHERE s.user_id = st.owner_id
AND (s.store_id IS NULL OR s.role IS NULL);

-- 2. Backfill store_id for all employees in subscriptions table
-- Employees are identified by having a record in the store_employees table
UPDATE public.subscriptions s
SET store_id = se.store_id, role = 'employee'
FROM public.store_employees se
WHERE s.user_id = se.user_id
AND (s.store_id IS NULL OR s.role IS NULL);

-- 3. Update shares_store function to be more robust
-- This function is used by RLS policies to determine if a user can see a record
-- It returns true if the current user and the record's creator belong to the same store
CREATE OR REPLACE FUNCTION public.shares_store(record_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  v_current_user_store_id UUID;
  v_record_user_store_id UUID;
BEGIN
  -- If it's the same user, they always share the store
  IF auth.uid() = record_user_id THEN
    RETURN TRUE;
  END IF;

  -- Get current user's store_id
  SELECT store_id INTO v_current_user_store_id 
  FROM public.subscriptions 
  WHERE user_id = auth.uid() 
  LIMIT 1;

  -- Get record creator's store_id
  SELECT store_id INTO v_record_user_store_id 
  FROM public.subscriptions 
  WHERE user_id = record_user_id 
  LIMIT 1;

  -- Check if they match and are NOT NULL
  RETURN (v_current_user_store_id IS NOT NULL AND v_current_user_store_id = v_record_user_store_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Reload schema cache for policies
NOTIFY pgrst, 'reload schema';
