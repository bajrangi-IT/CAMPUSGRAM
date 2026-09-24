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
// LOCAL STORAGE & MULTI-CAMPUS SEED STORES
// ==========================================

const SEED_CLUBS: Club[] = [
  // IIT Bombay
  {
    id: 'club-iitb-1',
    college_id: 'col-iitb',
    name: 'Web & Coding Club (WnCC)',
    slug: 'wncc-iitb',
    category: 'Technical',
    description: 'The official programming and software engineering community of IIT Bombay.',
    logo: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=160&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80',
    created_by: 'ashu-devops-iitb',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    member_count: 340,
    is_member: true,
    is_admin: true,
  },
  {
    id: 'club-iitb-2',
    college_id: 'col-iitb',
    name: 'Mood Indigo Cultural Council',
    slug: 'mood-indigo-iitb',
    category: 'Cultural',
    description: 'Asia’s largest college cultural festival committee and student arts society.',
    logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=160&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80',
    created_by: 'priya-iitb',
    created_at: '2026-09-02T10:00:00Z',
    updated_at: '2026-09-02T10:00:00Z',
    member_count: 820,
    is_member: false,
    is_admin: false,
  },
  // Delhi University
  {
    id: 'club-du-1',
    college_id: 'col-du',
    name: 'DU Debating Society (DebSoc)',
    slug: 'debsoc-du',
    category: 'Academic',
    description: 'Parliamentary debating, diplomacy summits, and inter-college oratory tournaments.',
    logo: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=160&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1000&auto=format&fit=crop&q=80',
    created_by: 'rahul-du',
    created_at: '2026-09-05T10:00:00Z',
    updated_at: '2026-09-05T10:00:00Z',
    member_count: 210,
    is_member: false,
    is_admin: false,
  },
  // BITS Pilani
  {
    id: 'club-bits-1',
    college_id: 'col-bits',
    name: 'APOGEE Tech Society',
    slug: 'apogee-bits',
    category: 'Technical',
    description: 'Innovating robotics, aerospace, algorithmic challenges, and annual tech conclaves.',
    logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=160&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
    created_by: 'bits-lead',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
    member_count: 450,
    is_member: false,
    is_admin: false,
  },
];

const SEED_EVENTS: EventItem[] = [
  // IIT Bombay
  {
    id: 'ev-iitb-1',
    college_id: 'col-iitb',
    organizer_id: 'ashu-devops-iitb',
    title: 'Autumn Hackathon 2026: Cloud & AI Sprint',
    description: '36-hour sprint building decentralized campus applications and AI copilots. Cash prizes & direct mentor interviews!',
    location: 'FC Kohli Auditorium, CS Department',
    start_time: '2026-10-15T09:00:00Z',
    end_time: '2026-10-16T21:00:00Z',
    capacity: 200,
    banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&auto=format&fit=crop&q=80',
    status: 'upcoming',
    created_at: '2026-09-10T08:00:00Z',
    is_registered: true,
    is_checked_in: false,
    registered_count: 96,
  },
  {
    id: 'ev-iitb-2',
    college_id: 'col-iitb',
    organizer_id: 'priya-iitb',
    title: 'E-Summit Leadership Keynote',
    description: 'Fireside chat with prominent startup founders and venture partners on scaling deep-tech from university labs.',
    location: 'Convocation Hall',
    start_time: '2026-10-22T14:00:00Z',
    end_time: '2026-10-22T17:30:00Z',
    capacity: 500,
    banner_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1000&auto=format&fit=crop&q=80',
    status: 'upcoming',
    created_at: '2026-09-12T08:00:00Z',
    is_registered: false,
    is_checked_in: false,
    registered_count: 312,
  },
  // Delhi University
  {
    id: 'ev-du-1',
    college_id: 'col-du',
    organizer_id: 'rahul-du',
    title: 'National Parliamentary Debate Open',
    description: 'Premier Asian parliamentary debate tournament hosted across North Campus colleges with international adjudicators.',
    location: 'St. Stephen’s College Seminar Hall',
    start_time: '2026-10-18T10:00:00Z',
    end_time: '2026-10-19T18:00:00Z',
    capacity: 150,
    banner_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80',
    status: 'upcoming',
    created_at: '2026-09-14T08:00:00Z',
    is_registered: false,
    is_checked_in: false,
    registered_count: 85,
  },
  // BITS Pilani
  {
    id: 'ev-bits-1',
    college_id: 'col-bits',
    organizer_id: 'bits-lead',
    title: 'Oasis Music & Pro-Nite Extravaganza',
    description: 'Annual cultural festival headlined by prominent national indie bands and battle of the bands.',
    location: 'BITS Auditorium & Gym Grounds',
    start_time: '2026-11-05T18:00:00Z',
    end_time: '2026-11-07T23:00:00Z',
    capacity: 1200,
    banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
    status: 'upcoming',
    created_at: '2026-09-15T08:00:00Z',
    is_registered: false,
    is_checked_in: false,
    registered_count: 640,
  },
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  // IIT Bombay
  {
    id: 'ann-iitb-1',
    college_id: 'col-iitb',
    author_id: 'admin-iitb',
    author_role: 'college_admin',
    title: 'Mid-Semester Examination Schedule Autumn 2026 Released',
    content: 'The academic office has published the finalized exam timetable on the ASC portal. Slot clashes must be reported within 48 hours to the department coordinator.',
    priority: 'urgent',
    target_audience: 'all',
    created_at: '2026-09-20T09:30:00Z',
  },
  {
    id: 'ann-iitb-2',
    college_id: 'col-iitb',
    author_id: 'hostel-affairs',
    author_role: 'college_admin',
    title: 'Hostel Night Mess & Dining Committee Election',
    content: 'Nominations are invited for Mess Councilors for Hostels 12, 13, and 14. Submit physical forms before Friday 5 PM.',
    priority: 'normal',
    target_audience: 'hostelers',
    created_at: '2026-09-18T14:00:00Z',
  },
  // Delhi University
  {
    id: 'ann-du-1',
    college_id: 'col-du',
    author_id: 'admin-du',
    author_role: 'college_admin',
    title: 'Semester End Examination Form Submission Deadline',
    content: 'All undergraduate students must ensure exam registration fees and admit card validation is completed by October 10.',
    priority: 'urgent',
    target_audience: 'all',
    created_at: '2026-09-21T11:00:00Z',
  },
];

