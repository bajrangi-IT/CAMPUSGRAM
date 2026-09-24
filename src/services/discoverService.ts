import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/types/database.types';
import { Post } from '@/types/social.types';
import { campusService } from '@/services/campusService';
import { fetchFeedPosts } from '@/services/postsService';

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

  const q = queryText.trim().toLowerCase();
  if (!q) return empty;

  if (!isSupabaseConfigured) {
    // Offline / Local search with strict campus isolation
    const [clubs, events, notes, opportunities, feedRes] = await Promise.all([
      campusService.getClubs(undefined, collegeId),
      campusService.getEvents('upcoming', undefined, collegeId),
      campusService.getResources({}, collegeId),
      campusService.getOpportunities(undefined, collegeId),
      fetchFeedPosts('campus', 1, { currentUserId: '', collegeId: collegeId || null, followingUserIds: new Set(), userInterests: new Set(), userBranch: null }),
    ]);

    const matchingClubs = clubs.filter(
      (c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    );
    const matchingEvents = events.filter(
      (e) => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
    );
    const matchingNotes = notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q) || n.course.toLowerCase().includes(q)
    );
    const matchingOpps = opportunities.filter(
      (o) => o.title.toLowerCase().includes(q) || o.organization.toLowerCase().includes(q)
    );
    const matchingPosts = (feedRes.posts || []).filter(
      (p) => p.content.toLowerCase().includes(q)
    );

    // Mock student directory matching current college
    const mockStudents: Profile[] = [
      {
        id: 'ashu-devops-iitb',
        full_name: 'Ashutosh Sharma',
        username: 'ashu.devops',
        email: 'ashu.devops@iitb.ac.in',
        phone: null,
        profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
        cover_photo: null,
        college_id: 'col-iitb',
        bio: 'DevOps & Cloud Architect | IIT Bombay',
        course: 'B.Tech',
        branch: 'Computer Science',
        year: '4th Year',
        interests: ['DevOps', 'Kubernetes', 'Cloud'],
        skills: ['Docker', 'AWS', 'Go', 'React'],
        is_verified: true,
        phone_verified: false,
        onboarding_step: 5,
        onboarding_completed: true,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
      {
        id: 'student-priya',
        full_name: 'Priya Patel',
        username: 'priya.codes',
        email: 'priya.codes@iitb.ac.in',
        phone: null,
        profile_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
        cover_photo: null,
        college_id: 'col-iitb',
        bio: 'Frontend enthusiast & Design System builder',
        course: 'B.Tech',
        branch: 'Electronics & Communication',
        year: '3rd Year',
        interests: ['UI/UX', 'Design', 'Web Dev'],
        skills: ['React', 'TypeScript', 'Tailwind'],
        is_verified: true,
        phone_verified: false,
        onboarding_step: 5,
        onboarding_completed: true,
        created_at: '2026-09-02T00:00:00Z',
        updated_at: '2026-09-02T00:00:00Z',
      },
      {
        id: 'student-rahul',
        full_name: 'Rahul Verma',
        username: 'rahul.du',
        email: 'rahul.verma@du.ac.in',
        phone: null,
        profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
        cover_photo: null,
        college_id: 'col-du',
        bio: 'Economics & Debating Society | Delhi University',
        course: 'B.A.',
        branch: 'Economics Honours',
        year: '2nd Year',
        interests: ['Debating', 'Economics', 'Finance'],
        skills: ['Public Speaking', 'Data Analysis'],
        is_verified: true,
        phone_verified: false,
        onboarding_step: 5,
        onboarding_completed: true,
        created_at: '2026-09-03T00:00:00Z',
        updated_at: '2026-09-03T00:00:00Z',
      },
    ];

    const isolatedStudents = collegeId
      ? mockStudents.filter((s) => s.college_id === collegeId)
      : mockStudents;

    const matchingStudents = isolatedStudents.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.branch && s.branch.toLowerCase().includes(q))
    );

    return {
      students: matchingStudents,
      posts: matchingPosts,
      clubs: matchingClubs,
      events: matchingEvents,
      notes: matchingNotes,
      opportunities: matchingOpps,
    };
  }

  try {
    const term = `%${queryText}%`;

    let studentsQuery = supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.${term},username.ilike.${term},course.ilike.${term},branch.ilike.${term}`)
      .limit(8);
    if (collegeId) studentsQuery = studentsQuery.eq('college_id', collegeId);

    let postsQuery = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(
          id, full_name, username, profile_photo, course, year, branch
        )
      `)
      .ilike('content', term)
      .limit(8);
    if (collegeId) postsQuery = postsQuery.eq('college_id', collegeId);

    let clubsQuery = supabase
      .from('clubs')
      .select('*')
      .or(`name.ilike.${term},category.ilike.${term}`)
      .limit(6);
    if (collegeId) clubsQuery = clubsQuery.eq('college_id', collegeId);

    let eventsQuery = supabase
      .from('events')
      .select('*')
      .or(`title.ilike.${term},location.ilike.${term}`)
      .limit(6);
    if (collegeId) eventsQuery = eventsQuery.eq('college_id', collegeId);

    let notesQuery = supabase
      .from('resources')
      .select('*')
      .or(`title.ilike.${term},subject.ilike.${term}`)
      .limit(6);
    if (collegeId) notesQuery = notesQuery.eq('college_id', collegeId);

    let oppsQuery = supabase
      .from('opportunities')
      .select('*')
      .or(`title.ilike.${term},organization.ilike.${term}`)
      .limit(6);
    if (collegeId) oppsQuery = oppsQuery.eq('college_id', collegeId);

    const [studentsRes, postsRes, clubsRes, eventsRes, notesRes, oppsRes] =
      await Promise.all([
        studentsQuery,
        postsQuery,
        clubsQuery,
        eventsQuery,
        notesQuery,
        oppsQuery,
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
