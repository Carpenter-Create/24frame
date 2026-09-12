-- ============================================================================
-- 20260912240000_courses.sql
--
-- INTENT: Slice 5 course placeholders. Lean port of donor
-- docs/24Frame-Data-Model.md §8 onto this dashboard as a NEW
-- forward-only survivor migration. Donor repo is not written.
-- Survivor project is uevsculwzwlhxeamagwg. Do not apply this file
-- to production from this PR. CoS merges and applies.
--
-- ADAM LOCK: company / admin / service / migration seed publish ONLY.
-- Members never create, upload, or publish courses, modules, or
-- lessons. Authenticated INSERT / UPDATE / DELETE is denied. No
-- create_course capability. No member form. No /social/courses/new.
-- Staff manage UI is omitted this slice (no natural operator surface).
--
-- MAPPING C (locked, unchanged from Packs 1–4 / #16 / group DMs):
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   no org_id             on courses / modules / lessons
--   catalog membership    is not required to discover or read
--   do not wire           is_gc_staff into these policies or
--                         has_course_access as a privilege bridge
--
-- CREATE (if absent): courses, modules, lessons;
-- has_course_access(p_user, p_course) =
--   is_flagship_free OR member_tier_rank(p_user) >= 1.
-- Seed 2 flagship_free placeholder courses (titles only).
--
-- OMIT:
--   embedding / vector. media_asset_id. media_assets. lesson_progress.
--   has_entitlement. entitlements table. donor subscriptions.
--   is_gc_staff. member write policies. video pipeline / MediaConvert /
--   HLS / CloudFront course cookies / 24frame-media / S3 course
--   cookies. Expo. marketing. gated community Exclusive rooms.
--   invented tier prices. instructor columns. Historical Pack 0–4 /
--   #16 / group-DM migration files untouched.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TABLE, CREATE INDEX, CREATE FUNCTION, ENABLE RLS, GRANT,
-- CREATE POLICY, INSERT seed. No DROP of existing dashboard objects.
-- Forward-only. ROLLBACK: drop public.lessons, public.modules,
-- public.courses, public.has_course_access(uuid, uuid).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tables (exact lean §8 columns; FKs cascade; no org_id)
-- ----------------------------------------------------------------------------
create table if not exists public.courses (
  id               uuid primary key default gen_random_uuid(),
  slug             extensions.citext not null unique,
  title            text not null,
  description      text,
  cover_key        text,
  is_flagship_free boolean not null default false,
  price_cents      integer,
  created_at       timestamptz not null default now()
);

create table if not exists public.modules (
  id        uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title     text not null,
  position  integer not null
);

create index if not exists modules_course_id_idx
  on public.modules (course_id, position);

create table if not exists public.lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.modules(id) on delete cascade,
  title            text not null,
  position         integer not null,
  duration_seconds integer,
  free_preview     boolean not null default false
);

create index if not exists lessons_module_id_idx
  on public.lessons (module_id, position);

-- ----------------------------------------------------------------------------
-- 2. has_course_access — flagship OR member_tier_rank >= 1
--    Do not call has_entitlement (missing). Do not call is_gc_staff.
--    member_tier_rank is still the Pack 1 stub (0).
-- ----------------------------------------------------------------------------
create or replace function public.has_course_access(p_user uuid, p_course uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = p_course
      and (
        c.is_flagship_free
        or public.member_tier_rank(p_user) >= 1
      )
  );
$$;

