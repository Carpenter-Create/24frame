-- finance_ops_slice_2_suspense.sql
-- Staff suspense pool for unmapped sales lines (Adam lock 2026-09-13).
-- Same sales_lines row. period_id nullable = parked. org_id always required.
-- No new money table. No compute change. Recipients never see suspense.
-- Mapping C: org-scoped. Do not invent a period from transaction_date.

-- ----------------------------------------------------------------------------
-- 1. Location: suspense is a null period_id on the existing line
-- ----------------------------------------------------------------------------
alter table public.sales_lines
  alter column period_id drop not null;

alter table public.sales_lines
  add column if not exists origin_period_id uuid
    references public.finance_periods(id) on delete restrict;

create index if not exists sales_lines_suspense_org_idx
  on public.sales_lines (org_id)
  where period_id is null;

alter table public.sales_lines
  drop constraint if exists sales_lines_suspense_unmapped_chk;
alter table public.sales_lines
  add constraint sales_lines_suspense_unmapped_chk
  check (period_id is not null or title_id is null);

-- Lines in suspense stay on the import's org. Attached periods must match org.
-- They may leave the import's original period.
create or replace function public.tg_sales_lines_import_org()
  returns trigger
  language plpgsql
as $$
begin
  if not exists (
    select 1 from public.sales_imports i
    where i.id = new.import_id and i.org_id = new.org_id
  ) then
    raise exception 'sales_lines must stay on the import''s org';
  end if;
  if new.period_id is not null and not exists (
    select 1 from public.finance_periods p
    where p.id = new.period_id and p.org_id = new.org_id
  ) then
    raise exception 'sales_lines.period_id must stay on the same org';
  end if;
  return new;
end;
$$;

-- Source fields stay write-once. Period association may change via staff RPCs.
-- origin_period_id is set once (the period the line left).
create or replace function public.tg_sales_lines_source_immutable()
  returns trigger
  language plpgsql
as $$
begin
  if new.org_id is distinct from old.org_id
     or new.import_id is distinct from old.import_id
     or new.line_no is distinct from old.line_no
     or new.endpoint is distinct from old.endpoint
     or new.external_id is distinct from old.external_id
     or new.bank_receipt_cents is distinct from old.bank_receipt_cents
     or new.reported_cents is distinct from old.reported_cents
     or new.currency is distinct from old.currency
     or new.transaction_date is distinct from old.transaction_date
     or new.raw is distinct from old.raw then
    raise exception 'sales_lines source fields are immutable';
  end if;
  if old.origin_period_id is not null
     and new.origin_period_id is distinct from old.origin_period_id then
    raise exception 'sales_lines.origin_period_id is immutable once set';
  end if;
  if old.title_id is not null and new.title_id is distinct from old.title_id then
    raise exception 'sales_lines.title_id cannot be remapped; import a correction';
  end if;
  return new;
end;
$$;

-- Recipients with view_financial see attached lines only. Staff see the pool.
drop policy if exists sales_lines_select on public.sales_lines;
create policy sales_lines_select on public.sales_lines
  for select to authenticated
  using (
    public.member_can(auth.uid(), org_id, 'view_financial')
    and (
      public.is_gc_staff(auth.uid())
      or period_id is not null
    )
  );

