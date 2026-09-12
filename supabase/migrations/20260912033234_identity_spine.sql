-- ============================================================================
-- 20260912033234_identity_spine.sql
--
-- INTENT: Phase 1B Pack 1. Port the 24Frame identity/engagement spine onto this
-- dashboard as a NEW forward-only migration. Source of truth was donor
-- Carpenter-Create/24frame `20260910030000_identity_engagement_spine.sql`,
-- verified against live 24Frame project qxribdfzkvffambaartp (not pasted
-- blindly). Survivor project is uevsculwzwlhxeamagwg. Do not apply this file
-- to production from this PR.
--
-- MAPPING C (locked):
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   one auth.users.id     may be any combination of the three
--   a creator need not    have a catalog org
--   do not auto-create    profiles on org invite or membership insert
--   revoking membership   must not delete a profile
--   do not wire           is_gc_staff into these social policies as a
--                         privilege bridge
--
-- CREATE (if absent): profiles, levels (+seed 1–9), point_events,
-- app_settings (+seed), capabilities (+seed);
-- refresh_profile_points, protect_profile_privileged_columns,
-- member_tier_rank (stub returns 0), has_capability; matching triggers;
-- RLS on all five tables.
--
-- OMIT:
--   donor org_status entirely (donor is active|churned). Dashboard
--   org_status stays registered|awaiting_payment|active|payment_lapsed|closed.
--   unused donor-only types that no LIVE table in this pack needs
--   (FLAG in PR). groups / posts / likes / DMs (Packs 2–4 HOLD).
--   leaderboards. donor notifications / subscriptions tables (dashboard
--   already has different ones). Social workspace UI/nav/routes.
--   Auth user cutover. media/S3. GitHub rename.
--
-- has_capability is NEW and must not replace member_can / gc_can /
-- is_gc_staff. member_tier_rank is a stub (0) until a later pack.
--
-- EXTENSIONS. citext (profiles.handle) and pgcrypto if missing. vector
-- only because live donor profiles.embedding is vector(1536) — verified
-- on qxribdfzkvffambaartp before this file was written. Other spine
-- tables have no vector columns.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE EXTENSION (if missing), CREATE TYPE (new names only), CREATE
-- TABLE, CREATE FUNCTION, CREATE TRIGGER, ENABLE RLS, GRANT. No DROP of
-- existing dashboard objects. Forward-only. ROLLBACK: drop the five new
-- tables, the four new functions, the four new enums; extensions may stay.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions — only if missing; vector only because profiles needs it
-- ----------------------------------------------------------------------------
create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- Verified on live 24Frame (qxribdfzkvffambaartp): profiles.embedding
-- is vector(1536). Other Pack 1 tables do not use vector.
create extension if not exists vector with schema extensions;

-- ----------------------------------------------------------------------------
-- 1. Enums required by LIVE Pack 1 tables only.
--    Do NOT create public.org_status. Do not recreate dashboard org_status.
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('member', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.trust_state as enum ('new', 'verified', 'trusted', 'restricted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum
    ('active', 'deactivated', 'pending_deletion', 'erased');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.point_reason as enum (
    'post_liked',
    'comment_liked',
    'answer_accepted',
    'course_completed',
    'event_attended',
    'streak_milestone',
    'referral',
    'onboarding',
    'manual',
    'post_created'
  );
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  handle                 extensions.citext not null unique,
  display_name           text not null,
  bio                    text,
  avatar_key             text,
  primary_role           text,
  crafts                 text[] not null default '{}',
  location_city          text,
  location_region        text,
  location_country       text,
  markets                text[] not null default '{}',
  timezone               text not null default 'UTC',
  imdb_url               text,
  website_url            text,
  credits                jsonb not null default '[]'::jsonb,
  discoverable           boolean not null default true,
  field_visibility       jsonb not null default '{}'::jsonb,
  app_role               public.app_role not null default 'member',
  birth_date             date not null,
  email_verified_at      timestamptz,
  trust_state            public.trust_state not null default 'new',
  points_total           integer not null default 0,
  level                  integer not null default 1,
  is_high_fanout         boolean not null default false,
  follower_count         integer not null default 0,
  status                 public.account_status not null default 'active',
  deactivated_at         timestamptz,
  deletion_requested_at  timestamptz,
  deletion_due_at        timestamptz,
  erased_at              timestamptz,
  legal_hold             boolean not null default false,
  embedding              extensions.vector(1536),
  last_active_at         timestamptz,
  created_at             timestamptz not null default now(),
  constraint profiles_birth_date_13_plus
    check (birth_date <= (current_date - interval '13 years'))
);

-- Mapping C: no org_id, no FK to organizations/memberships. Catalog membership
-- is a separate fact. ON DELETE CASCADE is auth.users → this person row only
-- (personal PII). It cannot touch org-owned catalog rows.

create index if not exists profiles_birth_date_idx
  on public.profiles (birth_date);
create index if not exists profiles_crafts_gin
  on public.profiles using gin (crafts);
create index if not exists profiles_inactive_status_idx
  on public.profiles (status)
  where status <> 'active';
create index if not exists profiles_markets_gin
  on public.profiles using gin (markets);
create index if not exists profiles_pending_deletion_due_idx
  on public.profiles (deletion_due_at)
  where status = 'pending_deletion';
create index if not exists profiles_primary_role_country_idx
  on public.profiles (primary_role, location_country);

create table if not exists public.levels (
  level      integer primary key,
  min_points integer not null,
  title      text
);

create table if not exists public.point_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  delta        integer not null,
  reason       public.point_reason not null,
  source_type  text,
  source_id    uuid,
  actor_id     uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  unique (user_id, reason, source_type, source_id, actor_id)
);
create index if not exists point_events_user_created_idx
  on public.point_events (user_id, created_at desc);

