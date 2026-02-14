import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  monthly_price?: number;
  yearly_price?: number;
  features?: string[];
  is_popular?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) {
        console.error('Error fetching subscription plans:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Parse the features JSON if it's a string
      const parsedPlans = (data || []).map(plan => ({
        ...plan,
        features: typeof plan.features === 'string' 
          ? JSON.parse(plan.features) 
          : (plan.features || [])
      }));

      setPlans(parsedPlans);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const getActivePlans = () => {
    return plans.filter(plan => plan.is_active);
  };

  const getPlanBySlug = (slug: string) => {
    return plans.find(plan => plan.slug === slug);
  };

  const updatePlan = async (id: string, data: UpdatePlanData): Promise<{ success: boolean; message: string }> => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.monthly_price !== undefined) updateData.monthly_price = data.monthly_price;
      if (data.yearly_price !== undefined) updateData.yearly_price = data.yearly_price;
      if (data.features !== undefined) updateData.features = data.features; // Don't stringify - let Supabase handle it
      if (data.is_popular !== undefined) updateData.is_popular = data.is_popular;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

      console.log('Updating plan:', id, 'with data:', updateData);

      const { data: result, error: updateError } = await supabase
        .from('subscription_plans')
        .update(updateData)
        .eq('id', id)
        .select();

      if (updateError) {
        console.error('Error updating plan:', updateError);
        return { success: false, message: `Database error: ${updateError.message}` };
      }

      console.log('Update result:', result);

      if (!result || result.length === 0) {
        return { success: false, message: 'No rows updated. Check RLS policies.' };
      }

      await fetchPlans();
      return { success: true, message: 'Plan updated successfully' };
    } catch (err) {
      console.error('Error updating plan:', err);
      return { success: false, message: err instanceof Error ? err.message : 'Failed to update plan' };
    }
  };

  const updatePlanFeatures = async (id: string, features: string[]): Promise<{ success: boolean; message: string }> => {
    return updatePlan(id, { features });
  };

  const addFeature = async (id: string, feature: string): Promise<{ success: boolean; message: string }> => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return { success: false, message: 'Plan not found' };

    const newFeatures = [...plan.features, feature];
    return updatePlanFeatures(id, newFeatures);
  };

  const removeFeature = async (id: string, featureIndex: number): Promise<{ success: boolean; message: string }> => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return { success: false, message: 'Plan not found' };

    const newFeatures = plan.features.filter((_, index) => index !== featureIndex);
    return updatePlanFeatures(id, newFeatures);
  };

  const togglePlanActive = async (id: string): Promise<{ success: boolean; message: string }> => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return { success: false, message: 'Plan not found' };

    return updatePlan(id, { is_active: !plan.is_active });
  };

  const setPopularPlan = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      // First, remove popular from all plans
      await supabase
        .from('subscription_plans')
        .update({ is_popular: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Then set the selected plan as popular
      const { error: updateError } = await supabase
        .from('subscription_plans')
        .update({ is_popular: true })
        .eq('id', id);

      if (updateError) {
        return { success: false, message: updateError.message };
      }

      await fetchPlans();
      return { success: true, message: 'Popular plan updated' };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Failed to update' };
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    fetchPlans,
    getActivePlans,
    getPlanBySlug,
    updatePlan,
    updatePlanFeatures,
    addFeature,
    removeFeature,
    togglePlanActive,
    setPopularPlan
  };
}
