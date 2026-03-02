-- ============================================================
-- FULL ROLLBACK SCRIPT 
-- Reverts the Store Owner/Employee Model and all related RLS changes
-- Run this in the Supabase SQL Editor ONLY IF you want to undo the two migrations
-- ============================================================

-- 1. Revert Data Table RLS Policies
-- We drop the "store-aware" policies and restore the "user-only" policies

-- === PRODUCTS ===
DROP POLICY IF EXISTS "Users can view store products" ON public.products;
DROP POLICY IF EXISTS "Users can insert store products" ON public.products;
DROP POLICY IF EXISTS "Users can update store products" ON public.products;
DROP POLICY IF EXISTS "Users can delete store products" ON public.products;

CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- === CLIENTS ===
DROP POLICY IF EXISTS "Users can view store clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert store clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update store clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete store clients" ON public.clients;

CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- === APPOINTMENTS ===
DROP POLICY IF EXISTS "Users can view store appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert store appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update store appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete store appointments" ON public.appointments;

CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own appointments" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

-- === INVOICES ===
DROP POLICY IF EXISTS "Users can view store invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert store invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update store invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete store invoices" ON public.invoices;

CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- === INVOICE ITEMS ===
DROP POLICY IF EXISTS "Users can view store invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert store invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update store invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete store invoice items" ON public.invoice_items;

CREATE POLICY "Users can view their own invoice items" ON public.invoice_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoice items" ON public.invoice_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoice items" ON public.invoice_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoice items" ON public.invoice_items FOR DELETE USING (auth.uid() = user_id);

-- === PURCHASES ===
DROP POLICY IF EXISTS "Users can view store purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert store purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can update store purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can delete store purchases" ON public.purchases;

CREATE POLICY "Users can view their own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own purchases" ON public.purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own purchases" ON public.purchases FOR DELETE USING (auth.uid() = user_id);

-- === RECEIPTS ===
DROP POLICY IF EXISTS "Users can view store receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can insert store receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can update store receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can delete store receipts" ON public.receipts;

CREATE POLICY "Users can view their own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own receipts" ON public.receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receipts" ON public.receipts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receipts" ON public.receipts FOR DELETE USING (auth.uid() = user_id);

-- === SUPPLIERS ===
DROP POLICY IF EXISTS "Users can view store suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert store suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update store suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete store suppliers" ON public.suppliers;

CREATE POLICY "Users can manage their own suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own suppliers" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own suppliers" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own suppliers" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own suppliers" ON public.suppliers FOR DELETE USING (auth.uid() = user_id);

-- 2. Restore Subscription and Permissions RLS
DROP POLICY IF EXISTS "Store owners can view employee subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON permissions;
DROP POLICY IF EXISTS "Store owners can manage employee permissions" ON permissions;

CREATE POLICY "Users can view their own permissions" ON permissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all permissions" ON permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = auth.uid()
    AND subscription_status = 'Active'
  )
);

-- 3. Restore the original handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id, email, display_name, start_date, end_date,
    subscription_type, subscription_status, trial_used,
    access_code, store_name, referral_code, referred_by
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
    NEW.raw_user_meta_data->>'referred_by'
  );

  INSERT INTO public.permissions (
    user_id, can_manage_products, can_manage_clients,
    can_manage_receipts, can_view_financial, can_manage_purchases,
    can_access_dashboard
  ) VALUES (
    NEW.id, true, true, true, false, false, true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate old functions
CREATE OR REPLACE FUNCTION public.check_access_code(p_access_code VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE access_code = p_access_code AND subscription_status = 'Active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_admin_permissions()
RETURNS TABLE (
  can_manage_products BOOLEAN,
  can_manage_clients BOOLEAN,
  can_manage_receipts BOOLEAN,
  can_view_financial BOOLEAN,
  can_manage_purchases BOOLEAN,
  can_access_dashboard BOOLEAN,
  can_manage_invoices BOOLEAN,
  can_access_appointments BOOLEAN
) AS $$
BEGIN
  RETURN QUERY SELECT true, true, true, true, true, true, true, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.promote_to_admin(p_access_code VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.check_access_code(p_access_code) THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Drop new helper functions
DROP FUNCTION IF EXISTS public.shares_store(UUID);
DROP FUNCTION IF EXISTS public.get_auth_store_id();
DROP FUNCTION IF EXISTS public.get_user_store_role();

-- 6. Clean up schema additions
-- Assign random access code to those who don't have one before setting NOT NULL
UPDATE public.subscriptions SET access_code = UPPER(LEFT(MD5(RANDOM()::text), 5)) WHERE access_code IS NULL;

ALTER TABLE public.subscriptions ALTER COLUMN access_code SET NOT NULL;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS role;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS store_id;

DROP TABLE IF EXISTS public.store_employees CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
