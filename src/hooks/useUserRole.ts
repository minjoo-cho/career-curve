import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'admin' | 'user';

export function useUserRole() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setRoles([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      setRoles((data || []).map(r => r.role as AppRole));
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const isAdmin = roles.includes('admin');
  const isUser = roles.includes('user');

  return {
    isLoading,
    roles,
    isAdmin,
    isUser,
    refetch: fetchRoles,
  };
}
