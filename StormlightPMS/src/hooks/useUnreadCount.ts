import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Polls unread notification count for the signed-in user.
 * Falls back to 0 on error so a transient failure does not corrupt the badge.
 */
export function useUnreadCount(): number {
  const { data } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('useUnreadCount failed:', error.message);
        return 0;
      }
      return count ?? 0;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  return data ?? 0;
}
