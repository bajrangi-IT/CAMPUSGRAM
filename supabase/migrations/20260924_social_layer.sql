-- ====================================================================
-- CAMPUSGRAM: Social Networking Layer Migration
-- Enhances posts, comments, likes, saves, stories, conversations, and messages
-- Configures Supabase Realtime & RLS Policies
-- ====================================================================

-- 1. ENHANCE POSTS
alter table if exists public.posts
  add column if not exists link_url text,
  add column if not exists link_title text;

-- 2. ENHANCE CONVERSATIONS
alter table if exists public.conversations
  add column if not exists title text,
  add column if not exists is_group boolean default false not null,
  add column if not exists group_avatar text,
  add column if not exists group_type text default 'direct' not null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- 3. ENHANCE MESSAGES
alter table if exists public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null,
  add column if not exists reactions jsonb default '{}'::jsonb not null,
  add column if not exists file_url text,
  add column if not exists file_name text;

-- 4. RLS POLICIES FOR POSTS, LIKES, SAVES, COMMENTS
-- Posts
drop policy if exists "Posts are viewable by same-college users" on public.posts;
create policy "Posts are viewable by campus users"
  on public.posts for select to authenticated
  using (
    -- Exclude posts from blocked users
    not exists (
      select 1 from public.blocks
      where (blocker_id = auth.uid() and blocked_id = posts.author_id)
         or (blocker_id = posts.author_id and blocked_id = auth.uid())
    )
  );

drop policy if exists "Users can create posts" on public.posts;
create policy "Users can create posts"
  on public.posts for insert to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts"
  on public.posts for update to authenticated
  using (auth.uid() = author_id);

drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts"
  on public.posts for delete to authenticated
  using (auth.uid() = author_id or public.is_admin_or_moderator());

-- Likes
drop policy if exists "Likes are viewable by authenticated users" on public.likes;
create policy "Likes are viewable by authenticated users"
  on public.likes for select to authenticated
  using (true);

drop policy if exists "Users can manage own likes" on public.likes;
create policy "Users can manage own likes"
  on public.likes for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Saves
drop policy if exists "Users can view own saves" on public.saves;
create policy "Users can view own saves"
  on public.saves for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can manage own saves" on public.saves;
create policy "Users can manage own saves"
  on public.saves for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Comments
drop policy if exists "Comments are viewable by authenticated users" on public.comments;
create policy "Comments are viewable by authenticated users"
  on public.comments for select to authenticated
  using (
    not exists (
      select 1 from public.blocks
      where (blocker_id = auth.uid() and blocked_id = comments.author_id)
         or (blocker_id = comments.author_id and blocked_id = auth.uid())
    )
  );

drop policy if exists "Users can create comments" on public.comments;
create policy "Users can create comments"
  on public.comments for insert to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments"
  on public.comments for delete to authenticated
  using (auth.uid() = author_id or public.is_admin_or_moderator());

-- Stories (Lightweight 24h stories)
drop policy if exists "Stories viewable by campus users" on public.stories;
create policy "Stories viewable by campus users"
  on public.stories for select to authenticated
  using (
    expires_at > timezone('utc'::text, now())
    and not exists (
      select 1 from public.blocks
      where (blocker_id = auth.uid() and blocked_id = stories.author_id)
         or (blocker_id = stories.author_id and blocked_id = auth.uid())
    )
  );

drop policy if exists "Users can manage own stories" on public.stories;
create policy "Users can manage own stories"
  on public.stories for all to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Conversations & Members
drop policy if exists "Users can view conversations they belong to" on public.conversations;
create policy "Users can view conversations they belong to"
  on public.conversations for select to authenticated
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_members.conversation_id = conversations.id
        and conversation_members.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create conversations" on public.conversations;
create policy "Users can create conversations"
  on public.conversations for insert to authenticated
  with check (true);

drop policy if exists "Users can view conversation members" on public.conversation_members;
create policy "Users can view conversation members"
  on public.conversation_members for select to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can join/manage conversation members" on public.conversation_members;
create policy "Users can join/manage conversation members"
  on public.conversation_members for all to authenticated
  using (true)
  with check (true);

-- Messages
drop policy if exists "Users can view messages in their conversations" on public.messages;
create policy "Users can view messages in their conversations"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_members.conversation_id = messages.conversation_id
        and conversation_members.user_id = auth.uid()
    )
  );

drop policy if exists "Users can send messages to their conversations" on public.messages;
create policy "Users can send messages to their conversations"
  on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_members
      where conversation_members.conversation_id = messages.conversation_id
        and conversation_members.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own messages" on public.messages;
create policy "Users can delete own messages"
  on public.messages for delete to authenticated
  using (auth.uid() = sender_id);

drop policy if exists "Users can update own messages" on public.messages;
create policy "Users can update own messages"
  on public.messages for update to authenticated
  using (
    exists (
      select 1 from public.conversation_members
      where conversation_members.conversation_id = messages.conversation_id
        and conversation_members.user_id = auth.uid()
    )
  );

-- 5. SUPABASE REALTIME REPLICATION (IF ENABLED IN SUPABASE INSTANCE)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
    alter publication supabase_realtime add table public.notifications;
    alter publication supabase_realtime add table public.comments;
    alter publication supabase_realtime add table public.likes;
  end if;
exception
  when others then null;
end $$;
