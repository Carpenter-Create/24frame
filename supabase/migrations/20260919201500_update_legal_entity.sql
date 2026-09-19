-- ============================================================================
-- 20260919201500_update_legal_entity.sql
--
-- INTENT: add update_legal_entity so a Rights Holder owner can edit an
-- existing legal entity's name, type, and jurisdiction. Does not change
-- is_default or org_id. Does not add delete/archive.
--
-- AUTHZ (fail-closed):
--   Authenticated caller. member_can(uid, entity.org_id, 'manage_settings').
--   SQL is the gate. Client cannot authorize the write.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
--   CREATE OR REPLACE FUNCTION + GRANT/REVOKE.
--   No DROP of existing objects. No row deletes. Forward-only.
--   CoS applies after merge + founder yes. Prod SQL apply needed after merge.
-- ROLLBACK: drop function public.update_legal_entity(uuid, text, public.entity_type, text).
-- ============================================================================

create or replace function public.update_legal_entity(
  p_entity_id uuid,
  p_name text,
  p_entity_type public.entity_type default null,
  p_jurisdiction text default null
)
  returns void
  language plpgsql security definer set search_path = public
as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Entity name is required';
  end if;

  select org_id into v_org
    from public.legal_entities
   where id = p_entity_id;

  if v_org is null then raise exception 'Entity not found'; end if;
  if not public.member_can(auth.uid(), v_org, 'manage_settings') then
    raise exception 'Not authorized';
  end if;

  -- name required. type/jurisdiction optional. is_default and org_id stay put.
  -- omitted jurisdiction (SQL NULL) keeps the current value; '' clears it.
  update public.legal_entities
     set name = btrim(p_name),
         entity_type = coalesce(p_entity_type, entity_type),
         jurisdiction = case
           when p_jurisdiction is null then jurisdiction
           else nullif(btrim(p_jurisdiction), '')
         end
   where id = p_entity_id;
end;
$$;

revoke execute on function public.update_legal_entity(uuid, text, public.entity_type, text)
  from public, anon;
grant execute on function public.update_legal_entity(uuid, text, public.entity_type, text)
  to authenticated;
