-- =====================================================
-- FIX: User Addresses RLS Policies
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON user_addresses;

-- Enable RLS if not already enabled
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for user_addresses
CREATE POLICY "Users can view own addresses"
ON user_addresses FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own addresses"
ON user_addresses FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
ON user_addresses FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
ON user_addresses FOR DELETE
USING (user_id = auth.uid());

-- Verify the table structure (this won't change anything, just confirms columns exist)
DO $$ 
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_addresses') THEN
        RAISE NOTICE 'Creating user_addresses table...';
        CREATE TABLE user_addresses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            label VARCHAR(100) NOT NULL DEFAULT 'Home',
            address TEXT NOT NULL,
            landmark TEXT,
            coordinates JSONB,
            is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);
    END IF;
END $$;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_addresses TO authenticated;

SELECT 'User addresses policies fixed successfully!' as status;
