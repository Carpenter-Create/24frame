-- social_profile_ensure_test.sql
-- Product lane: self-ensure may insert without a birth date.
-- Org invite / create_org_and_membership still does not create a profile
-- for anyone else.

begin;
select plan(5);

select set_config('t.self', gen_random_uuid()::text, false);
select set_config('t.other', gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.self')::uuid),
  (current_setting('t.other')::uuid);

select is(
  (
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'birth_date'
  ),
  'YES',
  'profiles.birth_date is nullable for ensure-without-form'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('t.self'), 'role', 'authenticated')::text,
  true
);

select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name)
    values (%L, 'selfone', 'Self One')
  $sql$, current_setting('t.self')),
  'self can insert a profile without inventing a birth_date'
);

select throws_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name)
    values (%L, 'otherone', 'Other One')
  $sql$, current_setting('t.other')),
  '42501',
  null,
  'session user cannot insert another person''s Social profile'
);

select set_config('t.org',
  (select public.create_org_and_membership('Invite Films'))::text, true);

select is(
  (select count(*) from public.profiles
    where id = current_setting('t.self')::uuid)::int,
  1,
  'create_org_and_membership does not add a second profile'
);
select is(
  (select count(*) from public.profiles
    where id = current_setting('t.other')::uuid)::int,
  0,
  'org create does not create another person''s Social profile'
);

reset role;
select * from finish();
rollback;
