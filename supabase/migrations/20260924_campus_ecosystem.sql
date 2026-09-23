-- ====================================================================
-- CAMPUSGRAM: Campus Ecosystem Migration
-- Covers Event Check-ins, Official Announcements, Notes & Resources verification,
-- Team Requests, Marketplace listings, Fast Search Indexes & RLS
-- ====================================================================

-- 1. EVENT CHECK-INS (Duplicate prevention architecture)
create table if not exists public.event_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  checkin_token text not null,
  checked_in_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (event_id, student_id)
);

-- 2. ENHANCE ANNOUNCEMENTS
alter table if exists public.announcements
  add column if not exists image_url text,
  add column if not exists club_id uuid references public.clubs(id) on delete set null,
  add column if not exists author_role text default 'Verified Campus Official';

-- 3. ENHANCE RESOURCES (NOTES)
alter table if exists public.resources
  add column if not exists verification_status text default 'student_uploaded' not null,
  add column if not exists verified_by uuid references public.profiles(id) on delete set null;

-- 4. ENHANCE TEAM REQUESTS
alter table if exists public.team_requests
  add column if not exists people_needed int default 1 not null,
  add column if not exists deadline timestamp with time zone,
  add column if not exists project_type text default 'Hackathon';

-- 5. ENHANCE MARKETPLACE LISTINGS
alter table if exists public.marketplace_listings
  add column if not exists is_sold boolean default false not null,
  add column if not exists contact_count int default 0 not null;

-- 6. SEARCH INDEXES FOR HIGH-SPEED CAMPUS SEARCH
create index if not exists idx_clubs_name on public.clubs using gin(to_tsvector('english', name || ' ' || category));
create index if not exists idx_events_title on public.events using gin(to_tsvector('english', title || ' ' || location));
create index if not exists idx_announcements_title on public.announcements using gin(to_tsvector('english', title || ' ' || content));
create index if not exists idx_resources_search on public.resources using gin(to_tsvector('english', title || ' ' || subject || ' ' || course));
create index if not exists idx_opportunities_search on public.opportunities using gin(to_tsvector('english', title || ' ' || organization));
create index if not exists idx_marketplace_search on public.marketplace_listings using gin(to_tsvector('english', title || ' ' || category));

-- 7. ROW LEVEL SECURITY (RLS) POLICIES FOR CAMPUS ECOSYSTEM

-- Enable RLS
alter table public.event_checkins enable row level security;

-- Event Check-ins
create policy "Check-ins viewable by event organizers or student"
  on public.event_checkins for select to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.events
      where events.id = event_checkins.event_id and events.organizer_id = auth.uid()
    )
    or public.is_admin_or_moderator()
  );

create policy "Students can check in with valid token"
  on public.event_checkins for insert to authenticated
  with check (student_id = auth.uid());

-- Clubs
drop policy if exists "Clubs viewable by campus users" on public.clubs;
create policy "Clubs viewable by campus users"
  on public.clubs for select to authenticated
  using (true);

drop policy if exists "Authenticated users can register clubs" on public.clubs;
create policy "Authenticated users can register clubs"
  on public.clubs for insert to authenticated
  with check (auth.uid() = created_by);

-- Club Members
drop policy if exists "Club members viewable by authenticated users" on public.club_members;
create policy "Club members viewable by authenticated users"
  on public.club_members for select to authenticated
  using (true);

drop policy if exists "Users can join or leave clubs" on public.club_members;
create policy "Users can join or leave clubs"
  on public.club_members for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Events
drop policy if exists "Events viewable by campus users" on public.events;
create policy "Events viewable by campus users"
  on public.events for select to authenticated
  using (true);

drop policy if exists "Users can host events" on public.events;
create policy "Users can host events"
  on public.events for insert to authenticated
  with check (auth.uid() = organizer_id);

-- Event Registrations
drop policy if exists "Event registrations viewable by authenticated" on public.event_registrations;
create policy "Event registrations viewable by authenticated"
  on public.event_registrations for select to authenticated
  using (true);

drop policy if exists "Users can manage own event registration" on public.event_registrations;
create policy "Users can manage own event registration"
  on public.event_registrations for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Announcements
drop policy if exists "Announcements viewable by campus users" on public.announcements;
create policy "Announcements viewable by campus users"
  on public.announcements for select to authenticated
  using (true);

drop policy if exists "Authorized officials can create announcements" on public.announcements;
create policy "Authorized officials can create announcements"
  on public.announcements for insert to authenticated
  with check (
    auth.uid() = author_id
    and (
      public.is_admin_or_moderator()
      or public.has_role(auth.uid(), 'faculty'::user_role_type)
      or public.has_role(auth.uid(), 'club_admin'::user_role_type)
      or public.has_role(auth.uid(), 'department_admin'::user_role_type)
      or public.has_role(auth.uid(), 'college_admin'::user_role_type)
    )
  );

-- Resources
drop policy if exists "Resources viewable by campus users" on public.resources;
create policy "Resources viewable by campus users"
  on public.resources for select to authenticated
  using (true);

drop policy if exists "Students can upload resources" on public.resources;
create policy "Students can upload resources"
  on public.resources for insert to authenticated
  with check (auth.uid() = uploader_id);

-- Team Requests
drop policy if exists "Team requests viewable by campus users" on public.team_requests;
create policy "Team requests viewable by campus users"
  on public.team_requests for select to authenticated
  using (true);

drop policy if exists "Users can create team requests" on public.team_requests;
create policy "Users can create team requests"
  on public.team_requests for insert to authenticated
  with check (auth.uid() = creator_id);

-- Marketplace Listings
drop policy if exists "Marketplace listings viewable by campus users" on public.marketplace_listings;
create policy "Marketplace listings viewable by campus users"
  on public.marketplace_listings for select to authenticated
  using (true);

drop policy if exists "Users can manage own marketplace listings" on public.marketplace_listings;
create policy "Users can manage own marketplace listings"
  on public.marketplace_listings for all to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);
