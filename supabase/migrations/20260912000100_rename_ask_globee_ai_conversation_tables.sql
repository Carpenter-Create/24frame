-- ============================================================================
-- 20260912000100_rename_ask_globee_ai_conversation_tables.sql
--
-- INTENT: free public.conversations / public.conversation_messages for later
-- donor DMs (Phase 1B Packs 1–4, HOLD). Ask Globee / 24Frame AI history moves
-- to public.ai_conversations / public.ai_conversation_messages. Same rows,
-- same RLS (member_can view), same hard-delete exception.
--
-- DATA. ALTER TABLE ... RENAME keeps every row, column, default, and OID.
-- No COPY, no DROP, no backfill. Indexes, constraints, policies, triggers,
-- and grants stay attached and are renamed to match.
--
-- LEFT UNCHANGED. Enums conversation_role / conversation_thumb, including
-- value 'globee' (not required to compile). Column conversation_id. Function
-- name tg_touch_conversation (body retargeted). Packs 1–4 tables are not
-- created here.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- rename 2 tables + their indexes / constraints / policies / triggers;
-- replace tg_touch_conversation body; restate grants on the new names.
-- Forward-only. ROLLBACK: rename tables and dependents back.
-- ============================================================================

do $$
begin
  if to_regclass('public.ai_conversations') is not null then
    raise exception 'public.ai_conversations already exists';
  end if;
  if to_regclass('public.ai_conversation_messages') is not null then
    raise exception 'public.ai_conversation_messages already exists';
  end if;
  if to_regclass('public.conversations') is null then
    raise exception 'public.conversations missing; cannot rename';
  end if;
  if to_regclass('public.conversation_messages') is null then
    raise exception 'public.conversation_messages missing; cannot rename';
  end if;
end $$;

alter table public.conversations rename to ai_conversations;
alter table public.conversation_messages rename to ai_conversation_messages;

alter index public.conversations_org_pin_updated_idx
  rename to ai_conversations_org_pin_updated_idx;
alter index public.conversation_messages_thread_idx
  rename to ai_conversation_messages_thread_idx;
alter index public.conversation_messages_org_idx
  rename to ai_conversation_messages_org_idx;

alter table public.ai_conversations
  rename constraint conversations_pkey to ai_conversations_pkey;
alter table public.ai_conversations
  rename constraint conversations_title_nonempty to ai_conversations_title_nonempty;
alter table public.ai_conversations
  rename constraint conversations_org_id_fkey to ai_conversations_org_id_fkey;
alter table public.ai_conversations
  rename constraint conversations_created_by_fkey to ai_conversations_created_by_fkey;

alter table public.ai_conversation_messages
  rename constraint conversation_messages_pkey to ai_conversation_messages_pkey;
alter table public.ai_conversation_messages
  rename constraint conversation_messages_body_nonempty
  to ai_conversation_messages_body_nonempty;
alter table public.ai_conversation_messages
  rename constraint conversation_messages_globee_lead
  to ai_conversation_messages_globee_lead;
alter table public.ai_conversation_messages
  rename constraint conversation_messages_user_fields
  to ai_conversation_messages_user_fields;
alter table public.ai_conversation_messages
  rename constraint conversation_messages_conversation_id_fkey
  to ai_conversation_messages_conversation_id_fkey;
alter table public.ai_conversation_messages
  rename constraint conversation_messages_org_id_fkey
  to ai_conversation_messages_org_id_fkey;

alter trigger audit_conversations on public.ai_conversations
  rename to audit_ai_conversations;
alter trigger audit_conversation_messages on public.ai_conversation_messages
  rename to audit_ai_conversation_messages;
alter trigger set_updated_at_conversations on public.ai_conversations
  rename to set_updated_at_ai_conversations;
alter trigger touch_conversation_on_message on public.ai_conversation_messages
  rename to touch_ai_conversation_on_message;

create or replace function public.tg_touch_conversation()
  returns trigger language plpgsql set search_path = public as $$
begin
  update public.ai_conversations
    set updated_at = now()
    where id = new.conversation_id;
  return new;
end;
$$;

drop policy if exists conversations_select on public.ai_conversations;
drop policy if exists conversations_insert on public.ai_conversations;
drop policy if exists conversations_update on public.ai_conversations;
drop policy if exists conversations_delete on public.ai_conversations;
drop policy if exists conversation_messages_select on public.ai_conversation_messages;
drop policy if exists conversation_messages_insert on public.ai_conversation_messages;
drop policy if exists conversation_messages_update on public.ai_conversation_messages;
drop policy if exists conversation_messages_delete on public.ai_conversation_messages;

create policy ai_conversations_select on public.ai_conversations
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view'));
create policy ai_conversations_insert on public.ai_conversations
  for insert to authenticated
  with check (public.member_can(auth.uid(), org_id, 'view'));
create policy ai_conversations_update on public.ai_conversations
  for update to authenticated
  using (public.member_can(auth.uid(), org_id, 'view'))
  with check (public.member_can(auth.uid(), org_id, 'view'));
create policy ai_conversations_delete on public.ai_conversations
  for delete to authenticated
  using (public.member_can(auth.uid(), org_id, 'view'));

create policy ai_conversation_messages_select on public.ai_conversation_messages
  for select to authenticated
  using (
    public.member_can(auth.uid(), org_id, 'view')
    and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.org_id = org_id
    )
  );
create policy ai_conversation_messages_insert on public.ai_conversation_messages
  for insert to authenticated
  with check (
    public.member_can(auth.uid(), org_id, 'view')
    and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.org_id = org_id
    )
  );
create policy ai_conversation_messages_update on public.ai_conversation_messages
  for update to authenticated
  using (
    public.member_can(auth.uid(), org_id, 'view')
    and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.org_id = org_id
    )
  )
  with check (
    public.member_can(auth.uid(), org_id, 'view')
    and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.org_id = org_id
    )
  );
create policy ai_conversation_messages_delete on public.ai_conversation_messages
  for delete to authenticated
  using (
    public.member_can(auth.uid(), org_id, 'view')
    and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.org_id = org_id
    )
  );

revoke all on public.ai_conversations from anon, authenticated;
revoke all on public.ai_conversation_messages from anon, authenticated;
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, update, delete on public.ai_conversation_messages to authenticated;