-- ----------------------------------------------------------------------------
-- 2. Staff RPCs — manage_tax_banking only
-- ----------------------------------------------------------------------------
create or replace function public.move_sales_lines_to_suspense(p_line_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer := 0;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;
  if p_line_ids is null or cardinality(p_line_ids) = 0 then
    raise exception 'Select at least one line';
  end if;
  if exists (
    select 1 from unnest(p_line_ids) as lid(id)
    where not exists (select 1 from public.sales_lines sl where sl.id = lid.id)
  ) then
    raise exception 'Sales line not found';
  end if;
  if exists (
    select 1 from public.sales_lines sl
    where sl.id = any(p_line_ids) and sl.title_id is not null
  ) then
    raise exception 'Only unmapped lines can move to suspense';
  end if;
  if exists (
    select 1 from public.sales_lines sl
    where sl.id = any(p_line_ids) and sl.period_id is null
  ) then
    raise exception 'Line is already in suspense';
  end if;
  if exists (
    select 1
    from public.sales_lines sl
    join public.finance_periods p on p.id = sl.period_id
    where sl.id = any(p_line_ids) and p.status <> 'open'
  ) then
    raise exception 'Cannot move lines off a closed period';
  end if;

  update public.sales_lines
     set origin_period_id = coalesce(origin_period_id, period_id),
         period_id = null
   where id = any(p_line_ids)
     and title_id is null
     and period_id is not null;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

create or replace function public.assign_suspense_lines_to_period(
  p_line_ids uuid[],
  p_period_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status public.finance_period_status;
  v_n integer := 0;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;
  if p_line_ids is null or cardinality(p_line_ids) = 0 then
    raise exception 'Select at least one line';
  end if;

  select org_id, status into v_org, v_status
  from public.finance_periods where id = p_period_id;
  if not found then raise exception 'Period not found'; end if;
  if v_status <> 'open' then
    raise exception 'Cannot assign suspense to a closed period';
  end if;
  if exists (
    select 1 from unnest(p_line_ids) as lid(id)
    where not exists (select 1 from public.sales_lines sl where sl.id = lid.id)
  ) then
    raise exception 'Sales line not found';
  end if;
  if exists (
    select 1 from public.sales_lines sl
    where sl.id = any(p_line_ids) and sl.period_id is not null
  ) then
    raise exception 'Line is not in suspense';
  end if;
  if exists (
    select 1 from public.sales_lines sl
    where sl.id = any(p_line_ids) and sl.org_id is distinct from v_org
  ) then
    raise exception 'Client A lines never enter Client B suspense';
  end if;

  update public.sales_lines
     set period_id = p_period_id
   where id = any(p_line_ids)
     and period_id is null
     and org_id = v_org;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Map only attached lines. Suspense waits for a staff-chosen open period.
create or replace function public.map_sales_import(p_import_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_n integer := 0;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;

  select org_id into v_org from public.sales_imports where id = p_import_id;
  if v_org is null then raise exception 'Import not found'; end if;

  update public.sales_lines sl
     set title_id = tei.title_id,
         mapped_at = now()
    from public.title_external_ids tei
   where sl.import_id = p_import_id
     and sl.title_id is null
     and sl.period_id is not null
     and tei.org_id = sl.org_id
     and tei.org_id = v_org
     and tei.endpoint = sl.endpoint
     and tei.external_id = sl.external_id
     and exists (
       select 1 from public.titles t
       where t.id = tei.title_id and t.org_id = sl.org_id
     );
  get diagnostics v_n = row_count;

  if not exists (
    select 1 from public.sales_lines
    where import_id = p_import_id and title_id is null and period_id is not null
  ) then
    update public.sales_imports set status = 'mapped' where id = p_import_id;
  end if;

  return v_n;
end;
$$;

create or replace function public.map_sales_line(p_line_id uuid, p_title_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_period uuid;
  v_title_org uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;

  select org_id, period_id into v_org, v_period from public.sales_lines where id = p_line_id;
  if v_org is null then raise exception 'Sales line not found'; end if;
  if v_period is null then
    raise exception 'Assign the line to an open period before mapping';
  end if;
  select org_id into v_title_org from public.titles where id = p_title_id;
  if v_title_org is null then raise exception 'Title not found'; end if;
  if v_title_org is distinct from v_org then
    raise exception 'Client A title never receives Client B import';
  end if;

  update public.sales_lines
     set title_id = p_title_id,
         mapped_at = now()
   where id = p_line_id and title_id is null and period_id is not null;
  if not found then
    raise exception 'Sales line already mapped or not found';
  end if;
end;
$$;

-- Same complementary-split close as Slice 1, plus: no silent unmapped orphans.
create or replace function public.close_finance_period(p_period_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status public.finance_period_status;
  v_threshold integer;
  v_net integer;
  v_kind public.ledger_entry_kind;
  v_closing integer;
  v_line record;
  v_at timestamptz;
  v_rate integer;
  v_term uuid;
  v_client integer;
  v_keep integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;

  select org_id, status, threshold_cents
    into v_org, v_status, v_threshold
  from public.finance_periods where id = p_period_id;
  if not found then raise exception 'Period not found'; end if;
  if v_status <> 'open' then raise exception 'Period is already closed'; end if;

  if exists (
    select 1 from public.sales_lines
    where period_id = p_period_id and title_id is null
  ) then
    raise exception 'Map unmapped lines or move them to suspense before close';
  end if;

  for v_line in
    select sl.id, sl.title_id, sl.bank_receipt_cents, sl.transaction_date, sl.endpoint, sl.external_id
    from public.sales_lines sl
    where sl.period_id = p_period_id
      and sl.title_id is not null
      and not exists (
        select 1 from public.ledger_entries le
        where le.sales_line_id = sl.id and le.kind = 'sale'
      )
  loop
    v_at := coalesce(v_line.transaction_date::timestamptz, now());
    select ct.id, ct.revenue_share_rate_bp
      into v_term, v_rate
    from public.contract_terms ct
    where ct.org_id = v_org
      and ct.effective_from <= v_at
      and (ct.effective_to is null or ct.effective_to > v_at)
    order by ct.effective_from desc
    limit 1;
    if v_rate is null then
      raise exception 'No contract term covers this sale; cannot invent a client tier percent';
    end if;

    v_client := public.finance_client_share_cents(v_line.bank_receipt_cents, v_rate);
    v_keep := v_line.bank_receipt_cents - v_client;

    insert into public.ledger_entries (
      org_id, period_id, title_id, kind, amount_cents, sales_line_id,
      source_refs, logic_version, posted_by
    ) values (
      v_org, p_period_id, v_line.title_id, 'sale', v_client, v_line.id,
      jsonb_build_object(
        'kind', 'sale_from_import',
        'sales_line_id', v_line.id,
        'endpoint', v_line.endpoint,
        'external_id', v_line.external_id,
        'bank_receipt_cents', v_line.bank_receipt_cents,
        'contract_term_id', v_term,
        'client_rate_bp', v_rate,
        'client_share_cents', v_client,
        'aggregator_keep_cents', v_keep,
        'complementary_split', true
      ),
      public.finance_logic_version(),
      auth.uid()
    );
  end loop;

  select coalesce(sum(amount_cents), 0) into v_net
  from public.ledger_entries
  where period_id = p_period_id
    and kind not in ('payable', 'closing');

  if v_threshold is not null and v_net >= v_threshold then
    v_kind := 'payable';
    v_closing := 0;
  else
    v_kind := 'closing';
    v_closing := v_net;
  end if;

  insert into public.ledger_entries (
    org_id, period_id, kind, amount_cents, source_refs, logic_version, posted_by
  ) values (
    v_org, p_period_id, v_kind, -v_net,
    jsonb_build_object(
      'kind', 'period_close',
      'net_cents', v_net,
      'threshold_cents', v_threshold,
      'complementary_split', true
    ),
    public.finance_logic_version(),
    auth.uid()
  );

  update public.finance_periods
     set status = 'closed',
         closing_balance_cents = v_closing,
         closed_at = now(),
         closed_by = auth.uid()
   where id = p_period_id;
end;
$$;

revoke execute on function public.move_sales_lines_to_suspense(uuid[]) from public, anon;
grant execute on function public.move_sales_lines_to_suspense(uuid[]) to authenticated, service_role;

revoke execute on function public.assign_suspense_lines_to_period(uuid[], uuid) from public, anon;
grant execute on function public.assign_suspense_lines_to_period(uuid[], uuid) to authenticated, service_role;

revoke execute on function public.map_sales_import(uuid) from public, anon;
grant execute on function public.map_sales_import(uuid) to authenticated, service_role;

revoke execute on function public.map_sales_line(uuid, uuid) from public, anon;
grant execute on function public.map_sales_line(uuid, uuid) to authenticated, service_role;

revoke execute on function public.close_finance_period(uuid) from public, anon;
grant execute on function public.close_finance_period(uuid) to authenticated, service_role;

do $$
declare v_bad text;
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'sales_lines'
       and column_name = 'period_id' and is_nullable = 'NO'
  ) then
    raise exception 'sales_lines.period_id must be nullable for suspense';
  end if;
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'sales_lines'
       and column_name = 'origin_period_id'
  ) then
    raise exception 'sales_lines.origin_period_id missing';
  end if;
  if exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name like '%suspense%'
  ) then
    raise exception 'do not invent a parallel suspense money table';
  end if;
  select qual into v_bad
  from pg_policies
  where schemaname = 'public' and tablename = 'sales_lines'
    and policyname = 'sales_lines_select';
  if v_bad is null or v_bad not like '%period_id is not null%' then
    raise exception 'sales_lines SELECT must hide suspense from recipients';
  end if;
  raise notice 'finance ops slice 2 suspense applied';
end $$;
