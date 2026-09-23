import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Comment } from '@/types/social.types';

const COMMENTS_STORAGE_KEY = 'campusgram_comments_store';

function getStoredComments(): Record<string, Comment[]> {
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredComments(data: Record<string, Comment[]>) {
  try {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save comments locally:', e);
  }
}

export async function fetchComments(
  postId: string,
  page: number = 0,
  pageSize: number = 20
): Promise<{ comments: Comment[]; hasMore: boolean }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles!comments_author_id_fkey(
            id, full_name, username, profile_photo, course, year, branch
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .range(from, to);

      if (!error && data && data.length > 0) {
        return {
          comments: data as Comment[],
          hasMore: data.length === pageSize,
        };
      }
    } catch (err) {
      console.warn('Failed to load remote comments, using local store:', err);
    }
  }

  const allComments = getStoredComments();
  const postComments = allComments[postId] || [];
  const paged = postComments.slice(from, from + pageSize);

  return {
    comments: paged,
    hasMore: from + pageSize < postComments.length,
  };
}

export async function addComment(params: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  authorProfile?: any;
}): Promise<{ comment?: Comment; error?: any }> {
  const authorData = params.authorProfile || {
    id: params.authorId,
    full_name: 'Ashu DevOps',
    username: 'ashu.devops',
    profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    course: 'B.Tech Computer Science',
    branch: 'DevOps & Systems Engineering',
    year: 'Final Year',
  };

  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    post_id: params.postId,
    author_id: params.authorId,
    author: authorData,
    parent_id: params.parentId || null,
    content: params.content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const all = getStoredComments();
  if (!all[params.postId]) all[params.postId] = [];
  all[params.postId].push(newComment);
  saveStoredComments(all);

  if (isSupabaseConfigured) {
    void (async () => {
      try {
        await supabase
          .from('comments')
          .insert({
            post_id: params.postId,
            author_id: params.authorId,
            content: params.content,
            parent_id: params.parentId || null,
          });
      } catch {}
    })();
  }

  return { comment: newComment };
}

export async function deleteComment(
  commentId: string,
  postId: string
): Promise<{ success: boolean; error?: any }> {
  const all = getStoredComments();
  if (all[postId]) {
    all[postId] = all[postId].filter((c) => c.id !== commentId);
    saveStoredComments(all);
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('comments').delete().eq('id', commentId);
    } catch {}
  }

  return { success: true };
}
