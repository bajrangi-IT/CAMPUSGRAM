import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Story } from '@/types/social.types';

export async function fetchActiveStories(collegeId?: string | null): Promise<Story[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const nowIso = new Date().toISOString();
    let query = supabase
      .from('stories')
      .select(`
        *,
        author:profiles!stories_author_id_fkey(
          id, full_name, username, profile_photo, course, year, branch
        )
      `)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false });

    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as Story[];
  } catch (err) {
    console.warn('Failed to load active stories:', err);
    return [];
  }
}

export async function createStory(params: {
  authorId: string;
  collegeId: string;
  mediaUrl: string;
  caption?: string | null;
}): Promise<{ story?: Story; error?: any }> {
  if (!isSupabaseConfigured) {
    const fallbackStory: Story = {
      id: `local-story-${Date.now()}`,
      author_id: params.authorId,
      author: {
        id: params.authorId,
        full_name: 'Campus Student',
        username: 'student',
        profile_photo: null,
        course: null,
        branch: null,
        year: null,
      },
      college_id: params.collegeId,
      media_url: params.mediaUrl,
      caption: params.caption || null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    return { story: fallbackStory };
  }

  try {
    // 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('stories')
      .insert({
        author_id: params.authorId,
        college_id: params.collegeId,
        media_url: params.mediaUrl,
        caption: params.caption || null,
        expires_at: expiresAt,
      })
      .select(`
        *,
        author:profiles!stories_author_id_fkey(
          id, full_name, username, profile_photo, course, year, branch
        )
      `)
      .single();

    if (error) throw error;
    return { story: data as Story };
  } catch (err: any) {
    return { error: err };
  }
}
