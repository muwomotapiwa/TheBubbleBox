import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Address {
  id: string;
  user_id: string;
  label: string;
  address: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
}

export interface CreateAddressData {
  label: string;
  address: string;
  landmark: string;
  is_default?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateAddressData {
  label?: string;
  address?: string;
  landmark?: string;
  is_default?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export function useAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all addresses for the user
  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_addresses')
        .select('id, user_id, label, address, landmark, is_default, created_at, latitude, longitude')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAddresses(data || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Add a new address
  const addAddress = async (addressData: CreateAddressData): Promise<{ success: boolean; message: string; address?: Address }> => {
    if (!user) {
      return { success: false, message: 'Please sign in to save addresses' };
    }

    try {
      // If this is the first address or set as default, update other addresses
      if (addressData.is_default) {
        const { error: updateError } = await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Error updating default status:', updateError);
        }
      }

      // Check if this is the first address - make it default
      const isFirstAddress = addresses.length === 0;

      const { data, error: insertError } = await supabase
        .from('user_addresses')
        .insert({
          user_id: user.id,
          label: addressData.label,
          address: addressData.address,
          landmark: addressData.landmark || '',
          latitude: addressData.latitude ?? null,
          longitude: addressData.longitude ?? null,
          is_default: addressData.is_default || isFirstAddress,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }

      await fetchAddresses();
      return { success: true, message: 'Address saved successfully!', address: data };
    } catch (err: unknown) {
      console.error('Error adding address:', err);
      const errorMessage = err instanceof Error ? err.message : 
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message: string }).message) : 
        'Failed to save address. Please try again.';
      return { success: false, message: `Failed to save address: ${errorMessage}` };
    }
  };

  // Update an existing address
  const updateAddress = async (addressId: string, updates: UpdateAddressData): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Please sign in to update addresses' };
    }

    try {
      // If setting as default, update other addresses first
      if (updates.is_default) {
        const { error: defaultError } = await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
        
        if (defaultError) {
          console.error('Error clearing default status:', defaultError);
        }
      }

      // Build update object without spreading (to avoid including undefined fields)
      const updateData: Record<string, unknown> = {};
      
      if (updates.label !== undefined) updateData.label = updates.label;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.landmark !== undefined) updateData.landmark = updates.landmark;
      if (updates.is_default !== undefined) updateData.is_default = updates.is_default;
      if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
      if (updates.longitude !== undefined) updateData.longitude = updates.longitude;

      console.log('Updating address:', { addressId, updateData, userId: user.id });

      const { data, error: updateError } = await supabase
        .from('user_addresses')
        .update(updateData)
        .eq('id', addressId)
        .eq('user_id', user.id)
        .select();

      console.log('Update response:', { data, updateError });

      if (updateError) {
        console.error('Update error details:', updateError);
        return { success: false, message: `Failed to update address: ${updateError.message}` };
      }

      if (!data || data.length === 0) {
        return { success: false, message: 'Address not found or you do not have permission to update it' };
      }

      await fetchAddresses();
      return { success: true, message: 'Address updated successfully!' };
    } catch (err: unknown) {
      console.error('Error updating address:', err);
      const errorMessage = err instanceof Error ? err.message : 
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message: string }).message) : 
        'Unknown error occurred';
      return { success: false, message: `Failed to update address: ${errorMessage}` };
    }
  };

  // Delete an address
  const deleteAddress = async (addressId: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Please sign in to delete addresses' };
    }

    try {
      const addressToDelete = addresses.find(a => a.id === addressId);
      
      const { error: deleteError } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // If we deleted the default address, make the next one default
      if (addressToDelete?.is_default && addresses.length > 1) {
        const remainingAddresses = addresses.filter(a => a.id !== addressId);
        if (remainingAddresses.length > 0) {
          await supabase
            .from('user_addresses')
            .update({ is_default: true })
            .eq('id', remainingAddresses[0].id);
        }
      }

      await fetchAddresses();
      return { success: true, message: 'Address deleted successfully!' };
    } catch (err) {
      console.error('Error deleting address:', err);
      return { success: false, message: 'Failed to delete address. Please try again.' };
    }
  };

  // Set an address as default
  const setDefaultAddress = async (addressId: string): Promise<{ success: boolean; message: string }> => {
    return updateAddress(addressId, { is_default: true });
  };

  // Get the default address
  const getDefaultAddress = (): Address | null => {
    return addresses.find(a => a.is_default) || addresses[0] || null;
  };

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
  };
}
