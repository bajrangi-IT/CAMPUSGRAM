import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Notification } from '@/types/database.types';

export async function fetchUserNotifications(userId: string): Promise<Notification[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(
          id, full_name, username, profile_photo
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40);

    if (error) throw error;
    return (data || []) as Notification[];
  } catch (err) {
    console.warn('Failed to load notifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  } catch {}
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  } catch {}
}

export function subscribeToNotifications(
  userId: string,
  onNewNotification: (item: Notification) => void
) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch actor details
        const { data } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:profiles!notifications_actor_id_fkey(
              id, full_name, username, profile_photo
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) onNewNotification(data as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
