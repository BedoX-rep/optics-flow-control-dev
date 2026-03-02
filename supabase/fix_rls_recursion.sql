-- ============================================================
-- FIX: BREAK INFINITE RECURSION IN RLS POLICIES
-- Run this in the Supabase SQL Editor to resolve the "infinite recursion" error
-- ============================================================

-- 1. Create SECURITY DEFINER functions to bypass RLS during policy checks
-- This breaks the cycle where stores checks store_employees and vice-versa

CREATE OR REPLACE FUNCTION public.check_is_store_owner(check_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = check_store_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_store_employee(check_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.store_employees 
    WHERE store_id = check_store_id AND user_id = auth.uid() AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_store_owner_for_employee(employee_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.store_employees se
    JOIN public.stores s ON s.id = se.store_id
    WHERE se.user_id = employee_user_id 
      AND s.owner_id = auth.uid() 
      AND se.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update store_employees policies
DROP POLICY IF EXISTS "Store owners can manage employees" ON public.store_employees;
CREATE POLICY "Store owners can manage employees" ON public.store_employees
  FOR ALL USING (public.check_is_store_owner(store_id));

-- 3. Update stores policies
DROP POLICY IF EXISTS "Employees can view their store" ON public.stores;
CREATE POLICY "Employees can view their store" ON public.stores
  FOR SELECT USING (public.check_is_store_employee(id));

-- 4. Update subscriptions policies
-- Using store_id directly which was added in migration 20240122000000
DROP POLICY IF EXISTS "Store owners can view employee subscriptions" ON public.subscriptions;
CREATE POLICY "Store owners can view employee subscriptions" ON public.subscriptions
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    (store_id IS NOT NULL AND public.check_is_store_owner(store_id))
  );

-- 5. Update permissions policies
-- Permissions doesn't have a store_id, so we use check_is_store_owner_for_employee
DROP POLICY IF EXISTS "Store owners can manage employee permissions" ON public.permissions;
CREATE POLICY "Store owners can manage employee permissions" ON public.permissions
  FOR ALL USING (
    auth.uid() = user_id
    OR
    public.check_is_store_owner_for_employee(user_id)
  );

-- 6. Reload schema cache for policies
NOTIFY pgrst, 'reload schema';