create table if not exists public.app_settings (
  id                     boolean primary key default true check (id),
  signup_mode            text not null default 'invite_only',
  gamification_enabled   boolean not null default true,
  leaderboard_public     boolean not null default true,
  heatmap_public         boolean not null default true,
  updated_at             timestamptz not null default now()
);

create table if not exists public.capabilities (
  key            text primary key,
  label          text not null,
  min_tier_rank  integer not null default 0,
  min_level      integer,
  staff_only     boolean not null default false
);

-- ----------------------------------------------------------------------------
-- 3. Seeds
-- ----------------------------------------------------------------------------
insert into public.levels (level, min_points, title) values
  (1, 0,    'Member'),
  (2, 3,    'Contributor'),
  (3, 15,   'Regular'),
  (4, 50,   'Trusted'),
  (5, 125,  'Notable'),
  (6, 300,  'Distinguished'),
  (7, 750,  'Luminary'),
  (8, 2000, 'Landmark'),
  (9, 5000, 'Legend')
on conflict (level) do nothing;

insert into public.app_settings (
  id, signup_mode, gamification_enabled, leaderboard_public, heatmap_public
) values (true, 'invite_only', true, true, true)
on conflict (id) do nothing;

insert into public.capabilities (key, label, min_tier_rank, min_level, staff_only) values
  ('coproduction_apply', 'Apply for co-production', 1, null, false),
  ('create_group',       'Create a group',          0, null, true),
  ('go_live',            'Go live',                 1, null, false),
  ('post_opportunity',   'Post a casting or crew call', 1, null, false)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- 4. Functions + triggers
--    member_tier_rank is a stub (0). has_capability is NEW — do not touch
--    member_can / gc_can / is_gc_staff.
-- ----------------------------------------------------------------------------

create or replace function public.member_tier_rank(p_user uuid)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select 0;
$$;

create or replace function public.has_capability(p_user uuid, p_cap text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.capabilities c
    join public.profiles p on p.id = p_user
    where c.key = p_cap
      and (not c.staff_only or p.app_role in ('admin', 'moderator'))
      and public.member_tier_rank(p_user) >= c.min_tier_rank
      and (c.min_level is null or p.level >= c.min_level)
  );
$$;

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if current_setting('24frame.refreshing_profile_points', true) = 'on' then
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
  perform set_config('24frame.refreshing_profile_points', 'on', true);
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

drop trigger if exists profiles_protect_privileged_columns on public.profiles;
create trigger profiles_protect_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

drop trigger if exists point_events_refresh_profile_points on public.point_events;
create trigger point_events_refresh_profile_points
  after insert or update or delete on public.point_events
  for each row execute function public.refresh_profile_points();

-- Mapping C: no trigger on auth.users, memberships, or organizations that
-- inserts public.profiles. create_org_and_membership is unchanged.

revoke execute on function public.member_tier_rank(uuid) from public, anon;
revoke execute on function public.has_capability(uuid, text) from public, anon;
grant execute on function public.member_tier_rank(uuid) to authenticated, service_role;
grant execute on function public.has_capability(uuid, text) to authenticated, service_role;

