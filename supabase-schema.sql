-- =====================================================
-- THE BUBBLE BOX - COMPLETE DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/vqppcsvpqoamxspkesbe/sql
-- =====================================================

-- =====================================================
-- STEP 0: CLEAN UP - DROP ALL EXISTING OBJECTS
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_order_number ON public.orders;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
DROP TRIGGER IF EXISTS update_customer_notes_updated_at ON public.customer_notes;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;

-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.customer_notes CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.promo_codes CASCADE;
DROP TABLE IF EXISTS public.order_photos CASCADE;
DROP TABLE IF EXISTS public.driver_trips CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.referral_codes CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.order_addons CASCADE;
DROP TABLE IF EXISTS public.order_preferences CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.time_slots CASCADE;
DROP TABLE IF EXISTS public.service_zones CASCADE;
DROP TABLE IF EXISTS public.user_addresses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;
DROP TYPE IF EXISTS discount_type CASCADE;
DROP TYPE IF EXISTS photo_type CASCADE;
DROP TYPE IF EXISTS trip_type CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;
DROP TYPE IF EXISTS credit_type CASCADE;
DROP TYPE IF EXISTS referral_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS billing_cycle CASCADE;
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS addon_type CASCADE;
DROP TYPE IF EXISTS notification_style CASCADE;
DROP TYPE IF EXISTS packaging_type CASCADE;
DROP TYPE IF EXISTS folding_style CASCADE;
DROP TYPE IF EXISTS drying_heat CASCADE;
DROP TYPE IF EXISTS water_temp CASCADE;
DROP TYPE IF EXISTS detergent_type CASCADE;
DROP TYPE IF EXISTS service_type CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert for new user creation
CREATE POLICY "Enable insert for authenticated users only" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. USER ADDRESSES
-- =====================================================
CREATE TABLE public.user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    landmark TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    label TEXT, -- 'home', 'work', 'other'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses" ON public.user_addresses
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 3. SERVICE ZONES
-- =====================================================
CREATE TABLE public.service_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    driver_capacity INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TIME SLOTS
-- =====================================================
CREATE TABLE public.time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    zone_id UUID REFERENCES public.service_zones(id),
    capacity INT DEFAULT 10,
    booked_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, start_time, end_time, zone_id)
);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read time slots" ON public.time_slots
    FOR SELECT USING (true);

-- =====================================================
-- 5. ORDERS
-- =====================================================
CREATE TYPE order_status AS ENUM (
    'pending', 'confirmed', 'picked_up', 'at_facility', 
    'cleaning', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
);

CREATE TYPE service_type AS ENUM (
    'laundry', 'suit', 'shoe', 'dry-clean', 'multiple'
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL UNIQUE,
    status order_status DEFAULT 'pending',
    service_type service_type NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 5.00,
    discount DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    estimated_weight DECIMAL(5, 2),
    actual_weight DECIMAL(5, 2),
    pickup_address TEXT NOT NULL,
    pickup_landmark TEXT,
    pickup_slot_id UUID REFERENCES public.time_slots(id),
    delivery_slot_id UUID REFERENCES public.time_slots(id),
    pickup_date DATE,
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'BB-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- =====================================================
-- 6. ORDER ITEMS
-- =====================================================
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'laundry_bag', 'suit', 'shoe', 'dry_clean'
    item_name TEXT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    );

-- =====================================================
-- 7. ORDER PREFERENCES
-- =====================================================
CREATE TYPE detergent_type AS ENUM ('standard', 'hypoallergenic', 'eco');
CREATE TYPE water_temp AS ENUM ('cold', 'warm');
CREATE TYPE drying_heat AS ENUM ('low', 'medium');
CREATE TYPE folding_style AS ENUM ('square', 'kondo', 'rolled');
CREATE TYPE packaging_type AS ENUM ('plastic', 'paper', 'reusable');
CREATE TYPE notification_style AS ENUM ('whatsapp', 'sms', 'quiet');

CREATE TABLE public.order_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    detergent_type detergent_type,
    fabric_softener BOOLEAN DEFAULT FALSE,
    water_temp water_temp,
    drying_heat drying_heat,
    folding_style folding_style,
    shirts_hung BOOLEAN DEFAULT FALSE,
    pants_creased BOOLEAN DEFAULT FALSE,
    dropoff_instructions TEXT,
    custom_dropoff_instruction TEXT,
    packaging_type packaging_type,
    notification_style notification_style,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order preferences" ON public.order_preferences
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create order preferences" ON public.order_preferences
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    );

-- =====================================================
-- 8. ORDER ADDONS
-- =====================================================
CREATE TYPE addon_type AS ENUM ('stain_treatment', 'whitening', 'scent_boosters', 'repairs');

CREATE TABLE public.order_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    addon_type addon_type NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order addons" ON public.order_addons
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create order addons" ON public.order_addons
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    );

-- =====================================================
-- 9. ORDER STATUS HISTORY
-- =====================================================
CREATE TABLE public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order history" ON public.order_status_history
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    );

