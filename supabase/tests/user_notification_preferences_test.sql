-- user_notification_preferences_test.sql
-- Own-row RLS: a user can write their prefs; a peer cannot read or
-- mutate them. DELETE stays revoked.

begin;
select plan(9);

select set_config('t.userA', gen_random_uuid()::text, false);
select set_config('t.userB', gen_random_uuid()::text, false);

insert into auth.users (id, email) values
  (current_setting('t.userA')::uuid, 'prefsA@test.example'),
  (current_setting('t.userB')::uuid, 'prefsB@test.example');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('t.userA'), 'role', 'authenticated')::text,
  true
);

select lives_ok(
  format(
    $$ insert into public.user_notification_preferences (user_id, title_queue_email)
       values (%L, false) $$,
    current_setting('t.userA')
  ),
  'user A can insert own notification prefs'
);

select is(
  (select title_queue_email from public.user_notification_preferences
    where user_id = current_setting('t.userA')::uuid),
  false,
  'user A can read own notification prefs'
);

select lives_ok(
  format(
    $$ update public.user_notification_preferences
       set education_email = true
       where user_id = %L $$,
    current_setting('t.userA')
  ),
  'user A can update own notification prefs'
);

select is(
  (select education_email from public.user_notification_preferences
    where user_id = current_setting('t.userA')::uuid),
  true,
  'user A update landed'
);

select throws_ok(
  format(
    $$ delete from public.user_notification_preferences where user_id = %L $$,
    current_setting('t.userA')
  ),
  '42501',
  null,
  'authenticated cannot DELETE notification prefs'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('t.userB'), 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*) from public.user_notification_preferences
    where user_id = current_setting('t.userA')::uuid)::int,
  0,
  'user B cannot see user A notification prefs'
);

select lives_ok(
  format(
    $$ update public.user_notification_preferences
       set title_queue_email = true
       where user_id = %L $$,
    current_setting('t.userA')
  ),
  'user B update against A is a no-op under RLS'
);

select throws_ok(
  format(
    $$ insert into public.user_notification_preferences (user_id)
       values (%L) $$,
    current_setting('t.userA')
  ),
  '42501',
  null,
  'user B cannot insert a row for user A'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('t.userA'), 'role', 'authenticated')::text,
  true
);

select is(
  (select title_queue_email from public.user_notification_preferences
    where user_id = current_setting('t.userA')::uuid),
  false,
  'user B could not flip user A email pref'
);

select * from finish();
rollback;
