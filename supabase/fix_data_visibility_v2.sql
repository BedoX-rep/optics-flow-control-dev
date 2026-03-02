-- ============================================================
-- FIX V2: Employee Data Visibility & RLS Policy Cleanup
-- Ensures both owners and employees can see store-wide data
-- ============================================================

-- 1. Enhanced helper to get store_id for ANY user (Owner or Employee)
CREATE OR REPLACE FUNCTION public.get_user_store_id(p_user_id UUID) 
RETURNS UUID AS $$
DECLARE
  v_store_id UUID;
BEGIN
  -- Try getting from subscriptions (usually for owners)
  SELECT store_id INTO v_store_id FROM public.subscriptions WHERE user_id = p_user_id LIMIT 1;
  
  -- If not found, try getting from store_employees (for employees)
  IF v_store_id IS NULL THEN
    SELECT store_id INTO v_store_id FROM public.store_employees WHERE user_id = p_user_id AND status = 'active' LIMIT 1;
  END IF;
  
  RETURN v_store_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Enhanced shares_store function
-- Checks if two users belong to the same store
CREATE OR REPLACE FUNCTION public.shares_store(record_user_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
  v_current_user_store_id UUID;
  v_record_user_store_id UUID;
BEGIN
  v_current_user_store_id := public.get_user_store_id(auth.uid());
  v_record_user_store_id := public.get_user_store_id(record_user_id);
  
  RETURN (v_current_user_store_id IS NOT NULL AND v_current_user_store_id = v_record_user_store_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Comprehensive Policy Cleanup and Re-application
-- This ensures no legacy policies interfere with the store-aware logic
DO $$
DECLARE
  t text;
  policy_record RECORD;
BEGIN
  -- Tables to update
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
    'products', 'clients', 'appointments', 'invoices', 'invoice_items', 'receipts', 'purchases', 'suppliers'
  )
  LOOP
    -- DROP ALL existing select/update/delete policies to ensure a clean slate
    -- We want to avoid "Users can CRUD their own products" or similar legacy policies
    FOR policy_record IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = t AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, t);
    END LOOP;

    -- Create fresh Store-Aware Policies
    
    -- SELECT: Allow if they share the store OR are the owner of the record
    EXECUTE format('CREATE POLICY "Users can view store %I" ON public.%I FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id)', t, t);
    
    -- INSERT: Only allow users to insert their own records (standard)
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);
    
    -- UPDATE: Allow if they share the store OR are the owner of the record
    EXECUTE format('CREATE POLICY "Users can update store %I" ON public.%I FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id)', t, t);

    -- DELETE: Allow if they share the store OR are the owner of the record
    EXECUTE format('CREATE POLICY "Users can delete store %I" ON public.%I FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id)', t, t);
    
  END LOOP;
END $$;

-- 4. Reload schema to apply changes
NOTIFY pgrst, 'reload schema';
