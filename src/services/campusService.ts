import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Club,
  ClubMember,
  EventItem,
  EventCheckin,
  Announcement,
  ResourceItem,
  Opportunity,
  TeamRequest,
  MarketplaceListing,
} from '@/types/campus.types';

// ==========================================
// 1. CLUBS
// ==========================================

export async function fetchClubs(collegeId?: string | null, userId?: string | null): Promise<Club[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('clubs')
      .select(`
        *,
        creator:profiles!clubs_created_by_fkey(id, full_name, username)
      `)
      .order('created_at', { ascending: false });

    if (collegeId) query = query.eq('college_id', collegeId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    // Check membership and count for each
    const clubIds = data.map((c: any) => c.id);
    const { data: memberRows } = await supabase
      .from('club_members')
      .select('club_id, user_id, role')
      .in('club_id', clubIds);

    const memberMap: Record<string, { count: number; isMember: boolean; isAdmin: boolean }> = {};
    (memberRows || []).forEach((r: any) => {
      if (!memberMap[r.club_id]) {
        memberMap[r.club_id] = { count: 0, isMember: false, isAdmin: false };
      }
      memberMap[r.club_id].count += 1;
      if (userId && r.user_id === userId) {
        memberMap[r.club_id].isMember = true;
        if (r.role === 'admin') memberMap[r.club_id].isAdmin = true;
      }
    });

    return data.map((c: any) => ({
      ...c,
      member_count: memberMap[c.id]?.count || 0,
      is_member: Boolean(memberMap[c.id]?.isMember),
      is_admin: Boolean(memberMap[c.id]?.isAdmin) || (userId && c.created_by === userId),
    }));
  } catch (err) {
    console.warn('Failed to load clubs:', err);
    return [];
  }
}

export async function joinClub(clubId: string, userId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase.from('club_members').insert({
      club_id: clubId,
      user_id: userId,
      role: 'member',
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function leaveClub(clubId: string, userId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase
      .from('club_members')
      .delete()
      .match({ club_id: clubId, user_id: userId });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function createClub(params: {
  collegeId: string;
  creatorId: string;
  name: string;
  category: string;
  description: string;
  logo?: string;
  coverImage?: string;
}): Promise<{ club?: Club; error?: any }> {
  if (!isSupabaseConfigured) {
    const fallback: Club = {
      id: `local-club-${Date.now()}`,
      college_id: params.collegeId,
      name: params.name,
      slug: params.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      category: params.category,
      description: params.description,
      logo: params.logo || null,
      cover_image: params.coverImage || null,
      created_by: params.creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 1,
      is_member: true,
      is_admin: true,
    };
    return { club: fallback };
  }

  try {
    const slug = params.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(100 + Math.random() * 900);
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        college_id: params.collegeId,
        created_by: params.creatorId,
        name: params.name,
        slug,
        category: params.category,
        description: params.description,
        logo: params.logo || null,
        cover_image: params.coverImage || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Automatically make creator an admin in club_members
    await supabase.from('club_members').insert({
      club_id: data.id,
      user_id: params.creatorId,
      role: 'admin',
    });

    return {
      club: {
        ...data,
        member_count: 1,
        is_member: true,
        is_admin: true,
      },
    };
  } catch (err: any) {
    return { error: err };
  }
}

// ==========================================
// 2. EVENTS & QR CHECK-IN
// ==========================================

export async function fetchEvents(collegeId?: string | null, userId?: string | null): Promise<EventItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(id, full_name, username, profile_photo),
        club:clubs!events_club_id_fkey(id, name, logo)
      `)
      .order('start_time', { ascending: true });

    if (collegeId) query = query.eq('college_id', collegeId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    // Get registration statuses
    let registeredEventIds = new Set<string>();
    let checkedInEventIds = new Set<string>();

    if (userId) {
      const [regRes, checkRes] = await Promise.all([
        supabase.from('event_registrations').select('event_id').eq('user_id', userId),
        supabase.from('event_checkins').select('event_id').eq('student_id', userId),
      ]);
      if (regRes.data) registeredEventIds = new Set(regRes.data.map((r: any) => r.event_id));
      if (checkRes.data) checkedInEventIds = new Set(checkRes.data.map((c: any) => c.event_id));
    }

    return data.map((ev: any) => ({
      ...ev,
      is_registered: registeredEventIds.has(ev.id),
      is_checked_in: checkedInEventIds.has(ev.id),
      registered_count: 0,
    }));
  } catch (err) {
    console.warn('Failed to load events:', err);
    return [];
  }
}

export async function registerForEvent(eventId: string, userId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase.from('event_registrations').insert({
      event_id: eventId,
      user_id: userId,
      status: 'registered',
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function cancelEventRegistration(eventId: string, userId: string): Promise<{ success: boolean; error?: any }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .match({ event_id: eventId, user_id: userId });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function createEvent(params: {
  collegeId: string;
  organizerId: string;
  clubId?: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity?: number;
  bannerUrl?: string;
}): Promise<{ event?: EventItem; error?: any }> {
  if (!isSupabaseConfigured) {
    const fallback: EventItem = {
      id: `local-event-${Date.now()}`,
      college_id: params.collegeId,
      organizer_id: params.organizerId,
      title: params.title,
      description: params.description,
      location: params.location,
      start_time: params.startTime,
      end_time: params.endTime,
      capacity: params.capacity || null,
      banner_url: params.bannerUrl || null,
      status: 'upcoming',
      created_at: new Date().toISOString(),
      is_registered: false,
    };
    return { event: fallback };
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        college_id: params.collegeId,
        organizer_id: params.organizerId,
        club_id: params.clubId || null,
        title: params.title,
        description: params.description,
        location: params.location,
        start_time: params.startTime,
        end_time: params.endTime,
        capacity: params.capacity || null,
        banner_url: params.bannerUrl || null,
        status: 'upcoming',
      })
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(id, full_name, username, profile_photo)
      `)
      .single();

    if (error) throw error;
    return { event: data as EventItem };
  } catch (err: any) {
    return { error: err };
  }
}

export async function checkinStudentToEvent(params: {
  eventId: string;
  studentId: string;
  checkinToken: string;
}): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Check-in confirmed successfully!' };
  }

  try {
    // Check if student already checked in
    const { data: existing } = await supabase
      .from('event_checkins')
      .select('id, checked_in_at')
      .eq('event_id', params.eventId)
      .eq('student_id', params.studentId)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        message: 'Duplicate check-in detected! You have already checked in to this event.',
      };
    }

    const { error } = await supabase.from('event_checkins').insert({
      event_id: params.eventId,
      student_id: params.studentId,
      checkin_token: params.checkinToken,
    });

    if (error) throw error;

    return { success: true, message: 'Check-in successful! Welcome to the event.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Check-in failed.' };
  }
}

