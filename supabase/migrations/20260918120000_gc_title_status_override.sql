-- ============================================================================
-- 20260918120000_gc_title_status_override.sql
--
-- INTENT: GC staff may set any live title_status until delivery/reporting
-- lock-in. One SECURITY DEFINER writer (gc_set_title_status). Append-only
-- title_status_overrides is the provenance SoT. review_title stays the
-- in_review approve/reject gate — this is not a fork of that path.
--
-- LOCK-IN (founder 2026-09-17): no override when status is Approved
-- (in_delivery OR live) AND (≥1 delivery in delivered/live OR any
-- sales_lines / ledger_entries row). Same predicate as
-- title_has_reporting_activity + delivered/live delivery SoT. Fail closed.
-- After lock-in, Archive remains the money-safe exit via archive_title.
--
-- APPLY (founder / CoS — after merge, not from this PR):
--   Do not prod-apply from the PR.
--
-- DESTRUCTIVE OPS (do NOT apply to production from this PR):
--   CREATE TABLE title_status_overrides; CREATE FUNCTIONs; GRANT/REVOKE.
--   No drops. Forward-only + idempotent where possible.
-- ROLLBACK: drop the three new functions + table (and its trigger/policies).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE — append-only override provenance (one SoT, not title_reviews)
-- ----------------------------------------------------------------------------
create table if not exists public.title_status_overrides (
  id          uuid primary key default gen_random_uuid(),
  title_id    uuid not null references public.titles(id)        on delete restrict,
  org_id      uuid not null references public.organizations(id) on delete restrict,
  actor       uuid references auth.users(id) on delete set null,
  from_status public.title_status not null,
  to_status   public.title_status not null,
  reason      text not null,
  created_at  timestamptz not null default now(),
  constraint title_status_overrides_reason_chk check (btrim(reason) <> '')
);
create index if not exists title_status_overrides_title_idx
  on public.title_status_overrides (title_id, created_at desc);
create index if not exists title_status_overrides_org_idx
  on public.title_status_overrides (org_id);

drop trigger if exists audit_title_status_overrides on public.title_status_overrides;
create trigger audit_title_status_overrides
  after insert or update or delete on public.title_status_overrides
  for each row execute function public.tg_audit();

alter table public.title_status_overrides enable row level security;
revoke all on public.title_status_overrides from anon;
revoke insert, update, delete on public.title_status_overrides from authenticated, service_role;
grant select on public.title_status_overrides to authenticated;
grant select on public.title_status_overrides to service_role;

drop policy if exists title_status_overrides_select on public.title_status_overrides;
create policy title_status_overrides_select on public.title_status_overrides
  for select to authenticated
  using (public.gc_can(auth.uid(), 'view') or public.member_can(auth.uid(), org_id, 'view'));

-- ----------------------------------------------------------------------------
-- 2. PREDICATES — shared lock-in. UI calls these; RPC enforces them.
--    Delivered-to = delivery_status in (delivered, live). pending is not
--    delivered. Reporting = sales_lines OR ledger_entries (existing SoT).
-- ----------------------------------------------------------------------------
create or replace function public.title_has_delivered_endpoint(p_title_id uuid)
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
  if not (public.is_gc_staff(auth.uid()) or public.member_can(auth.uid(), v_org, 'view')) then
    return false;
  end if;
  return exists (
    select 1
      from public.deliveries d
     where d.title_id = p_title_id
       and d.status in ('delivered', 'live')
  );
end;
$$;

revoke execute on function public.title_has_delivered_endpoint(uuid) from public, anon;
grant  execute on function public.title_has_delivered_endpoint(uuid) to authenticated;

create or replace function public.title_status_override_locked(p_title_id uuid)
  returns boolean
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_org uuid;
  v_status public.title_status;
  v_deleted timestamptz;
  v_delivered boolean;
  v_reporting boolean;
begin
  -- Fail closed: unknown / unreadable titles are locked.
  if auth.uid() is null then
    return true;
  end if;
  select org_id, status, deleted_at
    into v_org, v_status, v_deleted
    from public.titles
   where id = p_title_id;
  if v_org is null or v_deleted is not null then
    return true;
  end if;
  if not (public.is_gc_staff(auth.uid()) or public.member_can(auth.uid(), v_org, 'view')) then
    return true;
  end if;
  if v_status not in ('in_delivery', 'live') then
    return false;
  end if;
  select exists (
           select 1
             from public.deliveries d
            where d.title_id = p_title_id
              and d.status in ('delivered', 'live')
         )
    into v_delivered;
  select exists (select 1 from public.sales_lines sl where sl.title_id = p_title_id)
      or exists (select 1 from public.ledger_entries le where le.title_id = p_title_id)
    into v_reporting;
  return coalesce(v_delivered, false) or coalesce(v_reporting, false);
end;
$$;

revoke execute on function public.title_status_override_locked(uuid) from public, anon;
grant  execute on function public.title_status_override_locked(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 3. RPC — sole writer of a free status change. No client UPDATE on titles.status.
-- ----------------------------------------------------------------------------
create or replace function public.gc_set_title_status(
  p_title_id uuid,
  p_status   public.title_status,
  p_reason   text
) returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_org uuid;
  v_status public.title_status;
  v_deleted timestamptz;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_gc_staff(auth.uid()) then
    raise exception 'Only GC staff can set title status';
  end if;
  if v_reason = '' then
    raise exception 'A reason is required to set title status';
  end if;

  select org_id, status, deleted_at
    into v_org, v_status, v_deleted
    from public.titles
   where id = p_title_id;
  if v_org is null or v_deleted is not null then
    raise exception 'Title not found';
  end if;
  if v_status = p_status then
    raise exception 'Title is already in that status';
  end if;
  if public.title_status_override_locked(p_title_id) then
    raise exception 'Status cannot change. This title is Approved and has a delivered endpoint or reporting activity.';
  end if;

  update public.titles
     set archived_from = case
           when p_status = 'archived' then status
           when status = 'archived' then null
           else archived_from
         end,
         status = p_status
   where id = p_title_id
     and deleted_at is null;

  insert into public.title_status_overrides (
    title_id, org_id, actor, from_status, to_status, reason
  ) values (
    p_title_id, v_org, auth.uid(), v_status, p_status, v_reason
  );
end;
$$;

revoke execute on function public.gc_set_title_status(uuid, public.title_status, text) from public, anon;
grant  execute on function public.gc_set_title_status(uuid, public.title_status, text) to authenticated;
