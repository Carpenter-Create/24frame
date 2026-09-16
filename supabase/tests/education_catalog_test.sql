-- education_catalog_test.sql
-- Adam lock A: catalog_code EDU-####, status, position, instructors,
-- education_videos. Mapping C: no is_gc_staff in course RLS /
-- has_course_access. Authenticated writes stay denied.

begin;
select plan(29);

select set_config('t.alpha',   gen_random_uuid()::text, false);
select set_config('t.staff',   gen_random_uuid()::text, false);
select set_config('t.catalog', gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.alpha')::uuid),
  (current_setting('t.staff')::uuid),
  (current_setting('t.catalog')::uuid);

select ok(to_regclass('public.instructors') is not null, 'instructors table exists');
select ok(to_regclass('public.education_videos') is not null, 'education_videos table exists');
select ok(
  to_regclass('public.media_assets') is null,
  'media_assets is still omitted');

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'catalog_code'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'status'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'position'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'instructor_id'
  ),
  'courses has catalog_code, status, position, instructor_id');

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons' and column_name = 'summary'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons' and column_name = 'cover_key'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons' and column_name = 'lesson_type'
  )
  and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons' and column_name = 'education_video_id'
  ),
  'lessons has summary, cover_key, lesson_type, education_video_id');

select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('courses', 'modules', 'lessons', 'instructors', 'education_videos')
      and column_name = 'org_id'
  ),
  'education tables have no org_id');

select ok(
  not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('courses', 'modules', 'lessons', 'instructors', 'education_videos')
      and (
        coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
        or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
      )
  ),
  'education policies do not call is_gc_staff');

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
  'has_course_access does not call is_gc_staff, has_entitlement, or 24frame.* GUCs');

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'has_course_access'
      and p.prosrc ilike '%status = ''published''%'
  ),
  'has_course_access requires published status');

select ok(
  not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('courses', 'modules', 'lessons', 'instructors', 'education_videos')
      and pol.polcmd in ('a', 'w', 'd')
  ),
  'education tables have no client write policies');

select ok(
  has_table_privilege('authenticated', 'public.instructors', 'SELECT')
    and has_table_privilege('authenticated', 'public.education_videos', 'SELECT')
    and not has_table_privilege('authenticated', 'public.instructors', 'INSERT')
    and not has_table_privilege('authenticated', 'public.education_videos', 'INSERT')
    and not has_table_privilege('authenticated', 'public.instructors', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.education_videos', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.instructors', 'DELETE')
    and not has_table_privilege('authenticated', 'public.education_videos', 'DELETE'),
  'authenticated has select only on instructors and education_videos');

select ok(
  not has_table_privilege('anon', 'public.instructors', 'SELECT')
    and not has_table_privilege('anon', 'public.education_videos', 'SELECT'),
  'anon has no instructor or education_video grants');

select ok(
  (select catalog_code from public.courses where slug = 'welcome-to-24frame')
    ~ '^EDU-[0-9]{4,}$'
  and (select status from public.courses where slug = 'welcome-to-24frame') = 'published'
  and (select position from public.courses where slug = 'welcome-to-24frame') >= 1,
  'seeded courses backfilled with catalog_code, published, and position');

select is(
  (select count(*)::int from public.education_videos v
    join public.lessons l on l.id = v.lesson_id
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
   where c.slug = 'welcome-to-24frame'),
  (select count(*)::int from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
   where c.slug = 'welcome-to-24frame'),
  'each seeded welcome lesson has an education_videos row');

reset role;
insert into public.courses (slug, title, is_flagship_free, status)
values
  ('pgtap-catalog-pub', 'Published fixture', true, 'published'),
  ('pgtap-catalog-draft', 'Draft fixture', true, 'draft');

insert into public.modules (course_id, title, position)
values
  ((select id from public.courses where slug = 'pgtap-catalog-pub'), 'Pub module', 1),
  ((select id from public.courses where slug = 'pgtap-catalog-draft'), 'Draft module', 1);

insert into public.lessons (module_id, title, position, free_preview)
values
  (
    (select m.id from public.modules m
      join public.courses c on c.id = m.course_id
     where c.slug = 'pgtap-catalog-pub'),
    'Published lesson',
    1,
    false
  ),
  (
    (select m.id from public.modules m
      join public.courses c on c.id = m.course_id
     where c.slug = 'pgtap-catalog-draft'),
    'Draft lesson',
    1,
    true
  );

select ok(
  (select catalog_code from public.courses where slug = 'pgtap-catalog-pub')
    ~ '^EDU-[0-9]{4,}$',
  'new courses receive EDU-#### catalog_code');

select ok(
  public.has_course_access(
    current_setting('t.alpha')::uuid,
    (select id from public.courses where slug = 'pgtap-catalog-pub')
  ),
  'has_course_access is true for a published flagship course');

select ok(
  not public.has_course_access(
    current_setting('t.alpha')::uuid,
    (select id from public.courses where slug = 'pgtap-catalog-draft')
  ),
  'has_course_access is false for a draft flagship course');

select throws_ok(
  $$ update public.courses
     set catalog_code = 'EDU-9999'
     where slug = 'pgtap-catalog-pub' $$,
  'P0001',
  'catalog_code is immutable',
  'catalog_code cannot change after create');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alpha'), 'role', 'authenticated')::text,
  true);

select isnt_empty(
  $$ select 1 from public.courses where slug = 'pgtap-catalog-pub' $$,
  'member can discover a published course');
select is_empty(
  $$ select 1 from public.courses where slug = 'pgtap-catalog-draft' $$,
  'member cannot discover a draft course');
select is_empty(
  $$ select 1 from public.lessons where title = 'Draft lesson' $$,
  'member cannot read a draft-course lesson even with free_preview');

select throws_ok(
  $$ insert into public.instructors (name) values ('Member instructor') $$,
  '42501',
  null,
  'authenticated cannot insert instructors');
select throws_ok(
  $$ insert into public.education_videos (course_id)
     values ((select id from public.courses where slug = 'pgtap-catalog-pub')) $$,
  '42501',
  null,
  'authenticated cannot insert education_videos');
select throws_ok(
  $$ update public.courses set status = 'archived' where slug = 'pgtap-catalog-pub' $$,
  '42501',
  null,
  'authenticated cannot update course status');

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
select is_empty(
  $$ select 1 from public.courses where slug = 'pgtap-catalog-draft' $$,
  'gc_staff authenticated does not privilege-bridge draft course reads');
select throws_ok(
  $$ insert into public.instructors (name) values ('Staff instructor') $$,
  '42501',
  null,
  'gc_staff authenticated still cannot insert instructors');
select throws_ok(
  $$ insert into public.courses (slug, title, is_flagship_free)
     values ('staff-catalog-write', 'Nope', true) $$,
  '42501',
  null,
  'gc_staff authenticated still cannot insert courses');

reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.catalog'), 'role', 'authenticated')::text,
  true);
set local role authenticated;
select set_config('t.catalog_org',
  (select public.create_org_and_membership('Catalog Films'))::text, true);

select ok(
  not public.has_course_access(
    current_setting('t.catalog')::uuid,
    (select id from public.courses where slug = 'pgtap-catalog-draft')
  ),
  'catalog membership does not grant draft course access');

select * from finish();
rollback;
