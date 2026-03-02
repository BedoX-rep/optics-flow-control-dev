-- ============================================================
-- FINAL FIX: Employee Data Visibility & RLS Policies
-- Resolves 406 error in AuthProvider and ensures data sharing
-- ============================================================

-- 1. Update Subscriptions RLS to allow shared visibility
-- This allows employees to see the owner's subscription (needed for app status check)
-- and owners to see employee subscriptions.
DROP POLICY IF EXISTS "Store owners can view employee subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own or store subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own or store subscriptions" ON public.subscriptions
  FOR SELECT USING (
    auth.uid() = user_id -- Can always see own
    OR
    (
      store_id IS NOT NULL 
      AND (
        public.check_is_store_owner(store_id) -- Owner can see employee's
        OR 
        public.check_is_store_employee(store_id) -- Employee can see owner's
      )
    )
  );

-- 2. Ensure every subscription has a role and store_id
-- Backfill for any missed records
UPDATE public.subscriptions s
SET role = 'owner', store_id = st.id
FROM public.stores st
WHERE s.user_id = st.owner_id AND s.store_id IS NULL;

UPDATE public.subscriptions s
SET role = 'employee', store_id = se.store_id
FROM public.store_employees se
WHERE s.user_id = se.user_id AND s.store_id IS NULL;

-- 3. Update the share_store function to use store_id directly from records if available
-- Some tables have store_id, some don't.
CREATE OR REPLACE FUNCTION public.get_user_store_id(p_user_id UUID) 
RETURNS UUID AS $$
  SELECT store_id FROM public.subscriptions WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Re-verify Data Table Policies
-- They should use the store_id from the subscriptions table to match users
CREATE OR REPLACE FUNCTION public.records_match_store(record_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  v_current_store_id UUID;
  v_record_store_id UUID;
BEGIN
  v_current_store_id := public.get_user_store_id(auth.uid());
  v_record_store_id := public.get_user_store_id(record_user_id);
  
  RETURN (v_current_store_id IS NOT NULL AND v_current_store_id = v_record_store_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Update shares_store to use the more robust version
CREATE OR REPLACE FUNCTION public.shares_store(record_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.records_match_store(record_user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Final check on data table policies
-- We ensure all data tables use shares_store
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('products', 'clients', 'appointments', 'invoices', 'receipts', 'purchases', 'suppliers')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can view store %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Users can view store %I" ON public.%I FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id)', t, t);
    
    EXECUTE format('DROP POLICY IF EXISTS "Users can update store %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Users can update store %I" ON public.%I FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id)', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "Users can delete store %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Users can delete store %I" ON public.%I FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id)', t, t);
  END LOOP;
END $$;

-- 6. Reload schema
NOTIFY pgrst, 'reload schema';
