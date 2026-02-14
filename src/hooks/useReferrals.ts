import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from './useSettings';

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses_count: number;
  max_uses: number | null;
  is_active: boolean;
  reward_amount?: number | null;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code_id: string;
  code_used: string;
  status: 'pending' | 'completed' | 'expired';
  referrer_credited: boolean;
  referee_credited: boolean;
  referrer_credit_amount: number;
  referee_credit_amount: number;
  completed_at: string | null;
  created_at: string;
  referee?: {
    full_name: string;
    email: string;
  };
}

interface UserCredit {
  id: string;
  user_id: string;
  amount: number;
  type: string; // keep flexible with DB enum
  description: string;
  source_type?: string | null;
  source_id: string | null;
  expires_at: string | null;
  created_at: string;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalEarned: number;
  creditBalance: number;
}

export function useReferrals() {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [credits, setCredits] = useState<UserCredit[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalEarned: 0,
    creditBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrerBonus, setReferrerBonus] = useState<number>(10);
  const [refereeBonus, setRefereeBonus] = useState<number>(10);

  // Load dynamic bonuses from settings
  const { getNumberSetting, settings } = useSettings();

  useEffect(() => {
    // update bonuses whenever settings refresh
    setReferrerBonus(getNumberSetting('referral_referrer_bonus', 10));
    setRefereeBonus(getNumberSetting('referral_referee_bonus', 10));
  }, [settings, getNumberSetting]);

  // Get current user
  const getCurrentUserId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  // Fetch user's referral code
  const fetchReferralCode = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching referral code:', error);
        return null;
      }

      if (data) {
        setReferralCode(data);
        return data;
      }

      // Create referral code if doesn't exist
      const newCode = await createReferralCode(userId);
      return newCode;
    } catch (err) {
      console.error('Error in fetchReferralCode:', err);
      return null;
    }
  };

  // Create referral code for user
  const createReferralCode = async (userId: string): Promise<ReferralCode | null> => {
    try {
      // Get user's name to create personalized code
      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      // Generate code from name or random
      let code = '';
      if (userData?.full_name) {
        const namePart = userData.full_name.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase();
        const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        code = `${namePart}${randomPart}`;
      } else {
        code = `BUBBLE${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      }

      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: code,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating referral code:', error);
        return null;
      }

      setReferralCode(data);
      return data;
    } catch (err) {
      console.error('Error in createReferralCode:', err);
      return null;
    }
  };

  // Fetch user's referrals (people they referred)
  const fetchReferrals = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referee:users!referrals_referee_id_fkey(full_name, email)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // If join fails, try without it
        const { data: simpleData, error: simpleError } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', userId)
          .order('created_at', { ascending: false });

        if (simpleError) {
          console.error('Error fetching referrals:', simpleError);
          return [];
        }

        setReferrals(simpleData || []);
        return simpleData || [];
      }

      setReferrals(data || []);
      return data || [];
    } catch (err) {
      console.error('Error in fetchReferrals:', err);
      return [];
    }
  };

  // Fetch user's credits
  const fetchCredits = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching credits:', error);
        return [];
      }

      setCredits(data || []);
      return data || [];
    } catch (err) {
      console.error('Error in fetchCredits:', err);
      return [];
    }
  };

  // Calculate credit balance
  const getCreditBalance = async (): Promise<number> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return 0;

      const { data, error } = await supabase
        .from('user_credits')
        .select('amount, type, expires_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting credit balance:', error);
        return 0;
      }

      const now = new Date();
      const balance = (data || []).reduce((total, credit) => {
        // Skip expired credits
        if (credit.expires_at && new Date(credit.expires_at) < now) {
          return total;
        }
        const amount = Number(credit.amount) || 0;
        // Positive "used" rows are debits; everything else uses its signed value
        const delta = credit.type === 'used' && amount > 0 ? -amount : amount;
        return total + delta;
      }, 0);

      return Math.max(0, balance);
    } catch (err) {
      console.error('Error in getCreditBalance:', err);
      return 0;
    }
  };

  // Calculate stats
  const calculateStats = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const referralsList = await fetchReferrals();
      const creditBalance = await getCreditBalance();

      const pendingReferrals = referralsList.filter(r => r.status === 'pending').length;
      const completedReferrals = referralsList.filter(r => r.status === 'completed');
      const totalEarned = completedReferrals.reduce(
        (sum, r) => sum + (r.referrer_credit_amount || referrerBonus),
        0
      );

      setStats({
        totalReferrals: referralsList.length,
        pendingReferrals,
        completedReferrals: completedReferrals.length,
        totalEarned,
        creditBalance
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  // Validate a referral code (for signup)
  const validateReferralCode = async (code: string): Promise<{ valid: boolean; message: string }> => {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { valid: false, message: 'Invalid referral code' };
      }

      if (data.max_uses && data.uses_count >= data.max_uses) {
        return { valid: false, message: 'This referral code has reached its maximum uses' };
      }

      const bonus = data.reward_amount ?? refereeBonus;
      return { valid: true, message: `Valid referral code! You'll get $${bonus.toFixed(2)} credit.` };
    } catch (err) {
      console.error('Error validating referral code:', err);
      return { valid: false, message: 'Error validating code' };
    }
  };

  // Apply referral code (after signup)
  const applyReferralCode = async (code: string): Promise<{ success: boolean; message: string; creditAmount?: number }> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'You must be logged in to use a referral code' };
      }

      // Check if user already used a referral code
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', userId)
        .single();

      if (existingReferral) {
        return { success: false, message: 'You have already used a referral code' };
      }

      // Find the referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (codeError || !codeData) {
        return { success: false, message: 'Invalid or expired referral code' };
      }

      // Check if user is trying to use their own code
      if (codeData.user_id === userId) {
        return { success: false, message: 'You cannot use your own referral code' };
      }

      // Check max uses
      if (codeData.max_uses && codeData.uses_count >= codeData.max_uses) {
        return { success: false, message: 'This referral code has reached its maximum uses' };
      }

      // Use amounts from the code if set; otherwise fall back to current settings
      const referrerAmount = codeData.reward_amount ?? referrerBonus;
      const refereeAmount = refereeBonus;

      // Create the referral record
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: codeData.user_id,
          referee_id: userId,
          referral_code_id: codeData.id,
          code_used: code.toUpperCase(),
          status: 'pending',
          referee_credited: true,
          referrer_credited: false,
          referrer_credit_amount: referrerAmount,
          referee_credit_amount: refereeAmount
        })
        .select()
        .single();

      if (referralError) {
        console.error('Error creating referral:', referralError);
        return { success: false, message: 'Failed to apply referral code' };
      }

      // Update uses count
      await supabase
        .from('referral_codes')
        .update({ uses_count: codeData.uses_count + 1 })
        .eq('id', codeData.id);

      // Give referee their $10 credit
      await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          amount: refereeAmount,
          type: 'referee_bonus',
          source_type: 'referral',
          source_id: referralData.id,
          description: `Welcome bonus for using referral code ${code.toUpperCase()}`
        });

      // Update user's referred_by
      await supabase
        .from('users')
        .update({
          referred_by: codeData.user_id,
          referral_code_used: code.toUpperCase()
        })
        .eq('id', userId);

      // Refresh data
      await fetchCredits();
      await calculateStats();

      return { 
        success: true, 
        message: `Referral code applied! You received $${refereeAmount.toFixed(2)} credit.`, 
        creditAmount: refereeAmount 
      };
    } catch (err) {
      console.error('Error applying referral code:', err);
      return { success: false, message: 'Error applying referral code' };
    }
  };

  // Use credits at checkout
  const useCredits = async (amount: number, orderId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'You must be logged in' };
      }

      const balance = await getCreditBalance();
      if (balance < amount) {
        return { success: false, message: `Insufficient credits. You have $${balance.toFixed(2)} available.` };
      }

      const { data, error } = await supabase.from('user_credits').insert({
        user_id: userId,
        amount: -amount, // store as debit
        type: 'used',
        source_type: 'order',
        source_id: orderId,
        description: `Credits applied to order ${orderId}`
      }).select().single();

      if (error) {
        console.error('Error using credits:', error);
        return { success: false, message: 'Failed to record credit usage' };
      }
      console.log('Credits recorded', data);

      // Refresh credits
      await fetchCredits();
      await calculateStats();

      return { success: true, message: `Applied $${amount.toFixed(2)} credit to your order` };
    } catch (err) {
      console.error('Error in useCredits:', err);
      return { success: false, message: 'Error using credits' };
    }
  };

  // Get share URL
  const getShareUrl = (): string => {
    if (!referralCode) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${referralCode.code}`;
  };

  // Get share message
  const getShareMessage = (): string => {
    if (!referralCode) return '';
    return `Get $${refereeBonus.toFixed(2)} off your first laundry order at The Bubble Box! Use my code: ${referralCode.code} or sign up here: ${getShareUrl()}`;
  };

  // Share on WhatsApp
  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Share on Twitter/X
  const shareOnTwitter = () => {
    const message = encodeURIComponent(getShareMessage());
    window.open(`https://twitter.com/intent/tweet?text=${message}`, '_blank');
  };

  // Share on Facebook
  const shareOnFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  // Copy link to clipboard
  const copyShareLink = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  };

  // Copy code to clipboard
  const copyCode = async (): Promise<boolean> => {
    try {
      if (!referralCode) return false;
      await navigator.clipboard.writeText(referralCode.code);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  };

  // Load all data
  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchReferralCode();
      await fetchReferrals();
      await fetchCredits();
      await calculateStats();
    } catch (err) {
      console.error('Error loading referral data:', err);
      setError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return {
    referralCode,
    referrals,
    credits,
    stats,
    loading,
    error,
    // Actions
    fetchReferralCode,
    fetchReferrals,
    fetchCredits,
    validateReferralCode,
    applyReferralCode,
    useCredits,
    getCreditBalance,
    calculateStats,
    loadAll,
    referrerBonus,
    refereeBonus,
    // Share functions
    getShareUrl,
    getShareMessage,
    shareOnWhatsApp,
    shareOnTwitter,
    shareOnFacebook,
    copyShareLink,
    copyCode
  };
}
