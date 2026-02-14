import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from './useSettings';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed' | 'free_delivery';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  description: string | null;
}

export interface PromoValidationResult {
  valid: boolean;
  promo: PromoCode | null;
  message: string;
  discountAmount: number;
}

export function usePromoCode() {
  const [loading, setLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { getNumberSetting } = useSettings();

  const validatePromoCode = async (
    code: string, 
    orderTotal: number,
    deliveryFeeOverride?: number
  ): Promise<PromoValidationResult> => {
    if (!code.trim()) {
      return {
        valid: false,
        promo: null,
        message: 'Please enter a promo code',
        discountAmount: 0
      };
    }

    setLoading(true);

    try {
      const deliveryFee = deliveryFeeOverride ?? getNumberSetting('delivery_fee', 5);

      // Fetch the promo code from database
      const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .single();

      if (error || !promo) {
        return {
          valid: false,
          promo: null,
          message: 'Invalid promo code. Please check and try again.',
          discountAmount: 0
        };
      }

      // Check if promo is active
      if (!promo.is_active) {
        return {
          valid: false,
          promo: null,
          message: 'This promo code is no longer active.',
          discountAmount: 0
        };
      }

      // Check if promo has expired
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return {
          valid: false,
          promo: null,
          message: 'This promo code has expired.',
          discountAmount: 0
        };
      }

      // Check if promo has reached max uses
      if (promo.max_uses && promo.uses_count >= promo.max_uses) {
        return {
          valid: false,
          promo: null,
          message: 'This promo code has reached its maximum uses.',
          discountAmount: 0
        };
      }

      // Check minimum order amount
      if (promo.min_order_amount && orderTotal < promo.min_order_amount) {
        return {
          valid: false,
          promo: null,
          message: `Minimum order amount of $${promo.min_order_amount.toFixed(2)} required for this code.`,
          discountAmount: 0
        };
      }

      // Calculate discount
      let discount = 0;
      if (promo.discount_type === 'percentage') {
        discount = (orderTotal * promo.discount_value) / 100;
      } else if (promo.discount_type === 'fixed') {
        discount = promo.discount_value;
      } else if (promo.discount_type === 'free_delivery') {
        discount = deliveryFee;
      }

      // Don't let discount exceed order total
      discount = Math.min(discount, orderTotal);

      return {
        valid: true,
        promo: promo as PromoCode,
        message: getSuccessMessage(promo as PromoCode),
        discountAmount: discount
      };

    } catch (err) {
      console.error('Error validating promo code:', err);
      return {
        valid: false,
        promo: null,
        message: 'Error validating promo code. Please try again.',
        discountAmount: 0
      };
    } finally {
      setLoading(false);
    }
  };

  const applyPromoCode = async (code: string, orderTotal: number, deliveryFee?: number): Promise<PromoValidationResult> => {
    const result = await validatePromoCode(code, orderTotal, deliveryFee);
    
    if (result.valid && result.promo) {
      setAppliedPromo(result.promo);
      setDiscountAmount(result.discountAmount);
    }
    
    return result;
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
  };

  const incrementPromoUsage = async (promoId: string) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ uses_count: (appliedPromo?.uses_count || 0) + 1 })
        .eq('id', promoId);

      if (error) {
        console.error('Error incrementing promo usage:', error);
      }
    } catch (err) {
      console.error('Error incrementing promo usage:', err);
    }
  };

  return {
    loading,
    appliedPromo,
    discountAmount,
    applyPromoCode,
    removePromoCode,
    incrementPromoUsage
  };
}

function getSuccessMessage(promo: PromoCode): string {
  if (promo.discount_type === 'percentage') {
    return `${promo.discount_value}% discount applied!`;
  } else if (promo.discount_type === 'fixed') {
    return `$${promo.discount_value.toFixed(2)} discount applied!`;
  } else if (promo.discount_type === 'free_delivery') {
    return 'Free delivery applied!';
  }
  return 'Promo code applied!';
}
