-- =============================================
-- FIX USER CREATION FROM ADMIN
-- =============================================

-- Make sure role and is_active columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop existing policies on users table that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Authenticated can insert users" ON users;
DROP POLICY IF EXISTS "Authenticated can update users" ON users;
DROP POLICY IF EXISTS "Authenticated can view all users" ON users;
DROP POLICY IF EXISTS "Public can insert users" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Admins can view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
  )
  OR id = auth.uid()
);

-- 3. Allow insert from authenticated users (for admin creating users)
CREATE POLICY "Authenticated can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Allow insert from anon (for new user signup)
CREATE POLICY "Anyone can insert own profile"
ON users FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 6. Admins can update any user
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  )
);

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT INSERT ON users TO anon;

-- Verify your user is super_admin
UPDATE users SET role = 'super_admin' WHERE email = 'muwomotapiwa@gmail.com';

-- Show current users
SELECT id, email, name, role, is_active FROM users;
