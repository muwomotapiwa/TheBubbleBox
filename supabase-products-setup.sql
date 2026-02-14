-- =============================================
-- PRODUCTS TABLE SETUP FOR THE BUBBLE BOX
-- =============================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vqppcsvpqoamxspkesbe/sql
-- =============================================

-- Drop existing table if exists (for clean setup)
DROP TABLE IF EXISTS products CASCADE;

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('laundry', 'suit', 'shoe', 'dry-clean', 'addon')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'per_item' CHECK (unit IN ('per_item', 'per_kg', 'per_bag', 'per_pair')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies (products are public read, admin write)
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can view all products"
ON products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON products FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete products"
ON products FOR DELETE
TO authenticated
USING (true);

-- Grant permissions
GRANT SELECT ON products TO anon;
GRANT ALL ON products TO authenticated;

-- =============================================
-- INSERT DEFAULT PRODUCTS
-- =============================================

-- LAUNDRY PRODUCTS
INSERT INTO products (category, name, description, price, unit, sort_order) VALUES
('laundry', 'Regular Bag', 'Standard laundry bag (up to 4kg)', 12.00, 'per_bag', 1),
('laundry', 'Large Bag', 'Large laundry bag (up to 8kg)', 20.00, 'per_bag', 2),
('laundry', 'Wash & Fold', 'Per kilogram pricing for wash and fold', 2.50, 'per_kg', 3),
('laundry', 'Hang Dry', 'Air dry delicate items', 3.00, 'per_item', 4),
('laundry', 'Express Wash', '24-hour turnaround', 18.00, 'per_bag', 5);

-- SUIT PRODUCTS
INSERT INTO products (category, name, description, price, unit, sort_order) VALUES
('suit', '2-Piece Suit', 'Jacket and pants cleaning', 25.00, 'per_item', 1),
('suit', '3-Piece Suit', 'Jacket, pants, and vest cleaning', 35.00, 'per_item', 2),
('suit', 'Blazer', 'Single blazer or sport coat', 18.00, 'per_item', 3),
('suit', 'Dress Pants', 'Formal trousers cleaning', 12.00, 'per_item', 4),
('suit', 'Tuxedo', 'Full tuxedo cleaning and pressing', 45.00, 'per_item', 5),
('suit', 'Waistcoat', 'Vest or waistcoat cleaning', 10.00, 'per_item', 6);

-- SHOE PRODUCTS
INSERT INTO products (category, name, description, price, unit, sort_order) VALUES
('shoe', 'Sneakers - Basic Clean', 'Surface clean and deodorize', 8.00, 'per_item', 1),
('shoe', 'Sneakers - Deep Clean', 'Full restoration and whitening', 15.00, 'per_item', 2),
('shoe', 'Leather Shoes', 'Clean, condition, and polish', 12.00, 'per_item', 3),
('shoe', 'Suede/Nubuck', 'Specialized suede cleaning', 15.00, 'per_item', 4),
('shoe', 'Boots', 'Full boot cleaning and conditioning', 18.00, 'per_item', 5),
('shoe', 'Sandals', 'Clean and sanitize', 6.00, 'per_item', 6),
('shoe', 'Designer Shoes', 'Premium care for luxury footwear', 25.00, 'per_item', 7);

-- DRY CLEANING PRODUCTS
INSERT INTO products (category, name, description, price, unit, sort_order) VALUES
('dry-clean', 'Dress Shirt', 'Professional shirt cleaning and pressing', 6.00, 'per_item', 1),
('dry-clean', 'Dress/Gown', 'Delicate dress cleaning', 18.00, 'per_item', 2),
('dry-clean', 'Blouse', 'Ladies blouse cleaning', 8.00, 'per_item', 3),
('dry-clean', 'Skirt', 'Skirt cleaning and pressing', 10.00, 'per_item', 4),
('dry-clean', 'Coat/Jacket', 'Outerwear cleaning', 22.00, 'per_item', 5),
('dry-clean', 'Sweater', 'Knit and sweater care', 10.00, 'per_item', 6),
('dry-clean', 'Tie', 'Silk and fabric tie cleaning', 5.00, 'per_item', 7),
('dry-clean', 'Scarf', 'Delicate scarf cleaning', 8.00, 'per_item', 8),
('dry-clean', 'Wedding Dress', 'Premium wedding dress cleaning and preservation', 150.00, 'per_item', 9),
('dry-clean', 'Curtains (per panel)', 'Curtain and drape cleaning', 15.00, 'per_item', 10),
('dry-clean', 'Comforter/Duvet', 'Large bedding item cleaning', 35.00, 'per_item', 11),
('dry-clean', 'Blanket', 'Blanket cleaning', 20.00, 'per_item', 12);

-- ADD-ON PRODUCTS (for extras)
INSERT INTO products (category, name, description, price, unit, sort_order) VALUES
('addon', 'Stain Treatment', 'Professional spot treatment for tough stains', 5.00, 'per_item', 1),
('addon', 'Whitening', 'Brighten whites with oxygen bleach', 4.00, 'per_item', 2),
('addon', 'Scent Booster', 'Extra long-lasting fragrance', 3.00, 'per_item', 3),
('addon', 'Button Repair', 'Reattach or replace loose buttons', 2.00, 'per_item', 4),
('addon', 'Minor Repair', 'Small seam or hem repair', 5.00, 'per_item', 5),
('addon', 'Fabric Softener', 'Premium fabric softener treatment', 2.00, 'per_item', 6),
('addon', 'Anti-Static Treatment', 'Reduce static cling', 2.00, 'per_item', 7),
('addon', 'Waterproofing', 'Apply water-resistant coating', 10.00, 'per_item', 8);

-- =============================================
-- DONE! You should see "Success. No rows returned"
-- Then check the products table to see all items
-- =============================================
