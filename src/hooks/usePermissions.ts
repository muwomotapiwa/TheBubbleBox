import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('customer');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPermissions();
    } else {
      setUserRole('customer');
      setUserPermissions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);

      // Get user's role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (userError) {
        console.error('Error fetching user role:', userError);
        setUserRole('customer');
        setUserPermissions([]);
        return;
      }

      const role = userData?.role || 'customer';
      setUserRole(role);

      // Super admin has all permissions
      if (role === 'super_admin') {
        const { data: allPerms } = await supabase
          .from('permissions')
          .select('name');
        setUserPermissions((allPerms || []).map(p => p.name));
        return;
      }

      // Get permissions for role
      const { data: rolePerms, error: permError } = await supabase
        .from('role_permissions')
        .select('permission_name')
        .eq('role_name', role);

      if (permError) {
        console.error('Error fetching permissions:', permError);
        setUserPermissions([]);
        return;
      }

      setUserPermissions((rolePerms || []).map(p => p.permission_name));
    } catch (err) {
      console.error('Error in fetchUserPermissions:', err);
      setUserPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific permission
  const hasPermission = (permissionName: string): boolean => {
    if (userRole === 'super_admin') return true;
    return userPermissions.includes(permissionName);
  };

  // Check if user has any of the given permissions
  const hasAnyPermission = (permissionNames: string[]): boolean => {
    if (userRole === 'super_admin') return true;
    return permissionNames.some(p => userPermissions.includes(p));
  };

  // Check if user has all of the given permissions
  const hasAllPermissions = (permissionNames: string[]): boolean => {
    if (userRole === 'super_admin') return true;
    return permissionNames.every(p => userPermissions.includes(p));
  };

  // Check if user is super admin
  const isSuperAdmin = (): boolean => {
    return userRole === 'super_admin';
  };

  // Check if user is admin or higher
  const isAdmin = (): boolean => {
    return ['super_admin', 'admin'].includes(userRole);
  };

  // Check if user is manager or higher
  const isManager = (): boolean => {
    return ['super_admin', 'admin', 'manager'].includes(userRole);
  };

  // Check if user is staff or higher
  const isStaff = (): boolean => {
    return ['super_admin', 'admin', 'manager', 'staff'].includes(userRole);
  };

  // Check if user can access admin dashboard
  const canAccessAdmin = (): boolean => {
    return ['super_admin', 'admin', 'manager', 'staff'].includes(userRole);
  };

  return {
    userRole,
    userPermissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isAdmin,
    isManager,
    isStaff,
    canAccessAdmin,
    refreshPermissions: fetchUserPermissions
  };
};
