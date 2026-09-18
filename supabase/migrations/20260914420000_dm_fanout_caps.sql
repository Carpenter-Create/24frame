-- ============================================================================
-- 20260914420000_dm_fanout_caps.sql
--
-- INTENT: Remediation class 6. Data Access — DM fan-out and DM list reads
-- cannot be unbounded. Group / multi-party message delivery looped every
-- active participant on insert (realtime inbox) and add_conversation_participants
-- accepted an unbounded peer array. get_dm_inbox silently capped at 50.
-- Named path + cardinality; no silent caps.
--
-- ACCESS PATH + CARDINALITY:
--   add_conversation_participants(p_conversation, p_peers)
--     — one RPC batch. Cardinality ≤ 32 peers. Resulting active room ≤ 32.
--   refresh_conversation_on_message
--     — one set-based UPDATE of unread_count. Cardinality = active room (≤32
--       after the add gate). Not a per-row client loop.
--   broadcast_new_message
--     — conversation channel once, then inbox:user_id per active participant.
--       Loop LIMIT 32 (same as the room). No async remainder: a legal room
--       fits the batch. Oversized legacy rooms are a residual (see below).
--   get_dm_inbox(p_limit)
--     — caller's active rooms, last_message_at desc. App probes 51.
--       Hard max 51. participant_ids per row ≤ 32.
--   messages thread (app)
--     — one conversation_id, status=active, created_at+id keyset.
--       Cap 50 (+1 probe). Existing messages_conversation_created_idx.
--
-- MAPPING C (locked, unchanged): profiles.id. No org_id on conversations /
-- conversation_participants / messages. Do not call is_gc_staff. Exclusive
-- rooms stay iMessage-style multi-party DMs, not gated groups.min_level.
--
-- OMIT: Education. Redis/partition. Social Home (class 5). my_* RPCs.
-- Media author. Group-delete. Avatar. Figma. Ask Globee /ai_conversations.
--
-- Why REPLACE (same signatures): CREATE OR REPLACE keeps argument lists.
-- get_dm_inbox return shape is unchanged (kind, title, participant_ids).
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE OR REPLACE FUNCTION on get_dm_inbox, add_conversation_participants,
-- broadcast_new_message. GRANT/REVOKE EXECUTE unchanged. No table, column,
-- policy, trigger, or row changes. Forward-only.
-- CoS applies after merge + founder yes. Prod SQL apply needed after merge.
-- ROLLBACK: restore function bodies from 20260912230000_group_dms.sql
-- (inbox + add) and 20260912200000_direct_messages.sql (broadcast).
--
-- Residual: a room already larger than 32 (none expected; live count was 0
-- at Pack 4 cutover) keeps its members. Adds are refused. Broadcast notifies
-- 32 inbox channels. Unread increment remains set-based for every active
-- non-sender — do not silently skip unread on a legacy oversized room.
-- ============================================================================

-- 32 = SOCIAL_DM_ROOM_LIMIT / SOCIAL_DM_FANOUT_BATCH / SOCIAL_DM_ADD_BATCH_LIMIT
-- 51 = SOCIAL_DM_INBOX_LIMIT (50) + 1 probe
-- Keep in lockstep with src/lib/social-dm-bounds.ts

