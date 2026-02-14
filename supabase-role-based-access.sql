-- =============================================
-- ROLE-BASED ACCESS CONTROL (RBAC)
-- Customers see only their data
-- Company roles see all data
-- =============================================

-- =============================================
-- 1. HELPER FUNCTION TO CHECK IF USER IS COMPANY STAFF
-- =============================================

CREATE OR REPLACE FUNCTION is_company_staff()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM users WHERE id = auth.uid();
    RETURN user_role IN ('driver', 'staff', 'manager', 'admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. FIX ORDERS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
DROP POLICY IF EXISTS "customer_view_own_orders" ON orders;
DROP POLICY IF EXISTS "staff_view_all_orders" ON orders;

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can view only their own orders
CREATE POLICY "customer_view_own_orders"
ON orders FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

-- Customers can insert their own orders
CREATE POLICY "customer_insert_orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Customers can update their own orders, staff can update any
CREATE POLICY "customer_update_own_orders"
ON orders FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

-- =============================================
-- 3. FIX ORDER_ITEMS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
DROP POLICY IF EXISTS "customer_view_own_order_items" ON order_items;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- View order items (check if order belongs to user or user is staff)
CREATE POLICY "view_order_items"
ON order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND (orders.user_id = auth.uid() OR is_company_staff())
    )
);

-- Insert order items
CREATE POLICY "insert_order_items"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- 4. FIX ORDER_PREFERENCES TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own order preferences" ON order_preferences;
DROP POLICY IF EXISTS "Users can insert order preferences" ON order_preferences;

ALTER TABLE order_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_order_preferences"
ON order_preferences FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_preferences.order_id 
        AND (orders.user_id = auth.uid() OR is_company_staff())
    )
);

CREATE POLICY "insert_order_preferences"
ON order_preferences FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- 5. FIX ORDER_ADDONS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own order addons" ON order_addons;
DROP POLICY IF EXISTS "Users can insert order addons" ON order_addons;

ALTER TABLE order_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_order_addons"
ON order_addons FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_addons.order_id 
        AND (orders.user_id = auth.uid() OR is_company_staff())
    )
);

CREATE POLICY "insert_order_addons"
ON order_addons FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- 6. FIX ORDER_STATUS_HISTORY TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own order status history" ON order_status_history;
DROP POLICY IF EXISTS "Users can insert order status history" ON order_status_history;

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_order_status_history"
ON order_status_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_status_history.order_id 
        AND (orders.user_id = auth.uid() OR is_company_staff())
    )
);

CREATE POLICY "insert_order_status_history"
ON order_status_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- 7. FIX USER_ADDRESSES TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON user_addresses;
DROP POLICY IF EXISTS "allow_select_addresses" ON user_addresses;

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- Customers see own addresses, staff see all
CREATE POLICY "view_addresses"
ON user_addresses FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

CREATE POLICY "insert_addresses"
ON user_addresses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR is_company_staff());

CREATE POLICY "update_addresses"
ON user_addresses FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR is_company_staff());

CREATE POLICY "delete_addresses"
ON user_addresses FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR is_company_staff());

-- =============================================
-- 8. FIX USER_PREFERENCES TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_preferences"
ON user_preferences FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

CREATE POLICY "insert_preferences"
ON user_preferences FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR is_company_staff());

CREATE POLICY "update_preferences"
ON user_preferences FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR is_company_staff());

-- =============================================
-- 9. FIX USERS TABLE POLICIES
-- =============================================

-- Drop all existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Customers see only themselves, staff see all
CREATE POLICY "view_users"
ON users FOR SELECT
TO authenticated
USING (
    id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.role IN ('driver', 'staff', 'manager', 'admin', 'super_admin')
    )
);

-- Allow insert for signup
CREATE POLICY "insert_users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "anon_insert_users"
ON users FOR INSERT
TO anon
WITH CHECK (true);

-- Customers update only themselves, admins update anyone
CREATE POLICY "update_users"
ON users FOR UPDATE
TO authenticated
USING (
    id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.role IN ('admin', 'super_admin')
    )
);

-- =============================================
-- 10. FIX PAYMENTS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_payments"
ON payments FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

CREATE POLICY "insert_payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "update_payments"
ON payments FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

-- =============================================
-- 11. FIX SUBSCRIPTIONS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert subscriptions" ON subscriptions;

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

CREATE POLICY "insert_subscriptions"
ON subscriptions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "update_subscriptions"
ON subscriptions FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

-- =============================================
-- 12. FIX REFERRALS & CREDITS TABLE POLICIES
-- =============================================

-- Referral codes
DROP POLICY IF EXISTS "Users can view own referral codes" ON referral_codes;

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_referral_codes"
ON referral_codes FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

CREATE POLICY "insert_referral_codes"
ON referral_codes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_referrals"
ON referrals FOR SELECT
TO authenticated
USING (
    referrer_id = auth.uid() 
    OR referee_id = auth.uid()
    OR is_company_staff()
);

CREATE POLICY "insert_referrals"
ON referrals FOR INSERT
TO authenticated
WITH CHECK (true);

-- User credits
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_user_credits"
ON user_credits FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_company_staff()
);

CREATE POLICY "insert_user_credits"
ON user_credits FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================
-- 13. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON order_preferences TO authenticated;
GRANT ALL ON order_addons TO authenticated;
GRANT ALL ON order_status_history TO authenticated;
GRANT ALL ON user_addresses TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON referral_codes TO authenticated;
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON user_credits TO authenticated;

GRANT SELECT, INSERT ON users TO anon;

-- =============================================
-- 14. VERIFY SETUP
-- =============================================

SELECT 'Role-Based Access Control Setup Complete!' as status;

-- Show current users and their roles
SELECT id, email, full_name, role, is_active FROM users ORDER BY role, email;
