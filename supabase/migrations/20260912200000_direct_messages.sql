-- ============================================================================
-- 20260912200000_direct_messages.sql
--
-- INTENT: Phase 1B Pack 4. Port the 24Frame direct-message slice onto this
-- dashboard as a NEW forward-only migration. Source of truth was live 24Frame
-- project qxribdfzkvffambaartp (migration version 20260912014715, name
-- direct_messages). Donor repo Carpenter-Create/24frame was not readable from
-- this agent and was not written. Donor SQL was not pasted blindly. Survivor
-- project is uevsculwzwlhxeamagwg. Do not apply this file to production from
-- this PR.
--
-- HARD CLASH (already resolved by Pack 0): Ask Globee tables stay
-- public.ai_conversations / public.ai_conversation_messages. This file creates
-- public.conversations / public.messages for DMs. Do not rename either pair.
--
-- MAPPING C (locked, unchanged from Packs 1–3):
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   all new FKs           to profiles.id
--   no org_id             on blocks / conversations / conversation_participants
--                         / messages
--   a user without an     active profile cannot open a DM or insert a block
--   org membership is     not required
--   do not wire           is_gc_staff into these social/DM policies or helpers
--                         as a privilege bridge
--   revoking a            membership does not delete profile / DMs / blocks
--
-- CREATE (if absent): conversation_kind enum (Pack 1 omitted it);
-- tables blocks, conversations, conversation_participants, messages
-- (reuse post_status from Pack 2 — do not recreate);
-- helpers + protect/stamp/refresh/broadcast + triggers + RLS.
--
-- GUC adaptation: donor `24frame.refreshing_last_message_at` /
-- `24frame.refreshing_unread` start with a digit and 42602 on set_config.
-- This file uses `app.refreshing_last_message_at` and `app.refreshing_unread`
-- (same app.* pattern as Packs 2–3).
--
-- OMIT:
--   donor org_status entirely. Dashboard org_status stays
--   registered|awaiting_payment|active|payment_lapsed|closed.
--   leaderboards (#16 HOLD). Social workspace UI/nav/routes.
--   Auth user cutover. media/S3. GitHub rename.
--   group-conversation productization (kind=group may exist in the enum).
--   donor notifications/subscriptions tables.
--   realtime.messages policies unless realtime.messages and realtime.send
--   already exist (do not invent a realtime install).
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TYPE (new name only), CREATE TABLE, CREATE FUNCTION, CREATE
-- TRIGGER, ENABLE RLS, GRANT, CREATE POLICY. No DROP of existing dashboard
-- objects. Forward-only. Historical Pack 0/1/2/3 migration files untouched.
-- ROLLBACK: drop public.messages, public.conversation_participants,
-- public.conversations, public.blocks, the Pack 4 functions/triggers,
-- profiles_select_conversation_peer, and enum conversation_kind.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enum required by LIVE Pack 4 tables.
--    Pack 1 omitted conversation_kind. post_status already exists (Pack 2).
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.conversation_kind as enum ('direct', 'group');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Tables (exact donor columns; FKs to profiles.id; no org_id)
-- ----------------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_id_idx
  on public.blocks (blocked_id);

create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  kind             public.conversation_kind not null default 'direct',
  dm_key           text unique,
  title            text,
  created_by       uuid references public.profiles(id) on delete set null,
  last_message_at  timestamptz,
  created_at       timestamptz not null default now(),
  constraint conversations_dm_key_for_kind check (
    (kind = 'direct' and dm_key is not null)
    or (kind = 'group' and dm_key is null)
  )
);

create table if not exists public.conversation_participants (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  joined_at        timestamptz not null default now(),
  last_read_at     timestamptz,
  unread_count     integer not null default 0,
  muted            boolean not null default false,
  left_at          timestamptz,
  primary key (conversation_id, user_id)
);

create index if not exists conversation_participants_active_user_idx
  on public.conversation_participants (user_id, left_at)
  where left_at is null;

-- Unpartitioned. Donor live PK is id only. Do not invent a partition PK.
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid references public.profiles(id) on delete set null,
  body             text,
  media            jsonb default '[]'::jsonb,
  status           public.post_status not null default 'active',
  created_at       timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

-- Mapping C: no org_id. Profile FKs are person/social, not catalog.
-- ON DELETE CASCADE here is donor personal-content cleanup
-- (auth.users → profiles → blocks/participants), not org-owned catalog rows.

