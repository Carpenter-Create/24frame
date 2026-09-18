-- ============================================================================
-- 20260916020000_education_catalog.sql
--
-- INTENT: Education CMS catalog spine (Adam lock A). catalog_code EDU-####,
-- slug uniqueness stays, course.position + status, first-class instructors,
-- Education-scoped videos (NOT Social media_assets). Forward-only survivor
-- migration. Survivor project is uevsculwzwlhxeamagwg. Do not apply this
-- file to production from this PR. CoS merges and applies after founder
-- unlock. No AWS resources are created by this file.
--
-- ADAM LOCK A:
--   catalog_code auto EDU-####, immutable after create
--   slug auto from title (unique); quiet staff override OK
--   position on course / module / lesson (modules+lessons already have it)
--   status draft | published | archived
--   durable ids: course, education_videos, instructors
--   CMS at /education (app). Member URL stays /social/courses/{slug}
--   Mapping C unchanged: gc_staff app-layer server actions
--   do not wire is_gc_staff into course RLS or has_course_access
--   no org_id on education tables
--   no create_course / publish_course capability
--   no entitlements / buy path / lesson_progress / media_assets
--   lesson type P0 only (no Sequence)
--   free_preview column may remain; do not invent a free-taste UI here
--
-- CREATE / ALTER:
--   course_status enum
--   public.instructors
--   public.education_videos
--   courses.catalog_code, courses.status, courses.position,
--     courses.instructor_id
--   lessons.summary, lessons.cover_key, lessons.lesson_type,
--     lessons.education_video_id
--   next_course_catalog_code() + immutable catalog_code trigger
--   has_course_access requires published
--   member SELECT on courses/modules/lessons is published-only
--   backfill existing courses published + catalog_code + position
--   backfill one education_videos row per existing lesson
--
-- OMIT:
--   is_gc_staff in RLS or has_course_access. Client write policies.
--   media_asset_id. media_assets. lesson_progress. has_entitlement.
--   Stripe. MasterClass. Sequence. member publish. 24frame-media reuse.
--   Settings hub. workspace switcher.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TYPE, CREATE TABLE, CREATE SEQUENCE, CREATE FUNCTION,
-- CREATE TRIGGER, ALTER TABLE, CREATE POLICY, GRANT, REPLACE
-- has_course_access. No DROP of existing dashboard objects.
-- Forward-only. ROLLBACK: drop new tables/columns/functions/enum.
-- Do not drop courses / modules / lessons / has_course_access.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enum + catalog_code generator
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'course_status'
  ) then
    create type public.course_status as enum ('draft', 'published', 'archived');
  end if;
end $$;

create sequence if not exists public.course_catalog_seq start 1;

create or replace function public.next_course_catalog_code()
returns text
language plpgsql
volatile
set search_path to 'public'
as $$
begin
  return 'EDU-' || lpad(nextval('public.course_catalog_seq')::text, 4, '0');
end;
$$;

revoke execute on function public.next_course_catalog_code() from public, anon, authenticated;
grant execute on function public.next_course_catalog_code() to service_role;

-- ----------------------------------------------------------------------------
-- 2. Instructors (first-class). No org_id. Mapping C.
-- ----------------------------------------------------------------------------
create table if not exists public.instructors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  bio        text,
  created_at timestamptz not null default now()
);

create index if not exists instructors_created_at_idx
  on public.instructors (created_at);

-- ----------------------------------------------------------------------------
-- 3. Course catalog columns + backfill
-- ----------------------------------------------------------------------------
alter table public.courses
  add column if not exists catalog_code text,
  add column if not exists status public.course_status,
  add column if not exists position integer,
  add column if not exists instructor_id uuid references public.instructors(id);

update public.courses
set catalog_code = public.next_course_catalog_code()
where catalog_code is null;

update public.courses
set status = 'published'
where status is null;

with ordered as (
  select id, row_number() over (order by created_at, id) as pos
  from public.courses
)
update public.courses c
set position = o.pos
from ordered o
where c.id = o.id
  and c.position is null;

