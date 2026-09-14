-- profiles_select_active_public_test.sql
-- Active public handles must be selectable by other authenticated
-- members even when discoverable is false. Self still sees own row.
-- Inactive + not-discoverable stays hidden from others.

begin;
select plan(6);

select set_config('t.alice', gen_random_uuid()::text, false);
select set_config('t.bob',   gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.alice')::uuid),
  (current_setting('t.bob')::uuid);

reset role;
insert into public.profiles (id, handle, display_name, discoverable)
values
  (current_setting('t.alice')::uuid, 'alicepub', 'Alice Pub', true),
  (current_setting('t.bob')::uuid,   'bobhidden', 'Bob Hidden', false);

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

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.bob'), 'role', 'authenticated')::text,
  true);

select is(
  (select handle from public.profiles
    where id = current_setting('t.bob')::uuid),
  'bobhidden',
  'bob can read his own non-discoverable row');

reset role;
update public.profiles
   set status = 'deactivated',
       discoverable = false
 where id = current_setting('t.bob')::uuid;

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);

select is(
  (select count(*) from public.profiles
    where id = current_setting('t.bob')::uuid)::int,
  0,
  'alice cannot read an inactive non-discoverable profile');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.bob'), 'role', 'authenticated')::text,
  true);

select is(
  (select handle from public.profiles
    where id = current_setting('t.bob')::uuid),
  'bobhidden',
  'bob can still read his own inactive row');

reset role;
select * from finish();
rollback;
