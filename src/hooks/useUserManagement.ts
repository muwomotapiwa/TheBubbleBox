import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  avatar_url: string | null;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  level: number;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default roles if database table doesn't exist
  const defaultRoles: Role[] = [
    { id: '1', name: 'customer', display_name: 'Customer', description: 'Regular customer', level: 0 },
    { id: '2', name: 'driver', display_name: 'Driver', description: 'Delivery driver', level: 20 },
    { id: '3', name: 'staff', display_name: 'Staff', description: 'Staff member', level: 40 },
    { id: '4', name: 'manager', display_name: 'Manager', description: 'Manager', level: 60 },
    { id: '5', name: 'admin', display_name: 'Admin', description: 'Administrator', level: 80 },
    { id: '6', name: 'super_admin', display_name: 'Super Admin', description: 'Full access', level: 100 },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users...');
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching users:', fetchError);
        setError(fetchError.message);
        return;
      }

      console.log('Users fetched:', data);
      setUsers(data || []);
    } catch (err: any) {
      console.error('Exception fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('roles')
        .select('*')
        .order('level', { ascending: true });

      if (fetchError) {
        console.log('Roles table error, using defaults:', fetchError);
        setRoles(defaultRoles);
        return;
      }

      setRoles(data && data.length > 0 ? data : defaultRoles);
    } catch (err) {
      console.log('Using default roles');
      setRoles(defaultRoles);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const createUser = async (userData: {
    email: string;
    password: string;
    fullName: string;
    phone?: string | null;
    role: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Creating user with data:', userData);
      
      // Get current user ID for created_by
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const createdById = currentUser?.id || null;

      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            role: userData.role,
            phone: userData.phone || null
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Failed to create auth user' };
      }

      console.log('Auth user created:', authData.user.id);

      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update the user record with correct data
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: userData.fullName,
          phone: userData.phone || null,
          role: userData.role,
          created_by: createdById,
          is_active: true
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        // Try insert instead
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            full_name: userData.fullName,
            phone: userData.phone || null,
            role: userData.role,
            created_by: createdById,
            is_active: true
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          return { success: false, message: insertError.message };
        }
      }

      console.log('User record updated successfully');
      await fetchUsers();
      return { success: true, message: 'User created successfully' };

    } catch (err: any) {
      console.error('Exception creating user:', err);
      return { success: false, message: err.message };
    }
  };

  const updateUser = async (
    userId: string, 
    updates: {
      full_name?: string;
      email?: string;
      phone?: string | null;
      role?: string;
      is_active?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Updating user:', userId, updates);

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        console.error('Update error:', updateError);
        return { success: false, message: updateError.message };
      }

      await fetchUsers();
      return { success: true, message: 'User updated successfully' };
    } catch (err: any) {
      console.error('Exception updating user:', err);
      return { success: false, message: err.message };
    }
  };

  const updateUserRole = async (userId: string, newRole: string): Promise<{ success: boolean; message: string }> => {
    return updateUser(userId, { role: newRole });
  };

  const toggleUserActive = async (userId: string, isActive: boolean): Promise<{ success: boolean; message: string }> => {
    return updateUser(userId, { is_active: isActive });
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Soft delete - just deactivate
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        return { success: false, message: error.message };
      }

      await fetchUsers();
      return { success: true, message: 'User deactivated successfully' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  return {
    users,
    roles: roles.length > 0 ? roles : defaultRoles,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    updateUserRole,
    toggleUserActive,
    deleteUser
  };
}
