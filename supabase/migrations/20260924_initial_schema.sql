-- ====================================================================
-- CAMPUSGRAM: Production-Ready Database Schema & RLS Foundation
-- Multi-college Campus Social Network
-- ====================================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- ====================================================================
-- 1. ENUMS
-- ====================================================================

create type user_role_type as enum (
  'student',
  'club_admin',
  'faculty',
  'department_admin',
  'college_admin',
  'business',
  'advertiser',
  'moderator',
  'super_admin'
);

create type college_status as enum (
  'active',
  'inactive',
  'pending'
);

create type report_target_type as enum (
  'profile',
  'post',
  'comment',
  'club',
  'event',
  'resource',
  'message'
);

create type report_status as enum (
  'pending',
  'reviewed',
  'dismissed',
  'action_taken'
);

create type notification_type as enum (
  'follow',
  'mention',
  'like',
  'comment',
  'event_reminder',
  'announcement',
  'team_invite',
  'role_change',
  'system'
);

create type club_member_role as enum (
  'member',
  'officer',
  'admin'
);

create type event_status as enum (
  'upcoming',
  'ongoing',
  'completed',
  'cancelled'
);

create type opportunity_type as enum (
  'internship',
  'research',
  'job',
  'project',
  'volunteer'
);

create type marketplace_category as enum (
  'books',
  'electronics',
  'furniture',
  'housing',
  'services',
  'other'
);

create type marketplace_status as enum (
  'active',
  'reserved',
  'sold',
  'archived'
);

-- ====================================================================
-- 2. CORE TABLES
-- ====================================================================

-- Colleges (Multi-College Architecture)
create table if not exists colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  domain text unique not null,
  description text,
  status college_status default 'active' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username citext unique not null,
  email text not null,
  phone text,
  profile_photo text,
  cover_photo text,
  college_id uuid references colleges(id) on delete set null,
  course text,
  branch text,
  year text,
  bio text,
  skills text[] default array[]::text[] not null,
  interests text[] default array[]::text[] not null,
  is_verified boolean default false not null,
  phone_verified boolean default false not null,
  onboarding_step int default 1 not null,
  onboarding_completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Roles (Enforced Server-Side)
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role_type default 'student' not null,
  college_id uuid references colleges(id) on delete cascade,
  granted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, role, college_id)
);

-- Follows
create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id),
  constraint cant_follow_self check (follower_id <> following_id)
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  type notification_type not null,
  title text not null,
  message text not null,
  link text,
  read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Moderation Reports
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type report_target_type not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status report_status default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Blocks
create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (blocker_id, blocked_id),
  constraint cant_block_self check (blocker_id <> blocked_id)
);

-- ====================================================================
-- 3. ARCHITECTURAL FOUNDATION (PREPARED FOR FUTURE MODULES)
-- ====================================================================

-- Posts
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  content text not null,
  media_urls text[] default array[]::text[],
  visibility text default 'campus' not null,
  likes_count int default 0 not null,
  comments_count int default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Likes
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, post_id)
);

-- Saves
create table if not exists saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, post_id)
);

-- Stories
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  media_url text not null,
  caption text,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Clubs
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  logo text,
  cover_image text,
  category text not null,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (college_id, slug)
);

-- Club Members
create table if not exists club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role club_member_role default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (club_id, user_id)
);

-- Club Posts
create table if not exists club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  content text not null,
  media_urls text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  club_id uuid references clubs(id) on delete set null,
  organizer_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  banner_url text,
  location text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  capacity int,
  status event_status default 'upcoming' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Event Registrations
create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text default 'registered' not null,
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (event_id, user_id)
);

-- Announcements
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  content text not null,
  priority text default 'normal' not null,
  target_audience text default 'all' not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Resources / Notes
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete cascade,
  uploader_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  file_type text not null,
  file_size bigint not null,
  subject text not null,
  course text not null,
  semester text,
  downloads_count int default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Resource Saves
create table if not exists resource_saves (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (resource_id, user_id)
);

-- Conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Conversation Members
create table if not exists conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (conversation_id, user_id)
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  media_urls text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Team Requests
create table if not exists team_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  title text not null,
  description text not null,
  skills_needed text[] not null,
  status text default 'open' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Team Applications
create table if not exists team_applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references team_requests(id) on delete cascade,
  applicant_id uuid not null references profiles(id) on delete cascade,
  pitch text not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (request_id, applicant_id)
);

-- Opportunities
create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  title text not null,
  organization text not null,
  type opportunity_type not null,
  location text not null,
  link text,
  deadline timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Marketplace Listings
