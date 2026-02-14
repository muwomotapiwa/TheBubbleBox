-- =============================================
-- SERVICE CATEGORIES SETUP
-- For managing price ranges on the Services page
-- =============================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS service_categories CASCADE;

-- Create the service_categories table
CREATE TABLE service_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    tagline VARCHAR(200),
    description TEXT,
    price_range VARCHAR(100) NOT NULL,
    price_note VARCHAR(100),
    icon VARCHAR(50) DEFAULT 'Sparkles',
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active service categories"
ON service_categories FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can update service categories"
ON service_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can insert service categories"
ON service_categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service categories"
ON service_categories FOR DELETE
TO authenticated
USING (true);

-- Grant permissions
GRANT ALL ON service_categories TO authenticated;
GRANT SELECT ON service_categories TO anon;

-- Insert default service categories
INSERT INTO service_categories (slug, name, tagline, description, price_range, price_note, icon, features, sort_order) VALUES
(
    'laundry',
    'Laundry Services',
    'Fresh, Clean, Perfectly Folded',
    'Our signature wash & fold service. We handle your everyday laundry with care, using premium detergents and fabric softeners.',
    '$2.50/kg or $12/bag',
    'Priced by weight or bag',
    'Shirt',
    '["Wash & fold service", "Premium detergents", "Fabric softener included", "Same-day available", "Eco-friendly options", "Delicates handled with care"]'::jsonb,
    1
),
(
    'suit',
    'Suit Cleaning',
    'Executive Care for Executive Wear',
    'Professional dry cleaning for your business attire. We ensure your suits look sharp and professionally pressed.',
    '$18-$30 per suit',
    'Depends on suit type',
    'Briefcase',
    '["Professional pressing", "Stain treatment", "Minor repairs included", "Protective garment bag", "Same-week turnaround", "VIP express available"]'::jsonb,
    2
),
(
    'shoe',
    'Shoe Cleaning',
    'Step Out in Style',
    'Restore your footwear to like-new condition. From sneakers to leather dress shoes, we handle all types.',
    '$15-$35 per pair',
    'Based on shoe type',
    'Footprints',
    '["Deep cleaning", "Deodorizing", "Leather conditioning", "Suede restoration", "Sole cleaning", "Protective coating"]'::jsonb,
    3
),
(
    'dry-clean',
    'Dry Cleaning',
    'Delicate Fabrics, Expert Care',
    'Specialized cleaning for delicate fabrics, formal wear, and items that require extra attention.',
    '$5-$150 per item',
    'Varies by garment',
    'Sparkles',
    '["Gentle on fabrics", "Stain specialists", "Wedding dress experts", "Leather & suede care", "Curtains & drapes", "Designer garment care"]'::jsonb,
    4
);

-- Verify the data
SELECT slug, name, price_range, price_note FROM service_categories ORDER BY sort_order;
