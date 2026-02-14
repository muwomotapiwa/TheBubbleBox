-- =====================================================
-- FIX: User Addresses UPDATE Policy
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vqppcsvpqoamxspkesbe/sql
-- =====================================================

-- First, let's check if the user_addresses table has the updated_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_addresses' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_addresses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Drop ALL existing policies on user_addresses to start fresh
DROP POLICY IF EXISTS "Users can view own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON user_addresses;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON user_addresses;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_addresses;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_addresses;

-- Enable RLS
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies
CREATE POLICY "Users can view own addresses"
ON user_addresses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own addresses"
ON user_addresses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
ON user_addresses FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
ON user_addresses FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Grant all permissions to authenticated users
GRANT ALL ON user_addresses TO authenticated;

-- Verify policies were created
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_addresses';
