-- =============================================
-- ENHANCED ORDERS TABLE
-- Adds driver assignment, notes, priority
-- =============================================

-- 1. Add new columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_pickup_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_pickup_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_by UUID;

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_is_priority ON orders(is_priority);

-- 3. Update drivers table to track current load
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_orders INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS max_orders INTEGER DEFAULT 10;

-- 4. Create function to update driver order count
CREATE OR REPLACE FUNCTION update_driver_order_count()
RETURNS TRIGGER AS $$
BEGIN
    -- When order is assigned to a driver
    IF NEW.driver_id IS NOT NULL AND (OLD.driver_id IS NULL OR OLD.driver_id != NEW.driver_id) THEN
        -- Increment new driver's count
        UPDATE drivers SET current_orders = current_orders + 1 WHERE id = NEW.driver_id;
        -- Decrement old driver's count if there was one
        IF OLD.driver_id IS NOT NULL THEN
            UPDATE drivers SET current_orders = current_orders - 1 WHERE id = OLD.driver_id;
        END IF;
    END IF;
    
    -- When order is unassigned from a driver
    IF NEW.driver_id IS NULL AND OLD.driver_id IS NOT NULL THEN
        UPDATE drivers SET current_orders = current_orders - 1 WHERE id = OLD.driver_id;
    END IF;
    
    -- When order is delivered or cancelled, decrement driver count
    IF NEW.status IN ('delivered', 'cancelled') AND OLD.status NOT IN ('delivered', 'cancelled') AND NEW.driver_id IS NOT NULL THEN
        UPDATE drivers SET current_orders = current_orders - 1 WHERE id = NEW.driver_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS order_driver_count_trigger ON orders;
CREATE TRIGGER order_driver_count_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_order_count();

-- 5. Create order_notes table for internal communication
CREATE TABLE IF NOT EXISTS order_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    note TEXT NOT NULL,
    is_customer_visible BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

-- Policies for order_notes
DROP POLICY IF EXISTS "Staff can view order notes" ON order_notes;
DROP POLICY IF EXISTS "Staff can insert order notes" ON order_notes;
DROP POLICY IF EXISTS "Staff can delete own notes" ON order_notes;

CREATE POLICY "Staff can view order notes"
ON order_notes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can insert order notes"
ON order_notes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Staff can delete own notes"
ON order_notes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

GRANT ALL ON order_notes TO authenticated;

-- 6. Show current orders structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;