revoke execute on function public.has_course_access(uuid, uuid) from public, anon;
grant execute on function public.has_course_access(uuid, uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. RLS — authenticated SELECT only. No client writes.
--    Courses and modules are discoverable outline. Lesson rows are
--    readable when has_course_access OR free_preview.
--    No is_gc_staff backdoor. No anon grants.
-- ----------------------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select to authenticated
  using (true);

drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules
  for select to authenticated
  using (true);

drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons
  for select to authenticated
  using (
    free_preview
    or public.has_course_access(
      auth.uid(),
      (select m.course_id from public.modules m where m.id = module_id)
    )
  );

revoke all on public.courses from public, anon, authenticated;
revoke all on public.modules from public, anon, authenticated;
revoke all on public.lessons from public, anon, authenticated;

grant select on public.courses to authenticated;
grant select on public.modules to authenticated;
grant select on public.lessons to authenticated;

grant select, insert, update, delete on public.courses to service_role;
grant select, insert, update, delete on public.modules to service_role;
grant select, insert, update, delete on public.lessons to service_role;

-- ----------------------------------------------------------------------------
-- 4. Seed flagship_free placeholders (titles only). Owner/service write.
-- ----------------------------------------------------------------------------
insert into public.courses (slug, title, description, cover_key, is_flagship_free, price_cents)
values
  (
    'welcome-to-24frame',
    'Welcome to 24Frame',
    'Placeholder orientation for the Social+Education workspace.',
    null,
    true,
    null
  ),
  (
    'social-education',
    'Social+Education',
    'Placeholder course. Titles only in this slice.',
    null,
    true,
    null
  )
on conflict (slug) do nothing;

insert into public.modules (course_id, title, position)
select c.id, 'Orientation', 1
from public.courses c
where c.slug = 'welcome-to-24frame'
  and not exists (
    select 1 from public.modules m where m.course_id = c.id
  );

insert into public.modules (course_id, title, position)
select c.id, 'Structure', 1
from public.courses c
where c.slug = 'social-education'
  and not exists (
    select 1 from public.modules m where m.course_id = c.id
  );

insert into public.lessons (module_id, title, position, duration_seconds, free_preview)
select m.id, v.title, v.position, null, v.free_preview
from public.modules m
join public.courses c on c.id = m.course_id
join (
  values
    (1, 'What this workspace is', true),
    (2, 'Aggregation and Social+Education', false),
    (3, 'What comes later', false)
) as v(position, title, free_preview) on true
where c.slug = 'welcome-to-24frame'
  and not exists (
    select 1 from public.lessons l where l.module_id = m.id
  );

insert into public.lessons (module_id, title, position, duration_seconds, free_preview)
select m.id, v.title, v.position, null, v.free_preview
from public.modules m
join public.courses c on c.id = m.course_id
join (
  values
    (1, 'Course list', false),
    (2, 'Course detail', false)
) as v(position, title, free_preview) on true
where c.slug = 'social-education'
  and not exists (
    select 1 from public.lessons l where l.module_id = m.id
  );

-- ----------------------------------------------------------------------------
-- 5. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_org_status text[];
  v_bad_pol text;
  v_bad_fn text;
  v_missing text;
begin
  if to_regclass('public.courses') is null
     or to_regclass('public.modules') is null
     or to_regclass('public.lessons') is null then
    raise exception 'course tables missing after create';
  end if;

  if to_regclass('public.lesson_progress') is not null then
    raise exception 'lesson_progress must not exist in this slice';
  end if;

  if to_regclass('public.media_assets') is not null then
    raise exception 'media_assets must not exist in this slice';
  end if;

  if to_regprocedure('public.has_entitlement(uuid, text)') is not null then
    raise exception 'has_entitlement must not exist in this slice';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'media_asset_id'
  ) then
    raise exception 'lessons must not have media_asset_id';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'courses'
      and column_name = 'embedding'
  ) then
    raise exception 'courses must not have embedding';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('courses', 'modules', 'lessons')
      and column_name = 'org_id'
  ) then
    raise exception 'course tables must not have org_id (mapping C)';
  end if;

  if to_regclass('public.conversations') is null
     or to_regclass('public.ai_conversations') is null then
    raise exception 'conversations / ai_conversations must stay';
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

  select string_agg(pol.polname, ', ' order by pol.polname) into v_bad_pol
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('courses', 'modules', 'lessons')
    and (
      coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
      or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
    );
  if v_bad_pol is not null then
    raise exception 'course policies must not call is_gc_staff: %', v_bad_pol;
  end if;

  select p.prosrc into v_bad_fn
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'has_course_access'
    and (
      p.prosrc ilike '%is_gc_staff%'
      or p.prosrc ilike '%has_entitlement%'
      or p.prosrc ilike '%24frame.%'
    );
  if v_bad_fn is not null then
    raise exception 'has_course_access must not call is_gc_staff, has_entitlement, or 24frame.* GUCs';
  end if;

  if exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('courses', 'modules', 'lessons')
      and pol.polcmd in ('a', 'w', 'd')
  ) then
    raise exception 'course tables must have no client write policies';
  end if;

  if has_table_privilege('anon', 'public.courses', 'SELECT')
     or has_table_privilege('anon', 'public.modules', 'SELECT')
     or has_table_privilege('anon', 'public.lessons', 'SELECT') then
    raise exception 'anon must not have course grants';
  end if;

  select string_agg(c.relname, ', ' order by c.relname) into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname in ('courses', 'modules', 'lessons')
    and (
      not has_table_privilege('authenticated', c.oid, 'SELECT')
      or has_table_privilege('authenticated', c.oid, 'INSERT')
      or has_table_privilege('authenticated', c.oid, 'UPDATE')
      or has_table_privilege('authenticated', c.oid, 'DELETE')
    );
  if v_missing is not null then
    raise exception 'authenticated must have select-only on course tables: %', v_missing;
  end if;

  if not has_function_privilege(
       'authenticated',
       'public.has_course_access(uuid, uuid)',
       'EXECUTE'
     )
     or has_function_privilege('anon', 'public.has_course_access(uuid, uuid)', 'EXECUTE')
  then
    raise exception 'has_course_access execute must be authenticated only (not anon)';
  end if;

  if exists (
    select 1 from public.capabilities where key in ('create_course', 'publish_course')
  ) then
    raise exception 'must not invent a create/publish course capability';
  end if;

  raise notice 'courses applied; mapping C; ADAM LOCK write-deny; org_status unchanged';
end $$;
