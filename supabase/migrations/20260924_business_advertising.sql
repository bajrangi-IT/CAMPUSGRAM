-- ==============================================================================
-- Campus Business & Advertising Ecosystem Migration
-- ==============================================================================

-- 1. Enhance Advertiser Accounts
alter table if exists public.advertiser_accounts
  add column if not exists business_name text,
  add column if not exists logo_url text,
  add column if not exists description text,
  add column if not exists category text default 'Local Business',
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists college_id uuid references public.colleges(id) on delete set null,
  add column if not exists verification_status text default 'pending' check (verification_status in ('pending', 'verified', 'rejected', 'suspended'));

-- Ensure company_name backwards-compatibility
update public.advertiser_accounts 
set business_name = company_name 
where business_name is null and company_name is not null;

-- 2. Enhance Campaigns Table
alter table if exists public.campaigns
  add column if not exists objective text default 'reach' check (objective in ('reach', 'clicks', 'event_registrations', 'offer_claims', 'applications')),
  add column if not exists pricing_model text default 'cpm' check (pricing_model in ('cpm', 'cpc', 'cpa', 'sponsored_placement')),
  add column if not exists bid_amount numeric(10, 2) default 5.00,
  add column if not exists total_budget numeric(10, 2) default 100.00,
  add column if not exists spent_amount numeric(10, 2) default 0.00,
  add column if not exists targeting_criteria jsonb default '{}'::jsonb,
  add column if not exists review_notes text;

-- Update status check constraint if needed
alter table if exists public.campaigns
  drop constraint if exists campaigns_status_check;

alter table if exists public.campaigns
  add constraint campaigns_status_check 
  check (status in ('draft', 'pending_review', 'active', 'paused', 'completed', 'rejected'));

-- 3. Enhance Advertisements (Creatives) Table
alter table if exists public.advertisements
  add column if not exists format text default 'sponsored_post' check (format in ('sponsored_post', 'sponsored_story', 'sponsored_event', 'campus_deal', 'recruitment')),
  add column if not exists headline text,
  add column if not exists description text,
  add column if not exists media_urls text[] default '{}',
  add column if not exists cta_type text default 'learn_more' check (cta_type in ('claim_offer', 'learn_more', 'apply_now', 'register', 'visit_website')),
  add column if not exists destination_url text,
  add column if not exists deal_details jsonb default '{}'::jsonb,
  add column if not exists event_id uuid references public.events(id) on delete set null,
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null;

-- 4. Deal Claims Table (Students claiming coupons/discounts for free)
create table if not exists public.deal_claims (
  id uuid primary key default gen_random_uuid(),
  advertisement_id uuid not null references public.advertisements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  claimed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  claim_code text,
  is_redeemed boolean default false not null,
  unique (advertisement_id, user_id)
);

-- 5. Ad Conversions Table (Anonymous measurable conversions)
create table if not exists public.ad_conversions (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.advertisements(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  conversion_type text not null, -- 'claim', 'registration', 'application'
  occurred_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Enable RLS
alter table public.deal_claims enable row level security;
alter table public.ad_conversions enable row level security;

-- Policies for deal_claims
drop policy if exists "Users can claim deals" on public.deal_claims;
create policy "Users can claim deals"
  on public.deal_claims for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own claims" on public.deal_claims;
create policy "Users can view own claims"
  on public.deal_claims for select
  using (auth.uid() = user_id);

-- Policies for advertiser_accounts
drop policy if exists "Advertisers manage own account" on public.advertiser_accounts;
create policy "Advertisers manage own account"
  on public.advertiser_accounts for all
  using (auth.uid() = user_id);

drop policy if exists "Public view of verified business profile" on public.advertiser_accounts;
create policy "Public view of verified business profile"
  on public.advertiser_accounts for select
  using (true);

-- Policies for campaigns
drop policy if exists "Advertisers manage own campaigns" on public.campaigns;
create policy "Advertisers manage own campaigns"
  on public.campaigns for all
  using (
    advertiser_id in (select id from public.advertiser_accounts where user_id = auth.uid())
  );

-- Policies for advertisements
drop policy if exists "Public can view active approved ads" on public.advertisements;
create policy "Public can view active approved ads"
  on public.advertisements for select
  using (status = 'active');

drop policy if exists "Advertisers manage own ads" on public.advertisements;
create policy "Advertisers manage own ads"
  on public.advertisements for all
  using (
    campaign_id in (
      select c.id from public.campaigns c
      join public.advertiser_accounts a on a.id = c.advertiser_id
      where a.user_id = auth.uid()
    )
  );

-- Indexes for lightning fast targeted delivery
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_advertisements_campaign_id on public.advertisements(campaign_id);
create index if not exists idx_advertisements_format on public.advertisements(format);
create index if not exists idx_deal_claims_user on public.deal_claims(user_id);
