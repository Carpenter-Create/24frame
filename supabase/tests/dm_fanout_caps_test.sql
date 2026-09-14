-- dm_fanout_caps_test.sql
-- Class 6: explicit DM room / batch / broadcast caps and inbox hard max.
-- Mapping C. Existing direct_messages_test / group_dms_test stay the suite
-- for 1:1 and small-room paths.

begin;
select plan(16);

select set_config('t.alice', gen_random_uuid()::text, false);
select set_config('t.bob',   gen_random_uuid()::text, false);
select set_config('t.carol', gen_random_uuid()::text, false);
select set_config('t.dave',  gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.alice')::uuid),
  (current_setting('t.bob')::uuid),
  (current_setting('t.carol')::uuid),
  (current_setting('t.dave')::uuid);

select ok(
  (select p.prosrc from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_dm_inbox')
    ilike '%, 51)%',
  'get_dm_inbox hard max is 51 so the app can probe');

select ok(
  (select p.prosrc from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_dm_inbox')
    ilike '%limit 32%',
  'get_dm_inbox caps participant_ids at 32');

select ok(
  (select p.prosrc from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'broadcast_new_message')
    ilike '%limit 32%',
  'broadcast_new_message limits inbox fan-out to 32');

select ok(
  (select p.prosrc from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'add_conversation_participants')
    ilike '%room is full%',
  'add_conversation_participants names the room cap');

select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('conversations', 'conversation_participants', 'messages')
      and column_name = 'org_id'
  ),
  'Mapping C: no org_id on DM tables');

select ok(
  not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'get_dm_inbox',
        'add_conversation_participants',
        'broadcast_new_message'
      )
      and p.prosrc ilike '%is_gc_staff%'
  ),
  'class 6 helpers do not call is_gc_staff');

-- ---- profiles --------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'alicec6', 'Alice C6', (current_date - interval '22 years')::date)
  $sql$, current_setting('t.alice')),
  'alice profile');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.bob'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'bobc6', 'Bob C6', (current_date - interval '22 years')::date)
  $sql$, current_setting('t.bob')),
  'bob profile');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.carol'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'carolc6', 'Carol C6', (current_date - interval '22 years')::date)
  $sql$, current_setting('t.carol')),
  'carol profile');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.dave'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'davec6', 'Dave C6', (current_date - interval '22 years')::date)
  $sql$, current_setting('t.dave')),
  'dave profile');

-- ---- small room still works ------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    select set_config('t.conv', public.open_or_get_direct_conversation(%L)::text, true)
  $sql$, current_setting('t.bob')),
  'open 1:1');

select lives_ok(
  format($sql$
    select public.add_conversation_participants(%L, array[%L]::uuid[])
  $sql$, current_setting('t.conv'), current_setting('t.carol')),
  'adding one peer still works');

select is(
  (select count(*)::integer from public.conversation_participants
    where conversation_id = current_setting('t.conv')::uuid
      and left_at is null),
  3,
  'small room has three active members');

-- ---- batch cap (33 ids, no insert) ----------------------------------------
select throws_ok(
  format($sql$
    select public.add_conversation_participants(
      %L,
      array_fill(%L::uuid, array[33])
    )
  $sql$, current_setting('t.conv'), current_setting('t.dave')),
  '22023',
  'too many participants in one add',
  'a 33-peer add is refused before insert');

select is(
  (select count(*)::integer from public.conversation_participants
    where conversation_id = current_setting('t.conv')::uuid
      and left_at is null),
  3,
  'refused batch does not grow the room');

-- ---- room cap (fill to 32, then refuse) -----------------------------------
reset role;
create temp table t_c6_extra (id uuid primary key);
insert into t_c6_extra select gen_random_uuid() from generate_series(1, 29);
insert into auth.users (id) select id from t_c6_extra;
insert into public.profiles (id, handle, display_name, birth_date)
select id,
       'c6x' || row_number() over (order by id),
       'Extra ' || row_number() over (order by id),
       (current_date - interval '22 years')::date
from t_c6_extra;
insert into public.conversation_participants (conversation_id, user_id)
select current_setting('t.conv')::uuid, id
from t_c6_extra;

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);

select is(
  (select count(*)::integer from public.conversation_participants
    where conversation_id = current_setting('t.conv')::uuid
      and left_at is null),
  32,
  'fixture room is exactly 32');

select throws_ok(
  format($sql$
    select public.add_conversation_participants(%L, array[%L]::uuid[])
  $sql$, current_setting('t.conv'), current_setting('t.dave')),
  '22023',
  'room is full',
  'the 33rd active participant is refused');

select is(
  (select count(*)::integer from public.conversation_participants
    where conversation_id = current_setting('t.conv')::uuid
      and left_at is null),
  32,
  'full room stays at 32');

select * from finish();
rollback;
