-- ============================================================================
-- 20260917120100_titles_delete_archive.sql
--
-- INTENT: Titles Delete + Archive pack (CoS unlock). Soft-delete foundation
-- on titles + assets; first-class Archived status; restore; audit via tg_audit.
--
-- HARD PREDICATE (locked): a title may not be deleted when it has any linked
-- Aggregation money / reporting fact rows. Discovered SoT in this repo — do
-- not invent tables:
--   sales_lines.title_id     — endpoint earnings / reporting facts
--   ledger_entries.title_id  — statement / payout SoT (sale, payable, …)
-- title_external_ids is a mapping key, not a fact. finance_periods are org-
-- scoped, not title-linked. organization_payout_details is org-level.
--
-- GATES:
--   Owner (operate, not staff): own-org Drafts only. Never after submit.
--   Staff with operate (member_can → gc_can): Drafts always; submitted /
--   Complete / Live only when the hard predicate is empty. If any fact row
--   exists → delete refused; Archive is the path. View-only staff
--   (gc_legal, gc_accountant, gc_viewer) cannot delete or archive.
--   Archive does not erase assets, rights, or money.
--
-- APPLY (founder / CoS / Adam — after merge, not from this PR):
--   Requires 20260917120000_title_status_archived.sql already applied.
--   Do not prod-apply from the PR.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
--   ALTER TABLE titles / assets (add columns); REPLACE titles_select and
--   assets_select; REPLACE create_asset; CREATE FUNCTIONs; GRANT/REVOKE.
--   No drops. Forward-only + idempotent where possible.
-- ROLLBACK: drop the four new functions, restore prior create_asset /
--   titles_select / assets_select, drop the new columns and indexes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COLUMNS — soft-delete foundation; archive remembers the prior status
-- ----------------------------------------------------------------------------
alter table public.titles
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_from public.title_status;

alter table public.assets
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists titles_not_deleted_idx
  on public.titles (org_id, created_at desc)
  where deleted_at is null;

create index if not exists titles_active_catalog_idx
  on public.titles (org_id, created_at desc)
  where deleted_at is null and status <> 'archived';

create index if not exists assets_not_deleted_title_idx
  on public.assets (title_id)
  where deleted_at is null;

-- ----------------------------------------------------------------------------
-- 2. RLS — soft-deleted rows stay in the table (audit + history) but leave
--    the authenticated catalog. Staff use audit_log; they do not browse deleted.
-- ----------------------------------------------------------------------------
drop policy if exists titles_select on public.titles;
create policy titles_select on public.titles for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view') and deleted_at is null);

drop policy if exists assets_select on public.assets;
create policy assets_select on public.assets for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view') and deleted_at is null);

-- ----------------------------------------------------------------------------
-- 3. PREDICATE — real Aggregation fact tables only
-- ----------------------------------------------------------------------------
create or replace function public.title_has_reporting_activity(p_title_id uuid)
  returns boolean
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select org_id into v_org from public.titles where id = p_title_id;
  if v_org is null then
    return false;
  end if;
  if not public.member_can(auth.uid(), v_org, 'view') then
    return false;
  end if;
  return exists (select 1 from public.sales_lines sl where sl.title_id = p_title_id)
      or exists (select 1 from public.ledger_entries le where le.title_id = p_title_id);
end;
$$;

