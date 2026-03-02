
-- 1. Companies Table RLS
-- Allow employees to see custom companies added by the store owner
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

    -- Drop existing restrictive policies if they exist
    DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
    DROP POLICY IF EXISTS "Users can view store companies" ON public.companies;
    DROP POLICY IF EXISTS "Users can insert own companies" ON public.companies;
    DROP POLICY IF EXISTS "Users can insert store companies" ON public.companies;
    DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
    DROP POLICY IF EXISTS "Users can update store companies" ON public.companies;
    DROP POLICY IF EXISTS "Users can delete own companies" ON public.companies;
    DROP POLICY IF EXISTS "Users can delete store companies" ON public.companies;

    -- Create new store-aware policies
    -- SELECT: Allow anyone in the same store to view companies
    CREATE POLICY "Users can view store companies" ON public.companies 
        FOR SELECT USING (public.shares_store(user_id));

    -- INSERT: Only allow users to insert their own records
    CREATE POLICY "Users can insert store companies" ON public.companies 
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- UPDATE: Allow anyone in the same store to update companies (or restrict to owner if preferred)
    -- For now, following the pattern of other tables where store members can update
    CREATE POLICY "Users can update store companies" ON public.companies 
        FOR UPDATE USING (public.shares_store(user_id));

    -- DELETE: Allow anyone in the same store to delete companies
    CREATE POLICY "Users can delete store companies" ON public.companies 
        FOR DELETE USING (public.shares_store(user_id));

    RAISE NOTICE 'RLS policies for companies table updated';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table companies does not exist, skipping';
END $$;

-- 2. User Information Table RLS
-- Allow employees to see store information (owner's user_information)
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own information" ON public.user_information;
DROP POLICY IF EXISTS "Users can view store information" ON public.user_information;

-- SELECT: Allow anyone in the same store to view information but ONLY owners can update
CREATE POLICY "Users can view store information" ON public.user_information 
    FOR SELECT USING (public.shares_store(user_id));

-- INSERT: Only owners can create their record
DROP POLICY IF EXISTS "Users can insert own information" ON public.user_information;
CREATE POLICY "Users can insert own information" ON public.user_information 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only owners can update their record
DROP POLICY IF EXISTS "Users can update own information" ON public.user_information;
CREATE POLICY "Users can update own information" ON public.user_information 
    FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Only owners can delete their record (though usually managed by system)
DROP POLICY IF EXISTS "Users can delete own information" ON public.user_information;
CREATE POLICY "Users can delete own information" ON public.user_information 
    FOR DELETE USING (auth.uid() = user_id);

RAISE NOTICE 'RLS policies for user_information table updated (Employees: Read-Only, Owners: Full Access)';
