-- ============================================================================
-- 20260912230000_group_dms.sql
--
-- INTENT: Productize Pack 4 group DMs as iMessage-style rooms on the LIVE
-- conversations spine. Same conversation id when a 1:1 gains a third
-- person. Donor SSOT was docs/24Frame-Data-Model.md §16 (title is for
-- group threads; dm_key only for kind=direct). No donor add-member RPC
-- existed. Survivor project is uevsculwzwlhxeamagwg. Do not apply this
-- file to production from this PR. CoS merges and applies.
--
-- MAPPING C (locked, unchanged from Packs 1–4):
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   all new FKs           none — reuse conversations / participants
--   no org_id             on conversations / conversation_participants
--                         / messages / blocks
--   a user without an     active profile cannot add people
--   org membership is     not required
--   do not wire           is_gc_staff into these social/DM policies or
--                         helpers as a privilege bridge
--
-- CREATE (if absent): add_conversation_participants,
-- set_group_conversation_title. REPLACE get_dm_inbox return shape
-- (drop + create: kind, title, participant_ids). REPLACE
-- shares_direct_conversation so group peers are readable (existing
-- profiles_select_conversation_peer stays).
--
-- OMIT:
--   gated community Exclusive groups UI / groups.min_level product.
--   membership_tiers. New group-chat tables. 24frame-media.
--   authenticated INSERT on conversations or conversation_participants.
--   Auth cutover. Expo. Repo rename. Donor apply.
--   Historical Pack 0–4 / #16 migration files untouched.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE OR REPLACE FUNCTION, DROP FUNCTION get_dm_inbox(integer) then
-- recreate with added columns, GRANT. No DROP of tables. Forward-only.
-- ROLLBACK: restore Pack 4 get_dm_inbox / shares_direct_conversation
-- bodies; drop add_conversation_participants and
-- set_group_conversation_title.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Group peers must be readable. shares_direct_conversation was
--    kind=direct only. Drop that filter. Do not call is_gc_staff.
-- ----------------------------------------------------------------------------
create or replace function public.shares_direct_conversation(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    (public.caller_may_inspect(p_a) or public.caller_may_inspect(p_b))
    and exists (
      select 1
      from public.conversation_participants a
      join public.conversation_participants b
        on a.conversation_id = b.conversation_id
      join public.conversations c on c.id = a.conversation_id
      where a.user_id = p_a
        and b.user_id = p_b
        and a.left_at is null
        and not public.is_blocked_either_way(p_a, p_b)
    );
$$;

-- ----------------------------------------------------------------------------
-- 2. Inbox lists 1:1 and group rooms. Return type grows, so drop first.
-- ----------------------------------------------------------------------------
drop function if exists public.get_dm_inbox(integer);

create function public.get_dm_inbox(p_limit integer default 50)
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
      from public.conversation_participants peer
      where peer.conversation_id = me.conversation_id
        and peer.user_id <> me.user_id
        and peer.left_at is null
    ), array[]::uuid[])
  from public.conversation_participants me
  join public.conversations c on c.id = me.conversation_id
  where me.user_id = (select auth.uid())
    and me.left_at is null
    and public.can_access_conversation(c.id, (select auth.uid()))
  order by c.last_message_at desc nulls last
  limit least(greatest(coalesce(p_limit, 50), 1), 50);
$$;

-- ----------------------------------------------------------------------------
-- 3. Add people. First extra participant converts the same row to group.
--    Client has no INSERT on participants. Do not call is_gc_staff.
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

  if not public.is_active_profile(me) then
    raise exception 'inactive profile' using errcode = '42501';
  end if;

  if not public.is_active_conversation_participant(p_conversation, me) then
    raise exception 'not a participant' using errcode = '42501';
  end if;

  if not public.can_access_conversation(p_conversation, me) then
    raise exception 'blocked' using errcode = '42501';
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

