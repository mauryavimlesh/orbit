-- ORBIT: production data foundation for Assistant, Community and Knowledge Library.
-- Target: Supabase-managed PostgreSQL + Supabase Auth. Apply through a reviewed migration.
-- This migration intentionally does NOT import or expose the legacy shared SQLite records.
-- All user-owned tables use RLS; the client must use the PUBLIC anon key, never service_role.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  source_type text not null check (source_type in ('paper','repository','article','video','other')),
  source_id text not null check (char_length(source_id) between 1 and 350),
  title text not null check (char_length(title) between 1 and 500),
  url text check (char_length(url) <= 2048),
  metadata jsonb not null default '{}'::jsonb,
  personal_note text not null default '' check (char_length(personal_note) <= 20000),
  saved_at timestamptz not null default now(),
  unique(owner_id, source_type, source_id)
);
create index if not exists library_owner_recent on public.library_items(owner_id, saved_at desc);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 1 and 140),
  description text not null default '' check (char_length(description) <= 2000),
  visibility text not null default 'private' check (visibility in ('private','public','unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists collections_owner on public.collections(owner_id, updated_at desc);
create index if not exists collections_public on public.collections(updated_at desc) where visibility = 'public';

-- Store collection references by stable source identifiers, so shared collections
-- never inadvertently expose private library notes/annotations.
create table if not exists public.collection_entries (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  source_type text not null check (source_type in ('paper','repository','article','video','other')),
  source_id text not null check (char_length(source_id) between 1 and 350),
  title text not null check (char_length(title) between 1 and 500),
  source_url text check (char_length(source_url) <= 2048),
  description text not null default '' check (char_length(description) <= 1000),
  position integer not null default 0 check (position >= 0),
  added_at timestamptz not null default now(),
  unique(collection_id, source_type, source_id)
);
create index if not exists collection_entries_order on public.collection_entries(collection_id, position, added_at);

create table if not exists public.mastery_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  concept_id text not null check (char_length(concept_id) between 1 and 350),
  concept_title text not null check (char_length(concept_title) between 1 and 350),
  level integer not null default 0 check (level between 0 and 5),
  confidence integer not null default 0 check (confidence between 0 and 100),
  review_due_at timestamptz,
  last_reviewed_at timestamptz,
  evidence jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique(owner_id, concept_id)
);
create index if not exists mastery_due on public.mastery_records(owner_id, review_due_at);

create table if not exists public.assistant_threads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null default 'New learning conversation' check (char_length(title) <= 200),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assistant_threads_owner on public.assistant_threads(owner_id, updated_at desc);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.assistant_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  body text not null check (char_length(body) between 1 and 20000),
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists assistant_messages_thread on public.assistant_messages(thread_id, created_at);

create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 5 and 200),
  body text not null check (char_length(body) between 10 and 20000),
  source_url text check (char_length(source_url) <= 2048),
  topic text not null default 'general' check (char_length(topic) <= 80),
  status text not null default 'published' check (status in ('published','hidden','locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists discussions_feed on public.discussions(created_at desc) where status='published';
create index if not exists discussions_topic_feed on public.discussions(topic, created_at desc) where status='published';

create table if not exists public.discussion_comments (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  parent_id uuid references public.discussion_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists discussion_comments_thread on public.discussion_comments(discussion_id, created_at);

create table if not exists public.discussion_reactions (
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  reaction text not null default 'like' check (reaction in ('like','insightful')),
  created_at timestamptz not null default now(),
  primary key(discussion_id, user_id, reaction)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 5 and 180),
  description text not null check (char_length(description) between 10 and 5000),
  topic text not null check (char_length(topic) between 1 and 80),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  visibility text not null default 'public' check (visibility in ('public','unlisted')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists challenges_upcoming on public.challenges(starts_at, ends_at);

create table if not exists public.challenge_members (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  joined_at timestamptz not null default now(),
  progress integer not null default 0 check (progress between 0 and 100),
  primary key(challenge_id, user_id)
);

-- Reports are write-only for ordinary users; moderators use server-side privileged actions.
create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  target_type text not null check (target_type in ('discussion','comment','collection','profile')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 10 and 1000),
  created_at timestamptz not null default now()
);

-- RLS is mandatory and applies even if clients access PostgREST directly.
alter table public.profiles enable row level security;
alter table public.library_items enable row level security;
alter table public.collections enable row level security;
alter table public.collection_entries enable row level security;
alter table public.mastery_records enable row level security;
alter table public.assistant_threads enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_comments enable row level security;
alter table public.discussion_reactions enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.moderation_reports enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_insert on public.profiles for insert to authenticated with check (id=auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

create policy library_select on public.library_items for select to authenticated using (owner_id=auth.uid());
create policy library_insert on public.library_items for insert to authenticated with check (owner_id=auth.uid());
create policy library_update on public.library_items for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy library_delete on public.library_items for delete to authenticated using (owner_id=auth.uid());

create policy collections_read on public.collections for select to authenticated using (owner_id=auth.uid() or visibility in ('public','unlisted'));
create policy collections_insert on public.collections for insert to authenticated with check (owner_id=auth.uid());
create policy collections_update on public.collections for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy collections_delete on public.collections for delete to authenticated using (owner_id=auth.uid());

create policy entries_read on public.collection_entries for select to authenticated using (
  exists (select 1 from public.collections c where c.id=collection_id and (c.owner_id=auth.uid() or c.visibility in ('public','unlisted')))
);
create policy entries_insert on public.collection_entries for insert to authenticated with check (
  exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=auth.uid())
);
create policy entries_update on public.collection_entries for update to authenticated using (
  exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=auth.uid())
) with check (
  exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=auth.uid())
);
create policy entries_delete on public.collection_entries for delete to authenticated using (
  exists (select 1 from public.collections c where c.id=collection_id and c.owner_id=auth.uid())
);

create policy mastery_select on public.mastery_records for select to authenticated using (owner_id=auth.uid());
create policy mastery_insert on public.mastery_records for insert to authenticated with check (owner_id=auth.uid());
create policy mastery_update on public.mastery_records for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy mastery_delete on public.mastery_records for delete to authenticated using (owner_id=auth.uid());

create policy threads_select on public.assistant_threads for select to authenticated using (owner_id=auth.uid());
create policy threads_insert on public.assistant_threads for insert to authenticated with check (owner_id=auth.uid());
create policy threads_update on public.assistant_threads for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy threads_delete on public.assistant_threads for delete to authenticated using (owner_id=auth.uid());

create policy messages_select on public.assistant_messages for select to authenticated using (
  exists (select 1 from public.assistant_threads t where t.id=thread_id and t.owner_id=auth.uid())
);
-- Assistant messages must be written by a trusted backend, not forged by a client.
create policy messages_insert_user on public.assistant_messages for insert to authenticated with check (
  role='user' and exists (select 1 from public.assistant_threads t where t.id=thread_id and t.owner_id=auth.uid())
);

create policy discussions_select on public.discussions for select to authenticated using (status='published' or author_id=auth.uid());
create policy discussions_insert on public.discussions for insert to authenticated with check (author_id=auth.uid() and status='published');
create policy discussions_update on public.discussions for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid() and status='published');
create policy discussions_delete on public.discussions for delete to authenticated using (author_id=auth.uid());

