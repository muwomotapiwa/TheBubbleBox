-- =============================================
-- FIX SUBSCRIPTION PLANS - VERSION 2
-- =============================================
-- This completely resets and fixes all policies

-- Step 1: Disable RLS temporarily
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'subscription_plans'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON subscription_plans', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Grant full access to authenticated users
GRANT ALL ON subscription_plans TO authenticated;
GRANT SELECT ON subscription_plans TO anon;

-- Step 4: Re-enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, permissive policies
CREATE POLICY "allow_public_read"
ON subscription_plans FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_authenticated_insert"
ON subscription_plans FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_authenticated_update"
ON subscription_plans FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_authenticated_delete"
ON subscription_plans FOR DELETE
TO authenticated
USING (true);

-- Step 6: Verify the table structure and data
SELECT id, name, slug, monthly_price, yearly_price FROM subscription_plans;