alter table public.courses
  alter column catalog_code set default public.next_course_catalog_code(),
  alter column catalog_code set not null,
  alter column status set default 'draft',
  alter column status set not null,
  alter column position set default 0,
  alter column position set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'courses_catalog_code_unique'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses
      add constraint courses_catalog_code_unique unique (catalog_code);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'courses_catalog_code_format'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses
      add constraint courses_catalog_code_format
      check (catalog_code ~ '^EDU-[0-9]{4,}$');
  end if;
end $$;

create index if not exists courses_status_position_idx
  on public.courses (status, position);

create or replace function public.courses_catalog_code_immutable()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.catalog_code is distinct from old.catalog_code then
    raise exception 'catalog_code is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists courses_catalog_code_immutable on public.courses;
create trigger courses_catalog_code_immutable
  before update on public.courses
  for each row
  execute function public.courses_catalog_code_immutable();

-- ----------------------------------------------------------------------------
-- 4. Education videos (durable video id). NOT media_assets.
-- ----------------------------------------------------------------------------
create table if not exists public.education_videos (
  id                uuid primary key default gen_random_uuid(),
  course_id         uuid not null references public.courses(id),
  lesson_id         uuid unique references public.lessons(id),
  source_key        text,
  hls_key           text,
  encode_status     public.course_encode_status,
  encode_job_id     text,
  encode_error      text,
  encode_updated_at timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists education_videos_course_id_idx
  on public.education_videos (course_id);

-- ----------------------------------------------------------------------------
-- 5. Lesson catalog columns + video backfill
-- ----------------------------------------------------------------------------
alter table public.lessons
  add column if not exists summary text,
  add column if not exists cover_key text,
  add column if not exists lesson_type text,
  add column if not exists education_video_id uuid references public.education_videos(id);

update public.lessons
set lesson_type = 'lesson'
where lesson_type is null;

alter table public.lessons
  alter column lesson_type set default 'lesson',
  alter column lesson_type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lessons_lesson_type_p0'
      and conrelid = 'public.lessons'::regclass
  ) then
    alter table public.lessons
      add constraint lessons_lesson_type_p0 check (lesson_type = 'lesson');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'lessons_summary_len'
      and conrelid = 'public.lessons'::regclass
  ) then
    alter table public.lessons
      add constraint lessons_summary_len
      check (summary is null or char_length(summary) <= 200);
  end if;
end $$;

insert into public.education_videos (
  course_id,
  lesson_id,
  source_key,
  hls_key,
  encode_status,
  encode_job_id,
  encode_error,
  encode_updated_at
)
select
  m.course_id,
  l.id,
  l.source_key,
  l.hls_key,
  l.encode_status,
  l.encode_job_id,
  l.encode_error,
  l.encode_updated_at
from public.lessons l
join public.modules m on m.id = l.module_id
where not exists (
  select 1 from public.education_videos v where v.lesson_id = l.id
);

update public.lessons l
set education_video_id = v.id
from public.education_videos v
where v.lesson_id = l.id
  and l.education_video_id is null;

-- ----------------------------------------------------------------------------
-- 6. has_course_access — published only. Still no is_gc_staff.
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
      and c.status = 'published'
      and (
        c.is_flagship_free
        or public.member_tier_rank(p_user) >= 1
      )
  );
$$;

