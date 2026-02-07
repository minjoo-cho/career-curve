import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CustomStatus {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: Date;
}

export function useCustomStatuses() {
  const { user } = useAuth();
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomStatuses = useCallback(async () => {
    if (!user) {
      setCustomStatuses([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('custom_statuses')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setCustomStatuses(
        (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          sortOrder: s.sort_order,
          createdAt: new Date(s.created_at),
        }))
      );
    } catch (error) {
      console.error('Error fetching custom statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomStatuses();
  }, [fetchCustomStatuses]);

  const addCustomStatus = useCallback(
    async (name: string, color: string = 'muted') => {
      if (!user) return;

      // Get the next sort order
      const maxOrder = customStatuses.reduce((max, s) => Math.max(max, s.sortOrder), -1);

      try {
        const { data, error } = await supabase
          .from('custom_statuses')
          .insert({
            user_id: user.id,
            name,
            color,
            sort_order: maxOrder + 1,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            toast.error('이미 같은 이름의 상태가 있습니다');
          } else {
            throw error;
          }
          return;
        }

        setCustomStatuses((prev) => [
          ...prev,
          {
            id: data.id,
            name: data.name,
            color: data.color,
            sortOrder: data.sort_order,
            createdAt: new Date(data.created_at),
          },
        ]);
        toast.success('상태가 추가되었습니다');
      } catch (error) {
        console.error('Error adding custom status:', error);
        toast.error('상태 추가 실패');
      }
    },
    [user, customStatuses]
  );

  const updateCustomStatus = useCallback(
    async (id: string, updates: { name?: string; color?: string }) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('custom_statuses')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          if (error.code === '23505') {
            toast.error('이미 같은 이름의 상태가 있습니다');
          } else {
            throw error;
          }
          return;
        }

        setCustomStatuses((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        );
        toast.success('상태가 수정되었습니다');
      } catch (error) {
        console.error('Error updating custom status:', error);
        toast.error('상태 수정 실패');
      }
    },
    [user]
  );

  const removeCustomStatus = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('custom_statuses')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setCustomStatuses((prev) => prev.filter((s) => s.id !== id));
        toast.success('상태가 삭제되었습니다');
      } catch (error) {
        console.error('Error removing custom status:', error);
        toast.error('상태 삭제 실패');
      }
    },
    [user]
  );

  return {
    customStatuses,
    isLoading,
    addCustomStatus,
    updateCustomStatus,
    removeCustomStatus,
    refetch: fetchCustomStatuses,
  };
}
