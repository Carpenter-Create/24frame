-- group_dms_test.sql
-- iMessage-style group rooms on the Pack 4 spine. Same conversation id
-- converts on the first extra participant. Client cannot INSERT
-- participants. Mapping C. Do not touch groups.min_level.

begin;
select plan(34);

select set_config('t.alice',  gen_random_uuid()::text, false);
select set_config('t.bob',    gen_random_uuid()::text, false);
select set_config('t.carol',  gen_random_uuid()::text, false);
select set_config('t.dave',   gen_random_uuid()::text, false);
select set_config('t.eve',    gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.alice')::uuid),
  (current_setting('t.bob')::uuid),
  (current_setting('t.carol')::uuid),
  (current_setting('t.dave')::uuid),
  (current_setting('t.eve')::uuid);

select ok(
  to_regprocedure('public.add_conversation_participants(uuid, uuid[])') is not null,
  'add_conversation_participants exists');
select ok(
  to_regprocedure('public.set_group_conversation_title(uuid, text)') is not null,
  'set_group_conversation_title exists');
select ok(
  not has_table_privilege('authenticated', 'public.conversations', 'INSERT')
    and not has_table_privilege(
      'authenticated', 'public.conversation_participants', 'INSERT'),
  'authenticated still has no INSERT on conversations/participants');
select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'groups'
      and column_name = 'min_level'
  ),
  'groups.min_level is untouched');
select ok(
  not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'add_conversation_participants',
        'set_group_conversation_title',
        'get_dm_inbox',
        'shares_direct_conversation'
      )
      and (
        p.prosrc ilike '%is_gc_staff%'
        or p.prosrc like '%set_config(''24frame.%'
        or p.prosrc like '%current_setting(''24frame.%'
      )
  ),
  'group DM helpers do not call is_gc_staff and use no 24frame.* GUCs');
select ok(
  (select p.prosrc from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'shares_direct_conversation')
    not ilike '%kind = ''direct''%',
  'shares_direct_conversation includes group peers');

-- ---- profiles --------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'alicegdm', 'Alice Gdm', (current_date - interval '22 years')::date)
  $sql$, current_setting('t.alice')),
  'alice profile');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.bob'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'bobgdm', 'Bob Gdm', (current_date - interval '24 years')::date)
  $sql$, current_setting('t.bob')),
  'bob profile');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.carol'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'carolgdm', 'Carol Gdm', (current_date - interval '26 years')::date)
  $sql$, current_setting('t.carol')),
  'carol profile');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.dave'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'davegdm', 'Dave Gdm', (current_date - interval '28 years')::date)
  $sql$, current_setting('t.dave')),
  'dave profile');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.eve'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'evegdm', 'Eve Gdm', (current_date - interval '30 years')::date)
  $sql$, current_setting('t.eve')),
  'eve profile');

-- ---- 1:1 stays unique via dm_key ------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);

select lives_ok(
  format($sql$
    select set_config('t.conv', public.open_or_get_direct_conversation(%L)::text, true)
  $sql$, current_setting('t.bob')),
  'alice opens a 1:1 with bob');

select is(
  public.open_or_get_direct_conversation(current_setting('t.bob')::uuid)::text,
  current_setting('t.conv'),
  '1:1 stays unique via dm_key');

select lives_ok(
  format($sql$
    insert into public.messages (conversation_id, sender_id, body)
    values (%L, %L, 'prior hello')
  $sql$, current_setting('t.conv'), current_setting('t.alice')),
  'alice can send before convert');

-- ---- non-participant cannot add -------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.eve'), 'role', 'authenticated')::text,
  true);
select throws_ok(
  format($sql$
    select public.add_conversation_participants(%L, array[%L]::uuid[])
  $sql$, current_setting('t.conv'), current_setting('t.carol')),
  '42501',
  'not a participant',
  'non-participant cannot add');

-- ---- convert same id on first extra person --------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);

select is(
  public.add_conversation_participants(
    current_setting('t.conv')::uuid,
    array[current_setting('t.carol')::uuid]
  )::text,
  current_setting('t.conv'),
  'add returns the same conversation id');

select is(
  (select kind::text from public.conversations
    where id = current_setting('t.conv')::uuid),
  'group',
  'first extra participant converts kind to group');
