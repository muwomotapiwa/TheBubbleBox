-- =============================================
-- ROLES & PERMISSIONS SYSTEM
-- Super User, Admin, Staff, Customer roles
-- =============================================

-- =============================================
-- 1. ADD REQUIRED COLUMNS TO USERS TABLE
-- =============================================

-- Add role column (simple ALTER with error handling)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- Add is_active column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add created_by column
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT NULL;

-- =============================================
-- 2. CREATE ROLES TABLE
-- =============================================

DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0, -- Higher = more permissions
    is_system BOOLEAN DEFAULT false, -- System roles can't be deleted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, display_name, description, level, is_system) VALUES
('super_admin', 'Super Administrator', 'Full access to everything. Can manage all users and permissions.', 100, true),
('admin', 'Administrator', 'Access to admin dashboard. Can manage orders, products, and view reports.', 80, true),
('manager', 'Manager', 'Can manage orders, drivers, and view reports. Limited settings access.', 60, true),
('staff', 'Staff', 'Can view and process orders. No access to settings or reports.', 40, true),
('driver', 'Driver', 'Can view assigned orders and update delivery status.', 20, true),
('customer', 'Customer', 'Regular customer. Can place orders and view own history.', 0, true);

-- =============================================
-- 3. CREATE PERMISSIONS TABLE
-- =============================================

DROP TABLE IF EXISTS permissions CASCADE;

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'orders', 'products', 'users', 'reports', 'settings'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
-- Orders
('orders.view', 'View Orders', 'Can view all orders', 'orders'),
('orders.create', 'Create Orders', 'Can create orders for customers', 'orders'),
('orders.edit', 'Edit Orders', 'Can edit order details', 'orders'),
('orders.cancel', 'Cancel Orders', 'Can cancel orders', 'orders'),
('orders.assign_driver', 'Assign Driver', 'Can assign drivers to orders', 'orders'),

-- Products & Pricing
('products.view', 'View Products', 'Can view products and prices', 'products'),
('products.create', 'Create Products', 'Can add new products', 'products'),
('products.edit', 'Edit Products', 'Can edit products and prices', 'products'),
('products.delete', 'Delete Products', 'Can delete products', 'products'),

-- Users
('users.view', 'View Users', 'Can view user list', 'users'),
('users.create', 'Create Users', 'Can create new users', 'users'),
('users.edit', 'Edit Users', 'Can edit user details', 'users'),
('users.delete', 'Delete Users', 'Can deactivate/delete users', 'users'),
('users.assign_role', 'Assign Roles', 'Can assign roles to users', 'users'),

-- Drivers
('drivers.view', 'View Drivers', 'Can view driver list', 'drivers'),
('drivers.create', 'Create Drivers', 'Can add new drivers', 'drivers'),
('drivers.edit', 'Edit Drivers', 'Can edit driver details', 'drivers'),
('drivers.delete', 'Delete Drivers', 'Can remove drivers', 'drivers'),

-- Reports & Revenue
('reports.view', 'View Reports', 'Can view revenue and analytics', 'reports'),
('reports.export', 'Export Reports', 'Can export reports to CSV/PDF', 'reports'),

-- Settings
('settings.view', 'View Settings', 'Can view app settings', 'settings'),
('settings.edit', 'Edit Settings', 'Can edit app settings', 'settings'),
('settings.subscriptions', 'Manage Subscriptions', 'Can edit subscription plans', 'settings'),
('settings.services', 'Manage Services', 'Can edit service categories', 'settings'),
('settings.promos', 'Manage Promos', 'Can create and edit promo codes', 'settings'),

-- Reviews
('reviews.view', 'View Reviews', 'Can view all reviews', 'reviews'),
('reviews.create', 'Create Reviews', 'Can add reviews/testimonials', 'reviews'),
('reviews.edit', 'Edit Reviews', 'Can edit reviews', 'reviews'),
('reviews.delete', 'Delete Reviews', 'Can delete reviews', 'reviews'),

