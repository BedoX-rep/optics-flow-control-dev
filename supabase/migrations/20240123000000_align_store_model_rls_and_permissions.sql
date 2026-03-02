-- ============================================================
-- MIGRATION: Align Data Tables with Store Owner / Employee Model
-- Run this in Supabase SQL Editor AFTER the previous migration
-- ============================================================

-- ------------------------------------------------------------
-- 1. UPDATE HANDLE_NEW_USER TRIGGER
-- Adds missing permissions (invoices, appointments) for new signups
-- ------------------------------------------------------------
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
    -- Note: Employees do NOT get their own subscription. Their access is determined by the store owner's subscription.

    -- Link the employee record to this user
    UPDATE public.store_employees
    SET user_id = NEW.id, updated_at = NOW()
    WHERE id = v_employee_record.id;

    -- Create restricted default permissions for employee
    INSERT INTO public.permissions (
      user_id, can_manage_products, can_manage_clients,
      can_manage_receipts, can_view_financial, can_manage_purchases,
      can_access_dashboard, can_manage_invoices, can_access_appointments
    ) VALUES (
      NEW.id, true, true, true, false, false, true, true, true
    );

  ELSE
    -- This is a new store owner signing up
    -- 1. Create the store FIRST to get its ID
    INSERT INTO public.stores (owner_id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store'))
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
    );

    -- Create full permissions for owner
    INSERT INTO public.permissions (
      user_id, can_manage_products, can_manage_clients,
      can_manage_receipts, can_view_financial, can_manage_purchases,
      can_access_dashboard, can_manage_invoices, can_access_appointments
    ) VALUES (
      NEW.id, true, true, true, true, true, true, true, true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------
-- 2. CREATE HELPER FUNCTION FOR RLS
-- Safely gets the current user's store_id
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_store_id() 
RETURNS UUID AS $$
  SELECT store_id FROM public.subscriptions WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ------------------------------------------------------------
-- 3. UPDATE RLS POLICIES ON DATA TABLES
-- Allows employees to see and interact with store-wide data
-- ------------------------------------------------------------

-- Helper: function that checks if a target record's creator shares the same store as the current user
CREATE OR REPLACE FUNCTION public.shares_store(record_user_id UUID) 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s_current
    JOIN public.subscriptions s_record ON s_current.store_id = s_record.store_id
    WHERE s_current.user_id = auth.uid() AND s_record.user_id = record_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Note: We drop existing restrictive policies that check (auth.uid() = user_id)
-- and add "Store-Aware" policies.

-- === PRODUCTS ===
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

CREATE POLICY "Users can view store products" ON public.products FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can insert store products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update store products" ON public.products FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can delete store products" ON public.products FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id);

-- === CLIENTS ===
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Users can view store clients" ON public.clients FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can insert store clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update store clients" ON public.clients FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can delete store clients" ON public.clients FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id);

-- === APPOINTMENTS ===
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

CREATE POLICY "Users can view store appointments" ON public.appointments FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can insert store appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update store appointments" ON public.appointments FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can delete store appointments" ON public.appointments FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id);

-- === INVOICES ===
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

CREATE POLICY "Users can view store invoices" ON public.invoices FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can insert store invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update store invoices" ON public.invoices FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can delete store invoices" ON public.invoices FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id);

-- === INVOICE ITEMS ===
DROP POLICY IF EXISTS "Users can view their own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert their own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update their own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete their own invoice items" ON public.invoice_items;

CREATE POLICY "Users can view store invoice items" ON public.invoice_items FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can insert store invoice items" ON public.invoice_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update store invoice items" ON public.invoice_items FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can delete store invoice items" ON public.invoice_items FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id);

-- === PURCHASES ===
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can update their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can delete their own purchases" ON public.purchases;

CREATE POLICY "Users can view store purchases" ON public.purchases FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can insert store purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update store purchases" ON public.purchases FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can delete store purchases" ON public.purchases FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id);

-- === RECEIPTS ===
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can insert their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can update their own receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON public.receipts;

CREATE POLICY "Users can view store receipts" ON public.receipts FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can insert store receipts" ON public.receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update store receipts" ON public.receipts FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can delete store receipts" ON public.receipts FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id);

-- === SUPPLIERS ===
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete their own suppliers" ON public.suppliers;

CREATE POLICY "Users can view store suppliers" ON public.suppliers FOR SELECT USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can insert store suppliers" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update store suppliers" ON public.suppliers FOR UPDATE USING (public.shares_store(user_id) OR auth.uid() = user_id);
CREATE POLICY "Users can delete store suppliers" ON public.suppliers FOR DELETE USING (public.shares_store(user_id) OR auth.uid() = user_id);
