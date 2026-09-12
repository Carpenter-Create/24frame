-- ============================================================================
-- 20260912120000_groups_posts.sql
--
-- INTENT: Phase 1B Pack 2. Port the 24Frame groups/posts schema onto this
-- dashboard as a NEW forward-only migration. Source of truth was donor
-- Carpenter-Create/24frame `20260910120000_groups_posts.sql`, verified against
-- live 24Frame project qxribdfzkvffambaartp (migration version 20260910121226,
-- name groups_posts) — not pasted blindly. Survivor project is
-- uevsculwzwlhxeamagwg. Do not apply this file to production from this PR.
--
-- MAPPING C (locked, unchanged from Pack 1):
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   groups / posts        FK to profiles.id
--   a user without a      profile cannot post or join a group
--   a creator need not    have a catalog org to have a profile or join a
--                         public group (donor access helpers)
--   revoking membership   must not delete a profile or its posts
--   do not wire           is_gc_staff into these social policies as a
--                         privilege bridge — create_group is app_role
--                         admin/moderator via has_capability
--
-- CREATE (if absent): groups, group_members, posts;
-- enums group_visibility, user_role_in_group, post_status (exact donor
-- names; no collision with dashboard types);
-- is_active_profile, is_group_member, meets_group_access, can_see_group,
-- can_access_group_content, can_self_join_group, shares_group,
-- refresh_group_member_count, protect_group_privileged_columns,
-- protect_post_privileged_columns; matching triggers; RLS;
-- additive profiles_select_shared_group (uses shares_group, not is_gc_staff).
--
-- OMIT:
--   donor org_status entirely. Dashboard org_status stays
--   registered|awaiting_payment|active|payment_lapsed|closed.
--   likes / blocks (Pack 3). donor conversations / messages (Pack 4).
--   leaderboards. donor notifications / subscriptions tables (dashboard
--   already has different ones). Social workspace UI/nav/routes.
--   Auth user cutover. media/S3. GitHub rename.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TYPE (new names only), CREATE TABLE, CREATE FUNCTION, CREATE
-- TRIGGER, ENABLE RLS, GRANT, CREATE POLICY (additive on profiles).
-- No DROP of existing dashboard objects. Forward-only.
-- ROLLBACK: drop the three new tables, the ten new functions, the three
-- new enums, and policy profiles_select_shared_group.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enums required by LIVE Pack 2 tables.
--    Do NOT create public.org_status. Do not recreate dashboard org_status.
--    Exact donor names — none collide with existing dashboard types.
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.group_visibility as enum ('public', 'private', 'secret');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role_in_group as enum ('owner', 'admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_status as enum ('active', 'hidden', 'removed');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------

create table if not exists public.groups (
  id             uuid primary key default gen_random_uuid(),
  slug           extensions.citext not null unique,
  name           text not null,
  description    text,
  cover_key      text,
  visibility     public.group_visibility not null default 'public',
  min_level      integer,
  min_tier_rank  integer not null default 0,
  member_count   integer not null default 0,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now()
);

-- Mapping C: no org_id. created_by is optional and does not cascade-delete
-- the group when a profile is removed (donor: no ON DELETE).

create table if not exists public.group_members (
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.user_role_in_group not null default 'member',
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_id_idx
  on public.group_members (user_id);

create table if not exists public.posts (
  id                         uuid primary key default gen_random_uuid(),
  author_id                  uuid not null references public.profiles(id) on delete cascade,
  group_id                   uuid references public.groups(id) on delete cascade,
  body                       text,
  media                      jsonb default '[]'::jsonb,
  required_entitlement_key   text,
  status                     public.post_status not null default 'active',
  pinned                     boolean not null default false,
  like_count                 integer not null default 0,
  comment_count              integer not null default 0,
  embedding                  extensions.vector(1536),
  created_at                 timestamptz not null default now(),
  edited_at                  timestamptz
);

-- Mapping C: no org_id. author_id / group_id FKs are person/social, not
-- catalog. ON DELETE CASCADE here is donor personal-content cleanup
-- (auth.users → profiles → posts), not org-owned catalog rows.

create index if not exists posts_author_created_idx
  on public.posts (author_id, created_at desc);
create index if not exists posts_group_created_idx
  on public.posts (group_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 3. Functions + triggers
--    Social admin is has_capability('create_group') → profiles.app_role
--    admin/moderator. Do not call is_gc_staff.
-- ----------------------------------------------------------------------------

create or replace function public.is_active_profile(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user
      and p.status = 'active'
  );
$$;

create or replace function public.is_group_member(p_group uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group
      and gm.user_id = p_user
  );
$$;

create or replace function public.meets_group_access(p_group uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.groups g
    join public.profiles p on p.id = p_user
    where g.id = p_group
      and public.member_tier_rank(p_user) >= g.min_tier_rank
      and (g.min_level is null or p.level >= g.min_level)
  );
$$;

create or replace function public.can_see_group(p_group uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group
      and (
        public.has_capability(p_user, 'create_group')
        or g.visibility in ('public', 'private')
        or exists (
          select 1
          from public.group_members gm
          where gm.group_id = g.id
            and gm.user_id = p_user
        )
      )
  );
$$;

create or replace function public.can_access_group_content(p_group uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    public.has_capability(p_user, 'create_group')
    or (
      public.is_group_member(p_group, p_user)
      and public.meets_group_access(p_group, p_user)
    );
$$;

create or replace function public.can_self_join_group(p_group uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group
      and g.visibility = 'public'
      and public.is_active_profile(p_user)
      and public.meets_group_access(p_group, p_user)
  );
$$;

create or replace function public.shares_group(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = p_a
      and b.user_id = p_b
  );
$$;

create or replace function public.protect_group_privileged_columns()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if current_setting('24frame.refreshing_group_member_count', true) = 'on' then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.member_count is distinct from old.member_count then
    raise exception 'privileged group columns are not client-writable';
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
  if current_setting('24frame.refreshing_post_like_count', true) = 'on' then
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

create or replace function public.refresh_group_member_count()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  target_group uuid;
begin
  perform set_config('24frame.refreshing_group_member_count', 'on', true);
  target_group := coalesce(new.group_id, old.group_id);

  update public.groups
  set member_count = (
    select count(*)::integer
    from public.group_members gm
    where gm.group_id = target_group
  )
  where id = target_group;

  if tg_op = 'UPDATE'
     and old.group_id is distinct from new.group_id then
    update public.groups
    set member_count = (
      select count(*)::integer
      from public.group_members gm
      where gm.group_id = old.group_id
    )
    where id = old.group_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists group_members_refresh_member_count on public.group_members;
create trigger group_members_refresh_member_count
  after insert or update or delete on public.group_members
  for each row execute function public.refresh_group_member_count();

drop trigger if exists groups_protect_privileged_columns on public.groups;
create trigger groups_protect_privileged_columns
  before update on public.groups
  for each row execute function public.protect_group_privileged_columns();

drop trigger if exists posts_protect_privileged_columns on public.posts;
create trigger posts_protect_privileged_columns
  before insert or update on public.posts
  for each row execute function public.protect_post_privileged_columns();

revoke execute on function public.is_active_profile(uuid) from public, anon;
revoke execute on function public.is_group_member(uuid, uuid) from public, anon;
revoke execute on function public.meets_group_access(uuid, uuid) from public, anon;
revoke execute on function public.can_see_group(uuid, uuid) from public, anon;
revoke execute on function public.can_access_group_content(uuid, uuid) from public, anon;
revoke execute on function public.can_self_join_group(uuid, uuid) from public, anon;
revoke execute on function public.shares_group(uuid, uuid) from public, anon;

grant execute on function public.is_active_profile(uuid) to authenticated, service_role;
grant execute on function public.is_group_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.meets_group_access(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_see_group(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_access_group_content(uuid, uuid) to authenticated, service_role;
grant execute on function public.can_self_join_group(uuid, uuid) to authenticated, service_role;
grant execute on function public.shares_group(uuid, uuid) to authenticated, service_role;

-- Trigger functions: EXECUTE is checked at CREATE TRIGGER, not at fire.
revoke execute on function public.protect_group_privileged_columns()
  from public, anon, authenticated, service_role;
revoke execute on function public.protect_post_privileged_columns()
  from public, anon, authenticated, service_role;
revoke execute on function public.refresh_group_member_count()
  from public, anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. RLS
--    Donor policies adapted: anon gets no table grants (dashboard
--    convention, 20260726000600). Do not mention is_gc_staff.
-- ----------------------------------------------------------------------------
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.posts enable row level security;

drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select to authenticated
  using (public.can_see_group(id, (select auth.uid())));

drop policy if exists groups_insert_staff on public.groups;
create policy groups_insert_staff on public.groups
  for insert to authenticated
  with check (
    public.has_capability((select auth.uid()), 'create_group')
    and public.is_active_profile((select auth.uid()))
    and member_count = 0
    and (created_by is null or created_by = (select auth.uid()))
  );

drop policy if exists groups_update_staff on public.groups;
create policy groups_update_staff on public.groups
  for update to authenticated
  using (public.has_capability((select auth.uid()), 'create_group'))
  with check (public.has_capability((select auth.uid()), 'create_group'));

drop policy if exists groups_delete_staff on public.groups;
create policy groups_delete_staff on public.groups
  for delete to authenticated
  using (public.has_capability((select auth.uid()), 'create_group'));

drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_group_member(group_id, (select auth.uid()))
    or public.has_capability((select auth.uid()), 'create_group')
  );

drop policy if exists group_members_insert on public.group_members;
create policy group_members_insert on public.group_members
  for insert to authenticated
  with check (
    public.is_active_profile((select auth.uid()))
    and (
      (
        user_id = (select auth.uid())
        and role = 'member'
        and public.can_self_join_group(group_id, (select auth.uid()))
      )
      or public.has_capability((select auth.uid()), 'create_group')
    )
  );

drop policy if exists group_members_update_staff on public.group_members;
create policy group_members_update_staff on public.group_members
  for update to authenticated
  using (public.has_capability((select auth.uid()), 'create_group'))
  with check (public.has_capability((select auth.uid()), 'create_group'));

drop policy if exists group_members_delete on public.group_members;
create policy group_members_delete on public.group_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_capability((select auth.uid()), 'create_group')
  );

drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts
  for select to authenticated
  using (
    public.has_capability((select auth.uid()), 'create_group')
    or (
      status = 'active'
      and (
        group_id is null
        or public.can_access_group_content(group_id, (select auth.uid()))
      )
    )
  );

drop policy if exists posts_insert_author on public.posts;
create policy posts_insert_author on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_active_profile((select auth.uid()))
    and status = 'active'
    and like_count = 0
    and comment_count = 0
    and pinned = false
    and (
      group_id is null
      or public.can_access_group_content(group_id, (select auth.uid()))
    )
  );

drop policy if exists posts_update_author on public.posts;
create policy posts_update_author on public.posts
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and public.is_active_profile((select auth.uid()))
  )
  with check (
    author_id = (select auth.uid())
    and status = any (array['active'::public.post_status, 'removed'::public.post_status])
    and pinned = false
    and (
      group_id is null
      or public.can_access_group_content(group_id, (select auth.uid()))
    )
  );

drop policy if exists posts_update_staff on public.posts;
create policy posts_update_staff on public.posts
  for update to authenticated
  using (public.has_capability((select auth.uid()), 'create_group'))
  with check (public.has_capability((select auth.uid()), 'create_group'));

-- Additive Pack 2 profile visibility. Donor has this; it calls shares_group
-- only — not is_gc_staff. Pack 1 omitted it because shares_group did not exist.
drop policy if exists profiles_select_shared_group on public.profiles;
create policy profiles_select_shared_group on public.profiles
  for select to authenticated
  using (public.shares_group((select auth.uid()), id));

revoke all on public.groups from anon;
revoke all on public.group_members from anon;
revoke all on public.posts from anon;

grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, update, delete on public.groups to service_role;

grant select, insert, update, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.group_members to service_role;

-- Donor has no posts DELETE policy. Do not grant client DELETE.
grant select, insert, update on public.posts to authenticated;
grant select, insert, update, delete on public.posts to service_role;

-- ----------------------------------------------------------------------------
-- 5. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
  v_org_status text[];
  v_bad_pol text;
  v_collide text;
begin
  if to_regclass('public.groups') is null
     or to_regclass('public.group_members') is null
     or to_regclass('public.posts') is null then
    raise exception 'Pack 2 groups/posts tables missing after create';
  end if;

  if to_regclass('public.likes') is not null
     or to_regclass('public.conversations') is not null
     or to_regclass('public.messages') is not null then
    raise exception 'Packs 3–4 social tables must not be created in Pack 2';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('groups', 'group_members', 'posts')
      and column_name = 'org_id'
  ) then
    raise exception 'social tables must not have org_id (mapping C)';
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
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'group_visibility'
  ) then
    raise exception 'group_visibility enum missing';
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
    where n.nspname = 'public' and p.proname = 'is_active_profile'
      and pg_get_function_identity_arguments(p.oid) = 'p_user uuid'
  ) then
    raise exception 'is_active_profile missing';
  end if;

  if not exists (
    select 1 from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'profiles'
      and pol.polname = 'profiles_select_shared_group'
  ) then
    raise exception 'profiles_select_shared_group missing';
  end if;

  select string_agg(pol.polname, ', ' order by pol.polname) into v_bad_pol
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and (
      c.relname in ('groups', 'group_members', 'posts')
      or pol.polname = 'profiles_select_shared_group'
    )
    and (
      coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
      or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
    );
  if v_bad_pol is not null then
    raise exception 'Pack 2 policies must not call is_gc_staff: %', v_bad_pol;
  end if;

  select string_agg(p.proname, ', ') into v_collide
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('member_can', 'gc_can', 'is_gc_staff')
    and (
      p.prosrc ilike '%is_active_profile%'
      or p.prosrc ilike '%can_see_group%'
      or p.prosrc ilike '%shares_group%'
    );
  if v_collide is not null then
    raise exception 'catalog auth functions were rewritten to call Pack 2 helpers: %', v_collide;
  end if;

  select string_agg(c.relname, ', ' order by c.relname) into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname in ('groups', 'group_members', 'posts')
    and not has_table_privilege('authenticated', c.oid, 'SELECT');
  if v_missing is not null then
    raise exception 'Pack 2 tables not readable by authenticated: %', v_missing;
  end if;

  raise notice 'groups/posts applied; mapping C FKs to profiles; org_status unchanged';
end $$;