-- Customer Notes
('customers.view', 'View Customers', 'Can view customer details', 'customers'),
('customers.notes', 'Manage Customer Notes', 'Can add/edit customer notes', 'customers');

-- =============================================
-- 4. CREATE ROLE_PERMISSIONS TABLE
-- =============================================

DROP TABLE IF EXISTS role_permissions CASCADE;

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) REFERENCES roles(name) ON DELETE CASCADE,
    permission_name VARCHAR(100) REFERENCES permissions(name) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_name, permission_name)
);

-- Super Admin gets ALL permissions
INSERT INTO role_permissions (role_name, permission_name)
SELECT 'super_admin', name FROM permissions;

-- Admin gets most permissions (except user role assignment)
INSERT INTO role_permissions (role_name, permission_name)
SELECT 'admin', name FROM permissions 
WHERE name NOT IN ('users.assign_role', 'users.delete');

-- Manager gets order, product, driver, customer, review permissions
INSERT INTO role_permissions (role_name, permission_name)
SELECT 'manager', name FROM permissions 
WHERE category IN ('orders', 'products', 'drivers', 'customers', 'reviews')
OR name IN ('reports.view');

-- Staff gets basic order and customer view permissions
INSERT INTO role_permissions (role_name, permission_name) VALUES
('staff', 'orders.view'),
('staff', 'orders.edit'),
('staff', 'products.view'),
('staff', 'customers.view'),
('staff', 'drivers.view');

-- Driver gets limited permissions
INSERT INTO role_permissions (role_name, permission_name) VALUES
('driver', 'orders.view');

-- =============================================
-- 5. CREATE NOTIFICATION SETTINGS TABLE
-- =============================================

DROP TABLE IF EXISTS notification_settings CASCADE;

CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- 'order_placed', 'order_cancelled', etc.
    email_enabled BOOLEAN DEFAULT true,
    email_recipients TEXT[] DEFAULT '{}', -- Array of emails
    sms_enabled BOOLEAN DEFAULT false,
    sms_recipients TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default notification settings
INSERT INTO notification_settings (event_type, email_enabled, email_recipients) VALUES
('order_placed', true, ARRAY['muwomotapiwa@gmail.com']),
('order_cancelled', true, ARRAY['muwomotapiwa@gmail.com']),
('order_delivered', true, ARRAY['muwomotapiwa@gmail.com']),
('new_customer', true, ARRAY['muwomotapiwa@gmail.com']),
('low_driver_availability', true, ARRAY['muwomotapiwa@gmail.com']);

-- =============================================
-- 6. CREATE EMAIL QUEUE TABLE
-- =============================================

DROP TABLE IF EXISTS email_queue CASCADE;

CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    html_body TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0
);

-- =============================================
-- 7. SET UP RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Roles policies
CREATE POLICY "Anyone can view roles" ON roles FOR SELECT TO public USING (true);
CREATE POLICY "Super admin can manage roles" ON roles FOR ALL TO authenticated USING (true);

-- Permissions policies
CREATE POLICY "Anyone can view permissions" ON permissions FOR SELECT TO public USING (true);

-- Role permissions policies
CREATE POLICY "Anyone can view role_permissions" ON role_permissions FOR SELECT TO public USING (true);
CREATE POLICY "Super admin can manage role_permissions" ON role_permissions FOR ALL TO authenticated USING (true);

-- Notification settings policies
CREATE POLICY "Authenticated can view notification_settings" ON notification_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage notification_settings" ON notification_settings FOR ALL TO authenticated USING (true);

-- Email queue policies
CREATE POLICY "Authenticated can view email_queue" ON email_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage email_queue" ON email_queue FOR ALL TO authenticated USING (true);

