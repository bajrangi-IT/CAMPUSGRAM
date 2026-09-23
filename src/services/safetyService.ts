import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type ReportTargetType = 'profile' | 'post' | 'comment' | 'club' | 'event' | 'resource' | 'message';

export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error?: any }> {
  if (blockerId === blockedId) {
    return { success: false, error: new Error('You cannot block yourself.') };
  }
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { error } = await supabase.from('blocks').insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });
    if (error) throw error;

    // Also remove follows both directions if existing
    await supabase.from('follows').delete().match({ follower_id: blockerId, following_id: blockedId });
    await supabase.from('follows').delete().match({ follower_id: blockedId, following_id: blockerId });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function unblockUser(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function submitReport(params: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { error } = await supabase.from('reports').insert({
      reporter_id: params.reporterId,
      target_type: params.targetType,
      target_id: params.targetId,
      reason: params.reason,
      details: params.details || null,
      status: 'pending',
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function getBlockedUserIds(currentUserId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();

  try {
    const { data } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', currentUserId);

    return new Set((data || []).map((r: any) => r.blocked_id));
  } catch {
    return new Set();
  }
}
