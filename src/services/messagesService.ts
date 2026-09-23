import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Conversation, Message } from '@/types/social.types';

export async function fetchUserConversations(userId: string): Promise<Conversation[]> {
  if (!isSupabaseConfigured) return [];

  try {
    // 1. Get conversation IDs for user
    const { data: memberRows, error: memberErr } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    if (memberErr || !memberRows || memberRows.length === 0) return [];

    const convIds = memberRows.map((r: any) => r.conversation_id);

    // 2. Fetch conversations with all members and last messages
    const { data: convs, error: convErr } = await supabase
      .from('conversations')
      .select(`
        *,
        members:conversation_members(
          conversation_id, user_id, joined_at, last_read_at,
          user:profiles(*)
        )
      `)
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (convErr || !convs) return [];

    // 3. For each conversation, fetch the last message
    const formatted: Conversation[] = await Promise.all(
      convs.map(async (c: any) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(
              id, full_name, username, profile_photo
            )
          `)
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          id: c.id,
          title: c.title,
          is_group: c.is_group || false,
          group_avatar: c.group_avatar,
          group_type: c.group_type || 'direct',
          created_by: c.created_by,
          created_at: c.created_at,
          updated_at: c.updated_at,
          members: c.members || [],
          last_message: lastMsg || null,
        };
      })
    );

    return formatted;
  } catch (err) {
    console.warn('Failed to load conversations:', err);
    return [];
  }
}

export async function fetchConversationMessages(
  conversationId: string,
  page: number = 0,
  pageSize: number = 30
): Promise<{ messages: Message[]; hasMore: boolean }> {
  if (!isSupabaseConfigured) return { messages: [], hasMore: false };

  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id, full_name, username, profile_photo, course, year
        ),
        reply_to:messages!messages_reply_to_id_fkey(
          id, content, sender_id
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      messages: (data || []) as Message[],
      hasMore: (data || []).length === pageSize,
    };
  } catch (err) {
    console.warn('Failed to fetch messages:', err);
    return { messages: [], hasMore: false };
  }
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrls?: string[];
  fileUrl?: string;
  fileName?: string;
  replyToId?: string;
}): Promise<{ message?: Message; error?: any }> {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        content: params.content,
        media_urls: params.mediaUrls || [],
        file_url: params.fileUrl || null,
        file_name: params.fileName || null,
        reply_to_id: params.replyToId || null,
        reactions: {},
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id, full_name, username, profile_photo, course, year
        )
      `)
      .single();

    if (error) throw error;

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.conversationId);

    return { message: data as Message };
  } catch (err: any) {
    return { error: err };
  }
}

export async function createDirectConversation(
  userId: string,
  targetUserId: string
): Promise<{ conversationId?: string; error?: any }> {
  if (!isSupabaseConfigured) return { conversationId: 'demo-direct' };

  try {
    // Check if direct conversation already exists between these 2 users
    const { data: userConvs } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    if (userConvs && userConvs.length > 0) {
      const cIds = userConvs.map((r: any) => r.conversation_id);
      const { data: shared } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', targetUserId)
        .in('conversation_id', cIds);

      if (shared && shared.length > 0) {
        // Check if one of them is non-group
        const { data: directConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('is_group', false)
          .in('id', shared.map((s: any) => s.conversation_id))
          .maybeSingle();

        if (directConv) {
          return { conversationId: directConv.id };
        }
      }
    }

    // Otherwise create new conversation
    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert({
        is_group: false,
        group_type: 'direct',
        created_by: userId,
      })
      .select('id')
      .single();

    if (convErr) throw convErr;

    // Insert members
    await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, user_id: userId, last_read_at: new Date().toISOString() },
      { conversation_id: newConv.id, user_id: targetUserId, last_read_at: new Date().toISOString() },
    ]);

    return { conversationId: newConv.id };
  } catch (err: any) {
    return { error: err };
  }
}

export async function createGroupConversation(params: {
  creatorId: string;
  title: string;
  groupType: 'club' | 'event' | 'project_team' | 'direct';
  memberUserIds: string[];
}): Promise<{ conversationId?: string; error?: any }> {
  if (!isSupabaseConfigured) return { conversationId: 'demo-group' };

  try {
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        title: params.title,
        is_group: true,
        group_type: params.groupType,
        created_by: params.creatorId,
      })
      .select('id')
      .single();

    if (error) throw error;

    const allMembers = Array.from(new Set([params.creatorId, ...params.memberUserIds]));
    const memberRows = allMembers.map((uid) => ({
      conversation_id: newConv.id,
      user_id: uid,
      last_read_at: new Date().toISOString(),
    }));

    await supabase.from('conversation_members').insert(memberRows);

    return { conversationId: newConv.id };
  } catch (err: any) {
    return { error: err };
  }
}

export async function deleteMessage(messageId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<{ success: boolean; reactions?: Record<string, string[]> }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const { data: msg } = await supabase
      .from('messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    const currentReactions: Record<string, string[]> = msg?.reactions || {};
    const userList = currentReactions[emoji] || [];

    let updatedUsers: string[];
    if (userList.includes(userId)) {
      updatedUsers = userList.filter((id) => id !== userId);
    } else {
      updatedUsers = [...userList, userId];
    }

    const newReactions = { ...currentReactions };
    if (updatedUsers.length > 0) {
      newReactions[emoji] = updatedUsers;
    } else {
      delete newReactions[emoji];
    }

    await supabase
      .from('messages')
      .update({ reactions: newReactions })
      .eq('id', messageId);

    return { success: true, reactions: newReactions };
  } catch {
    return { success: false };
  }
}

/**
 * Subscribes to Realtime messages for a specific conversation
 */
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (msg: Message) => void
) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        // Fetch complete message with sender details
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(
              id, full_name, username, profile_photo, course, year
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) onNewMessage(data as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
