-- social_follow_alerts_test.sql
-- Live follows counts + recipient-targeted new_follower alerts.
-- Catalog notifications stay org-scoped. Pref off skips the insert.

begin;
select plan(20);

select set_config('t.follower', gen_random_uuid()::text, false);
select set_config('t.followee', gen_random_uuid()::text, false);
select set_config('t.mate', gen_random_uuid()::text, false);
select set_config('t.stranger', gen_random_uuid()::text, false);
select set_config('t.org', gen_random_uuid()::text, false);

insert into auth.users (id, email) values
  (current_setting('t.follower')::uuid, 'follower@test.example'),
  (current_setting('t.followee')::uuid, 'followee@test.example'),
  (current_setting('t.mate')::uuid, 'mate@test.example'),
  (current_setting('t.stranger')::uuid, 'stranger@test.example');

insert into public.organizations (id, name, status) values
  (current_setting('t.org')::uuid, 'Follow Org', 'active');

insert into public.memberships (user_id, org_id, role, status) values
  (current_setting('t.followee')::uuid, current_setting('t.org')::uuid, 'account_owner', 'active'),
  (current_setting('t.mate')::uuid, current_setting('t.org')::uuid, 'viewer', 'active');

insert into public.profiles (id, handle, display_name, birth_date)
values
  (current_setting('t.follower')::uuid, 'adamfollow', 'Adam', (current_date - interval '30 years')::date),
  (current_setting('t.followee')::uuid, 'joshfollow', 'Joshua', (current_date - interval '28 years')::date),
  (current_setting('t.mate')::uuid, 'orgmate', 'Mate', (current_date - interval '26 years')::date),
  (current_setting('t.stranger')::uuid, 'strangerf', 'Stranger', (current_date - interval '24 years')::date);

select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'follows' and column_name = 'id'
  ),
  'follows has no id column — counts must use follower_id / followee_id');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.follower'), 'role', 'authenticated')::text,
  true);

select lives_ok(
  format($sql$
    insert into public.follows (follower_id, followee_id)
    values (%L, %L)
  $sql$, current_setting('t.follower'), current_setting('t.followee')),
  'active profile can follow another profile');

select is(
  (select public.notify_new_follower(
    current_setting('t.followee')::uuid
  ) is not null),
  true,
  'notify_new_follower inserts for the followee when pref is missing (default on)');

select is(
  public.notify_new_follower(current_setting('t.followee')::uuid),
  null,
  'notify_new_follower rejects a repeat call for the same follow edge');

select is(
  (select count(*) from public.my_notifications()
    where kind = 'new_follower')::int,
  0,
  'follower does not see the followee alert');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.followee'), 'role', 'authenticated')::text,
  true);

select is(
  (select count(*) from public.follows
    where followee_id = current_setting('t.followee')::uuid)::int,
  1,
  'followee can count the inbound follow row');

select is(
  (select count(*) from public.my_notifications()
    where kind = 'new_follower')::int,
  1,
  'followee sees the new_follower alert');

select ok(
  exists (
    select 1
    from public.my_notifications()
    where kind = 'new_follower'
      and title = 'New follower'
      and body = '@adamfollow followed you'
      and source_refs->>'handle' = 'adamfollow'
      and source_refs->>'path' = '/social/u/adamfollow'
      and source_refs->>'actor_id' = current_setting('t.follower')
  ),
  'new_follower copy and source_refs come from the follower profile');

select is(public.my_unread_count(), 1, 'followee unread count includes new_follower');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.mate'), 'role', 'authenticated')::text,
  true);

select is(
  (select count(*) from public.my_notifications()
    where kind = 'new_follower')::int,
  0,
  'org mate does not see a recipient-targeted follow alert');

select is(
  (select count(*) from public.follows
    where follower_id = current_setting('t.follower')::uuid)::int,
  1,
  'third party can count a live follow edge for profile stats');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.stranger'), 'role', 'authenticated')::text,
  true);

select is(
  public.notify_new_follower(
    current_setting('t.followee')::uuid
  ),
  null,
  'notify_new_follower no-ops without a follow row');

reset role;

insert into public.user_notification_preferences (user_id, prefs)
values (
  current_setting('t.followee')::uuid,
  '{"new_follower":{"in_app":false,"email":false}}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.follower'), 'role', 'authenticated')::text,
  true);

select is(
  public.notify_new_follower(
    current_setting('t.followee')::uuid
  ),
  null,
  'notify_new_follower skips when new_follower in-app is off');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.followee'), 'role', 'authenticated')::text,
  true);

select is(
  (select count(*) from public.my_notifications()
    where kind = 'new_follower')::int,
  1,
  'pref-off retry does not add a second alert');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.follower'), 'role', 'authenticated')::text,
  true);

select throws_ok(
  format($sql$
    insert into public.notifications (kind, title, body, source_refs, recipient_user_id)
    values ('new_follower', 'T', 'b', '{}'::jsonb, %L)
  $sql$, current_setting('t.followee')),
  '42501',
  null,
  'authenticated cannot INSERT notifications directly');

reset role;

select throws_ok(
  format($sql$
    insert into public.notifications (org_id, kind, title, body, source_refs, recipient_user_id)
    values (%L, 'new_follower', 'T', 'b', '{}'::jsonb, %L)
  $sql$, current_setting('t.org'), current_setting('t.followee')),
  '23514',
  null,
  'new_follower cannot carry an org_id');

select ok(
  not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'follows'
      and (
        pg_get_expr(pol.polqual, pol.polrelid) ilike '%is_gc_staff%'
        or pg_get_expr(pol.polwithcheck, pol.polrelid) ilike '%is_gc_staff%'
      )
  ),
  'follows policies still do not call is_gc_staff');

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name = 'recipient_user_id'
  ),
  'notifications.recipient_user_id exists');

select ok(
  exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'notification_kind'
      and e.enumlabel = 'new_follower'
  ),
  'notification_kind includes new_follower');

select ok(
  exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'notification_sender'
      and e.enumlabel = 'member'
  ),
  'notification_sender includes member');

select * from finish();
rollback;