const SEED_RESOURCES: ResourceItem[] = [
  // IIT Bombay
  {
    id: 'res-iitb-1',
    college_id: 'col-iitb',
    uploader_id: 'ashu-devops-iitb',
    title: 'CS213 Data Structures & Algorithms Handout + PYQs',
    description: 'Comprehensive handwritten lecture notes, red-black trees cheat sheet, and 5 years solved midsem problems.',
    course: 'Computer Science & Engineering',
    subject: 'Data Structures & Algorithms',
    semester: 'Semester 3',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    file_size: 4200000,
    downloads_count: 512,
    verification_status: 'faculty_verified',
    created_at: '2026-09-08T10:00:00Z',
  },
  {
    id: 'res-iitb-2',
    college_id: 'col-iitb',
    uploader_id: 'priya-iitb',
    title: 'EE101 Electrical & Electronics Fundamentals Formula Sheet',
    description: 'RLC transient circuits, Norton-Thevenin theorem summaries, and lab exam revision questions.',
    course: 'Electronics & Communication',
    subject: 'Analog Electronics',
    semester: 'Semester 2',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    file_size: 2100000,
    downloads_count: 320,
    verification_status: 'student_uploaded',
    created_at: '2026-09-12T14:30:00Z',
  },
  // Delhi University
  {
    id: 'res-du-1',
    college_id: 'col-du',
    uploader_id: 'rahul-du',
    title: 'Microeconomics Theory - Past 10 Years Solved Questions',
    description: 'Detailed answers for consumer equilibrium, game theory, and market dynamics curated from St. Stephens faculty notes.',
    course: 'Business Administration',
    subject: 'Microeconomics',
    semester: 'Semester 1',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    file_size: 3500000,
    downloads_count: 289,
    verification_status: 'faculty_verified',
    created_at: '2026-09-14T10:00:00Z',
  },
];