-- ----------------------------------------------------------------------------
-- 4. Optional title. Group threads only. Participants stay first.
-- ----------------------------------------------------------------------------
create or replace function public.set_group_conversation_title(
  p_conversation uuid,
  p_title text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := (select auth.uid());
  v_kind public.conversation_kind;
  v_title text;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_conversation is null then
    raise exception 'conversation not found' using errcode = 'P0002';
  end if;

  if not public.is_active_profile(me) then
    raise exception 'inactive profile' using errcode = '42501';
  end if;

  if not public.can_access_conversation(p_conversation, me) then
    raise exception 'blocked' using errcode = '42501';
  end if;

  select c.kind
    into v_kind
  from public.conversations c
  where c.id = p_conversation;

  if v_kind is null then
    raise exception 'conversation not found' using errcode = 'P0002';
  end if;

  if v_kind <> 'group' then
    raise exception 'title is for group threads' using errcode = '22023';
  end if;

  v_title := nullif(btrim(p_title), '');
  if v_title is not null and char_length(v_title) > 80 then
    raise exception 'title too long' using errcode = '22023';
  end if;

  update public.conversations
  set title = v_title
  where id = p_conversation;
end;
$$;

revoke execute on function public.get_dm_inbox(integer) from public, anon;
revoke execute on function public.add_conversation_participants(uuid, uuid[])
  from public, anon;
revoke execute on function public.set_group_conversation_title(uuid, text)
  from public, anon;

grant execute on function public.get_dm_inbox(integer)
  to authenticated, service_role;
grant execute on function public.add_conversation_participants(uuid, uuid[])
  to authenticated, service_role;
grant execute on function public.set_group_conversation_title(uuid, text)
  to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_inbox text;
  v_staff text;
  v_guc text;
  v_kind_filter text;
begin
  if to_regprocedure('public.add_conversation_participants(uuid, uuid[])') is null then
    raise exception 'add_conversation_participants missing';
  end if;

  if to_regprocedure('public.set_group_conversation_title(uuid, text)') is null then
    raise exception 'set_group_conversation_title missing';
  end if;

  if to_regprocedure('public.get_dm_inbox(integer)') is null then
    raise exception 'get_dm_inbox missing after recreate';
  end if;

  select pg_get_function_result(p.oid) into v_inbox
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'get_dm_inbox';

  if v_inbox is null
     or v_inbox not ilike '%kind%'
     or v_inbox not ilike '%title%'
     or v_inbox not ilike '%participant_ids%' then
    raise exception 'get_dm_inbox must return kind, title, participant_ids: %', v_inbox;
  end if;

  select p.prosrc into v_kind_filter
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'shares_direct_conversation';

  if v_kind_filter is null or v_kind_filter ilike '%kind = ''direct''%' then
    raise exception 'shares_direct_conversation must include group peers';
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_staff
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'shares_direct_conversation',
      'get_dm_inbox',
      'add_conversation_participants',
      'set_group_conversation_title'
    )
    and p.prosrc ilike '%is_gc_staff%';
  if v_staff is not null then
    raise exception 'group DM helpers must not call is_gc_staff: %', v_staff;
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_guc
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'shares_direct_conversation',
      'get_dm_inbox',
      'add_conversation_participants',
      'set_group_conversation_title'
    )
    and (
      p.prosrc like '%set_config(''24frame.%'
      or p.prosrc like '%current_setting(''24frame.%'
    );
  if v_guc is not null then
    raise exception 'group DM helpers still use 24frame.* GUCs: %', v_guc;
  end if;

  if has_table_privilege('authenticated', 'public.conversations', 'INSERT')
     or has_table_privilege('authenticated', 'public.conversation_participants', 'INSERT')
  then
    raise exception 'authenticated must not have INSERT on conversations/participants';
  end if;

  if exists (
    select 1 from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'conversation_participants'
      and pol.polcmd in ('a', 'd')
  ) then
    raise exception 'conversation_participants must have no INSERT/DELETE policy';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'groups'
      and column_name = 'min_level'
  ) then
    raise exception 'groups.min_level must remain (this file must not drop it)';
  end if;

  raise notice
    'group DMs applied; Pack 4 spine reused; authenticated still RPC-only for membership';
end $$;