-- ----------------------------------------------------------------------------
-- 1. Inbox: raise hard max so the app can probe. Cap participant_ids.
-- ----------------------------------------------------------------------------
create or replace function public.get_dm_inbox(p_limit integer default 50)
returns table (
  conversation_id uuid,
  last_message_at timestamptz,
  unread_count integer,
  muted boolean,
  peer_id uuid,
  kind public.conversation_kind,
  title text,
  participant_ids uuid[]
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    c.id,
    c.last_message_at,
    me.unread_count,
    me.muted,
    case
      when c.kind = 'direct' then (
        select peer.user_id
        from public.conversation_participants peer
        where peer.conversation_id = me.conversation_id
          and peer.user_id <> me.user_id
        order by peer.joined_at
        limit 1
      )
      else null
    end,
    c.kind,
    c.title,
    coalesce((
      select array_agg(peer.user_id order by peer.joined_at)
      from (
        select inner_peer.user_id, inner_peer.joined_at
        from public.conversation_participants inner_peer
        where inner_peer.conversation_id = me.conversation_id
          and inner_peer.user_id <> me.user_id
          and inner_peer.left_at is null
        order by inner_peer.joined_at, inner_peer.user_id
        limit 32
      ) peer
    ), array[]::uuid[])
  from public.conversation_participants me
  join public.conversations c on c.id = me.conversation_id
  where me.user_id = (select auth.uid())
    and me.left_at is null
    and public.can_access_conversation(c.id, (select auth.uid()))
  order by c.last_message_at desc nulls last
  limit least(greatest(coalesce(p_limit, 50), 1), 51);
$$;

comment on function public.get_dm_inbox(integer) is
  'Caller DM inbox. Bounded (≤51). participant_ids ≤32. Mapping C: no org_id.';

-- ----------------------------------------------------------------------------
-- 2. Add people: explicit batch + room caps. Same conversion rule.
-- ----------------------------------------------------------------------------
create or replace function public.add_conversation_participants(
  p_conversation uuid,
  p_peers uuid[]
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := (select auth.uid());
  peer uuid;
  v_kind public.conversation_kind;
  v_active integer;
  v_new integer;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_conversation is null then
    raise exception 'conversation not found' using errcode = 'P0002';
  end if;

  if p_peers is null or cardinality(p_peers) = 0 then
    raise exception 'no participants to add' using errcode = '22023';
  end if;

  -- ACCESS PATH: one add RPC. Cardinality ≤ 32. Not a silent truncate.
  if cardinality(p_peers) > 32 then
    raise exception 'too many participants in one add' using errcode = '22023';
  end if;

  if not public.is_active_profile(me) then
    raise exception 'inactive profile' using errcode = '42501';
  end if;

  if not public.is_active_conversation_participant(p_conversation, me) then
    raise exception 'not a participant' using errcode = '42501';
  end if;

  if not public.can_access_conversation(p_conversation, me) then
    raise exception 'blocked' using errcode = '42501';
  end if;

  select count(*)::integer
    into v_active
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation
    and cp.left_at is null;

  select count(*)::integer
    into v_new
  from (
    select distinct incoming.peer
    from unnest(p_peers) as incoming(peer)
    where incoming.peer is not null
  ) incoming
  where not exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation
      and cp.user_id = incoming.peer
      and cp.left_at is null
  );

  -- ACCESS PATH: active room including the caller. Cardinality ≤ 32.
  if v_active + v_new > 32 then
    raise exception 'room is full' using errcode = '22023';
  end if;

  foreach peer in array p_peers
  loop
    if peer is null then
      raise exception 'peer not found' using errcode = 'P0002';
    end if;

    if peer = me then
      raise exception 'cannot add yourself' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from public.profiles p
      where p.id = peer
    ) then
      raise exception 'peer not found' using errcode = 'P0002';
    end if;

    if not public.is_active_profile(peer) then
      raise exception 'inactive profile' using errcode = '42501';
    end if;

    if public.is_blocked_either_way(me, peer) then
      raise exception 'blocked' using errcode = '42501';
    end if;

    insert into public.conversation_participants (conversation_id, user_id)
    values (p_conversation, peer)
    on conflict (conversation_id, user_id) do update
      set left_at = null
      where public.conversation_participants.left_at is not null;
  end loop;

  select c.kind
    into v_kind
  from public.conversations c
  where c.id = p_conversation;

  select count(*)::integer
    into v_active
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation
    and cp.left_at is null;

  if v_kind = 'direct' and v_active >= 3 then
    update public.conversations
    set kind = 'group',
        dm_key = null
    where id = p_conversation;
  end if;

  return p_conversation;
end;
$$;

