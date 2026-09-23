export type UserRole =
  | 'student'
  | 'club_admin'
  | 'faculty'
  | 'department_admin'
  | 'college_admin'
  | 'business'
  | 'advertiser'
  | 'moderator'
  | 'super_admin';

export type CollegeStatus = 'active' | 'inactive' | 'pending';

export interface College {
  id: string;
  name: string;
  logo: string | null;
  domain: string;
  description: string | null;
  status: CollegeStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  profile_photo: string | null;
  cover_photo: string | null;
  college_id: string | null;
  college?: College;
  course: string | null;
  branch: string | null;
  year: string | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  is_verified: boolean;
  phone_verified: boolean;
  onboarding_step: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  college_id: string | null;
  granted_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  actor?: Profile;
  type:
    | 'follow'
    | 'mention'
    | 'like'
    | 'comment'
    | 'event_reminder'
    | 'announcement'
    | 'club_activity'
    | 'team_invite'
    | 'role_change'
    | 'system';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'profile' | 'post' | 'comment' | 'club' | 'event' | 'resource' | 'message';
  target_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}
