-- ============================================================================
-- 20260924190000_dm_membership_sealed.sql
--
-- INTENT: 1:1 membership is sealed. A group is a new conversation, never a
-- promoted direct thread. Cap stays 32 including the creator.
-- Draft only. Do not apply to production from this PR.
--
-- CREATE: create_group_conversation(uuid[]).
-- REPLACE: add_conversation_participants refuses. Signature stays so grants
-- hold. Mapping C. No org_id. Do not call is_gc_staff.
--
-- ROLLBACK: restore add_conversation_participants from
-- 20260914420000_dm_fanout_caps.sql and drop create_group_conversation.
-- ============================================================================

create or replace function public.add_conversation_participants(
  p_conversation uuid,
  p_peers uuid[]
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Membership is chosen when the thread is created. Adding into an
  -- existing 1:1 or group would promote or grow it. Both are out.
  raise exception 'membership is set at create' using errcode = '22023';
end;
$$;

comment on function public.add_conversation_participants(uuid, uuid[]) is
  'Refused. Membership is set at create. Mapping C: no org_id.';

create or replace function public.create_group_conversation(p_peers uuid[])
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := (select auth.uid());
  peer uuid;
  conv_id uuid;
  v_count integer;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not public.is_active_profile(me) then
    raise exception 'inactive profile' using errcode = '42501';
  end if;

  if p_peers is null or cardinality(p_peers) < 2 then
    raise exception 'a group needs at least two other people' using errcode = '22023';
  end if;

  -- ACCESS PATH: others in one create. Cardinality ≤ 31 so the room
  -- including the creator stays ≤ 32. Not a silent truncate.
  if cardinality(p_peers) > 31 then
    raise exception 'room is full' using errcode = '22023';
  end if;

  select count(*)::integer
    into v_count
  from (
    select distinct incoming.peer
    from unnest(p_peers) as incoming(peer)
    where incoming.peer is not null
      and incoming.peer <> me
  ) incoming;

  if v_count > 31 then
    raise exception 'room is full' using errcode = '22023';
  end if;

  if v_count < 2 then
    raise exception 'a group needs at least two other people' using errcode = '22023';
  end if;

  foreach peer in array p_peers
  loop
    if peer is null or peer = me then
      raise exception 'cannot add yourself' using errcode = '22023';
    end if;

    if not exists (
      select 1 from public.profiles p where p.id = peer
    ) then
      raise exception 'peer not found' using errcode = 'P0002';
    end if;

    if not public.is_active_profile(peer) then
      raise exception 'inactive profile' using errcode = '42501';
    end if;

    if public.is_blocked_either_way(me, peer) then
      raise exception 'blocked' using errcode = '42501';
    end if;
  end loop;

  insert into public.conversations (kind, dm_key, created_by)
  values ('group', null, me)
  returning id into conv_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (conv_id, me);

  insert into public.conversation_participants (conversation_id, user_id)
  select conv_id, incoming.peer
  from (
    select distinct unnest_peer.peer
    from unnest(p_peers) as unnest_peer(peer)
    where unnest_peer.peer is not null
      and unnest_peer.peer <> me
  ) incoming;

  return conv_id;
end;
$$;

comment on function public.create_group_conversation(uuid[]) is
  'Fresh group. Others ≤31. Active room ≤32 including creator. Does not touch a direct thread. Mapping C: no org_id.';

revoke execute on function public.create_group_conversation(uuid[])
  from public, anon;
grant execute on function public.create_group_conversation(uuid[])
  to authenticated, service_role;

do $$
declare
  v_add text;
  v_create text;
  v_staff text;
begin
  select p.prosrc into v_add
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'add_conversation_participants';

  if v_add is null or v_add not ilike '%membership is set at create%' then
    raise exception 'add_conversation_participants must refuse existing threads';
  end if;

  if v_add ilike '%kind = ''group''%' then
    raise exception 'add_conversation_participants must not promote a direct thread';
  end if;

  select p.prosrc into v_create
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'create_group_conversation';

  if v_create is null or v_create not ilike '%room is full%' then
    raise exception 'create_group_conversation must name the room cap';
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_staff
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('add_conversation_participants', 'create_group_conversation')
    and p.prosrc ilike '%is_gc_staff%';
  if v_staff is not null then
    raise exception 'membership helpers must not call is_gc_staff: %', v_staff;
  end if;
end;
$$;
