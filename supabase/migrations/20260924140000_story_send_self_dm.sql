-- ============================================================================
-- 20260924140000_story_send_self_dm.sql
--
-- INTENT: Stories send DM craft v1.2 §2b. Self is a valid single recipient
-- (note-to-self). open_or_get_direct_conversation used to raise
-- 'cannot message yourself'. A self pair uses one participant row so the
-- insert does not propose the same (conversation, user) twice.
--
-- DESTRUCTIVE OPS: none. CREATE OR REPLACE FUNCTION only. Forward-only.
-- Do not apply to production from this agent session.
-- ROLLBACK: restore the previous function body that rejects p_peer = me.
-- ============================================================================

create or replace function public.open_or_get_direct_conversation(p_peer uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := (select auth.uid());
  key text;
  conv_id uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_peer is null then
    raise exception 'peer not found' using errcode = 'P0002';
  end if;

  if not public.is_active_profile(me) then
    raise exception 'inactive profile' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_peer
  ) then
    raise exception 'peer not found' using errcode = 'P0002';
  end if;

  if not public.is_active_profile(p_peer) then
    raise exception 'inactive profile' using errcode = '42501';
  end if;

  if p_peer <> me and public.is_blocked_either_way(me, p_peer) then
    raise exception 'blocked' using errcode = '42501';
  end if;

  key := public.direct_dm_key(me, p_peer);

  insert into public.conversations (kind, dm_key, created_by)
  values ('direct', key, me)
  on conflict (dm_key) do nothing;

  select c.id
    into conv_id
  from public.conversations c
  where c.dm_key = key;

  if conv_id is null then
    raise exception 'could not open conversation' using errcode = 'P0002';
  end if;

  if p_peer = me then
    insert into public.conversation_participants (conversation_id, user_id)
    values (conv_id, me)
    on conflict (conversation_id, user_id) do nothing;
  else
    insert into public.conversation_participants (conversation_id, user_id)
    values (conv_id, me), (conv_id, p_peer)
    on conflict (conversation_id, user_id) do nothing;
  end if;

  update public.conversation_participants
  set left_at = null
  where conversation_id = conv_id
    and user_id = me
    and left_at is not null;

  return conv_id;
end;
$$;