-- =====================================================
-- 10. PAYMENTS
-- =====================================================
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'wallet');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'completed', 'refunded', 'failed');

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    gateway_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 11. USER PREFERENCES (Default settings)
-- =====================================================
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    detergent_type detergent_type DEFAULT 'standard',
    fabric_softener BOOLEAN DEFAULT TRUE,
    water_temp water_temp DEFAULT 'cold',
    drying_heat drying_heat DEFAULT 'low',
    folding_style folding_style DEFAULT 'square',
    shirts_hung BOOLEAN DEFAULT FALSE,
    pants_creased BOOLEAN DEFAULT FALSE,
    default_packaging packaging_type DEFAULT 'plastic',
    notification_whatsapp BOOLEAN DEFAULT TRUE,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 12. SUBSCRIPTIONS (Bubble Pass)
-- =====================================================
CREATE TYPE plan_type AS ENUM ('basic', 'bubble_pass', 'family_pass');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type plan_type NOT NULL,
    billing_cycle billing_cycle NOT NULL,
    status subscription_status DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscription" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 13. REFERRAL CODES
-- =====================================================
CREATE TABLE public.referral_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    uses_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code" ON public.referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON public.referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can look up codes" ON public.referral_codes
    FOR SELECT USING (true);

-- =====================================================
-- 14. REFERRALS
-- =====================================================
CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired');

CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code_used TEXT NOT NULL,
    status referral_status DEFAULT 'pending',
    referrer_credit DECIMAL(10, 2) DEFAULT 10.00,
    referee_credit DECIMAL(10, 2) DEFAULT 10.00,
    credited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- =====================================================
-- 15. USER CREDITS
-- =====================================================
CREATE TYPE credit_type AS ENUM ('referral', 'promo', 'refund', 'admin');

CREATE TABLE public.user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    type credit_type NOT NULL,
    source_id UUID, -- referral_id or promo_id
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 16. DRIVERS
-- =====================================================
CREATE TYPE driver_status AS ENUM ('active', 'break', 'offline');

CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    status driver_status DEFAULT 'offline',
    zone_id UUID REFERENCES public.service_zones(id),
    vehicle_info TEXT,
    rating DECIMAL(2, 1) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 17. DRIVER TRIPS
-- =====================================================
CREATE TYPE trip_type AS ENUM ('pickup', 'delivery');

CREATE TABLE public.driver_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    trip_type trip_type NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    distance_km DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 18. ORDER PHOTOS (Proof of Delivery)
-- =====================================================
CREATE TYPE photo_type AS ENUM ('pickup', 'delivery', 'damage');

CREATE TABLE public.order_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.drivers(id),
    photo_type photo_type NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order photos" ON public.order_photos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
    );

-- =====================================================
-- 19. PROMO CODES
-- =====================================================
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

CREATE TABLE public.promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    max_uses INT,
    uses_count INT DEFAULT 0,
    min_order_value DECIMAL(10, 2),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promo codes" ON public.promo_codes
    FOR SELECT USING (is_active = true);

-- =====================================================
-- 20. REVIEWS
-- =====================================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, order_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read approved reviews" ON public.reviews
    FOR SELECT USING (is_approved = true OR auth.uid() = user_id);

-- =====================================================
-- 21. CUSTOMER NOTES (Admin Blackbook)
-- =====================================================
CREATE TABLE public.customer_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    added_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 22. NOTIFICATION LOGS
-- =====================================================
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'sms', 'email');
CREATE TYPE notification_status AS ENUM ('sent', 'delivered', 'failed');

CREATE TABLE public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id),
    channel notification_channel NOT NULL,
    message_type TEXT NOT NULL,
    status notification_status DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_notes_updated_at
    BEFORE UPDATE ON public.customer_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Auto-create user profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
    );
    
    -- Create default preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    -- Create referral code
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (
        NEW.id,
        UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'full_name', 'USER'), 1, 4)) || FLOOR(RANDOM() * 90 + 10)::TEXT
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SAMPLE DATA (Optional - remove in production)
-- =====================================================

-- Insert sample service zones
INSERT INTO public.service_zones (name, is_active, driver_capacity) VALUES
    ('Downtown', true, 15),
    ('Midtown', true, 12),
    ('Uptown', true, 10),
    ('Brooklyn', true, 8);

-- Insert sample promo codes
INSERT INTO public.promo_codes (code, discount_type, discount_value, max_uses, min_order_value) VALUES
    ('WELCOME10', 'percentage', 10, 1000, 20),
    ('BUBBLE20', 'fixed', 20, 500, 50),
    ('FIRSTORDER', 'percentage', 15, NULL, 25);

-- =====================================================
-- STORAGE BUCKET FOR PHOTOS
-- Run this separately in Supabase Storage settings
-- =====================================================
-- Create a bucket called 'order-photos' with public access
-- Set max file size to 5MB
-- Allow image file types only

COMMENT ON SCHEMA public IS 'The Bubble Box - Complete Database Schema v1.0';
