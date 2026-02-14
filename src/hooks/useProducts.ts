import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Product {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface CreateProductData {
  category: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  unit?: string;
  is_active?: boolean;
  sort_order?: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('category')
        .order('sort_order')
        .order('name');

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductsByCategory = useCallback((category: string) => {
    return products.filter(p => p.category === category && p.is_active);
  }, [products]);

  const getAllProductsByCategory = useCallback((category: string) => {
    return products.filter(p => p.category === category);
  }, [products]);

  const addProduct = useCallback(async (productData: CreateProductData): Promise<{ success: boolean; message: string; product?: Product }> => {
    try {
      const { data, error: insertError } = await supabase
        .from('products')
        .insert([{
          ...productData,
          is_active: productData.is_active ?? true,
          sort_order: productData.sort_order ?? 0
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setProducts(prev => [...prev, data]);
      return { success: true, message: 'Product added successfully', product: data };
    } catch (err) {
      console.error('Error adding product:', err);
      const message = err instanceof Error ? err.message : 'Failed to add product';
      return { success: false, message };
    }
  }, []);

  const updateProduct = useCallback(async (id: string, updates: UpdateProductData): Promise<{ success: boolean; message: string }> => {
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ));
      return { success: true, message: 'Product updated successfully' };
    } catch (err) {
      console.error('Error updating product:', err);
      const message = err instanceof Error ? err.message : 'Failed to update product';
      return { success: false, message };
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setProducts(prev => prev.filter(p => p.id !== id));
      return { success: true, message: 'Product deleted successfully' };
    } catch (err) {
      console.error('Error deleting product:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete product';
      return { success: false, message };
    }
  }, []);

  const toggleProductActive = useCallback(async (id: string, isActive: boolean): Promise<{ success: boolean; message: string }> => {
    return updateProduct(id, { is_active: isActive });
  }, [updateProduct]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    getProductsByCategory,
    getAllProductsByCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive
  };
}