const SEED_OPPORTUNITIES: Opportunity[] = [
  // IIT Bombay
  {
    id: 'opp-iitb-1',
    college_id: 'col-iitb',
    creator_id: 'ashu-devops-iitb',
    title: 'Research Assistant in Distributed Systems & Kubernetes',
    organization: 'Computer Systems Research Lab (IIT Bombay)',
    type: 'research' as any,
    location: 'Kanwal Rekhi Building, Room 204',
    deadline: '2026-10-30',
    link: 'https://cs.iitb.ac.in',
    created_at: '2026-09-15T09:00:00Z',
  },
  {
    id: 'opp-iitb-2',
    college_id: 'col-iitb',
    creator_id: 'alumni-iitb',
    title: 'Winter Software Engineering Intern (Frontend / React)',
    organization: 'CampusGram Core Labs',
    type: 'internship' as any,
    location: 'Remote / Hybrid (Powai)',
    deadline: '2026-11-15',
    link: 'https://campusgram.edu',
    created_at: '2026-09-18T12:00:00Z',
  },
  // Delhi University
  {
    id: 'opp-du-1',
    college_id: 'col-du',
    creator_id: 'rahul-du',
    title: 'Financial Analyst Intern (Winter 2026)',
    organization: 'Deloitte Campus Consulting Group',
    type: 'internship' as any,
    location: 'Connaught Place / Hybrid',
    deadline: '2026-10-25',
    link: 'https://deloitte.com/careers',
    created_at: '2026-09-19T10:00:00Z',
  },
];

const SEED_TEAM_REQUESTS: TeamRequest[] = [
  // IIT Bombay
  {
    id: 'team-iitb-1',
    college_id: 'col-iitb',
    creator_id: 'ashu-devops-iitb',
    title: 'Building Real-time Campus IoT Mesh for Smart Energy Tracking',
    description: 'Looking for 1 Embedded C/Rust developer and 1 UI developer to compete in the National Smart Energy Hackathon next month.',
    skills_needed: ['Rust', 'Embedded C', 'React', 'MQTT'],
    people_needed: 2,
    project_type: 'Hackathon',
    deadline: '2026-10-10',
    status: 'open',
    created_at: '2026-09-16T11:00:00Z',
  },
  // Delhi University
  {
    id: 'team-du-1',
    college_id: 'col-du',
    creator_id: 'rahul-du',
    title: 'Case Study Competition Team for National B-School League',
    description: 'Looking for a quantitative data analyst and a slide deck designer to compete in the upcoming Harvard USG Business Cup.',
    skills_needed: ['Financial Modeling', 'Excel', 'Canva/Figma', 'Pitching'],
    people_needed: 2,
    project_type: 'Case Competition',
    deadline: '2026-10-15',
    status: 'open',
    created_at: '2026-09-17T15:00:00Z',
  },
];

const SEED_MARKETPLACE: MarketplaceListing[] = [
  // IIT Bombay
  {
    id: 'market-iitb-1',
    college_id: 'col-iitb',
    seller_id: 'ashu-devops-iitb',
    title: 'Hercules Road Cycle - Excellent Campus Commuter',
    description: 'Serviced last month with new tires, wire lock included. Perfect for moving between Hostel 13 and Lecture Hall Complex.',
    price: 2800,
    category: 'Bicycles & Transport' as any,
    condition: 'Good' as any,
    status: 'active',
    is_sold: false,
    contact_count: 7,
    images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80'],
    created_at: '2026-09-19T08:00:00Z',
  },
  {
    id: 'market-iitb-2',
    college_id: 'col-iitb',
    seller_id: 'priya-iitb',
    title: 'Casio fx-991EX Scientific Calculator',
    description: 'Approved for semester exams. Mint condition with original snap-on protective cover and manual.',
    price: 750,
    category: 'Electronics' as any,
    condition: 'Like New' as any,
    status: 'active',
    is_sold: false,
    contact_count: 12,
    images: ['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80'],
    created_at: '2026-09-20T14:00:00Z',
  },
  // Delhi University
  {
    id: 'market-du-1',
    college_id: 'col-du',
    seller_id: 'rahul-du',
    title: 'Mankiw Principles of Economics (Complete 8th Edition)',
    description: 'Clean pages, no excessive highlighting. Must-have for 1st and 2nd year B.A. Economics honors.',
    price: 450,
    category: 'Textbooks & Notes' as any,
    condition: 'Good' as any,
    status: 'active',
    is_sold: false,
    contact_count: 5,
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'],
    created_at: '2026-09-21T09:00:00Z',
  },
];

// Helper to get / save local storage per category
function getLocalStore<T>(key: string, initialData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(raw);
  } catch {
    return initialData;
  }
}

