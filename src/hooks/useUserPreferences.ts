import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserPreferences } from '../types/database';

export function useUserPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch preferences
  const fetchPreferences = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setPreferences(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Update preferences
  const updatePreferences = async (data: Partial<UserPreferences>) => {
    if (!userId) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Refetch to get updated data
      await fetchPreferences();

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences
  };
}
