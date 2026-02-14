import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useNewsletter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clear = () => {
    setMessage(null);
    setError(null);
  };

  const subscribe = useCallback(
    async (email: string) => {
      clear();
      if (!email) {
        setError('Please enter an email');
        return { success: false };
      }
      setLoading(true);
      try {
        const { error: upsertError } = await supabase
          .from('marketing_subscriptions')
          .upsert(
            {
              email: email.toLowerCase(),
              user_id: user?.id || null,
              opted_in: true,
              unsubscribed_at: null,
              source: 'website'
            },
            { onConflict: 'email' }
          );

        if (upsertError) throw upsertError;
        setMessage('You are subscribed to our monthly newsletter. You can unsubscribe anytime.');
        return { success: true };
      } catch (err: any) {
        setError(err.message || 'Subscription failed. Please try again.');
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const unsubscribe = useCallback(
    async (email?: string) => {
      clear();
      const targetEmail = (email || user?.email || '').toLowerCase();
      if (!targetEmail) {
        setError('Email is required to unsubscribe.');
        return { success: false };
      }
      setLoading(true);
      try {
        const { error: updateError } = await supabase
          .from('marketing_subscriptions')
          .update({
            opted_in: false,
            unsubscribed_at: new Date().toISOString()
          })
          .eq('email', targetEmail);

        if (updateError) throw updateError;
        setMessage('You have been unsubscribed from marketing emails. Transactional emails will continue.');
        return { success: true };
      } catch (err: any) {
        setError(err.message || 'Unsubscribe failed. Please try again.');
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return { loading, message, error, subscribe, unsubscribe, clear };
}