-- Grant permissions
GRANT ALL ON roles TO authenticated;
GRANT ALL ON permissions TO authenticated;
GRANT ALL ON role_permissions TO authenticated;
GRANT ALL ON notification_settings TO authenticated;
GRANT ALL ON email_queue TO authenticated;
GRANT SELECT ON roles TO anon;
GRANT SELECT ON permissions TO anon;
GRANT SELECT ON role_permissions TO anon;

-- =============================================
-- 8. UPDATE EXISTING USER TO SUPER ADMIN
-- =============================================

-- Update the user muwomotapiwa@gmail.com to be super_admin
-- This will update if user exists, otherwise do nothing
DO $$
BEGIN
    UPDATE users SET role = 'super_admin' WHERE email = 'muwomotapiwa@gmail.com';
    IF NOT FOUND THEN
        RAISE NOTICE 'User muwomotapiwa@gmail.com not found. Please sign up first.';
    END IF;
END $$;

-- =============================================
-- 9. CREATE HELPER FUNCTION TO CHECK PERMISSIONS
-- =============================================

CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    has_perm BOOLEAN;
BEGIN
    -- Get user's role
    SELECT role INTO user_role FROM users WHERE id = user_id;
    
    -- Super admin has all permissions
    IF user_role = 'super_admin' THEN
        RETURN true;
    END IF;
    
    -- Check if role has the permission
    SELECT EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role_name = user_role
        AND rp.permission_name = permission_name
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 10. CREATE FUNCTION TO QUEUE EMAIL ON ORDER
-- =============================================

CREATE OR REPLACE FUNCTION queue_order_email()
RETURNS TRIGGER AS $$
DECLARE
    recipient TEXT;
    recipients TEXT[];
    user_name TEXT;
    order_total NUMERIC;
BEGIN
    -- Get notification recipients for order_placed
    SELECT email_recipients INTO recipients 
    FROM notification_settings 
    WHERE event_type = 'order_placed' AND email_enabled = true;
    
    -- Get user name
    SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
    
    -- Queue email for each recipient
    IF recipients IS NOT NULL THEN
        FOREACH recipient IN ARRAY recipients
        LOOP
            INSERT INTO email_queue (to_email, subject, body, html_body)
            VALUES (
                recipient,
                'New Order Placed - ' || NEW.order_number,
                'A new order has been placed.' || E'\n\n' ||
                'Order Number: ' || NEW.order_number || E'\n' ||
                'Customer: ' || COALESCE(user_name, 'Unknown') || E'\n' ||
                'Service: ' || NEW.service_type || E'\n' ||
                'Total: $' || NEW.total_amount || E'\n' ||
                'Status: ' || NEW.status || E'\n\n' ||
                'Please check the admin dashboard for details.',
                '<h2>New Order Placed</h2>' ||
                '<p>A new order has been placed on The Bubble Box.</p>' ||
                '<table style="border-collapse: collapse; width: 100%; max-width: 400px;">' ||
                '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Order Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' || NEW.order_number || '</td></tr>' ||
                '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Customer</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' || COALESCE(user_name, 'Unknown') || '</td></tr>' ||
                '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Service</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' || NEW.service_type || '</td></tr>' ||
                '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #ddd;">$' || NEW.total_amount || '</td></tr>' ||
                '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' || NEW.status || '</td></tr>' ||
                '</table>' ||
                '<p style="margin-top: 20px;"><a href="https://019c4ea9-fe45-7351-bff1-93899c14310f.arena.site/admin" style="background-color: #e14171; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Dashboard</a></p>'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to queue email when order is placed
DROP TRIGGER IF EXISTS order_placed_email_trigger ON orders;
CREATE TRIGGER order_placed_email_trigger
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION queue_order_email();

-- =============================================
-- VERIFY SETUP
-- =============================================

SELECT 'Roles:' as info, COUNT(*) as count FROM roles
UNION ALL
SELECT 'Permissions:', COUNT(*) FROM permissions
UNION ALL
SELECT 'Role Permissions:', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'Notification Settings:', COUNT(*) FROM notification_settings;
