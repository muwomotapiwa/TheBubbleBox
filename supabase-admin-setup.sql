-- =====================================================
-- ADMIN DASHBOARD SETUP - The Bubble Box
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add missing columns to drivers table
-- =====================================================

DO $$ 
BEGIN
    -- Add rating column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'drivers' AND column_name = 'rating') THEN
        ALTER TABLE drivers ADD COLUMN rating DECIMAL(3,2) DEFAULT 5.0;
    END IF;

    -- Add on_time_rate column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'drivers' AND column_name = 'on_time_rate') THEN
        ALTER TABLE drivers ADD COLUMN on_time_rate INTEGER DEFAULT 100;
    END IF;
END $$;

-- 2. Add missing columns to customer_notes table
-- =====================================================

DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_notes' AND column_name = 'updated_at') THEN
        ALTER TABLE customer_notes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 3. Create RLS policies for admin access
-- =====================================================

-- For now, we'll allow authenticated users to access admin features
-- In production, you should create an admin role

-- Drivers table policies
DROP POLICY IF EXISTS "Anyone can view drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can manage drivers" ON drivers;

CREATE POLICY "Anyone can view drivers"
ON drivers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage drivers"
ON drivers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Customer notes policies (for admin blackbook)
DROP POLICY IF EXISTS "Anyone can view customer notes" ON customer_notes;
DROP POLICY IF EXISTS "Authenticated users can manage customer notes" ON customer_notes;

CREATE POLICY "Anyone can view customer notes"
ON customer_notes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage customer notes"
ON customer_notes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Driver trips policies
DROP POLICY IF EXISTS "Anyone can view driver trips" ON driver_trips;
DROP POLICY IF EXISTS "Authenticated users can manage driver trips" ON driver_trips;

CREATE POLICY "Anyone can view driver trips"
ON driver_trips FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage driver trips"
ON driver_trips FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Users table - allow admins to view all users
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Orders table - allow viewing all orders for admin
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
TO authenticated
USING (true);

-- 4. Grant permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON drivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON driver_trips TO authenticated;

-- 5. Insert sample drivers (optional - uncomment to add)
-- =====================================================

-- INSERT INTO drivers (name, phone, status, rating, on_time_rate) VALUES
-- ('Ahmed K.', '+1 555-0001', 'active', 4.9, 98),
-- ('Maria L.', '+1 555-0002', 'active', 4.8, 96),
-- ('James T.', '+1 555-0003', 'break', 4.6, 91),
-- ('Sarah P.', '+1 555-0004', 'offline', 4.7, 94)
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- DONE! Your admin dashboard is now configured.
-- =====================================================
