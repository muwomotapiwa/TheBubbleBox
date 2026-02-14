-- =============================================
-- FIX SUBSCRIPTION PLANS RLS POLICIES
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop all existing policies on subscription_plans
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can view all subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can insert subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can update subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can delete subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Anyone can view plans" ON subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can update plans" ON subscription_plans;

-- Disable and re-enable RLS to reset
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create simple policies that work

-- 1. Anyone can view all plans (for public pricing page)
CREATE POLICY "public_read_subscription_plans"
ON subscription_plans FOR SELECT
TO public
USING (true);

-- 2. Authenticated users can update any plan
CREATE POLICY "authenticated_update_subscription_plans"
ON subscription_plans FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Authenticated users can insert plans
CREATE POLICY "authenticated_insert_subscription_plans"
ON subscription_plans FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Authenticated users can delete plans
CREATE POLICY "authenticated_delete_subscription_plans"
ON subscription_plans FOR DELETE
TO authenticated
USING (true);

-- Grant all permissions
GRANT ALL ON subscription_plans TO authenticated;
GRANT SELECT ON subscription_plans TO anon;

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'subscription_plans';
