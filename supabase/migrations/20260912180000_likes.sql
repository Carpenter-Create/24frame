-- ============================================================================
-- 20260912180000_likes.sql
--
-- INTENT: Phase 1B Pack 3. Port the 24Frame likes slice onto this dashboard
-- as a NEW forward-only migration. Source of truth was live 24Frame project
-- qxribdfzkvffambaartp (migration version 20260910131540, name likes),
-- adapted from donor file supabase/migrations/20260910180000_likes.sql —
-- not pasted blindly. Survivor project is uevsculwzwlhxeamagwg. Do not apply
-- this file to production from this PR.
--
-- MAPPING C (locked, unchanged from Packs 1–2):
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   likes.user_id         FK to profiles.id
--   no org_id             on likes
--   a user without an     active profile cannot like
--   org membership is     not required to like a visible post
--   do not wire           is_gc_staff into these social policies as a
--                         privilege bridge
--   self-likes            allowed; they bump like_count and insert no
--                         point_event
--   unlike                removes the matching point_event
--   gamification_enabled  suppresses point_events only
--
-- CREATE (if absent): like_target enum; likes table + likes_target_idx;
-- REPLACE protect_profile_privileged_columns, refresh_profile_points,
-- protect_post_privileged_columns (session-flag bypasses);
-- CREATE OR REPLACE refresh_like_engagement; trigger
-- likes_refresh_engagement; RLS (authenticated only, fail-closed).
--
-- GUC adaptation: donor `24frame.refreshing_profile_points` /
-- `24frame.refreshing_post_like_count` start with a digit and 42602 on
-- set_config. This file uses `app.refreshing_profile_points` (Pack 1
-- functions are replaced to match) and keeps Pack 2's
-- `app.refreshing_post_like_count`.
--
-- OMIT:
--   donor org_status entirely. Dashboard org_status stays
--   registered|awaiting_payment|active|payment_lapsed|closed.
--   blocks / conversations / conversation_participants / messages (Pack 4).
--   leaderboards (#16 HOLD). Social workspace UI/nav/routes.
--   Auth user cutover. media/S3. GitHub rename.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TYPE (new name only), CREATE TABLE, CREATE FUNCTION, CREATE
-- TRIGGER, ENABLE RLS, GRANT, CREATE POLICY. No DROP of existing dashboard
-- objects. Forward-only.
-- ROLLBACK: drop public.likes, public.refresh_like_engagement, enum
-- like_target; restore Pack 1/2 function bodies if this REPLACE is reversed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enum required by LIVE Pack 3 table.
--    Pack 1 did not create like_target. Do not invent extra labels.
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.like_target as enum ('post', 'comment');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Table
-- ----------------------------------------------------------------------------
create table if not exists public.likes (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  target_type  public.like_target not null,
  target_id    uuid not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

-- Mapping C: no org_id. user_id FK is person/social, not catalog.
-- ON DELETE CASCADE here is donor personal-content cleanup
-- (auth.users → profiles → likes), not org-owned catalog rows.

create index if not exists likes_target_idx
  on public.likes (target_type, target_id);

-- ----------------------------------------------------------------------------
-- 3. Functions + trigger
--    Session-flag bypass so the engagement loop can write
--    profiles.points_total/level and posts.like_count.
--    Do not call is_gc_staff.
-- ----------------------------------------------------------------------------

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
-- extensions must stay on the path: embedding is vector(1536) and
-- `IS DISTINCT FROM` needs extensions.= . public-only search_path 42883s.
set search_path to 'public', 'extensions'
as $$
begin
  -- Session flag for the engagement loop. Custom GUC must use app.*, not a
  -- digit-leading schema name (set_config 42602).
  if current_setting('app.refreshing_profile_points', true) = 'on' then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.points_total is distinct from old.points_total
     or new.level is distinct from old.level
     or new.app_role is distinct from old.app_role
     or new.trust_state is distinct from old.trust_state
     or new.email_verified_at is distinct from old.email_verified_at
     or new.is_high_fanout is distinct from old.is_high_fanout
     or new.follower_count is distinct from old.follower_count
     or new.status is distinct from old.status
     or new.deactivated_at is distinct from old.deactivated_at
     or new.deletion_requested_at is distinct from old.deletion_requested_at
     or new.deletion_due_at is distinct from old.deletion_due_at
     or new.erased_at is distinct from old.erased_at
     or new.legal_hold is distinct from old.legal_hold
     or new.embedding is distinct from old.embedding
  then
    raise exception 'privileged profile columns are not client-writable';
  end if;

  return new;
end;
$$;

create or replace function public.refresh_profile_points()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  target_user uuid;
  total integer;
  derived_level integer;
begin
  perform set_config('app.refreshing_profile_points', 'on', true);
  target_user := coalesce(new.user_id, old.user_id);

  select coalesce(sum(pe.delta), 0)
    into total
  from public.point_events pe
  where pe.user_id = target_user;

  select l.level
    into derived_level
  from public.levels l
  where l.min_points <= total
  order by l.level desc
  limit 1;

  update public.profiles
  set
    points_total = total,
    level = coalesce(derived_level, 1)
  where id = target_user;

  if tg_op = 'UPDATE'
     and old.user_id is distinct from new.user_id then
    select coalesce(sum(pe.delta), 0)
      into total
    from public.point_events pe
    where pe.user_id = old.user_id;

    select l.level
      into derived_level
    from public.levels l
    where l.min_points <= total
    order by l.level desc
    limit 1;

    update public.profiles
    set
      points_total = total,
      level = coalesce(derived_level, 1)
    where id = old.user_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.protect_post_privileged_columns()
returns trigger
language plpgsql
-- extensions must stay on the path: embedding is vector(1536) and
-- `IS DISTINCT FROM` needs extensions.= . public-only search_path 42883s.
set search_path to 'public', 'extensions'
as $$
begin
  -- Pack 2 already adapted this GUC. Keep app.refreshing_post_like_count.
  if current_setting('app.refreshing_post_like_count', true) = 'on' then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.like_count <> 0
       or new.comment_count <> 0
       or new.embedding is not null then
      raise exception 'privileged post columns are not client-writable';
    end if;
    return new;
  end if;

  if new.like_count is distinct from old.like_count
     or new.comment_count is distinct from old.comment_count
     or new.embedding is distinct from old.embedding then
    raise exception 'privileged post columns are not client-writable';
  end if;

  return new;
end;
$$;

create or replace function public.refresh_like_engagement()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  author uuid;
  gamification boolean;
  target public.like_target;
  target_row uuid;
  actor uuid;
begin
  perform set_config('app.refreshing_post_like_count', 'on', true);

  if tg_op = 'INSERT' then
    target := new.target_type;
    target_row := new.target_id;
    actor := new.user_id;
  else
    target := old.target_type;
    target_row := old.target_id;
    actor := old.user_id;
  end if;

  if target <> 'post' then
    raise exception 'comment likes are not in this slice';
  end if;

  if tg_op = 'INSERT' then
    update public.posts
    set like_count = like_count + 1
    where id = target_row;

    if not found then
      raise exception 'like target post does not exist';
    end if;
  else
    update public.posts
    set like_count = greatest(like_count - 1, 0)
    where id = target_row;
  end if;

  select p.author_id into author
  from public.posts p
  where p.id = target_row;

  if tg_op = 'INSERT' then
    if author is not null and author <> actor then
      select coalesce(
        (select s.gamification_enabled from public.app_settings s where s.id),
        true
      )
        into gamification;

      if gamification then
        insert into public.point_events (
          user_id,
          delta,
          reason,
          source_type,
          source_id,
          actor_id
        ) values (
          author,
          1,
          'post_liked',
          'post',
          target_row,
          actor
        )
        on conflict (user_id, reason, source_type, source_id, actor_id)
        do nothing;
      end if;
    end if;

    return new;
  end if;

  delete from public.point_events
  where reason = 'post_liked'
    and source_type = 'post'
    and source_id = target_row
    and actor_id = actor
    and (author is null or user_id = author);

  return old;
end;
$$;

drop trigger if exists likes_refresh_engagement on public.likes;
create trigger likes_refresh_engagement
  after insert or delete on public.likes
  for each row execute function public.refresh_like_engagement();

-- Trigger functions: EXECUTE is checked at CREATE TRIGGER, not at fire.
revoke execute on function public.protect_profile_privileged_columns()
  from public, anon, authenticated, service_role;
revoke execute on function public.refresh_profile_points()
  from public, anon, authenticated, service_role;
revoke execute on function public.protect_post_privileged_columns()
  from public, anon, authenticated, service_role;
revoke execute on function public.refresh_like_engagement()
  from public, anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. RLS
--    Authenticated only, fail-closed. No UPDATE policy. Do not mention
--    is_gc_staff. anon gets no table grants (dashboard convention).
-- ----------------------------------------------------------------------------
alter table public.likes enable row level security;

drop policy if exists likes_select_self on public.likes;
create policy likes_select_self on public.likes
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists likes_insert_self on public.likes;
create policy likes_insert_self on public.likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_active_profile((select auth.uid()))
    and target_type = 'post'
    and exists (
      select 1
      from public.posts p
      where p.id = likes.target_id
    )
  );

drop policy if exists likes_delete_self on public.likes;
create policy likes_delete_self on public.likes
  for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.likes from public, anon;
revoke update, truncate on public.likes from authenticated;
grant select, insert, delete on public.likes to authenticated;
grant select, insert, delete on public.likes to service_role;

-- ----------------------------------------------------------------------------
-- 5. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
  v_org_status text[];
  v_like_target text[];
  v_bad_pol text;
  v_collide text;
  v_guc text;
begin
  if to_regclass('public.likes') is null then
    raise exception 'Pack 3 likes table missing after create';
  end if;

  if to_regclass('public.blocks') is not null
     or to_regclass('public.conversations') is not null
     or to_regclass('public.conversation_participants') is not null
     or to_regclass('public.messages') is not null then
    raise exception 'Pack 4 DM tables must not be created in Pack 3';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'likes'
      and column_name = 'org_id'
  ) then
    raise exception 'likes must not have org_id (mapping C)';
  end if;

  select array_agg(e.enumlabel::text order by e.enumsortorder) into v_like_target
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'like_target';

  if v_like_target is distinct from array['post','comment']::text[] then
    raise exception 'like_target enum mutated: %', v_like_target;
  end if;

  select array_agg(e.enumlabel::text order by e.enumsortorder) into v_org_status
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'org_status';

  if v_org_status is distinct from
     array['registered','awaiting_payment','active','payment_lapsed','closed']::text[]
  then
    raise exception 'org_status enum mutated: %', v_org_status;
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'member_can'
      and pg_get_function_identity_arguments(p.oid) = 'p_uid uuid, p_org uuid, p_capability text'
  ) then
    raise exception 'member_can signature missing or overwritten';
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'refresh_like_engagement'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    raise exception 'refresh_like_engagement missing';
  end if;

  if exists (
    select 1 from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'likes'
      and pol.polcmd = 'w'
  ) then
    raise exception 'likes must have no UPDATE policy';
  end if;

  select string_agg(pol.polname, ', ' order by pol.polname) into v_bad_pol
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'likes'
    and (
      coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
      or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
    );
  if v_bad_pol is not null then
    raise exception 'Pack 3 policies must not call is_gc_staff: %', v_bad_pol;
  end if;

  select string_agg(p.proname, ', ') into v_collide
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('member_can', 'gc_can', 'is_gc_staff')
    and (
      p.prosrc ilike '%refresh_like_engagement%'
      or p.prosrc ilike '%like_target%'
    );
  if v_collide is not null then
    raise exception 'catalog auth functions were rewritten to call Pack 3 helpers: %', v_collide;
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_guc
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'protect_profile_privileged_columns',
      'refresh_profile_points',
      'protect_post_privileged_columns',
      'refresh_like_engagement'
    )
    and (
      p.prosrc like '%set_config(''24frame.%'
      or p.prosrc like '%current_setting(''24frame.%'
    );
  if v_guc is not null then
    raise exception 'replaced functions still use 24frame.* GUCs: %', v_guc;
  end if;

  if not has_table_privilege('authenticated', 'public.likes', 'SELECT')
     or not has_table_privilege('authenticated', 'public.likes', 'INSERT')
     or not has_table_privilege('authenticated', 'public.likes', 'DELETE') then
    raise exception 'likes not readable/insertable/deletable by authenticated';
  end if;

  if has_table_privilege('authenticated', 'public.likes', 'UPDATE') then
    raise exception 'likes must not grant UPDATE to authenticated';
  end if;

  select string_agg(c.relname, ', ' order by c.relname) into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname = 'likes'
    and not has_table_privilege('authenticated', c.oid, 'SELECT');
  if v_missing is not null then
    raise exception 'Pack 3 tables not readable by authenticated: %', v_missing;
  end if;

  raise notice 'likes applied; mapping C FK to profiles; org_status unchanged';
end $$;
