import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDateTime } from '@/lib/format';

interface NotifRow {
  id: string;
  notification_type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, notification_type, title, body, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as NotifRow[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = (data ?? []).filter((n) => !n.is_read).map((n) => n.id);
      if (!unread.length) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unread);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        actions={
          unreadCount > 0 && (
            <button type="button" className="btn-secondary" onClick={() => markAllRead.mutate()}>
              Mark all read
            </button>
          )
        }
      />
      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <ul className="space-y-2">
          {data!.map((n) => (
            <li
              key={n.id}
              className={`card p-4 flex justify-between items-start ${n.is_read ? 'opacity-70' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={n.notification_type} />
                  <span className="text-sm font-medium text-slate-900">{n.title}</span>
                </div>
                {n.body && <p className="text-sm text-slate-600 mt-1">{n.body}</p>}
                <p className="text-xs text-slate-400 mt-1">{fmtDateTime(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  className="text-xs text-slate-700 hover:underline"
                  onClick={() => markRead.mutate(n.id)}
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
