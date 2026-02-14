-- Add promo_code column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'promo_code') THEN
        ALTER TABLE orders ADD COLUMN promo_code VARCHAR(50) DEFAULT NULL;
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'promo_code';