select ok(
  (select dm_key from public.conversations
    where id = current_setting('t.conv')::uuid) is null,
  'converted group clears dm_key');
select is(
  (select count(*) from public.conversation_participants
    where conversation_id = current_setting('t.conv')::uuid
      and left_at is null)::int,
  3,
  'group has three active participants');

-- ---- new member reads prior messages --------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.carol'), 'role', 'authenticated')::text,
  true);
select is(
  (select count(*) from public.messages
    where conversation_id = current_setting('t.conv')::uuid
      and body = 'prior hello')::int,
  1,
  'new member can read messages from before they joined');

-- ---- inbox lists the group room -------------------------------------------
select ok(
  exists (
    select 1 from public.get_dm_inbox(10)
    where conversation_id = current_setting('t.conv')::uuid
      and kind = 'group'
      and peer_id is null
      and current_setting('t.alice')::uuid = any(participant_ids)
      and current_setting('t.bob')::uuid = any(participant_ids)
  ),
  'carol inbox lists the group room with participant ids');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);
select ok(
  exists (
    select 1 from public.get_dm_inbox(10)
    where conversation_id = current_setting('t.conv')::uuid
      and kind = 'group'
      and current_setting('t.carol')::uuid = any(participant_ids)
  ),
  'alice inbox lists the converted group room');

-- ---- blocked peer cannot be added -----------------------------------------
select lives_ok(
  format($sql$
    insert into public.blocks (blocker_id, blocked_id)
    values (%L, %L)
  $sql$, current_setting('t.alice'), current_setting('t.dave')),
  'alice can block dave');
select throws_ok(
  format($sql$
    select public.add_conversation_participants(%L, array[%L]::uuid[])
  $sql$, current_setting('t.conv'), current_setting('t.dave')),
  '42501',
  'blocked',
  'adding a blocked peer fails');

-- ---- optional title on group; not on a later 1:1 --------------------------
select lives_ok(
  format($sql$
    select public.set_group_conversation_title(%L, 'Desk room')
  $sql$, current_setting('t.conv')),
  'participant can set a group title');
select is(
  (select title from public.conversations
    where id = current_setting('t.conv')::uuid),
  'Desk room',
  'group title is stored');

select lives_ok(
  format($sql$
    select set_config(
      't.direct2',
      public.open_or_get_direct_conversation(%L)::text,
      true)
  $sql$, current_setting('t.bob')),
  'a new 1:1 with the original peer can open after convert');
select ok(
  current_setting('t.direct2') <> current_setting('t.conv'),
  'post-convert 1:1 is a new conversation id');
select is(
  (select kind::text from public.conversations
    where id = current_setting('t.direct2')::uuid),
  'direct',
  'post-convert 1:1 is kind=direct');
select ok(
  (select dm_key from public.conversations
    where id = current_setting('t.direct2')::uuid) is not null,
  'post-convert 1:1 has a dm_key');
select throws_ok(
  format($sql$
    select public.set_group_conversation_title(%L, 'Nope')
  $sql$, current_setting('t.direct2')),
  '22023',
  'title is for group threads',
  'title update is refused on a 1:1');

-- ---- group peer visibility when not discoverable --------------------------
reset role;
update public.profiles
   set discoverable = false
 where id = current_setting('t.carol')::uuid;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.alice'), 'role', 'authenticated')::text,
  true);
select is(
  (select count(*) from public.profiles
    where id = current_setting('t.carol')::uuid)::int,
  1,
  'alice can read a non-discoverable group peer');

-- ---- self add is rejected; client INSERT still refused --------------------
select throws_ok(
  format($sql$
    select public.add_conversation_participants(%L, array[%L]::uuid[])
  $sql$, current_setting('t.conv'), current_setting('t.alice')),
  '22023',
  'cannot add yourself',
  'self add is rejected');
select throws_ok(
  format($sql$
    insert into public.conversation_participants (conversation_id, user_id)
    values (%L, %L)
  $sql$, current_setting('t.conv'), current_setting('t.dave')),
  '42501',
  null,
  'client still cannot INSERT conversation_participants');

reset role;
select * from finish();
rollback;
