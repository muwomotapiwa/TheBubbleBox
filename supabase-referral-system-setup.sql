-- =============================================
-- COMPLETE REFERRAL SYSTEM SETUP
-- =============================================

-- 1. Ensure referral_codes table is correct
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    uses_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure referrals table is correct
DROP TABLE IF EXISTS referrals CASCADE;
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Person who shared the code
    referee_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- Person who used the code
    referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,
    code_used VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, expired
    referrer_credited BOOLEAN DEFAULT false,
    referee_credited BOOLEAN DEFAULT false,
    referrer_credit_amount DECIMAL(10,2) DEFAULT 10.00,
    referee_credit_amount DECIMAL(10,2) DEFAULT 10.00,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure user_credits table is correct
DROP TABLE IF EXISTS user_credits CASCADE;
CREATE TABLE user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'referral_bonus', 'referee_bonus', 'promotion', 'refund', 'used'
    description TEXT,
    reference_id UUID DEFAULT NULL, -- Links to referral_id or order_id
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add referred_by column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(20) DEFAULT NULL;

-- 5. Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'referral_codes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON referral_codes', pol.policyname);
    END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'referrals'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON referrals', pol.policyname);
    END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_credits'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_credits', pol.policyname);
    END LOOP;
END $$;

-- 7. Create policies for referral_codes
CREATE POLICY "Anyone can view active referral codes"
ON referral_codes FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Users can view own referral codes"
ON referral_codes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated can insert referral codes"
ON referral_codes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own referral codes"
ON referral_codes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 8. Create policies for referrals
CREATE POLICY "Users can view own referrals as referrer"
ON referrals FOR SELECT
TO authenticated
USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "Authenticated can insert referrals"
ON referrals FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update referrals"
ON referrals FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 9. Create policies for user_credits
CREATE POLICY "Users can view own credits"
ON user_credits FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated can insert credits"
ON user_credits FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admin can view all
CREATE POLICY "Admin can view all referrals"
ON referrals FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
);

CREATE POLICY "Admin can view all credits"
ON user_credits FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
);

-- 10. Grant permissions
GRANT ALL ON referral_codes TO authenticated;
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON user_credits TO authenticated;
GRANT SELECT ON referral_codes TO anon;

-- 11. Create function to validate and use referral code
CREATE OR REPLACE FUNCTION use_referral_code(
    p_code VARCHAR(20),
    p_referee_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_referral_code RECORD;
    v_referrer_id UUID;
    v_referral_id UUID;
BEGIN
    -- Find the referral code
    SELECT * INTO v_referral_code
    FROM referral_codes
    WHERE code = UPPER(p_code)
    AND is_active = true
    AND (max_uses IS NULL OR uses_count < max_uses);
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Invalid or expired referral code');
    END IF;
    
    -- Check if user is trying to use their own code
    IF v_referral_code.user_id = p_referee_id THEN
        RETURN json_build_object('success', false, 'message', 'You cannot use your own referral code');
    END IF;
    
    -- Check if user already used a referral code
    IF EXISTS (SELECT 1 FROM referrals WHERE referee_id = p_referee_id) THEN
        RETURN json_build_object('success', false, 'message', 'You have already used a referral code');
    END IF;
    
    v_referrer_id := v_referral_code.user_id;
    
    -- Create the referral record
    INSERT INTO referrals (referrer_id, referee_id, referral_code_id, code_used, status)
    VALUES (v_referrer_id, p_referee_id, v_referral_code.id, UPPER(p_code), 'pending')
    RETURNING id INTO v_referral_id;
    
    -- Update uses count
    UPDATE referral_codes SET uses_count = uses_count + 1 WHERE id = v_referral_code.id;
    
    -- Update user's referred_by
    UPDATE users SET referred_by = v_referrer_id, referral_code_used = UPPER(p_code) WHERE id = p_referee_id;
    
    -- Give referee their $10 credit immediately
    INSERT INTO user_credits (user_id, amount, type, description, reference_id)
    VALUES (p_referee_id, 10.00, 'referee_bonus', 'Welcome bonus for using referral code ' || UPPER(p_code), v_referral_id);
    
    -- Update referral to show referee was credited
    UPDATE referrals SET referee_credited = true WHERE id = v_referral_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Referral code applied! You received $10 credit.',
        'referral_id', v_referral_id,
        'credit_amount', 10.00
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to complete referral (called when referee completes first order)
CREATE OR REPLACE FUNCTION complete_referral(p_referee_id UUID)
RETURNS JSON AS $$
DECLARE
    v_referral RECORD;
BEGIN
    -- Find pending referral for this referee
    SELECT * INTO v_referral
    FROM referrals
    WHERE referee_id = p_referee_id
    AND status = 'pending'
    AND referrer_credited = false;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'No pending referral found');
    END IF;
    
    -- Give referrer their $10 credit
    INSERT INTO user_credits (user_id, amount, type, description, reference_id)
    VALUES (v_referral.referrer_id, 10.00, 'referral_bonus', 'Referral bonus - your friend completed their first order', v_referral.id);
    
    -- Update referral status
    UPDATE referrals 
    SET status = 'completed', 
        referrer_credited = true, 
        completed_at = NOW()
    WHERE id = v_referral.id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Referral completed! Referrer credited $10.',
        'referrer_id', v_referral.referrer_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to get user's credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'used' THEN -amount
            ELSE amount
        END
    ), 0) INTO v_balance
    FROM user_credits
    WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger to complete referral on first order
CREATE OR REPLACE FUNCTION trigger_complete_referral()
RETURNS TRIGGER AS $$
DECLARE
    v_order_count INTEGER;
BEGIN
    -- Count user's completed orders
    SELECT COUNT(*) INTO v_order_count
    FROM orders
    WHERE user_id = NEW.user_id
    AND status = 'delivered';
    
    -- If this is their first delivered order, complete the referral
    IF v_order_count = 1 THEN
        PERFORM complete_referral(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_order_delivered_complete_referral ON orders;

-- Create trigger
CREATE TRIGGER on_order_delivered_complete_referral
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (OLD.status != 'delivered' AND NEW.status = 'delivered')
    EXECUTE FUNCTION trigger_complete_referral();

-- 15. Verify setup
SELECT 'Referral system setup complete!' as status;
