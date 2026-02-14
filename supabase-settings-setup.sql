-- =============================================
-- SETTINGS TABLE SETUP
-- For configurable app settings
-- =============================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS app_settings CASCADE;

-- Create settings table
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'text', -- text, number, boolean, json
    category VARCHAR(100) DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view settings"
ON app_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated can update settings"
ON app_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can insert settings"
ON app_settings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON app_settings TO authenticated;
GRANT SELECT ON app_settings TO anon;

-- =============================================
-- INSERT DEFAULT SETTINGS
-- =============================================

INSERT INTO app_settings (key, value, label, description, type, category, sort_order) VALUES
-- Pricing Settings
('delivery_fee', '5', 'Delivery Fee', 'Standard delivery fee charged per order', 'number', 'pricing', 1),
('free_delivery_threshold', '50', 'Free Delivery Threshold', 'Minimum order amount for free delivery', 'number', 'pricing', 2),
('authorization_hold', '20', 'Authorization Hold', 'Amount to hold on card before final charge', 'number', 'pricing', 3),
('minimum_order', '10', 'Minimum Order Amount', 'Minimum order value required', 'number', 'pricing', 4),
('express_fee', '10', 'Express Service Fee', 'Additional fee for same-day/express service', 'number', 'pricing', 5),

-- Business Settings
('business_name', 'The Bubble Box', 'Business Name', 'Your business name displayed on the site', 'text', 'business', 1),
('business_email', 'info@bubblebox.com', 'Business Email', 'Contact email for customers', 'text', 'business', 2),
('business_phone', '+1234567890', 'Business Phone', 'Contact phone number', 'text', 'business', 3),
('business_address', '123 Main Street, City', 'Business Address', 'Physical business address', 'text', 'business', 4),

-- Order Settings
('min_pickup_hours', '2', 'Minimum Pickup Notice', 'Minimum hours notice required for pickup', 'number', 'orders', 1),
('turnaround_hours', '24', 'Standard Turnaround', 'Minimum hours between pickup and delivery', 'number', 'orders', 2),
('max_advance_days', '14', 'Max Advance Booking', 'Maximum days in advance customers can book', 'number', 'orders', 3),

-- Membership Settings
('member_delivery_discount', '100', 'Member Delivery Discount', 'Percentage discount on delivery for members (100 = free)', 'number', 'membership', 1),
('member_service_discount', '10', 'Member Service Discount', 'Percentage discount on services for members', 'number', 'membership', 2);

-- Verify settings
SELECT key, value, label, category FROM app_settings ORDER BY category, sort_order;
