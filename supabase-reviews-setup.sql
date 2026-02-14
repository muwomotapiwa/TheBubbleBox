-- =============================================
-- REVIEWS TABLE SETUP
-- For Admin-Only Customer Reviews/Testimonials
-- =============================================

-- Drop existing table if it exists (fresh start)
DROP TABLE IF EXISTS reviews CASCADE;

-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,
    customer_location VARCHAR(100) DEFAULT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    service_type VARCHAR(50) DEFAULT 'laundry',
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    avatar_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Anyone can view approved reviews (for homepage)
CREATE POLICY "Anyone can view approved reviews"
ON reviews FOR SELECT
TO public
USING (is_approved = true);

-- 2. Authenticated users can view all reviews (for admin)
CREATE POLICY "Authenticated can view all reviews"
ON reviews FOR SELECT
TO authenticated
USING (true);

-- 3. Authenticated users can insert reviews
CREATE POLICY "Authenticated can insert reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Authenticated users can update reviews
CREATE POLICY "Authenticated can update reviews"
ON reviews FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Authenticated users can delete reviews
CREATE POLICY "Authenticated can delete reviews"
ON reviews FOR DELETE
TO authenticated
USING (true);

-- Grant permissions
GRANT ALL ON reviews TO authenticated;
GRANT SELECT ON reviews TO anon;

-- =============================================
-- SAMPLE REVIEWS (Admin-created testimonials)
-- =============================================

INSERT INTO reviews (customer_name, customer_location, rating, comment, service_type, is_featured, is_approved) VALUES
(
    'Sarah Johnson',
    'Downtown',
    5,
    'Absolutely amazing service! My suits came back looking brand new. The attention to detail is incredible. Will definitely be using The Bubble Box for all my dry cleaning needs.',
    'suit',
    true,
    true
),
(
    'Michael Chen',
    'Westside',
    5,
    'I''ve been using their laundry service for 3 months now. Pickup and delivery is always on time, and my clothes smell fantastic. The app makes everything so easy!',
    'laundry',
    true,
    true
),
(
    'Emily Rodriguez',
    'Northgate',
    5,
    'They saved my favorite leather boots! I thought they were ruined but The Bubble Box brought them back to life. Amazing shoe cleaning service.',
    'shoe',
    true,
    true
),
(
    'David Kim',
    'Business District',
    4,
    'Great dry cleaning service. My dress shirts always come back perfectly pressed. The only reason for 4 stars is I wish they had earlier morning pickup times.',
    'dry-clean',
    true,
    true
),
(
    'Amanda Peters',
    'Suburbs',
    5,
    'The Bubble Pass subscription is a game changer! Free delivery has saved me so much time and money. Highly recommend for busy families.',
    'laundry',
    true,
    true
),
(
    'James Wilson',
    'City Center',
    5,
    'Professional, reliable, and affordable. They handle my business suits with care. The eco-friendly cleaning option is a bonus!',
    'suit',
    true,
    true
);

-- Verify the data
SELECT id, customer_name, rating, service_type, is_featured, is_approved FROM reviews;
