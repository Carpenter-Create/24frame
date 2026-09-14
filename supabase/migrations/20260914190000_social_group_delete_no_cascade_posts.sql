-- ============================================================================
-- 20260914190000_social_group_delete_no_cascade_posts.sql
--
-- INTENT: Remediation class 1. Data Access invariant #13 — Social group
-- deletion must never cascade-destroy independently owned member posts.
--
-- LIFECYCLE CLASS: status close/hide on groups (no authenticated hard
-- delete). Posts remain; memberships are group-owned and may still
-- cascade only when a group row is removed with no posts referencing it.
--
-- ACCESS PATH: authenticated staff UPDATE groups.status via
-- groups_update_staff + has_capability('create_group'). No authenticated
-- DELETE on groups. posts.group_id is ON DELETE RESTRICT.
--
-- NO ORG_ID ON SOCIAL: groups / group_members / posts stay Mapping C
-- person-scoped. Catalog membership revoke still must not wipe personal
-- Social.
--
-- MAPPING C (locked, unchanged):
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   groups / posts        FK to profiles.id
--   revoking membership   must not delete a profile or its posts
--   do not wire           is_gc_staff into these social policies
--
-- ALTER: posts.group_id FK CASCADE → RESTRICT;
--        drop groups_delete_staff; revoke authenticated DELETE;
--        add group_status + groups.status default active;
--        close/hide blocks join and new group posts; existing posts stay.
--
-- OMIT: account-can-story, YouTube handle UX, Education, deliveries
--   bounds, media CHECKs, Social Home keyset, DM caps, Redis/partition.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- ALTER TABLE drop/add FK, DROP POLICY, REVOKE, CREATE TYPE, ADD COLUMN,
-- CREATE OR REPLACE FUNCTION, DROP/CREATE POLICY. Forward-only.
-- CoS applies after merge + founder yes. Prod SQL apply needed after merge.
-- ROLLBACK: restore CASCADE FK + groups_delete_staff + DELETE grant;
-- drop groups.status / group_status (only if unused).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Lifecycle status. Close/hide the group; do not hard-delete it.
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.group_status as enum ('active', 'hidden', 'closed');
exception when duplicate_object then null; end $$;

alter table public.groups
  add column if not exists status public.group_status not null default 'active';

-- ----------------------------------------------------------------------------
-- 2. Independently owned posts must survive group removal attempts.
--    RESTRICT (not CASCADE). Default NO ACTION is equivalent; use RESTRICT
--    so the catalog is explicit.
-- ----------------------------------------------------------------------------
alter table public.posts
  drop constraint if exists posts_group_id_fkey;

alter table public.posts
  add constraint posts_group_id_fkey
  foreign key (group_id) references public.groups(id)
  on delete restrict;

-- ----------------------------------------------------------------------------
-- 3. Remove the authenticated hard-delete path.
-- ----------------------------------------------------------------------------
drop policy if exists groups_delete_staff on public.groups;

revoke delete on public.groups from authenticated;

-- ----------------------------------------------------------------------------
-- 4. Close/hide is the access path. Members still read remaining posts.
--    New joins and new group posts require status = active.
-- ----------------------------------------------------------------------------
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
        or (
          g.status = 'active'
          and g.visibility in ('public', 'private')
        )
        or exists (
          select 1
          from public.group_members gm
          where gm.group_id = g.id
            and gm.user_id = p_user
        )
      )
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
      and g.status = 'active'
      and g.visibility = 'public'
      and public.is_active_profile(p_user)
      and public.meets_group_access(p_group, p_user)
  );
$$;

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
      or (
        public.can_access_group_content(group_id, (select auth.uid()))
        and exists (
          select 1
          from public.groups g
          where g.id = group_id
            and g.status = 'active'
        )
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 5. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_deltype char;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('groups', 'group_members', 'posts')
      and column_name = 'org_id'
  ) then
    raise exception 'social tables must not have org_id (mapping C)';
  end if;

  select c.confdeltype into v_deltype
  from pg_constraint c
  join pg_class rel on rel.oid = c.conrelid
  join pg_namespace n on n.oid = rel.relnamespace
  where n.nspname = 'public'
    and rel.relname = 'posts'
    and c.conname = 'posts_group_id_fkey';

  if v_deltype is distinct from 'r' then
    raise exception 'posts.group_id must ON DELETE RESTRICT, got %', v_deltype;
  end if;

  if exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'groups'
      and pol.polname = 'groups_delete_staff'
  ) then
    raise exception 'groups_delete_staff must not exist';
  end if;

  if has_table_privilege('authenticated', 'public.groups', 'DELETE') then
    raise exception 'authenticated must not DELETE groups';
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'group_status'
  ) then
    raise exception 'group_status enum missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'groups'
      and column_name = 'status'
  ) then
    raise exception 'groups.status missing';
  end if;

  raise notice 'invariant 13: posts.group_id restrict; groups close/hide; no org_id';
end $$;