-- Trigger functions: EXECUTE is checked at CREATE TRIGGER, not at fire.
revoke execute on function public.protect_profile_privileged_columns()
  from public, anon, authenticated, service_role;
revoke execute on function public.refresh_profile_points()
  from public, anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. RLS — identity-spine policies only.
--    OMIT donor profiles_select_shared_group / profiles_select_conversation_peer
--    (those call Pack 2–4 functions). Do not mention is_gc_staff.
--    anon gets no table grants on this dashboard (20260726000600).
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.levels enable row level security;
alter table public.point_events enable row level security;
alter table public.app_settings enable row level security;
alter table public.capabilities enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or discoverable = true
    or status <> 'active'
  );

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (
    id = (select auth.uid())
    and app_role = 'member'
    and points_total = 0
    and level = 1
    and status = 'active'
    and trust_state = 'new'
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists point_events_select_self on public.point_events;
create policy point_events_select_self on public.point_events
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists levels_select on public.levels;
create policy levels_select on public.levels
  for select to authenticated
  using (true);

drop policy if exists levels_write_admin on public.levels;
create policy levels_write_admin on public.levels
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.app_role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.app_role = 'admin'
    )
  );

drop policy if exists capabilities_select on public.capabilities;
create policy capabilities_select on public.capabilities
  for select to authenticated
  using (true);

drop policy if exists capabilities_write_admin on public.capabilities;
create policy capabilities_write_admin on public.capabilities
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.app_role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.app_role = 'admin'
    )
  );

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings
  for select to authenticated
  using (true);

drop policy if exists app_settings_update_admin on public.app_settings;
create policy app_settings_update_admin on public.app_settings
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.app_role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.app_role = 'admin'
    )
  );

revoke all on public.profiles from anon;
revoke all on public.levels from anon;
revoke all on public.point_events from anon;
revoke all on public.app_settings from anon;
revoke all on public.capabilities from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

grant select on public.point_events to authenticated;
grant select, insert, update, delete on public.point_events to service_role;

grant select, insert, update, delete on public.levels to authenticated;
grant select, insert, update, delete on public.levels to service_role;

grant select, insert, update, delete on public.capabilities to authenticated;
grant select, insert, update, delete on public.capabilities to service_role;

grant select, update on public.app_settings to authenticated;
grant select, insert, update, delete on public.app_settings to service_role;

-- ----------------------------------------------------------------------------
-- 6. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
  v_org_status text[];
  v_bad_pol text;
  v_collide text;
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.levels') is null
     or to_regclass('public.point_events') is null
     or to_regclass('public.app_settings') is null
     or to_regclass('public.capabilities') is null then
    raise exception 'identity spine tables missing after create';
  end if;

  if to_regclass('public.groups') is not null
     or to_regclass('public.posts') is not null
     or to_regclass('public.likes') is not null
     or to_regclass('public.messages') is not null then
    raise exception 'Packs 2–4 social tables must not be created in Pack 1';
  end if;

  -- Pack 0 renamed Ask Globee off conversations. Do not recreate donor DMs.
  if to_regclass('public.conversations') is not null then
    raise exception 'public.conversations must stay absent (donor DMs HOLD)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'org_id'
  ) then
    raise exception 'profiles must not have org_id (mapping C)';
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
    where n.nspname = 'public' and p.proname = 'has_capability'
      and pg_get_function_identity_arguments(p.oid) = 'p_user uuid, p_cap text'
  ) then
    raise exception 'has_capability missing';
  end if;

  select string_agg(pol.policyname, ', ' order by pol.policyname) into v_bad_pol
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('profiles', 'levels', 'point_events', 'app_settings', 'capabilities')
    and (
      coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
      or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
    );
  if v_bad_pol is not null then
    raise exception 'identity spine policies must not call is_gc_staff: %', v_bad_pol;
  end if;

  select string_agg(p.proname, ', ') into v_collide
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('member_can', 'gc_can', 'is_gc_staff')
    and p.prosrc ilike '%has_capability%';
  if v_collide is not null then
    raise exception 'catalog auth functions were rewritten to call has_capability: %', v_collide;
  end if;

  select string_agg(c.relname, ', ' order by c.relname) into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname in ('profiles', 'levels', 'point_events', 'app_settings', 'capabilities')
    and not has_table_privilege('authenticated', c.oid, 'SELECT');
  if v_missing is not null then
    raise exception 'identity spine tables not readable by authenticated: %', v_missing;
  end if;

  raise notice 'identity spine applied; mapping C tables present; org_status unchanged';
end $$;