-- ----------------------------------------------------------------------------
-- 3. Helpers (SECURITY DEFINER where the live donor is)
--    Do not call is_gc_staff.
-- ----------------------------------------------------------------------------

create or replace function public.direct_dm_key(p_a uuid, p_b uuid)
returns text
language sql
immutable
as $$
  select least(p_a::text, p_b::text) || ':' || greatest(p_a::text, p_b::text);
$$;

create or replace function public.caller_may_inspect(p_user uuid)
returns boolean
language sql
stable
as $$
  select p_user = (select auth.uid())
    or (select auth.role()) = 'service_role';
$$;

create or replace function public.is_blocked_either_way(p_a uuid, p_b uuid)
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
      from public.blocks b
      where (b.blocker_id = p_a and b.blocked_id = p_b)
         or (b.blocker_id = p_b and b.blocked_id = p_a)
    );
$$;

create or replace function public.is_active_conversation_participant(
  p_conversation uuid,
  p_user uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    public.caller_may_inspect(p_user)
    and exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = p_conversation
        and cp.user_id = p_user
        and cp.left_at is null
    );
$$;

create or replace function public.conversation_has_block(
  p_conversation uuid,
  p_user uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    public.caller_may_inspect(p_user)
    and exists (
      select 1
      from public.conversation_participants peer
      where peer.conversation_id = p_conversation
        and peer.user_id <> p_user
        and public.is_blocked_either_way(p_user, peer.user_id)
    );
$$;

create or replace function public.can_access_conversation(
  p_conversation uuid,
  p_user uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    public.caller_may_inspect(p_user)
    and public.is_active_profile(p_user)
    and public.is_active_conversation_participant(p_conversation, p_user)
    and not public.conversation_has_block(p_conversation, p_user);
$$;

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
        and c.kind = 'direct'
        and not public.is_blocked_either_way(p_a, p_b)
    );
$$;

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

  if p_peer is null or p_peer = me then
    raise exception 'cannot message yourself' using errcode = '22023';
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

  if public.is_blocked_either_way(me, p_peer) then
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

  insert into public.conversation_participants (conversation_id, user_id)
  values (conv_id, me), (conv_id, p_peer)
  on conflict (conversation_id, user_id) do nothing;

  update public.conversation_participants
  set left_at = null
  where conversation_id = conv_id
    and user_id = me
    and left_at is not null;

  return conv_id;
end;
$$;

create or replace function public.get_dm_inbox(p_limit integer default 50)
returns table (
  conversation_id uuid,
  last_message_at timestamptz,
  unread_count integer,
  muted boolean,
  peer_id uuid
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
    peer.user_id
  from public.conversation_participants me
  join public.conversations c on c.id = me.conversation_id
  left join public.conversation_participants peer
    on peer.conversation_id = me.conversation_id
    and peer.user_id <> me.user_id
  where me.user_id = (select auth.uid())
    and me.left_at is null
    and c.kind = 'direct'
    and public.can_access_conversation(c.id, (select auth.uid()))
  order by c.last_message_at desc nulls last
  limit least(greatest(coalesce(p_limit, 50), 1), 50);
$$;

create or replace function public.mark_direct_conversation_read(
  p_conversation uuid,
  p_seen_at timestamptz
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_seen_at is null then
    return;
  end if;
  if not public.can_access_conversation(p_conversation, me) then
    raise exception 'blocked' using errcode = '42501';
  end if;

  update public.conversation_participants cp
  set last_read_at = p_seen_at
  from public.conversations c
  where cp.conversation_id = p_conversation
    and cp.user_id = me
    and c.id = p_conversation
    and (c.last_message_at is null or c.last_message_at <= p_seen_at);
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Protect / stamp / refresh / broadcast + matching triggers
-- ----------------------------------------------------------------------------

create or replace function public.protect_conversation_privileged_columns()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  -- Session flag for the message refresh loop. Custom GUC must use app.*,
  -- not a digit-leading schema name (set_config 42602).
  if current_setting('app.refreshing_last_message_at', true) = 'on' then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.last_message_at is not null then
      raise exception 'privileged conversation columns are not client-writable';
    end if;
    return new;
  end if;

  if new.last_message_at is distinct from old.last_message_at then
    raise exception 'privileged conversation columns are not client-writable';
  end if;

  return new;
end;
$$;

create or replace function public.protect_participant_privileged_columns()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if current_setting('app.refreshing_unread', true) = 'on' then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.unread_count <> 0 then
      raise exception 'privileged participant columns are not client-writable';
    end if;
    return new;
  end if;

  if new.conversation_id is distinct from old.conversation_id
     or new.user_id is distinct from old.user_id
     or new.joined_at is distinct from old.joined_at then
    raise exception 'privileged participant columns are not client-writable';
  end if;

  -- Mark-read zeros unread. Never COUNT(*).
  if new.last_read_at is distinct from old.last_read_at then
    new.unread_count := 0;
    return new;
  end if;

  if new.unread_count is distinct from old.unread_count then
    raise exception 'privileged participant columns are not client-writable';
  end if;

  return new;
end;
$$;

create or replace function public.stamp_message_created_at()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.created_at := clock_timestamp();
  return new;
end;
$$;

create or replace function public.refresh_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status <> 'active' then
    return new;
  end if;

  perform set_config('app.refreshing_last_message_at', 'on', true);
  perform set_config('app.refreshing_unread', 'on', true);

  update public.conversations
  set last_message_at = greatest(
    coalesce(last_message_at, new.created_at),
    new.created_at
  )
  where id = new.conversation_id;

  update public.conversation_participants
  set unread_count = unread_count + 1
  where conversation_id = new.conversation_id
    and left_at is null
    and (new.sender_id is null or user_id <> new.sender_id);

  return new;
end;
$$;

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

    for participant in
      select cp.user_id
      from public.conversation_participants cp
      where cp.conversation_id = new.conversation_id
        and cp.left_at is null
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

drop trigger if exists conversations_protect_privileged_columns
  on public.conversations;
create trigger conversations_protect_privileged_columns
  before insert or update on public.conversations
  for each row execute function public.protect_conversation_privileged_columns();

drop trigger if exists conversation_participants_protect_privileged_columns
  on public.conversation_participants;
create trigger conversation_participants_protect_privileged_columns
  before insert or update on public.conversation_participants
  for each row execute function public.protect_participant_privileged_columns();

drop trigger if exists messages_stamp_created_at on public.messages;
create trigger messages_stamp_created_at
  before insert on public.messages
  for each row execute function public.stamp_message_created_at();

drop trigger if exists messages_refresh_conversation on public.messages;
create trigger messages_refresh_conversation
  after insert on public.messages
  for each row execute function public.refresh_conversation_on_message();

drop trigger if exists messages_broadcast on public.messages;
create trigger messages_broadcast
  after insert on public.messages
  for each row execute function public.broadcast_new_message();

-- Trigger functions: EXECUTE is checked at CREATE TRIGGER, not at fire.
revoke execute on function public.protect_conversation_privileged_columns()
  from public, anon, authenticated, service_role;
revoke execute on function public.protect_participant_privileged_columns()
  from public, anon, authenticated, service_role;
revoke execute on function public.stamp_message_created_at()
  from public, anon, authenticated, service_role;
revoke execute on function public.refresh_conversation_on_message()
  from public, anon, authenticated, service_role;
revoke execute on function public.broadcast_new_message()
  from public, anon, authenticated, service_role;

revoke execute on function public.direct_dm_key(uuid, uuid) from public, anon;
revoke execute on function public.caller_may_inspect(uuid) from public, anon;
revoke execute on function public.is_blocked_either_way(uuid, uuid)
  from public, anon;
revoke execute on function public.is_active_conversation_participant(uuid, uuid)
  from public, anon;
revoke execute on function public.conversation_has_block(uuid, uuid)
  from public, anon;
revoke execute on function public.can_access_conversation(uuid, uuid)
  from public, anon;
revoke execute on function public.shares_direct_conversation(uuid, uuid)
  from public, anon;
revoke execute on function public.open_or_get_direct_conversation(uuid)
  from public, anon;
revoke execute on function public.get_dm_inbox(integer) from public, anon;
revoke execute on function public.mark_direct_conversation_read(uuid, timestamptz)
  from public, anon;

grant execute on function public.direct_dm_key(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.caller_may_inspect(uuid)
  to authenticated, service_role;
grant execute on function public.is_blocked_either_way(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.is_active_conversation_participant(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.conversation_has_block(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.can_access_conversation(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.shares_direct_conversation(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.open_or_get_direct_conversation(uuid)
  to authenticated, service_role;
grant execute on function public.get_dm_inbox(integer)
  to authenticated, service_role;
grant execute on function public.mark_direct_conversation_read(uuid, timestamptz)
  to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. RLS — authenticated only, fail-closed. Do not mention is_gc_staff.
--    Client cannot INSERT conversations or participants (RPC opens).
--    No client UPDATE/DELETE on messages.
--    anon gets no table grants (dashboard convention).
-- ----------------------------------------------------------------------------
alter table public.blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()));

drop policy if exists blocks_insert_self on public.blocks;
create policy blocks_insert_self on public.blocks
  for insert to authenticated
  with check (
    blocker_id = (select auth.uid())
    and blocker_id <> blocked_id
    and public.is_active_profile((select auth.uid()))
  );

drop policy if exists blocks_delete_self on public.blocks;
create policy blocks_delete_self on public.blocks
  for delete to authenticated
  using (blocker_id = (select auth.uid()));

drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant on public.conversations
  for select to authenticated
  using (public.can_access_conversation(id, (select auth.uid())));

drop policy if exists conversation_participants_select
  on public.conversation_participants;
create policy conversation_participants_select on public.conversation_participants
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.can_access_conversation(conversation_id, (select auth.uid()))
  );

drop policy if exists conversation_participants_update_self
  on public.conversation_participants;
create policy conversation_participants_update_self
  on public.conversation_participants
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
  for select to authenticated
  using (public.can_access_conversation(conversation_id, (select auth.uid())));

drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and status = 'active'::public.post_status
    and public.can_access_conversation(conversation_id, (select auth.uid()))
  );

drop policy if exists profiles_select_conversation_peer on public.profiles;
create policy profiles_select_conversation_peer on public.profiles
  for select to authenticated
  using (public.shares_direct_conversation((select auth.uid()), id));

revoke all on public.blocks from public, anon;
revoke update, truncate on public.blocks from authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert, delete, update on public.blocks to service_role;

revoke all on public.conversations from public, anon;
revoke insert, update, delete, truncate on public.conversations
  from authenticated;
grant select on public.conversations to authenticated;
grant select, insert, update, delete on public.conversations to service_role;

revoke all on public.conversation_participants from public, anon;
revoke insert, delete, truncate on public.conversation_participants
  from authenticated;
grant select, update on public.conversation_participants to authenticated;
grant select, insert, update, delete on public.conversation_participants
  to service_role;

revoke all on public.messages from public, anon;
revoke update, delete, truncate on public.messages from authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update, delete on public.messages to service_role;

-- Optional realtime.messages policies only if the dashboard already has
-- the realtime schema + realtime.send. Do not invent a realtime install.
do $$
begin
  if to_regclass('realtime.messages') is null
     or to_regprocedure('realtime.send(jsonb, text, text, boolean)') is null then
    raise notice
      'realtime.messages / realtime.send absent — skipped optional realtime DM policies';
    return;
  end if;

  execute 'drop policy if exists dm_realtime_insert on realtime.messages';
  execute $p$
    create policy dm_realtime_insert on realtime.messages
      for insert to authenticated
      with check (
        realtime.topic() ~ '^conversation:[0-9a-fA-F-]{36}$'
        and public.can_access_conversation(
          (substring(realtime.topic() from 14))::uuid,
          (select auth.uid())
        )
      )
  $p$;

  execute 'drop policy if exists dm_realtime_select on realtime.messages';
  execute $p$
    create policy dm_realtime_select on realtime.messages
      for select to authenticated
      using (
        (
          realtime.topic() ~ '^conversation:[0-9a-fA-F-]{36}$'
          and public.can_access_conversation(
            (substring(realtime.topic() from 14))::uuid,
            (select auth.uid())
          )
        )
        or realtime.topic() = ('inbox:' || ((select auth.uid()))::text)
      )
  $p$;

  raise notice 'realtime.messages DM policies applied';
end $$;

-- ----------------------------------------------------------------------------
-- 6. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_org_status text[];
  v_kind text[];
  v_bad_pol text;
  v_guc text;
  v_staff text;
begin
  if to_regclass('public.blocks') is null
     or to_regclass('public.conversations') is null
     or to_regclass('public.conversation_participants') is null
     or to_regclass('public.messages') is null then
    raise exception 'Pack 4 DM tables missing after create';
  end if;

  if to_regclass('public.ai_conversations') is null
     or to_regclass('public.ai_conversation_messages') is null then
    raise exception 'Ask Globee ai_* tables must remain; Pack 0 rename must stand';
  end if;

  if to_regclass('public.likes') is null then
    raise exception 'Pack 3 likes table missing after Pack 4';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'blocks', 'conversations', 'conversation_participants', 'messages'
      )
      and column_name = 'org_id'
  ) then
    raise exception 'DM tables must not have org_id (mapping C)';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversation_participants'
      and column_name = 'left_at'
  ) then
    raise exception 'conversation_participants.left_at missing (donor column)';
  end if;

  select array_agg(e.enumlabel::text order by e.enumsortorder) into v_kind
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'conversation_kind';

  if v_kind is distinct from array['direct','group']::text[] then
    raise exception 'conversation_kind enum mutated: %', v_kind;
  end if;

  select array_agg(e.enumlabel::text order by e.enumsortorder) into v_org_status
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'org_status';

  if v_org_status is distinct from
     array['registered','awaiting_payment','active','payment_lapsed','closed']::text[]
  then
    raise exception 'org_status enum mutated: %', v_org_status;
  end if;

  if exists (
    select 1 from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'conversations'
      and pol.polcmd = 'a'
  ) then
    raise exception 'conversations must have no INSERT policy';
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

  if exists (
    select 1 from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'messages'
      and pol.polcmd in ('w', 'd')
  ) then
    raise exception 'messages must have no UPDATE/DELETE policy';
  end if;

  select string_agg(c.relname || '.' || pol.polname, ', ' order by 1) into v_bad_pol
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and (
      c.relname in (
        'blocks', 'conversations', 'conversation_participants', 'messages'
      )
      or pol.polname = 'profiles_select_conversation_peer'
    )
    and (
      coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
      or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
    );
  if v_bad_pol is not null then
    raise exception 'Pack 4 policies must not call is_gc_staff: %', v_bad_pol;
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_staff
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'direct_dm_key',
      'caller_may_inspect',
      'is_blocked_either_way',
      'is_active_conversation_participant',
      'conversation_has_block',
      'can_access_conversation',
      'shares_direct_conversation',
      'open_or_get_direct_conversation',
      'get_dm_inbox',
      'mark_direct_conversation_read'
    )
    and p.prosrc ilike '%is_gc_staff%';
  if v_staff is not null then
    raise exception 'Pack 4 helpers must not call is_gc_staff: %', v_staff;
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_guc
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'protect_conversation_privileged_columns',
      'protect_participant_privileged_columns',
      'refresh_conversation_on_message'
    )
    and (
      p.prosrc like '%set_config(''24frame.%'
      or p.prosrc like '%current_setting(''24frame.%'
    );
  if v_guc is not null then
    raise exception 'Pack 4 functions still use 24frame.* GUCs: %', v_guc;
  end if;

  if has_table_privilege('authenticated', 'public.conversations', 'INSERT')
     or has_table_privilege('authenticated', 'public.conversation_participants', 'INSERT')
  then
    raise exception 'authenticated must not have INSERT on conversations/participants';
  end if;

  if has_table_privilege('authenticated', 'public.messages', 'UPDATE')
     or has_table_privilege('authenticated', 'public.messages', 'DELETE')
  then
    raise exception 'authenticated must not have UPDATE/DELETE on messages';
  end if;

  if not has_table_privilege('authenticated', 'public.messages', 'SELECT')
     or not has_table_privilege('authenticated', 'public.messages', 'INSERT')
     or not has_table_privilege('authenticated', 'public.blocks', 'SELECT')
     or not has_table_privilege('authenticated', 'public.blocks', 'INSERT')
     or not has_table_privilege('authenticated', 'public.blocks', 'DELETE')
  then
    raise exception 'authenticated grants do not match RLS on blocks/messages';
  end if;

  if has_table_privilege('anon', 'public.blocks', 'SELECT')
     or has_table_privilege('anon', 'public.conversations', 'SELECT')
     or has_table_privilege('anon', 'public.messages', 'SELECT')
  then
    raise exception 'anon must not have table grants on DM tables';
  end if;

  raise notice
    'direct messages applied; mapping C FKs to profiles; org_status unchanged; ai_* tables preserved';
end $$;
