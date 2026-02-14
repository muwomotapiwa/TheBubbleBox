import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price_range: string;
  price_note: string | null;
  icon: string | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateServiceCategoryData {
  name?: string;
  tagline?: string;
  description?: string;
  price_range?: string;
  price_note?: string;
  icon?: string;
  features?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export function useServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Parse features if they come as string
      const parsedData = (data || []).map(cat => ({
        ...cat,
        features: typeof cat.features === 'string' 
          ? JSON.parse(cat.features) 
          : (cat.features || [])
      }));
      
      setCategories(parsedData);
    } catch (err) {
      console.error('Error fetching service categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch service categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getActiveCategories = () => {
    return categories.filter(cat => cat.is_active);
  };

  const getCategoryBySlug = (slug: string) => {
    return categories.find(cat => cat.slug === slug);
  };

  const updateCategory = async (id: string, data: UpdateServiceCategoryData): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Updating service category:', id, data);
      
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.tagline !== undefined) updateData.tagline = data.tagline;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price_range !== undefined) updateData.price_range = data.price_range;
      if (data.price_note !== undefined) updateData.price_note = data.price_note;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.features !== undefined) updateData.features = data.features;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

      console.log('Update data being sent:', updateData);

      const { data: result, error } = await supabase
        .from('service_categories')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update result:', result);

      if (!result || result.length === 0) {
        throw new Error('Update failed - no rows returned');
      }

      await fetchCategories();
      return { success: true, message: 'Service category updated successfully' };
    } catch (err) {
      console.error('Error updating service category:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to update service category' 
      };
    }
  };

  const addFeature = async (id: string, feature: string): Promise<{ success: boolean; message: string }> => {
    try {
      const category = categories.find(c => c.id === id);
      if (!category) throw new Error('Category not found');

      const newFeatures = [...category.features, feature];
      return await updateCategory(id, { features: newFeatures });
    } catch (err) {
      console.error('Error adding feature:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to add feature' 
      };
    }
  };

  const removeFeature = async (id: string, featureIndex: number): Promise<{ success: boolean; message: string }> => {
    try {
      const category = categories.find(c => c.id === id);
      if (!category) throw new Error('Category not found');

      const newFeatures = category.features.filter((_, index) => index !== featureIndex);
      return await updateCategory(id, { features: newFeatures });
    } catch (err) {
      console.error('Error removing feature:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to remove feature' 
      };
    }
  };

  const toggleActive = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const category = categories.find(c => c.id === id);
      if (!category) throw new Error('Category not found');

      return await updateCategory(id, { is_active: !category.is_active });
    } catch (err) {
      console.error('Error toggling category active state:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to toggle category' 
      };
    }
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    getActiveCategories,
    getCategoryBySlug,
    updateCategory,
    addFeature,
    removeFeature,
    toggleActive
  };
}