create policy comments_select on public.discussion_comments for select to authenticated using (
  (status='published' or author_id=auth.uid()) and
  exists(select 1 from public.discussions d where d.id=discussion_id and (d.status='published' or d.author_id=auth.uid()))
);
create policy comments_insert on public.discussion_comments for insert to authenticated with check (
  author_id=auth.uid() and status='published' and
  exists(select 1 from public.discussions d where d.id=discussion_id and d.status='published')
);
create policy comments_update on public.discussion_comments for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid() and status='published');
create policy comments_delete on public.discussion_comments for delete to authenticated using (author_id=auth.uid());

create policy reactions_select on public.discussion_reactions for select to authenticated using (
  exists(select 1 from public.discussions d where d.id=discussion_id and d.status='published')
);
create policy reactions_insert on public.discussion_reactions for insert to authenticated with check (
  user_id=auth.uid() and exists(select 1 from public.discussions d where d.id=discussion_id and d.status='published')
);
create policy reactions_delete on public.discussion_reactions for delete to authenticated using (user_id=auth.uid());

create policy challenges_select on public.challenges for select to authenticated using (true);
create policy challenges_insert on public.challenges for insert to authenticated with check (creator_id=auth.uid());
create policy challenges_update on public.challenges for update to authenticated using (creator_id=auth.uid()) with check (creator_id=auth.uid());
create policy challenges_delete on public.challenges for delete to authenticated using (creator_id=auth.uid());
create policy challenge_members_select on public.challenge_members for select to authenticated using (true);
create policy challenge_members_insert on public.challenge_members for insert to authenticated with check (user_id=auth.uid());
create policy challenge_members_update on public.challenge_members for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy challenge_members_delete on public.challenge_members for delete to authenticated using (user_id=auth.uid());
create policy reports_insert on public.moderation_reports for insert to authenticated with check (reporter_id=auth.uid());

-- Profiles may be publicly readable to signed-in members, but private user data
-- (email, notes, messages, mastery) lives outside this table.
-- Enforcement to add before launch: API rate limits, abuse filters, moderation
-- service role, bounded pagination, signed auth checks, storage migrations and E2E RLS tests.
