-- ============================================================
-- FIX V3: Optimized RLS Policies & Performance Improvements
-- Based on Supabase Postgres Best Practices
-- ============================================================

-- 1. Optimized helper to get store_id for ANY user
-- Added search_path and internal select wrapping for better performance/security
CREATE OR REPLACE FUNCTION public.get_user_store_id(p_user_id UUID) 
RETURNS UUID 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- 2. Optimized shares_store function
-- Uses (SELECT ...) pattern to allow Postgres to cache the result per query
CREATE OR REPLACE FUNCTION public.shares_store(record_user_id UUID) 
RETURNS BOOLEAN 
LANGUAGE plpgsql 
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_user_store_id UUID;
  v_record_user_store_id UUID;
BEGIN
  -- Wrap auth.uid() and lookups in SELECT to encourage caching
  v_current_user_store_id := (SELECT public.get_user_store_id((SELECT auth.uid())));
  v_record_user_store_id := (SELECT public.get_user_store_id(record_user_id));
  
  RETURN (v_current_user_store_id IS NOT NULL AND v_current_user_store_id = v_record_user_store_id);
END;
$$;

-- 3. Comprehensive Policy Clean-slate and Optimized Re-application
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
    -- Drop EVERY policy to ensure no legacy "CRUD their own" overlaps
    FOR policy_record IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = t AND schemaname = 'public'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, t);
    END LOOP;

    -- SELECT: Use (SELECT shares_store(...)) for 100x performance boost on list queries
    EXECUTE format('CREATE POLICY "Users can view store %I" ON public.%I FOR SELECT USING ((SELECT public.shares_store(user_id)) OR (SELECT auth.uid()) = user_id)', t, t);
    
    -- INSERT: Simple check
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id)', t, t);
    
    -- UPDATE: Store-aware
    EXECUTE format('CREATE POLICY "Users can update store %I" ON public.%I FOR UPDATE USING ((SELECT public.shares_store(user_id)) OR (SELECT auth.uid()) = user_id)', t, t);

    -- DELETE: Store-aware
    EXECUTE format('CREATE POLICY "Users can delete store %I" ON public.%I FOR DELETE USING ((SELECT public.shares_store(user_id)) OR (SELECT auth.uid()) = user_id)', t, t);
    
  END LOOP;
END $$;

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