// ==========================================
// 3. OFFICIAL ANNOUNCEMENTS
// ==========================================

export async function fetchAnnouncements(collegeId?: string | null): Promise<Announcement[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('announcements')
      .select(`
        *,
        author:profiles!announcements_author_id_fkey(id, full_name, username, profile_photo),
        club:clubs(id, name)
      `)
      .order('created_at', { ascending: false });

    if (collegeId) query = query.eq('college_id', collegeId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Announcement[];
  } catch (err) {
    console.warn('Failed to load announcements:', err);
    return [];
  }
}

export async function createAnnouncement(params: {
  collegeId: string;
  authorId: string;
  authorRole: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent' | 'academic';
  imageUrl?: string;
  clubId?: string;
}): Promise<{ announcement?: Announcement; error?: any }> {
  if (!isSupabaseConfigured) {
    const fallback: Announcement = {
      id: `local-ann-${Date.now()}`,
      college_id: params.collegeId,
      author_id: params.authorId,
      author_role: params.authorRole,
      title: params.title,
      content: params.content,
      priority: params.priority,
      image_url: params.imageUrl || null,
      club_id: params.clubId || null,
      target_audience: 'all',
      created_at: new Date().toISOString(),
    };
    return { announcement: fallback };
  }

  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        college_id: params.collegeId,
        author_id: params.authorId,
        author_role: params.authorRole,
        title: params.title,
        content: params.content,
        priority: params.priority,
        image_url: params.imageUrl || null,
        club_id: params.clubId || null,
        target_audience: 'all',
      })
      .select(`
        *,
        author:profiles!announcements_author_id_fkey(id, full_name, username, profile_photo)
      `)
      .single();

    if (error) throw error;
    return { announcement: data as Announcement };
  } catch (err: any) {
    return { error: err };
  }
}

