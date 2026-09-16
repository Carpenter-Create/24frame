-- courses_education_media_test.sql
-- Education admin+S3 P0: lesson media refs + encode status.
-- Mapping C: has_course_access / course RLS stay free of is_gc_staff.
-- ADAM LOCK: authenticated INSERT/UPDATE/DELETE still denied.

begin;
select plan(16);

select set_config('t.member', gen_random_uuid()::text, false);
select set_config('t.staff',  gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.member')::uuid),
  (current_setting('t.staff')::uuid);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'source_key'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'hls_key'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'encode_status'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'encode_job_id'
  ),
  'lessons has education media + encode columns');

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'courses'
      and column_name = 'cover_key'
  ),
  'courses.cover_key remains the cover field');

select ok(
  exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'course_encode_status'
  ),
  'course_encode_status enum exists');

select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'media_asset_id'
  ),
  'lessons has no media_asset_id');

select ok(
  not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('courses', 'modules', 'lessons')
      and (
        coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
        or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
      )
  ),
  'course policies do not call is_gc_staff');

select ok(
  not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'has_course_access'
      and (
        p.prosrc ilike '%is_gc_staff%'
        or p.prosrc ilike '%has_entitlement%'
        or p.prosrc ilike '%24frame.%'
      )
  ),
  'has_course_access does not call is_gc_staff');

select ok(
  not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('courses', 'modules', 'lessons')
      and pol.polcmd in ('a', 'w', 'd')
  ),
  'course tables still have no client write policies');

select ok(
  has_table_privilege('authenticated', 'public.lessons', 'SELECT')
    and not has_table_privilege('authenticated', 'public.lessons', 'INSERT')
    and not has_table_privilege('authenticated', 'public.lessons', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.lessons', 'DELETE')
    and not has_table_privilege('authenticated', 'public.courses', 'INSERT')
    and not has_table_privilege('authenticated', 'public.courses', 'UPDATE'),
  'authenticated remains select-only on course tables');

reset role;
insert into public.courses (slug, title, is_flagship_free)
values ('pgtap-education-media', 'Education media fixture', true);

insert into public.modules (course_id, title, position)
values ((select id from public.courses where slug = 'pgtap-education-media'), 'Module', 1);

insert into public.lessons (module_id, title, position, free_preview)
values (
  (select m.id from public.modules m
    join public.courses c on c.id = m.course_id
   where c.slug = 'pgtap-education-media'),
  'Body lesson',
  1,
  false
);

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.member'), 'role', 'authenticated')::text,
  true);

select throws_ok(
  $$ insert into public.courses (slug, title, is_flagship_free)
     values ('member-education-write', 'Nope', true) $$,
  '42501',
  null,
  'authenticated cannot insert courses');

select throws_ok(
  $$ update public.courses
     set cover_key = 'courses/hijack/cover.jpg'
     where slug = 'pgtap-education-media' $$,
  '42501',
  null,
  'authenticated cannot update course cover_key');

select throws_ok(
  $$ update public.lessons
     set source_key = 'courses/hijack/lessons/x/source.mp4',
         hls_key = 'courses/hijack/lessons/x/hls/source.m3u8',
         encode_status = 'complete'
     where title = 'Body lesson' $$,
  '42501',
  null,
  'authenticated cannot update lesson media refs');

select throws_ok(
  $$ insert into public.lessons (module_id, title, position, free_preview, source_key)
     values (
       (select m.id from public.modules m
         join public.courses c on c.id = m.course_id
        where c.slug = 'pgtap-education-media' limit 1),
       'Member source',
       9,
       true,
       'courses/hijack/source.mp4'
     ) $$,
  '42501',
  null,
  'authenticated cannot insert a lesson with source_key');

reset role;
insert into public.gc_staff (user_id, role)
values (current_setting('t.staff')::uuid, 'gc_delivery_ops');
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.staff'), 'role', 'authenticated')::text,
  true);

select ok(
  public.is_gc_staff(current_setting('t.staff')::uuid),
  'staff fixture is gc_staff');

select throws_ok(
  $$ update public.lessons
     set encode_status = 'complete'
     where title = 'Body lesson' $$,
  '42501',
  null,
  'gc_staff authenticated still cannot update lesson encode status');

select throws_ok(
  $$ insert into public.courses (slug, title, is_flagship_free)
     values ('staff-education-write', 'Nope', true) $$,
  '42501',
  null,
  'gc_staff authenticated still cannot insert courses');

select * from finish();
rollback;
