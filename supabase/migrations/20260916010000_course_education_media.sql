-- ============================================================================
-- 20260916010000_course_education_media.sql
--
-- INTENT: Education admin+S3 P0. Lesson source + HLS refs and encode
-- status on public.lessons. Cover stays courses.cover_key.
-- Forward-only survivor migration. Survivor project is
-- uevsculwzwlhxeamagwg. Do not apply this file to production from this
-- PR. CoS merges. Founder applies after Adam confirms Education AWS
-- names. No AWS resources are created by this file.
--
-- ADAM LOCK: company / admin / service write ONLY. Members never
-- create, upload, or publish courses, modules, or lessons.
-- Authenticated INSERT / UPDATE / DELETE stays denied. Staff writes
-- are app-layer server actions (gc_staff + service_role), not RLS.
--
-- MAPPING C (locked):
--   do not wire is_gc_staff into course policies or has_course_access
--   no org_id on courses / modules / lessons
--   no create_course / publish_course capability
--   no entitlements / buy path / lesson_progress / media_assets
--
-- ALTER (if absent): lessons.source_key, lessons.hls_key,
-- lessons.encode_status, lessons.encode_job_id, lessons.encode_error,
-- lessons.encode_updated_at. New enum course_encode_status.
--
-- OMIT:
--   is_gc_staff in RLS or has_course_access. Client write policies.
--   media_asset_id. media_assets. lesson_progress. has_entitlement.
--   MasterClass. member publish. /education route. 24frame-media reuse.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TYPE, ALTER TABLE. No DROP of existing dashboard objects.
-- Forward-only. ROLLBACK: drop the new lesson columns and
-- course_encode_status. Do not drop courses / modules / lessons /
-- has_course_access.
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'course_encode_status'
  ) then
    create type public.course_encode_status as enum (
      'submitted',
      'running',
      'complete',
      'failed',
      'submit_failed'
    );
  end if;
end $$;

alter table public.lessons
  add column if not exists source_key text,
  add column if not exists hls_key text,
  add column if not exists encode_status public.course_encode_status,
  add column if not exists encode_job_id text,
  add column if not exists encode_error text,
  add column if not exists encode_updated_at timestamptz;

-- ----------------------------------------------------------------------------
-- Apply-time proofs — Mapping C and ADAM LOCK stay intact
-- ----------------------------------------------------------------------------
do $$
declare
  v_bad_pol text;
  v_bad_fn text;
  v_missing text;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name in ('source_key', 'hls_key', 'encode_status', 'encode_job_id')
    group by table_name
    having count(*) = 4
  ) then
    raise exception 'lessons education media columns missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'courses'
      and column_name = 'cover_key'
  ) then
    raise exception 'courses.cover_key must remain the cover successor';
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
      and table_name in ('courses', 'modules', 'lessons')
      and column_name = 'org_id'
  ) then
    raise exception 'course tables must not have org_id (mapping C)';
  end if;

  if to_regclass('public.lesson_progress') is not null then
    raise exception 'lesson_progress must not exist';
  end if;

  if to_regclass('public.media_assets') is not null then
    raise exception 'media_assets must not exist';
  end if;

  if to_regprocedure('public.has_entitlement(uuid, text)') is not null then
    raise exception 'has_entitlement must not exist';
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

  if exists (
    select 1 from public.capabilities where key in ('create_course', 'publish_course')
  ) then
    raise exception 'must not invent a create/publish course capability';
  end if;

  raise notice 'course education media applied; mapping C; ADAM LOCK write-deny';
end $$;
