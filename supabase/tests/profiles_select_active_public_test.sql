-- profiles_select_active_public_test.sql
-- Active public handles must be selectable by other authenticated
-- members even when discoverable is false. Self still sees own row.
-- Inactive + not-discoverable stays hidden from others.
-- Do not UPDATE profiles.status here — that column is privileged
-- (protect_profile_privileged_columns). Seed the inactive row instead.

begin;
select plan(6);

select set_config('t.alice', gen_random_uuid()::text, false);
select set_config('t.bob',   gen_random_uuid()::text, false);
select set_config('t.carol', gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.alice')::uuid),
  (current_setting('t.bob')::uuid),
  (current_setting('t.carol')::uuid);

reset role;
insert into public.profiles (id, handle, display_name, discoverable, status)
values
  (current_setting('t.alice')::uuid, 'alicepub', 'Alice Pub', true, 'active'),
  (current_setting('t.bob')::uuid,   'bobhidden', 'Bob Hidden', false, 'active'),
  (current_setting('t.carol')::uuid, 'carolinact', 'Carol Inactive', false, 'deactivated');

select ok(
  exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'profiles'
      and pol.polname = 'profiles_select'
      and pg_get_expr(pol.polqual, pol.polrelid) like '%status = ''active''%'
      and pg_get_expr(pol.polqual, pol.polrelid) not like '%status <> ''active''%'
  ),
  'profiles_select allows active rows and does not invert status');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);

select is(
  (select handle from public.profiles
    where id = current_setting('t.bob')::uuid),
  'bobhidden',
  'alice can read an active non-discoverable public handle');

select is(
  (select handle from public.profiles
    where id = current_setting('t.alice')::uuid),
  'alicepub',
  'alice can read her own profile');

select is(
  (select count(*) from public.profiles
    where id = current_setting('t.carol')::uuid)::int,
  0,
  'alice cannot read an inactive non-discoverable profile');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.bob'), 'role', 'authenticated')::text,
  true);

select is(
  (select handle from public.profiles
    where id = current_setting('t.bob')::uuid),
  'bobhidden',
  'bob can read his own non-discoverable row');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.carol'), 'role', 'authenticated')::text,
  true);

select is(
  (select handle from public.profiles
    where id = current_setting('t.carol')::uuid),
  'carolinact',
  'carol can still read her own inactive row');

reset role;
select * from finish();
rollback;