revoke execute on function public.title_has_reporting_activity(uuid) from public, anon;
grant  execute on function public.title_has_reporting_activity(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. DELETE — soft-delete title + cascade assets. RPC-only write.
-- ----------------------------------------------------------------------------
create or replace function public.delete_title(p_title_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_org uuid;
  v_status public.title_status;
  v_deleted timestamptz;
  v_staff boolean;
  v_has_reporting boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select org_id, status, deleted_at
    into v_org, v_status, v_deleted
    from public.titles
   where id = p_title_id;
  if v_org is null then
    raise exception 'Title not found';
  end if;
  if v_deleted is not null then
    raise exception 'Title is already deleted';
  end if;
  if not public.member_can(auth.uid(), v_org, 'view') then
    raise exception 'Title not found';
  end if;
  if not public.member_can(auth.uid(), v_org, 'operate') then
    raise exception 'Not authorized to delete this title';
  end if;

  v_staff := public.is_gc_staff(auth.uid());
  if not v_staff then
    if v_status <> 'draft' then
      raise exception 'Submitted titles cannot be deleted. Archive instead.';
    end if;
  else
    select exists (select 1 from public.sales_lines sl where sl.title_id = p_title_id)
        or exists (select 1 from public.ledger_entries le where le.title_id = p_title_id)
      into v_has_reporting;
    if v_status <> 'draft' and coalesce(v_has_reporting, false) then
      raise exception 'This title has reporting history. Archive it instead.';
    end if;
  end if;

  update public.titles
     set deleted_at = now(),
         deleted_by = auth.uid()
   where id = p_title_id
     and deleted_at is null;

  update public.assets
     set deleted_at = now(),
         deleted_by = auth.uid()
   where title_id = p_title_id
     and deleted_at is null;
end;
$$;

revoke execute on function public.delete_title(uuid) from public, anon;
grant  execute on function public.delete_title(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. ARCHIVE / RESTORE — status change only. History stays.
-- ----------------------------------------------------------------------------
create or replace function public.archive_title(p_title_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_org uuid;
  v_status public.title_status;
  v_deleted timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select org_id, status, deleted_at
    into v_org, v_status, v_deleted
    from public.titles
   where id = p_title_id;
  if v_org is null or v_deleted is not null then
    raise exception 'Title not found';
  end if;
  if not public.member_can(auth.uid(), v_org, 'operate') then
    raise exception 'Not authorized to archive this title';
  end if;
  if v_status = 'draft' then
    raise exception 'Delete a draft instead of archiving it.';
  end if;
  if v_status = 'archived' then
    raise exception 'Title is already archived';
  end if;

  update public.titles
     set archived_from = status,
         status = 'archived'
   where id = p_title_id
     and deleted_at is null
     and status <> 'archived';
end;
$$;

revoke execute on function public.archive_title(uuid) from public, anon;
grant  execute on function public.archive_title(uuid) to authenticated;

create or replace function public.restore_title(p_title_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_org uuid;
  v_status public.title_status;
  v_from public.title_status;
  v_deleted timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select org_id, status, archived_from, deleted_at
    into v_org, v_status, v_from, v_deleted
    from public.titles
   where id = p_title_id;
  if v_org is null or v_deleted is not null then
    raise exception 'Title not found';
  end if;
  if not public.member_can(auth.uid(), v_org, 'operate') then
    raise exception 'Not authorized to restore this title';
  end if;
  if v_status <> 'archived' then
    raise exception 'Only archived titles can be restored.';
  end if;

  update public.titles
     set status = coalesce(v_from, 'draft'),
         archived_from = null
   where id = p_title_id
     and deleted_at is null
     and status = 'archived';
end;
$$;

revoke execute on function public.restore_title(uuid) from public, anon;
grant  execute on function public.restore_title(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. create_asset — refuse writes onto a soft-deleted title
-- ----------------------------------------------------------------------------
create or replace function public.create_asset(
  p_org_id           uuid,
  p_title_id         uuid,
  p_kind             public.asset_kind,
  p_storage_key      text,
  p_content_hash     text,
  p_bytes            bigint,
  p_content_type     text default null,
  p_original_filename text default null
) returns uuid
  language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.member_can(auth.uid(), p_org_id, 'operate') then
    raise exception 'Not authorized to add assets for this organization';
  end if;
  if not exists (
    select 1 from public.titles t
    where t.id = p_title_id and t.org_id = p_org_id and t.deleted_at is null
  ) then
    raise exception 'Title does not belong to this organization';
  end if;
  if coalesce(btrim(p_storage_key), '') = '' or coalesce(btrim(p_content_hash), '') = '' then
    raise exception 'storage_key and content_hash are required';
  end if;

  insert into public.assets
    (org_id, title_id, kind, storage_key, content_hash, bytes, content_type, original_filename, provided_by)
  values
    (p_org_id, p_title_id, p_kind, btrim(p_storage_key), btrim(p_content_hash),
     coalesce(p_bytes, 0), p_content_type, p_original_filename, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.create_asset(uuid, uuid, public.asset_kind, text, text, bigint, text, text) from public, anon;
grant  execute on function public.create_asset(uuid, uuid, public.asset_kind, text, text, bigint, text, text) to authenticated;
