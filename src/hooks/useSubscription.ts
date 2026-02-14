import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Subscription } from '../types/database';

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch subscription
  const fetchSubscription = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    if (subscription.ends_at && new Date(subscription.ends_at) < new Date()) return false;
    return true;
  };

  // Get subscription benefits
  const getBenefits = () => {
    if (!hasActiveSubscription()) {
      return {
        freeDelivery: false,
        discount: 0,
        priorityScheduling: false,
        reusableBags: false
      };
    }

    switch (subscription?.plan_type) {
      case 'bubble_pass':
        return {
          freeDelivery: true,
          discount: 10,
          priorityScheduling: true,
          reusableBags: false
        };
      case 'family_pass':
        return {
          freeDelivery: true,
          discount: 15,
          priorityScheduling: true,
          reusableBags: true
        };
      default:
        return {
          freeDelivery: false,
          discount: 0,
          priorityScheduling: false,
          reusableBags: false
        };
    }
  };

  // Create subscription
  const createSubscription = async (
    planType: 'bubble_pass' | 'family_pass',
    billingCycle: 'monthly' | 'yearly'
  ) => {
    if (!userId) {
      return { error: new Error('Not authenticated') };
    }

    try {
      // Calculate end date
      const startDate = new Date();
      const endDate = new Date();
      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          billing_cycle: billingCycle,
          status: 'active',
          started_at: startDate.toISOString(),
          ends_at: endDate.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setSubscription(data);
      return { data, error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!subscription) {
      return { error: new Error('No active subscription') };
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Pause subscription
  const pauseSubscription = async () => {
    if (!subscription) {
      return { error: new Error('No active subscription') };
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription(prev => prev ? { ...prev, status: 'paused' } : null);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  return {
    subscription,
    loading,
    error,
    hasActiveSubscription,
    getBenefits,
    createSubscription,
    cancelSubscription,
    pauseSubscription,
    refetch: fetchSubscription
  };
}