function saveLocalStore<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to save ${key} to localStorage:`, err);
  }
}

// ==========================================
// 1. CLUBS
// ==========================================

export async function fetchClubs(collegeId?: string | null, userId?: string | null): Promise<Club[]> {
  if (!isSupabaseConfigured) {
    const clubs = getLocalStore<Club>('campusgram_clubs_store', SEED_CLUBS);
    if (!collegeId) return clubs;
    return clubs.filter((c) => c.college_id === collegeId);
  }

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
  if (!isSupabaseConfigured) {
    const clubs = getLocalStore<Club>('campusgram_clubs_store', SEED_CLUBS);
    const updated = clubs.map((c) => (c.id === clubId ? { ...c, member_count: (c.member_count ?? 0) + 1, is_member: true } : c));
    saveLocalStore('campusgram_clubs_store', updated);
    return { success: true };
  }
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
  if (!isSupabaseConfigured) {
    const clubs = getLocalStore<Club>('campusgram_clubs_store', SEED_CLUBS);
    const updated = clubs.map((c) => (c.id === clubId ? { ...c, member_count: Math.max(0, (c.member_count ?? 1) - 1), is_member: false } : c));
    saveLocalStore('campusgram_clubs_store', updated);
    return { success: true };
  }
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
    const clubs = getLocalStore<Club>('campusgram_clubs_store', SEED_CLUBS);
    saveLocalStore('campusgram_clubs_store', [fallback, ...clubs]);
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
  if (!isSupabaseConfigured) {
    const events = getLocalStore<EventItem>('campusgram_events_store', SEED_EVENTS);
    if (!collegeId) return events;
    return events.filter((e) => e.college_id === collegeId);
  }

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
  if (!isSupabaseConfigured) {
    const events = getLocalStore<EventItem>('campusgram_events_store', SEED_EVENTS);
    const updated = events.map((e) =>
      e.id === eventId ? { ...e, is_registered: true, registered_count: (e.registered_count || 0) + 1 } : e
    );
    saveLocalStore('campusgram_events_store', updated);
    return { success: true };
  }
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
  if (!isSupabaseConfigured) {
    const events = getLocalStore<EventItem>('campusgram_events_store', SEED_EVENTS);
    const updated = events.map((e) =>
      e.id === eventId ? { ...e, is_registered: false, registered_count: Math.max(0, (e.registered_count || 1) - 1) } : e
    );
    saveLocalStore('campusgram_events_store', updated);
    return { success: true };
  }
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
      registered_count: 1,
    };
    const events = getLocalStore<EventItem>('campusgram_events_store', SEED_EVENTS);
    saveLocalStore('campusgram_events_store', [fallback, ...events]);
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
    return { success: true, message: 'Check-in verified successfully!' };
  }

  try {
    const { data: existing } = await supabase
      .from('event_checkins')
      .select('id, checked_in_at')
      .eq('event_id', params.eventId)
      .eq('student_id', params.studentId)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        message: 'Duplicate check-in detected! You have already checked in.',
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
  if (!isSupabaseConfigured) {
    const announcements = getLocalStore<Announcement>('campusgram_announcements_store', SEED_ANNOUNCEMENTS);
    if (!collegeId) return announcements;
    return announcements.filter((a) => a.college_id === collegeId);
  }

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
    const announcements = getLocalStore<Announcement>('campusgram_announcements_store', SEED_ANNOUNCEMENTS);
    saveLocalStore('campusgram_announcements_store', [fallback, ...announcements]);
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
// 4. NOTES & RESOURCES
// ==========================================

export async function fetchResources(params: {
  collegeId?: string | null;
  course?: string | null;
  subject?: string | null;
} = {}): Promise<ResourceItem[]> {
  if (!isSupabaseConfigured) {
    let resources = getLocalStore<ResourceItem>('campusgram_resources_store', SEED_RESOURCES);
    if (params.collegeId) {
      resources = resources.filter((r) => r.college_id === params.collegeId);
    }
    if (params.course && params.course !== 'All Courses') {
      resources = resources.filter((r) => r.course.toLowerCase().includes(params.course!.toLowerCase()));
    }
    if (params.subject && params.subject !== 'All Subjects') {
      resources = resources.filter((r) => r.subject.toLowerCase().includes(params.subject!.toLowerCase()));
    }
    return resources;
  }

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
    const list = getLocalStore<ResourceItem>('campusgram_resources_store', SEED_RESOURCES);
    saveLocalStore('campusgram_resources_store', [fallback, ...list]);
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

// ==========================================
// 5. OPPORTUNITIES
// ==========================================

export async function fetchOpportunities(collegeId?: string | null, type?: string | null): Promise<Opportunity[]> {
  if (!isSupabaseConfigured) {
    let opps = getLocalStore<Opportunity>('campusgram_opportunities_store', SEED_OPPORTUNITIES);
    if (collegeId) opps = opps.filter((o) => o.college_id === collegeId);
    if (type && type !== 'all') opps = opps.filter((o) => o.type === type);
    return opps;
  }

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
    const opps = getLocalStore<Opportunity>('campusgram_opportunities_store', SEED_OPPORTUNITIES);
    saveLocalStore('campusgram_opportunities_store', [fallback, ...opps]);
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
  if (!isSupabaseConfigured) {
    let requests = getLocalStore<TeamRequest>('campusgram_team_store', SEED_TEAM_REQUESTS);
    if (collegeId) requests = requests.filter((r) => r.college_id === collegeId);
    return requests;
  }

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
    const list = getLocalStore<TeamRequest>('campusgram_team_store', SEED_TEAM_REQUESTS);
    saveLocalStore('campusgram_team_store', [fallback, ...list]);
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
  if (!isSupabaseConfigured) {
    let listings = getLocalStore<MarketplaceListing>('campusgram_marketplace_store', SEED_MARKETPLACE);
    if (collegeId) listings = listings.filter((l) => l.college_id === collegeId);
    if (category && category !== 'all' && category !== 'All') {
      listings = listings.filter((l) => (l.category || '').toLowerCase() === category.toLowerCase());
    }
    return listings;
  }

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
    if (category && category !== 'all' && category !== 'All') query = query.eq('category', category);

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
    const list = getLocalStore<MarketplaceListing>('campusgram_marketplace_store', SEED_MARKETPLACE);
    saveLocalStore('campusgram_marketplace_store', [fallback, ...list]);
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
  if (!isSupabaseConfigured) {
    const list = getLocalStore<MarketplaceListing>('campusgram_marketplace_store', SEED_MARKETPLACE);
    const updated = list.map((l) => (l.id === listingId ? { ...l, is_sold: true, status: 'sold' } : l));
    saveLocalStore('campusgram_marketplace_store', updated);
    return true;
  }
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
  getClubs: async (category?: string, collegeId?: string | null, userId?: string | null): Promise<Club[]> => {
    const clubs = await fetchClubs(collegeId, userId);
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
    if (!isSupabaseConfigured) {
      const events = getLocalStore<EventItem>('campusgram_events_store', SEED_EVENTS);
      return events.filter((e) => e.club_id === clubId);
    }
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', clubId)
      .order('start_time', { ascending: true });
    return (data || []) as EventItem[];
  },
  getClubAnnouncements: async (clubId: string): Promise<Announcement[]> => {
    if (!isSupabaseConfigured) {
      const ann = getLocalStore<Announcement>('campusgram_announcements_store', SEED_ANNOUNCEMENTS);
      return ann.filter((a) => a.club_id === clubId);
    }
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
  getEvents: async (filter?: 'upcoming' | 'registered' | 'past', userId?: string, collegeId?: string | null): Promise<EventItem[]> => {
    const events = await fetchEvents(collegeId, userId);
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
  getAnnouncements: async (priority?: string, collegeId?: string | null): Promise<Announcement[]> => {
    const data = await fetchAnnouncements(collegeId);
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
  getResources: async (filter?: { course?: string; subject?: string }, collegeId?: string | null): Promise<ResourceItem[]> => {
    let resources = await fetchResources({
      collegeId,
      course: filter?.course,
      subject: filter?.subject,
    });
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
    if (!isSupabaseConfigured) {
      const list = getLocalStore<ResourceItem>('campusgram_resources_store', SEED_RESOURCES);
      const updated = list.map((r) => (r.id === resourceId ? { ...r, downloads_count: (r.downloads_count || 0) + 1 } : r));
      saveLocalStore('campusgram_resources_store', updated);
      return true;
    }
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
  getOpportunities: async (category?: string, collegeId?: string | null): Promise<Opportunity[]> => {
    const data = await fetchOpportunities(collegeId);
    if (!category || category === 'All') return data;
    return data.filter((o) => (o.type || '').toLowerCase() === category.toLowerCase());
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
      organization: payload.company,
      description: payload.description,
      link: payload.apply_url || null,
    };
  },

  // Team Requests
  getTeamRequests: async (collegeId?: string | null): Promise<TeamRequest[]> => {
    return fetchTeamRequests(collegeId);
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
    return res.request!;
  },

  // Marketplace
  getMarketplaceListings: async (category?: string, collegeId?: string | null): Promise<MarketplaceListing[]> => {
    const listings = await fetchMarketplaceListings(collegeId, category);
    return listings;
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