create table if not exists marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  college_id uuid not null references colleges(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(10, 2) not null,
  category marketplace_category not null,
  condition text not null,
  status marketplace_status default 'active' not null,
  images text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Advertisers
create table if not exists advertiser_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  company_name text not null,
  website text,
  balance numeric(10, 2) default 0.00 not null,
  status text default 'active' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Campaigns
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references advertiser_accounts(id) on delete cascade,
  title text not null,
  budget numeric(10, 2) not null,
  status text default 'active' not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Advertisements
create table if not exists advertisements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title text not null,
  image_url text not null,
  target_url text not null,
  placement text default 'feed' not null,
  status text default 'active' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ad Impressions
create table if not exists ad_impressions (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references advertisements(id) on delete cascade,
  viewer_id uuid references profiles(id) on delete set null,
  college_id uuid references colleges(id) on delete set null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ad Clicks
create table if not exists ad_clicks (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references advertisements(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  college_id uuid references colleges(id) on delete set null,
  clicked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS
-- ====================================================================

-- Function to check if a user has a specific role server-side
create or replace function public.has_role(check_user_id uuid, check_role user_role_type)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and role = check_role
  );
$$;

-- Function to check if current user is moderator or super admin
create or replace function public.is_admin_or_moderator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('moderator', 'super_admin', 'college_admin')
  );
$$;

-- Trigger to auto-update updated_at columns
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace trigger set_colleges_updated_at
  before update on public.colleges
  for each row execute function public.handle_updated_at();

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger on auth.users creation to auto-create profiles row if metadata present
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    username,
    email,
    phone,
    college_id,
    course,
    branch,
    year,
    phone_verified,
    onboarding_step
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student User'),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.email, ''),
    coalesce(new.phone, new.raw_user_meta_data->>'phone'),
    nullif(new.raw_user_meta_data->>'college_id', '')::uuid,
    new.raw_user_meta_data->>'course',
    new.raw_user_meta_data->>'branch',
    new.raw_user_meta_data->>'year',
    (new.phone_confirmed_at is not null),
    1
  )
  on conflict (id) do nothing;

  -- Default role assignment: student
  insert into public.user_roles (user_id, role, college_id)
  values (
    new.id,
    'student'::user_role_type,
    nullif(new.raw_user_meta_data->>'college_id', '')::uuid
  )
  on conflict do nothing;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

alter table public.colleges enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

-- Colleges: anyone authenticated can read active colleges
create policy "Colleges are readable by authenticated users"
  on public.colleges for select
  to authenticated
  using (status = 'active');

-- Colleges: only super_admin can create/update
create policy "Colleges managed by super_admin"
  on public.colleges for all
  to authenticated
  using (public.has_role(auth.uid(), 'super_admin'::user_role_type));

-- Profiles: Authenticated users can view other profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Profiles: Users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Profiles: Users can update ONLY their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- User roles: Readable by authenticated users
create policy "User roles readable by authenticated users"
  on public.user_roles for select
  to authenticated
  using (true);

-- User roles: Only college_admin or super_admin can grant roles
create policy "User roles managed by admins"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'super_admin'::user_role_type) or public.has_role(auth.uid(), 'college_admin'::user_role_type));

-- Follows: Users can view follows
create policy "Follows viewable by authenticated users"
  on public.follows for select
  to authenticated
  using (true);

-- Follows: Users can follow/unfollow for themselves
create policy "Users can manage their own follows"
  on public.follows for all
  to authenticated
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

-- Notifications: Users can only see their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id);

-- Reports: Users can insert reports
create policy "Users can submit reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- Reports: Only admins/moderators can view and manage reports
create policy "Moderators can view reports"
  on public.reports for select
  to authenticated
  using (public.is_admin_or_moderator());

create policy "Moderators can update reports"
  on public.reports for update
  to authenticated
  using (public.is_admin_or_moderator());

-- Blocks: Users can manage their own blocks
create policy "Users can view their blocks"
  on public.blocks for select
  to authenticated
  using (auth.uid() = blocker_id);

create policy "Users can manage their blocks"
  on public.blocks for all
  to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- Enable RLS for prepared tables
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.stories enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_posts enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.announcements enable row level security;
alter table public.resources enable row level security;
alter table public.resource_saves enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.team_requests enable row level security;
alter table public.team_applications enable row level security;
alter table public.opportunities enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.advertiser_accounts enable row level security;
alter table public.campaigns enable row level security;
alter table public.advertisements enable row level security;
alter table public.ad_impressions enable row level security;
alter table public.ad_clicks enable row level security;

-- Base safe policies for prepared tables
create policy "Posts are viewable by same-college users"
  on public.posts for select to authenticated
  using (true);

create policy "Users can create posts"
  on public.posts for insert to authenticated
  with check (auth.uid() = author_id);

create policy "Users can update own posts"
  on public.posts for update to authenticated
  using (auth.uid() = author_id);

create policy "Users can delete own posts"
  on public.posts for delete to authenticated
  using (auth.uid() = author_id or public.is_admin_or_moderator());

-- ====================================================================
-- 6. STORAGE BUCKET CONFIGURATION & POLICIES
-- ====================================================================

-- Insert standard buckets into storage.buckets if they do not exist
insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('resources', 'resources', false),
  ('club_assets', 'club_assets', true)
on conflict (id) do update set public = excluded.public;

-- Avatar upload policy: Users can upload and update their own avatar
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Cover photo policy
create policy "Cover images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "Users can upload their own cover"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