// ==========================================
// 4. NOTES & RESOURCES (COURSE -> SUBJECT -> RESOURCES)
// ==========================================

export async function fetchResources(params: {
  collegeId?: string | null;
  course?: string | null;
  subject?: string | null;
} = {}): Promise<ResourceItem[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('resources')
      .select(`
        *,
        uploader:profiles!resources_uploader_id_fkey(id, full_name, username, profile_photo)
      `)
      .order('downloads_count', { ascending: false });

    if (params.collegeId) query = query.eq('college_id', params.collegeId);
    if (params.course) query = query.ilike('course', `%${params.course}%`);
    if (params.subject) query = query.ilike('subject', `%${params.subject}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ResourceItem[];
  } catch (err) {
    console.warn('Failed to load resources:', err);
    return [];
  }
}

export async function uploadResource(params: {
  collegeId: string;
  uploaderId: string;
  title: string;
  description?: string;
  course: string;
  subject: string;
  semester?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  verificationStatus?: any;
}): Promise<{ resource?: ResourceItem; error?: any }> {
  if (!isSupabaseConfigured) {
    const fallback: ResourceItem = {
      id: `local-res-${Date.now()}`,
      college_id: params.collegeId,
      uploader_id: params.uploaderId,
      title: params.title,
      description: params.description || null,
      course: params.course,
      subject: params.subject,
      semester: params.semester || null,
      file_url: params.fileUrl,
      file_type: params.fileType,
      file_size: params.fileSize || 1048576,
      downloads_count: 0,
      verification_status: 'student_uploaded',
      created_at: new Date().toISOString(),
    };
    return { resource: fallback };
  }

  try {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        college_id: params.collegeId,
        uploader_id: params.uploaderId,
        title: params.title,
        description: params.description || null,
        course: params.course,
        subject: params.subject,
        semester: params.semester || null,
        file_url: params.fileUrl,
        file_type: params.fileType,
        file_size: params.fileSize || 1048576,
        downloads_count: 0,
        verification_status: 'student_uploaded',
      })
      .select(`
        *,
        uploader:profiles!resources_uploader_id_fkey(id, full_name, username, profile_photo)
      `)
      .single();

    if (error) throw error;
    return { resource: data as ResourceItem };
  } catch (err: any) {
    return { error: err };
  }
}

export async function incrementResourceDownload(resourceId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { data } = await supabase.from('resources').select('downloads_count').eq('id', resourceId).single();
    if (data) {
      await supabase
        .from('resources')
        .update({ downloads_count: (data.downloads_count || 0) + 1 })
        .eq('id', resourceId);
    }
  } catch {}
}

// ==========================================
// 5. OPPORTUNITIES
// ==========================================

export async function fetchOpportunities(collegeId?: string | null, type?: string | null): Promise<Opportunity[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('opportunities')
      .select(`
        *,
        creator:profiles!opportunities_creator_id_fkey(id, full_name, username)
      `)
      .order('created_at', { ascending: false });

    if (collegeId) query = query.eq('college_id', collegeId);
    if (type && type !== 'all') query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Opportunity[];
  } catch (err) {
    console.warn('Failed to load opportunities:', err);
    return [];
  }
}

export async function createOpportunity(params: {
  collegeId: string;
  creatorId: string;
  title: string;
  organization: string;
  type: string;
  location: string;
  link?: string;
  deadline?: string;
}): Promise<{ opportunity?: Opportunity; error?: any }> {
  if (!isSupabaseConfigured) {
    const fallback: Opportunity = {
      id: `local-opp-${Date.now()}`,
      college_id: params.collegeId,
      creator_id: params.creatorId,
      title: params.title,
      organization: params.organization,
      type: params.type as any,
      location: params.location,
      link: params.link || null,
      deadline: params.deadline || null,
      created_at: new Date().toISOString(),
    };
    return { opportunity: fallback };
  }

  try {
    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        college_id: params.collegeId,
        creator_id: params.creatorId,
        title: params.title,
        organization: params.organization,
        type: params.type,
        location: params.location,
        link: params.link || null,
        deadline: params.deadline || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { opportunity: data as Opportunity };
  } catch (err: any) {
    return { error: err };
  }
}

// ==========================================
// 6. TEAM FINDER
// ==========================================

export async function fetchTeamRequests(collegeId?: string | null): Promise<TeamRequest[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('team_requests')
      .select(`
        *,
        creator:profiles!team_requests_creator_id_fkey(
          id, full_name, username, profile_photo, course, year, branch
        )
      `)
      .order('created_at', { ascending: false });

    if (collegeId) query = query.eq('college_id', collegeId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as TeamRequest[];
  } catch (err) {
    console.warn('Failed to load team requests:', err);
    return [];
  }
}

export async function createTeamRequest(params: {
  collegeId: string;
  creatorId: string;
  title: string;
  description: string;
  skillsNeeded: string[];
  peopleNeeded: number;
  projectType: string;
  deadline?: string;
}): Promise<{ request?: TeamRequest; error?: any }> {
  if (!isSupabaseConfigured) {
    const fallback: TeamRequest = {
      id: `local-team-${Date.now()}`,
      college_id: params.collegeId,
      creator_id: params.creatorId,
      title: params.title,
      description: params.description,
      skills_needed: params.skillsNeeded,
      people_needed: params.peopleNeeded,
      project_type: params.projectType,
      deadline: params.deadline || null,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    return { request: fallback };
  }

  try {
    const { data, error } = await supabase
      .from('team_requests')
      .insert({
        college_id: params.collegeId,
        creator_id: params.creatorId,
        title: params.title,
        description: params.description,
        skills_needed: params.skillsNeeded,
        people_needed: params.peopleNeeded,
        project_type: params.projectType,
        deadline: params.deadline || null,
        status: 'open',
      })
      .select(`
        *,
        creator:profiles!team_requests_creator_id_fkey(
          id, full_name, username, profile_photo, course, year, branch
        )
      `)
      .single();

    if (error) throw error;
    return { request: data as TeamRequest };
  } catch (err: any) {
    return { error: err };
  }
}

// ==========================================
// 7. MARKETPLACE
// ==========================================

export async function fetchMarketplaceListings(collegeId?: string | null, category?: string | null): Promise<MarketplaceListing[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('marketplace_listings')
      .select(`
        *,
        seller:profiles!marketplace_listings_seller_id_fkey(
          id, full_name, username, profile_photo, phone
        )
      `)
      .eq('is_sold', false)
      .order('created_at', { ascending: false });

    if (collegeId) query = query.eq('college_id', collegeId);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as MarketplaceListing[];
  } catch (err) {
    console.warn('Failed to load marketplace listings:', err);
    return [];
  }
}

export async function createMarketplaceListing(params: {
  collegeId: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
}): Promise<{ listing?: MarketplaceListing; error?: any }> {
  if (!isSupabaseConfigured) {
    const fallback: MarketplaceListing = {
      id: `local-item-${Date.now()}`,
      college_id: params.collegeId,
      seller_id: params.sellerId,
      title: params.title,
      description: params.description,
      price: params.price,
      category: params.category as any,
      condition: params.condition as any,
      status: 'active',
      is_sold: false,
      contact_count: 0,
      images: params.images,
      created_at: new Date().toISOString(),
    };
    return { listing: fallback };
  }

  try {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert({
        college_id: params.collegeId,
        seller_id: params.sellerId,
        title: params.title,
        description: params.description,
        price: params.price,
        category: params.category,
        condition: params.condition,
        images: params.images,
        status: 'active',
        is_sold: false,
        contact_count: 0,
      })
      .select(`
        *,
        seller:profiles!marketplace_listings_seller_id_fkey(
          id, full_name, username, profile_photo, phone
        )
      `)
      .single();

    if (error) throw error;
    return { listing: data as MarketplaceListing };
  } catch (err: any) {
    return { error: err };
  }
}

export async function markListingSold(listingId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase
      .from('marketplace_listings')
      .update({ is_sold: true, status: 'sold' })
      .eq('id', listingId);
    return !error;
  } catch {
    return false;
  }
}

// Unified campusService adapter
export const campusService = {
  // Clubs
  getClubs: async (category?: string): Promise<Club[]> => {
    const clubs = await fetchClubs();
    if (!category || category === 'All') return clubs;
    return clubs.filter((c) => c.category.toLowerCase() === category.toLowerCase());
  },
  checkUserClubMembership: async (clubId: string, userId: string): Promise<{ isMember: boolean; role?: 'member' | 'admin' }> => {
    if (!isSupabaseConfigured) return { isMember: false };
    const { data } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .maybeSingle();
    return { isMember: !!data, role: data?.role as any };
  },
  getClubEvents: async (clubId: string): Promise<EventItem[]> => {
    if (!isSupabaseConfigured) return [];
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', clubId)
      .order('start_time', { ascending: true });
    return (data || []) as EventItem[];
  },
  getClubAnnouncements: async (clubId: string): Promise<Announcement[]> => {
    if (!isSupabaseConfigured) return [];
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    return (data || []) as Announcement[];
  },
  joinClub: async (clubId: string, userId: string) => {
    return joinClub(clubId, userId);
  },
  leaveClub: async (clubId: string, userId: string) => {
    return leaveClub(clubId, userId);
  },
  createClub: async (payload: {
    college_id: string;
    name: string;
    category: string;
    description: string;
    logo_url?: string;
    created_by: string;
  }): Promise<Club> => {
    const res = await createClub({
      collegeId: payload.college_id,
      creatorId: payload.created_by,
      name: payload.name,
      category: payload.category,
      description: payload.description,
      logo: payload.logo_url,
    });
    if (res.error) throw res.error;
    return res.club!;
  },

  // Events
  getEvents: async (filter?: 'upcoming' | 'registered' | 'past', userId?: string): Promise<EventItem[]> => {
    const events = await fetchEvents(null, userId);
    const now = new Date();
    if (filter === 'registered') {
      return events.filter((e) => e.is_registered);
    }
    if (filter === 'past') {
      return events.filter((e) => new Date(e.start_time) < now);
    }
    return events.filter((e) => new Date(e.start_time) >= now);
  },
  createEvent: async (payload: {
    college_id: string;
    club_id?: string;
    title: string;
    description: string;
    venue: string;
    start_time: string;
    end_time?: string;
    max_capacity?: number;
    created_by: string;
  }): Promise<EventItem> => {
    const res = await createEvent({
      collegeId: payload.college_id,
      organizerId: payload.created_by,
      clubId: payload.club_id,
      title: payload.title,
      description: payload.description,
      location: payload.venue,
      startTime: payload.start_time,
      endTime: payload.end_time || payload.start_time,
      capacity: payload.max_capacity,
    });
    if (res.error) throw res.error;
    return res.event!;
  },
  registerForEvent: async (eventId: string, userId: string) => {
    const res = await registerForEvent(eventId, userId);
    if (!res.success) throw res.error || new Error('Registration failed');
    return res;
  },
  cancelEventRegistration: async (eventId: string, userId: string) => {
    const res = await cancelEventRegistration(eventId, userId);
    if (!res.success) throw res.error || new Error('Cancellation failed');
    return res;
  },
  getEventCheckins: async (eventId: string): Promise<EventCheckin[]> => {
    if (!isSupabaseConfigured) return [];
    const { data } = await supabase
      .from('event_checkins')
      .select('*, student:profiles!event_checkins_student_id_fkey(*)')
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: false });
    return (data || []) as EventCheckin[];
  },
  checkinStudentToEvent: async (eventId: string, studentId: string, token: string) => {
    return checkinStudentToEvent({
      eventId,
      studentId,
      checkinToken: token,
    });
  },

  // Announcements
  getAnnouncements: async (priority?: string): Promise<Announcement[]> => {
    const data = await fetchAnnouncements();
    if (!priority || priority === 'all') return data;
    return data.filter((a) => a.priority === priority);
  },
  createAnnouncement: async (payload: {
    college_id: string;
    author_id: string;
    author_role: 'college_admin' | 'faculty' | 'department_admin' | 'club_admin' | string;
    title: string;
    content: string;
    priority: 'normal' | 'important' | 'urgent' | 'academic';
    target_audience?: string;
  }): Promise<Announcement> => {
    const res = await createAnnouncement({
      collegeId: payload.college_id,
      authorId: payload.author_id,
      authorRole: payload.author_role,
      title: payload.title,
      content: payload.content,
      priority: payload.priority,
    });
    if (res.error) throw res.error;
    return res.announcement!;
  },

  // Notes & Resources
  getResources: async (filter?: { course?: string; subject?: string }): Promise<ResourceItem[]> => {
    let resources = await fetchResources();
    if (filter?.course && filter.course !== 'All Courses') {
      resources = resources.filter((r) => r.course.toLowerCase() === filter.course!.toLowerCase());
    }
    if (filter?.subject && filter.subject !== 'All Subjects') {
      resources = resources.filter((r) => r.subject.toLowerCase() === filter.subject!.toLowerCase());
    }
    return resources;
  },
  uploadResource: async (payload: {
    college_id: string;
    uploader_id: string;
    title: string;
    course: string;
    subject: string;
    file_url: string;
    file_type?: string;
    file_size_kb?: number;
    verification_status?: any;
  }): Promise<ResourceItem> => {
    const res = await uploadResource({
      collegeId: payload.college_id,
      uploaderId: payload.uploader_id,
      title: payload.title,
      course: payload.course,
      subject: payload.subject,
      fileUrl: payload.file_url,
      fileType: payload.file_type || 'pdf',
      fileSize: (payload.file_size_kb || 1024) * 1024,
      verificationStatus: payload.verification_status,
    });
    if (res.error) throw res.error;
    return res.resource!;
  },
  incrementResourceDownloads: async (resourceId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return true;
    try {
      const { data } = await supabase
        .from('resources')
        .select('downloads_count')
        .eq('id', resourceId)
        .single();
      const current = data?.downloads_count || 0;
      await supabase
        .from('resources')
        .update({ downloads_count: current + 1 })
        .eq('id', resourceId);
      return true;
    } catch {
      return false;
    }
  },

  // Opportunities
  getOpportunities: async (category?: string): Promise<Opportunity[]> => {
    const data = await fetchOpportunities();
    if (!category || category === 'All') return data;
    return data.filter((o) => (o.category || o.type || '').toLowerCase() === category.toLowerCase());
  },
  createOpportunity: async (payload: {
    college_id: string;
    posted_by: string;
    title: string;
    company: string;
    category: string;
    location?: string;
    deadline?: string;
    description: string;
    apply_url?: string;
  }): Promise<Opportunity> => {
    const res = await createOpportunity({
      collegeId: payload.college_id,
      creatorId: payload.posted_by,
      title: payload.title,
      organization: payload.company,
      type: payload.category as any,
      location: payload.location || 'Campus',
      link: payload.apply_url,
      deadline: payload.deadline,
    });
    if (res.error) throw res.error;
    return {
      ...res.opportunity!,
      company: payload.company,
      description: payload.description,
      apply_url: payload.apply_url,
    };
  },

  // Team Requests
  getTeamRequests: async (): Promise<TeamRequest[]> => {
    return fetchTeamRequests();
  },
  createTeamRequest: async (payload: {
    college_id: string;
    creator_id: string;
    title: string;
    description: string;
    skills_needed: string[];
    people_needed: number;
  }): Promise<TeamRequest> => {
    const res = await createTeamRequest({
      collegeId: payload.college_id,
      creatorId: payload.creator_id,
      title: payload.title,
      description: payload.description,
      skillsNeeded: payload.skills_needed,
      peopleNeeded: payload.people_needed,
      projectType: 'General Collaboration',
    });
    if (res.error) throw res.error;
    return (res.request || (res as any).teamRequest)!;
  },

  // Marketplace
  getMarketplaceListings: async (category?: string): Promise<MarketplaceListing[]> => {
    const listings = await fetchMarketplaceListings();
    if (!category || category === 'All') return listings;
    return listings.filter((l) => (l.category || '').toLowerCase() === category.toLowerCase());
  },
  createMarketplaceListing: async (payload: {
    college_id: string;
    seller_id: string;
    title: string;
    price: number;
    category: string;
    condition: string;
    description: string;
    image_url?: string;
  }): Promise<MarketplaceListing> => {
    const res = await createMarketplaceListing({
      collegeId: payload.college_id,
      sellerId: payload.seller_id,
      title: payload.title,
      price: payload.price,
      category: payload.category,
      condition: payload.condition,
      description: payload.description,
      images: payload.image_url ? [payload.image_url] : [],
    });
    if (res.error) throw res.error;
    return res.listing!;
  },
  updateMarketplaceListingStatus: async (listingId: string, status: 'available' | 'sold' | string): Promise<boolean> => {
    if (status === 'sold') {
      return markListingSold(listingId);
    }
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ is_sold: false, status: 'active' })
        .eq('id', listingId);
      return !error;
    } catch {
      return false;
    }
  },
};