comment on function public.add_conversation_participants(uuid, uuid[]) is
  'Add peers to a DM room. Batch ≤32. Active room ≤32. Mapping C: no org_id.';

-- ----------------------------------------------------------------------------
-- 3. Message delivery fan-out: documented batch on the inbox loop.
-- ----------------------------------------------------------------------------
create or replace function public.broadcast_new_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  payload jsonb;
  participant record;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if to_regprocedure('realtime.send(jsonb, text, text, boolean)') is null then
    return new;
  end if;

  payload := jsonb_build_object(
    'id', new.id,
    'conversation_id', new.conversation_id,
    'sender_id', new.sender_id,
    'created_at', new.created_at
  );

  begin
    perform realtime.send(
      payload,
      'message',
      'conversation:' || new.conversation_id::text,
      true
    );

    -- ACCESS PATH: inbox fan-out per active participant.
    -- Cardinality ≤ 32 (SOCIAL_DM_FANOUT_BATCH). Room add is the gate.
    for participant in
      select cp.user_id
      from public.conversation_participants cp
      where cp.conversation_id = new.conversation_id
        and cp.left_at is null
      order by cp.user_id
      limit 32
    loop
      perform realtime.send(
        payload,
        'inbox',
        'inbox:' || participant.user_id::text,
        true
      );
    end loop;
  exception
    when others then
      null;
  end;

  return new;
end;
$$;

revoke execute on function public.get_dm_inbox(integer) from public, anon;
revoke execute on function public.add_conversation_participants(uuid, uuid[])
  from public, anon;
revoke execute on function public.broadcast_new_message() from public, anon, authenticated;

grant execute on function public.get_dm_inbox(integer)
  to authenticated, service_role;
grant execute on function public.add_conversation_participants(uuid, uuid[])
  to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_inbox text;
  v_add text;
  v_broadcast text;
  v_staff text;
  v_guc text;
begin
  select p.prosrc into v_inbox
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'get_dm_inbox';

  if v_inbox is null
     or v_inbox not ilike '%limit 32%'
     or v_inbox not ilike '%, 51)%'
  then
    raise exception 'get_dm_inbox must cap participant_ids at 32 and inbox at 51';
  end if;

  select p.prosrc into v_add
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'add_conversation_participants';

  if v_add is null
     or v_add not ilike '%too many participants in one add%'
     or v_add not ilike '%room is full%'
     or v_add not ilike '%> 32%'
  then
    raise exception 'add_conversation_participants must refuse batch/room > 32';
  end if;

  select p.prosrc into v_broadcast
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'broadcast_new_message';

  if v_broadcast is null or v_broadcast not ilike '%limit 32%' then
    raise exception 'broadcast_new_message must LIMIT inbox fan-out to 32';
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_staff
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'get_dm_inbox',
      'add_conversation_participants',
      'broadcast_new_message'
    )
    and p.prosrc ilike '%is_gc_staff%';
  if v_staff is not null then
    raise exception 'class 6 DM helpers must not call is_gc_staff: %', v_staff;
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_guc
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'get_dm_inbox',
      'add_conversation_participants',
      'broadcast_new_message'
    )
    and (
      p.prosrc like '%set_config(''24frame.%'
      or p.prosrc like '%current_setting(''24frame.%'
    );
  if v_guc is not null then
    raise exception 'class 6 DM helpers still use 24frame.* GUCs: %', v_guc;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('conversations', 'conversation_participants', 'messages')
      and column_name = 'org_id'
  ) then
    raise exception 'Mapping C: no org_id on DM tables';
  end if;

  if has_table_privilege('authenticated', 'public.conversations', 'INSERT')
     or has_table_privilege('authenticated', 'public.conversation_participants', 'INSERT')
  then
    raise exception 'authenticated must not have INSERT on conversations/participants';
  end if;

  raise notice
    'class 6 DM fan-out caps applied; room/batch/broadcast 32; inbox hard max 51';
end $$;
