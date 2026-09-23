import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/types/database.types';
import { Post } from '@/types/social.types';

export interface DiscoverResults {
  students: Profile[];
  posts: Post[];
  clubs: any[];
  events: any[];
  notes: any[];
  opportunities: any[];
}

export async function unifiedSearch(
  queryText: string,
  collegeId?: string | null
): Promise<DiscoverResults> {
  const empty: DiscoverResults = {
    students: [],
    posts: [],
    clubs: [],
    events: [],
    notes: [],
    opportunities: [],
  };

  const q = queryText.trim();
  if (!q || !isSupabaseConfigured) return empty;

  try {
    const term = `%${q}%`;

    const [studentsRes, postsRes, clubsRes, eventsRes, notesRes, oppsRes] =
      await Promise.all([
        // Students: match name or username or course
        supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.${term},username.ilike.${term},course.ilike.${term},branch.ilike.${term}`)
          .limit(8),

        // Posts: match content
        supabase
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(
              id, full_name, username, profile_photo, course, year, branch
            )
          `)
          .ilike('content', term)
          .limit(8),

        // Clubs: match name or category
        supabase
          .from('clubs')
          .select('*')
          .or(`name.ilike.${term},category.ilike.${term}`)
          .limit(6),

        // Events: match title or location
        supabase
          .from('events')
          .select('*')
          .or(`title.ilike.${term},location.ilike.${term}`)
          .limit(6),

        // Notes: match title or subject
        supabase
          .from('resources')
          .select('*')
          .or(`title.ilike.${term},subject.ilike.${term}`)
          .limit(6),

        // Opportunities: match title or organization
        supabase
          .from('opportunities')
          .select('*')
          .or(`title.ilike.${term},organization.ilike.${term}`)
          .limit(6),
      ]);

    return {
      students: (studentsRes.data || []) as Profile[],
      posts: (postsRes.data || []) as Post[],
      clubs: clubsRes.data || [],
      events: eventsRes.data || [],
      notes: notesRes.data || [],
      opportunities: oppsRes.data || [],
    };
  } catch (err) {
    console.warn('Unified search error:', err);
    return empty;
  }
}