revoke execute on function public.has_course_access(uuid, uuid) from public, anon;
grant execute on function public.has_course_access(uuid, uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 7. RLS — published member reads. No is_gc_staff. No client writes.
-- ----------------------------------------------------------------------------
alter table public.instructors enable row level security;
alter table public.education_videos enable row level security;

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select to authenticated
  using (status = 'published');

drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules
  for select to authenticated
  using (
    exists (
      select 1
      from public.courses c
      where c.id = course_id
        and c.status = 'published'
    )
  );

drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons
  for select to authenticated
  using (
    exists (
      select 1
      from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id
        and c.status = 'published'
        and (
          free_preview
          or public.has_course_access(auth.uid(), c.id)
        )
    )
  );

drop policy if exists instructors_select on public.instructors;
create policy instructors_select on public.instructors
  for select to authenticated
  using (true);

drop policy if exists education_videos_select on public.education_videos;
create policy education_videos_select on public.education_videos
  for select to authenticated
  using (
    exists (
      select 1
      from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id
        and c.status = 'published'
        and (
          l.free_preview
          or public.has_course_access(auth.uid(), c.id)
        )
    )
  );

revoke all on public.instructors from public, anon, authenticated;
revoke all on public.education_videos from public, anon, authenticated;

grant select on public.instructors to authenticated;
grant select on public.education_videos to authenticated;

grant select, insert, update, delete on public.instructors to service_role;
grant select, insert, update, delete on public.education_videos to service_role;

-- ----------------------------------------------------------------------------
-- 8. Apply-time proofs — Mapping C and ADAM LOCK A
-- ----------------------------------------------------------------------------
do $$
declare
  v_bad_pol text;
  v_bad_fn text;
  v_missing text;
  v_org_status text[];
begin
  if to_regclass('public.instructors') is null
     or to_regclass('public.education_videos') is null then
    raise exception 'instructors / education_videos missing after create';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'courses'
      and column_name in ('catalog_code', 'status', 'position', 'instructor_id')
    group by table_name
    having count(*) = 4
  ) then
    raise exception 'courses catalog columns missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name in ('summary', 'cover_key', 'lesson_type', 'education_video_id')
    group by table_name
    having count(*) = 4
  ) then
    raise exception 'lessons catalog columns missing';
  end if;

  if exists (
    select 1 from public.courses
    where catalog_code is null
       or catalog_code !~ '^EDU-[0-9]{4,}$'
       or status is null
       or position is null
  ) then
    raise exception 'courses catalog backfill incomplete';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('courses', 'modules', 'lessons', 'instructors', 'education_videos')
      and column_name = 'org_id'
  ) then
    raise exception 'education tables must not have org_id (mapping C)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'media_asset_id'
  ) then
    raise exception 'lessons must not have media_asset_id';
  end if;

  if to_regclass('public.media_assets') is not null then
    raise exception 'media_assets must not exist';
  end if;

  if to_regclass('public.lesson_progress') is not null then
    raise exception 'lesson_progress must not exist';
  end if;

  if to_regprocedure('public.has_entitlement(uuid, text)') is not null then
    raise exception 'has_entitlement must not exist';
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
    and c.relname in ('courses', 'modules', 'lessons', 'instructors', 'education_videos')
    and (
      coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
      or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
    );
  if v_bad_pol is not null then
    raise exception 'education policies must not call is_gc_staff: %', v_bad_pol;
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
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'has_course_access'
      and p.prosrc not ilike '%status = ''published''%'
  ) then
    raise exception 'has_course_access must require published status';
  end if;

  if exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('courses', 'modules', 'lessons', 'instructors', 'education_videos')
      and pol.polcmd in ('a', 'w', 'd')
  ) then
    raise exception 'education tables must have no client write policies';
  end if;

  select string_agg(c.relname, ', ' order by c.relname) into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname in ('courses', 'modules', 'lessons', 'instructors', 'education_videos')
    and (
      not has_table_privilege('authenticated', c.oid, 'SELECT')
      or has_table_privilege('authenticated', c.oid, 'INSERT')
      or has_table_privilege('authenticated', c.oid, 'UPDATE')
      or has_table_privilege('authenticated', c.oid, 'DELETE')
    );
  if v_missing is not null then
    raise exception 'authenticated must have select-only on education tables: %', v_missing;
  end if;

  if exists (
    select 1 from public.capabilities where key in ('create_course', 'publish_course')
  ) then
    raise exception 'must not invent a create/publish course capability';
  end if;

  raise notice 'education catalog applied; mapping C; ADAM LOCK A; catalog_code EDU-####';
end $$;
