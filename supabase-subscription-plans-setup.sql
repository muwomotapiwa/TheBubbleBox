-- =============================================
-- SUBSCRIPTION PLANS TABLE SETUP
-- =============================================

-- Drop existing table if exists
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Create subscription_plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies - everyone can view active plans
CREATE POLICY "Anyone can view active subscription plans"
ON subscription_plans FOR SELECT
USING (is_active = true);

-- Authenticated users can view all plans (for admin)
CREATE POLICY "Authenticated users can view all subscription plans"
ON subscription_plans FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert plans
CREATE POLICY "Authenticated users can insert subscription plans"
ON subscription_plans FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update plans
CREATE POLICY "Authenticated users can update subscription plans"
ON subscription_plans FOR UPDATE
TO authenticated
USING (true);

-- Authenticated users can delete plans
CREATE POLICY "Authenticated users can delete subscription plans"
ON subscription_plans FOR DELETE
TO authenticated
USING (true);

-- Grant permissions
GRANT ALL ON subscription_plans TO authenticated;
GRANT SELECT ON subscription_plans TO anon;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, monthly_price, yearly_price, features, is_popular, sort_order) VALUES
(
    'Basic',
    'basic',
    'Pay as you go with standard service',
    0,
    0,
    '["Standard cleaning", "Regular delivery (2-3 days)", "Email support", "Basic order tracking"]'::jsonb,
    false,
    1
),
(
    'Bubble Pass',
    'bubble-pass',
    'Perfect for regular customers',
    14.99,
    149.99,
    '["Free delivery on all orders", "Priority cleaning (24h)", "10% off all services", "SMS & WhatsApp updates", "Priority customer support", "Free stain treatment"]'::jsonb,
    true,
    2
),
(
    'Family Pass',
    'family-pass',
    'Best value for families',
    24.99,
    249.99,
    '["Everything in Bubble Pass", "20% off all services", "Free pickup & delivery", "Dedicated account manager", "Same-day service available", "Free repairs & alterations", "Monthly free dry cleaning (5 items)", "Family member accounts (up to 4)"]'::jsonb,
    false,
    3
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER trigger_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Verify the data
SELECT name, slug, monthly_price, yearly_price, is_popular FROM subscription_plans ORDER BY sort_order;
