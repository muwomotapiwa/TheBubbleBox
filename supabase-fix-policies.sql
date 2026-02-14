-- =============================================
-- FIX: Add missing INSERT/UPDATE/DELETE policies
-- Run this in your Supabase SQL Editor
-- =============================================

-- Fix order_status_history policies
DROP POLICY IF EXISTS "Users can insert own order status" ON order_status_history;
DROP POLICY IF EXISTS "Users can view own order status history" ON order_status_history;

CREATE POLICY "Users can view own order status history"
ON order_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own order status"
ON order_status_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()
  )
);

-- Fix notification_logs policies (add INSERT)
DROP POLICY IF EXISTS "Users can insert own notifications" ON notification_logs;

CREATE POLICY "Users can insert own notifications"
ON notification_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Fix user_addresses policies (add INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Users can insert own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON user_addresses;

CREATE POLICY "Users can insert own addresses"
ON user_addresses FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
ON user_addresses FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
ON user_addresses FOR DELETE
USING (user_id = auth.uid());

-- Fix reviews policies (add INSERT, UPDATE)
DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;

CREATE POLICY "Users can insert own reviews"
ON reviews FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
USING (user_id = auth.uid());

-- Fix referrals table policies (add INSERT)
DROP POLICY IF EXISTS "Users can insert referrals" ON referrals;

CREATE POLICY "Users can insert referrals"
ON referrals FOR INSERT
WITH CHECK (referrer_id = auth.uid() OR referee_id = auth.uid());

-- Fix user_credits policies (add all operations)
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;

CREATE POLICY "Users can view own credits"
ON user_credits FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own credits"
ON user_credits FOR INSERT
WITH CHECK (user_id = auth.uid());

-- =============================================
-- Fix orders - allow users to UPDATE their own orders (for cancellation)
-- =============================================
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

CREATE POLICY "Users can update own orders"
ON orders FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================
-- Fix payments - allow users to UPDATE their own payments (for refund status)
-- =============================================
DROP POLICY IF EXISTS "Users can update own payments" ON payments;

CREATE POLICY "Users can update own payments"
ON payments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================
-- DONE! All policies fixed.
-- =============================================
