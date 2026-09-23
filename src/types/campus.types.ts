import { Profile, College } from './database.types';

export type ClubCategory =
  | 'Technical & Coding'
  | 'Cultural & Arts'
  | 'Sports & Fitness'
  | 'Literary & Debating'
  | 'Social & Community'
  | 'Entrepreneurship'
  | 'Academic & Departmental'
  | 'Other';

export interface Club {
  id: string;
  college_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  logo_url?: string;
  cover_image: string | null;
  category: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  is_member?: boolean;
  is_admin?: boolean;
  creator?: Profile;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'member' | 'officer' | 'admin';
  joined_at: string;
  user?: Profile;
}

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface EventItem {
  id: string;
  college_id: string;
  club_id?: string | null;
  club?: Pick<Club, 'id' | 'name' | 'logo'>;
  organizer_id: string;
  created_by?: string;
  organizer?: Pick<Profile, 'id' | 'full_name' | 'username' | 'profile_photo'>;
  title: string;
  description: string;
  banner_url: string | null;
  location: string;
  venue?: string;
  start_time: string;
  end_time: string;
  capacity: number | null;
  max_capacity?: number | null;
  status: EventStatus;
  qr_code_token?: string;
  created_at: string;
  // Computed client state
  is_registered?: boolean;
  registered_count?: number;
  attendees_count?: number;
  is_checked_in?: boolean;
}

export interface EventCheckin {
  id: string;
  event_id: string;
  student_id: string;
  checkin_token: string;
  checked_in_at: string;
  student?: Profile;
}

export type AnnouncementPriority = 'normal' | 'important' | 'urgent' | 'academic';

export interface Announcement {
  id: string;
  college_id: string;
  author_id: string;
  author?: Pick<Profile, 'id' | 'full_name' | 'username' | 'profile_photo'>;
  author_role?: 'college_admin' | 'faculty' | 'department_admin' | 'club_admin' | string;
  club_id?: string | null;
  club?: Pick<Club, 'id' | 'name'>;
  title: string;
  content: string;
  image_url?: string | null;
  priority: AnnouncementPriority;
  target_audience: string;
  expires_at?: string | null;
  created_at: string;
}

export type ResourceVerification = 'student_uploaded' | 'faculty_verified' | 'club_verified';

export interface ResourceItem {
  id: string;
  college_id: string;
  uploader_id: string;
  uploader?: Pick<Profile, 'id' | 'full_name' | 'username' | 'profile_photo'>;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number;
  file_size_kb?: number;
  subject: string;
  course: string;
  semester: string | null;
  downloads_count: number;
  download_count?: number;
  verification_status: ResourceVerification;
  verified_by?: string | null;
  created_at: string;
  is_saved?: boolean;
}

export type OpportunityCategory =
  | 'internship'
  | 'hackathon'
  | 'competition'
  | 'scholarship'
  | 'volunteering'
  | 'campus_job'
  | 'external'
  | string;

export interface Opportunity {
  id: string;
  creator_id: string;
  creator?: Pick<Profile, 'id' | 'full_name' | 'username'>;
  college_id: string;
  title: string;
  organization: string;
  company?: string;
  type: OpportunityCategory;
  category?: string;
  location: string;
  link: string | null;
  apply_url?: string | null;
  deadline: string | null;
  description?: string;
  created_at: string;
  is_saved?: boolean;
}

export interface TeamRequest {
  id: string;
  creator_id: string;
  creator?: Pick<Profile, 'id' | 'full_name' | 'username' | 'profile_photo' | 'course' | 'year' | 'branch'> & {
    avatar_url?: string;
  };
  college_id: string;
  title: string;
  description: string;
  skills_needed: string[];
  people_needed: number;
  project_type: string;
  deadline: string | null;
  status: 'open' | 'closed';
  created_at: string;
}

export type MarketplaceCategory =
  | 'books'
  | 'electronics'
  | 'calculators'
  | 'hostel'
  | 'cycles'
  | 'other'
  | string;

export type MarketplaceCondition = 'Like New' | 'Good' | 'Fair' | 'New';

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  seller?: Pick<Profile, 'id' | 'full_name' | 'username' | 'profile_photo' | 'phone'> & {
    avatar_url?: string;
  };
  college_id: string;
  title: string;
  description: string;
  price: number;
  category: MarketplaceCategory;
  condition: MarketplaceCondition;
  status: 'active' | 'reserved' | 'sold' | 'archived' | 'available';
  is_sold: boolean;
  contact_count: number;
  images: string[];
  image_url?: string;
  created_at: string;
  is_saved?: boolean;
}
