import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/types/database.types';

export async function checkIsFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || followerId === followingId) return false;

  try {
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    return Boolean(data);
  } catch {
    return false;
  }
}

export async function getFollowStats(userId: string): Promise<{
  followersCount: number;
  followingCount: number;
}> {
  if (!isSupabaseConfigured) return { followersCount: 0, followingCount: 0 };

  try {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);

    return {
      followersCount: followersRes.count || 0,
      followingCount: followingRes.count || 0,
    };
  } catch {
    return { followersCount: 0, followingCount: 0 };
  }
}

export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; error?: any }> {
  if (followerId === followingId) {
    return { success: false, error: new Error('You cannot follow yourself.') };
  }
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    });

    if (error) throw error;

    // Send notification to followed student
    await supabase.from('notifications').insert({
      user_id: followingId,
      actor_id: followerId,
      type: 'follow',
      title: 'New Campus Follower',
      message: 'Started following your campus profile and updates.',
      link: `/profile`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function getFollowers(userId: string): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('follows')
      .select('follower:profiles!follows_follower_id_fkey(*)')
      .eq('following_id', userId);

    return (data || []).map((row: any) => row.follower).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getFollowing(userId: string): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('follows')
      .select('following:profiles!follows_following_id_fkey(*)')
      .eq('follower_id', userId);

    return (data || []).map((row: any) => row.following).filter(Boolean);
  } catch {
    return [];
  }
}
