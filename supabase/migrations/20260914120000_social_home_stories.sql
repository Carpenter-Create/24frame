-- ============================================================================
-- 20260914120000_social_home_stories.sql
--
-- INTENT: Social Home miss list v1 P0. Lean follows + stories on the live
-- Pack 1–4 / posts.media spine. Completes profiles.follower_count with a
-- person-to-person follow edge. Stories reuse posts.media jsonb +
-- 24frame-media keys (stories/{user}/{object}). Optional posts.category
-- stores Home lens labels only.
--
-- MAPPING C (locked):
--   profiles              optional 24Frame audience/person row
--   follows / stories /
--   story_views           FK to profiles.id
--   no org_id             Social is not catalog-tenant-isolated
--   do not wire           is_gc_staff as a privilege bridge
--
-- CREATE (if absent): follows, stories, story_views;
-- ALTER posts add category (nullable, locked labels);
-- RLS + grants. No DELETE of org-owned rows. Status changes only.
--
-- OMIT: Supabase Storage. Title S3. AWS_* / FINANCE_AWS_* media.
--   Reels. A second feed/graph table. Category lenses on Explore.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TABLE, ALTER TABLE ADD COLUMN, CREATE INDEX, ENABLE RLS,
-- GRANT, CREATE POLICY. Forward-only. CoS applies after merge + Adam yes.
-- ROLLBACK: drop the three new tables and posts.category.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Follows — missing edge for profiles.follower_count. Not a cousin graph.
-- ----------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);

create index if not exists follows_followee_idx
  on public.follows (followee_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 2. Stories — 24h live window, Pack 2 media jsonb, Mapping C to profiles.
-- ----------------------------------------------------------------------------
create table if not exists public.stories (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text,
  media       jsonb not null default '[]'::jsonb,
  status      public.post_status not null default 'active',
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);

create index if not exists stories_author_expires_idx
  on public.stories (author_id, expires_at desc);

create index if not exists stories_live_idx
  on public.stories (expires_at desc)
  where status = 'active';

create table if not exists public.story_views (
  story_id   uuid not null references public.stories(id) on delete cascade,
  viewer_id  uuid not null references public.profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create index if not exists story_views_viewer_idx
  on public.story_views (viewer_id, viewed_at desc);

-- ----------------------------------------------------------------------------
-- 3. Home lens labels on posts. Exact founder-locked strings. Nullable.
-- ----------------------------------------------------------------------------
alter table public.posts
  add column if not exists category text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_category_locked'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_category_locked
      check (
        category is null
        or category in (
          'Acting',
          'AI filmmaking',
          'Animation',
          'Casting',
          'Cinematography',
          'Music',
          'Content creator',
          'Directors',
          'Distribution',
          'Film Festivals',
          'Financing',
          'Post-production',
          'Producers',
          'Screenwriting',
          'Vertical micro dramas'
        )
      );
  end if;
end $$;

create index if not exists posts_category_created_idx
  on public.posts (category, created_at desc)
  where category is not null;

-- ----------------------------------------------------------------------------
-- 4. Mapping C proofs — no org_id, no is_gc_staff privilege bridge
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('follows', 'stories', 'story_views')
      and column_name = 'org_id'
  ) then
    raise exception 'Social Home tables must not have org_id';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 5. RLS
-- ----------------------------------------------------------------------------
alter table public.follows enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;

drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows
  for select to authenticated
  using (
    follower_id = (select auth.uid())
    or followee_id = (select auth.uid())
  );

drop policy if exists follows_insert_self on public.follows;
create policy follows_insert_self on public.follows
  for insert to authenticated
  with check (
    follower_id = (select auth.uid())
    and follower_id <> followee_id
    and public.is_active_profile((select auth.uid()))
    and public.is_active_profile(followee_id)
  );

drop policy if exists follows_delete_self on public.follows;
create policy follows_delete_self on public.follows
  for delete to authenticated
  using (follower_id = (select auth.uid()));

drop policy if exists stories_select on public.stories;
create policy stories_select on public.stories
  for select to authenticated
  using (
    status = 'active'
    and expires_at > now()
    and public.is_active_profile(author_id)
    and (
      author_id = (select auth.uid())
      or exists (
        select 1
        from public.follows f
        where f.follower_id = (select auth.uid())
          and f.followee_id = author_id
      )
    )
  );

drop policy if exists stories_insert_author on public.stories;
create policy stories_insert_author on public.stories
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_active_profile((select auth.uid()))
    and status = 'active'
  );

drop policy if exists stories_update_author on public.stories;
create policy stories_update_author on public.stories
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and public.is_active_profile((select auth.uid()))
  )
  with check (
    author_id = (select auth.uid())
    and status = any (array['active'::public.post_status, 'removed'::public.post_status])
  );

drop policy if exists story_views_select_own on public.story_views;
create policy story_views_select_own on public.story_views
  for select to authenticated
  using (viewer_id = (select auth.uid()));

drop policy if exists story_views_insert_own on public.story_views;
create policy story_views_insert_own on public.story_views
  for insert to authenticated
  with check (
    viewer_id = (select auth.uid())
    and public.is_active_profile((select auth.uid()))
    and exists (
      select 1
      from public.stories s
      where s.id = story_id
        and s.status = 'active'
        and s.expires_at > now()
    )
  );

revoke all on public.follows from anon;
revoke all on public.stories from anon;
revoke all on public.story_views from anon;

grant select, insert, delete on public.follows to authenticated;
grant select, insert, update, delete on public.follows to service_role;

grant select, insert, update on public.stories to authenticated;
grant select, insert, update, delete on public.stories to service_role;

grant select, insert on public.story_views to authenticated;
grant select, insert, update, delete on public.story_views to service_role;

-- ----------------------------------------------------------------------------
-- 6. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_bad_pol text;
begin
  if to_regclass('public.follows') is null
     or to_regclass('public.stories') is null
     or to_regclass('public.story_views') is null then
    raise exception 'Social Home follows/stories tables missing after create';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'posts'
      and column_name = 'category'
  ) then
    raise exception 'posts.category missing after alter';
  end if;

  select pol.polname into v_bad_pol
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('follows', 'stories', 'story_views')
    and pg_get_expr(pol.polqual, pol.polrelid) ilike '%is_gc_staff%'
  limit 1;
  if v_bad_pol is not null then
    raise exception 'Social Home policy % must not call is_gc_staff', v_bad_pol;
  end if;

  raise notice 'social home stories applied; mapping C FKs to profiles; no org_id';
end $$;
