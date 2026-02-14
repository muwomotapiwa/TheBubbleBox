import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Setting {
  id: string;
  key: string;
  value: string;
  label: string;
  description: string | null;
  type: 'text' | 'number' | 'boolean' | 'json';
  category: string;
  sort_order: number;
}

export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('category')
        .order('sort_order');

      if (error) throw error;
      setSettings(data || []);
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Get a single setting value by key
  const getSetting = (key: string, defaultValue: string = ''): string => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  // Get a numeric setting
  const getNumberSetting = (key: string, defaultValue: number = 0): number => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return defaultValue;
    const num = parseFloat(setting.value);
    return isNaN(num) ? defaultValue : num;
  };

  // Get a boolean setting
  const getBooleanSetting = (key: string, defaultValue: boolean = false): boolean => {
    const setting = settings.find(s => s.key === key);
    if (!setting) return defaultValue;
    return setting.value === 'true' || setting.value === '1';
  };

  // Get settings by category
  const getSettingsByCategory = (category: string): Setting[] => {
    return settings.filter(s => s.category === category);
  };

  // Update a setting
  const updateSetting = async (key: string, value: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      // Update local state
      setSettings(prev => prev.map(s => 
        s.key === key ? { ...s, value } : s
      ));

      return { success: true, message: 'Setting updated successfully' };
    } catch (err: any) {
      console.error('Error updating setting:', err);
      return { success: false, message: err.message || 'Failed to update setting' };
    }
  };

  // Update multiple settings at once
  const updateSettings = async (updates: { key: string; value: string }[]): Promise<{ success: boolean; message: string }> => {
    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: update.value, updated_at: new Date().toISOString() })
          .eq('key', update.key);

        if (error) throw error;
      }

      // Refresh settings
      await fetchSettings();

      return { success: true, message: 'Settings updated successfully' };
    } catch (err: any) {
      console.error('Error updating settings:', err);
      return { success: false, message: err.message || 'Failed to update settings' };
    }
  };

  // Add a new setting
  const addSetting = async (setting: Omit<Setting, 'id'>): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .insert([setting]);

      if (error) throw error;

      await fetchSettings();
      return { success: true, message: 'Setting added successfully' };
    } catch (err: any) {
      console.error('Error adding setting:', err);
      return { success: false, message: err.message || 'Failed to add setting' };
    }
  };

  return {
    settings,
    loading,
    error,
    getSetting,
    getNumberSetting,
    getBooleanSetting,
    getSettingsByCategory,
    updateSetting,
    updateSettings,
    addSetting,
    refetch: fetchSettings
  };
}
