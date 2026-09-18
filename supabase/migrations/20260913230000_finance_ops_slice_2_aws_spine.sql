-- finance_ops_slice_2_aws_spine.sql
-- AWS owns finance files + compute. Relational SoT is portable Postgres
-- (survivor today; live Aurora frame-aurora-dev / frame-aurora-prod — SQL apply not yet).
-- close_finance_period is thin (enqueue). apply_finance_close is worker-only.
-- Do not invent a second money authority. No Supabase Storage.
-- Standard Postgres only: no pg_cron, realtime, or vault.
-- requested_by is a JWT sub UUID — no FK to auth.users (Aurora-portable).
-- Auth stays Supabase Auth. Cutover shim: docs/infra/aurora-auth-shim.sql.

do $$ begin
  create type public.finance_job_kind as enum ('ingest', 'map', 'close', 'export');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.finance_job_status as enum ('queued', 'running', 'succeeded', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.sales_import_status add value if not exists 'queued';
exception when duplicate_object then null;
end $$;

alter table public.sales_imports
  add column if not exists s3_key text;

alter table public.sales_imports
  drop constraint if exists sales_imports_s3_key_chk;
alter table public.sales_imports
  add constraint sales_imports_s3_key_chk
  check (s3_key is null or (char_length(btrim(s3_key)) > 0 and s3_key like 'orgs/%'));

create table if not exists public.finance_jobs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete restrict,
  period_id     uuid references public.finance_periods(id) on delete restrict,
  import_id     uuid references public.sales_imports(id) on delete restrict,
  kind          public.finance_job_kind not null,
  status        public.finance_job_status not null default 'queued',
  payload       jsonb not null default '{}'::jsonb,
  error         text,
  requested_by  uuid,
  created_at    timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);
create index if not exists finance_jobs_org_idx on public.finance_jobs (org_id, created_at desc);
create index if not exists finance_jobs_queued_idx on public.finance_jobs (status, kind)
  where status = 'queued';

create table if not exists public.finance_statement_exports (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete restrict,
  period_id     uuid not null references public.finance_periods(id) on delete restrict,
  format        text not null,
  s3_key        text not null,
  content_hash  text not null,
  generated_at  timestamptz not null default now(),
  constraint finance_statement_exports_format_chk check (format in ('pdf', 'csv')),
  constraint finance_statement_exports_key_chk check (s3_key like 'orgs/%'),
  constraint finance_statement_exports_period_format_key unique (period_id, format)
);
create index if not exists finance_statement_exports_org_idx
  on public.finance_statement_exports (org_id, period_id);

alter table public.finance_jobs enable row level security;
alter table public.finance_statement_exports enable row level security;

revoke all on public.finance_jobs, public.finance_statement_exports from public, anon;
revoke insert, update, delete on public.finance_jobs, public.finance_statement_exports
  from authenticated;
grant select on public.finance_jobs, public.finance_statement_exports to authenticated;
grant select, insert, update on public.finance_jobs, public.finance_statement_exports
  to service_role;

drop policy if exists finance_jobs_select on public.finance_jobs;
create policy finance_jobs_select on public.finance_jobs
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view_financial'));

drop policy if exists finance_statement_exports_select on public.finance_statement_exports;
create policy finance_statement_exports_select on public.finance_statement_exports
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view_financial'));

create or replace function public.finance_worker_only()
returns void
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Finance compute is AWS-worker only';
  end if;
end;
$$;

create or replace function public.enqueue_finance_job(
  p_org_id uuid,
  p_kind public.finance_job_kind,
  p_period_id uuid default null,
  p_import_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.finance_jobs (org_id, period_id, import_id, kind, payload, requested_by)
  values (p_org_id, p_period_id, p_import_id, p_kind, coalesce(p_payload, '{}'::jsonb), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.request_sales_import(
  p_period_id uuid,
  p_filename text,
  p_content_hash text,
  p_s3_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status public.finance_period_status;
  v_import uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;
  if coalesce(btrim(p_filename), '') = '' then raise exception 'Filename is required'; end if;
  if coalesce(btrim(p_content_hash), '') = '' then raise exception 'Content hash is required'; end if;
  if coalesce(btrim(p_s3_key), '') = '' or btrim(p_s3_key) not like 'orgs/%' then
    raise exception 'Finance import must use an org-scoped s3_key';
  end if;

  select org_id, status into v_org, v_status
  from public.finance_periods where id = p_period_id;
  if not found then raise exception 'Period not found'; end if;
  if v_status <> 'open' then raise exception 'Period is closed'; end if;
  if btrim(p_s3_key) not like ('orgs/' || v_org::text || '/%') then
    raise exception 'Client A never reads Client B money';
  end if;

  insert into public.sales_imports (
    org_id, period_id, filename, content_hash, s3_key, status, imported_by
  ) values (
    v_org, p_period_id, btrim(p_filename), btrim(p_content_hash), btrim(p_s3_key),
    'queued', auth.uid()
  )
  returning id into v_import;

  perform public.enqueue_finance_job(v_org, 'ingest', p_period_id, v_import);
  return v_import;
end;
$$;

create or replace function public.apply_sales_import(p_import_id uuid, p_lines jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_period uuid;
  v_line jsonb;
  v_n integer := 0;
begin
  perform public.finance_worker_only();
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Import must include at least one line';
  end if;

  select org_id, period_id into v_org, v_period from public.sales_imports where id = p_import_id;
  if v_org is null then raise exception 'Import not found'; end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_n := v_n + 1;
    if coalesce(btrim(v_line->>'endpoint'), '') = ''
       or coalesce(btrim(v_line->>'external_id'), '') = '' then
      raise exception 'Line % requires endpoint and external_id', v_n;
    end if;
    if coalesce(v_line->>'currency', 'USD') <> 'USD' then
      raise exception 'USD only (line %)', v_n;
    end if;
    if (v_line->>'bank_receipt_cents') is null or (v_line->>'bank_receipt_cents') !~ '^-?[0-9]+$' then
      raise exception 'Line % requires integer bank_receipt_cents', v_n;
    end if;
    if (v_line->>'reported_cents') is not null
       and (v_line->>'reported_cents') <> ''
       and (v_line->>'reported_cents') !~ '^-?[0-9]+$' then
      raise exception 'Line % reported_cents must be integer cents', v_n;
    end if;

    insert into public.sales_lines (
      org_id, period_id, import_id, line_no, endpoint, external_id,
      bank_receipt_cents, reported_cents, currency, transaction_date, raw
    ) values (
      v_org, v_period, p_import_id, v_n,
      lower(btrim(v_line->>'endpoint')),
      btrim(v_line->>'external_id'),
      (v_line->>'bank_receipt_cents')::integer,
      nullif(v_line->>'reported_cents', '')::integer,
      'USD',
      nullif(v_line->>'transaction_date', '')::date,
      coalesce(v_line->'raw', v_line)
    );
  end loop;

  update public.sales_imports set status = 'received' where id = p_import_id;
  update public.finance_jobs
     set status = 'succeeded', finished_at = now()
   where import_id = p_import_id and kind = 'ingest' and status = 'queued';
  return v_n;
end;
$$;

create or replace function public.import_sales(
  p_period_id uuid,
  p_filename text,
  p_content_hash text,
  p_lines jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Import parse runs on the finance worker; use request_sales_import';
end;
$$;

create or replace function public.close_finance_period(p_period_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status public.finance_period_status;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;

  select org_id, status into v_org, v_status
  from public.finance_periods where id = p_period_id;
  if not found then raise exception 'Period not found'; end if;
  if v_status <> 'open' then raise exception 'Period is already closed'; end if;

  if exists (
    select 1 from public.sales_lines
    where period_id = p_period_id and title_id is null
  ) then
    raise exception 'Map unmapped lines or move them to suspense before close';
  end if;

  if exists (
    select 1 from public.finance_jobs
    where period_id = p_period_id
      and kind = 'close'
      and status in ('queued', 'running')
  ) then
    return;
  end if;

  perform public.enqueue_finance_job(v_org, 'close', p_period_id, null);
end;
$$;

create or replace function public.apply_finance_close(p_period_id uuid)
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
  perform public.finance_worker_only();

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
      null
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
    null
  );

  update public.finance_periods
     set status = 'closed',
         closing_balance_cents = v_closing,
         closed_at = now(),
         closed_by = null
   where id = p_period_id;

  update public.finance_jobs
     set status = 'succeeded', finished_at = now()
   where period_id = p_period_id and kind = 'close' and status in ('queued', 'running');

  perform public.enqueue_finance_job(v_org, 'export', p_period_id, null);
end;
$$;

create or replace function public.request_finance_export(p_period_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status public.finance_period_status;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not (
    public.gc_can(auth.uid(), 'manage_tax_banking')
    or public.member_can(auth.uid(), (
      select org_id from public.finance_periods where id = p_period_id
    ), 'view_financial')
  ) then
    raise exception 'Not authorized';
  end if;

  select org_id, status into v_org, v_status
  from public.finance_periods where id = p_period_id;
  if not found then raise exception 'Period not found'; end if;
  if v_status <> 'closed' then raise exception 'Period is not closed'; end if;
  return public.enqueue_finance_job(v_org, 'export', p_period_id, null);
end;
$$;

create or replace function public.apply_finance_export(
  p_period_id uuid,
  p_format text,
  p_s3_key text,
  p_content_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
begin
  perform public.finance_worker_only();
  if p_format not in ('pdf', 'csv') then raise exception 'format must be pdf or csv'; end if;
  select org_id into v_org from public.finance_periods where id = p_period_id;
  if v_org is null then raise exception 'Period not found'; end if;
  if btrim(p_s3_key) not like ('orgs/' || v_org::text || '/%') then
    raise exception 'Client A never reads Client B money';
  end if;

  insert into public.finance_statement_exports (org_id, period_id, format, s3_key, content_hash)
  values (v_org, p_period_id, p_format, btrim(p_s3_key), btrim(p_content_hash))
  on conflict (period_id, format) do update
    set s3_key = excluded.s3_key,
        content_hash = excluded.content_hash,
        generated_at = now()
  returning id into v_id;

  update public.finance_jobs
     set status = 'succeeded', finished_at = now()
   where period_id = p_period_id and kind = 'export' and status in ('queued', 'running');
  return v_id;
end;
$$;

revoke execute on function public.import_sales(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.import_sales(uuid, text, text, jsonb) to service_role;

revoke execute on function public.request_sales_import(uuid, text, text, text) from public, anon;
grant execute on function public.request_sales_import(uuid, text, text, text) to authenticated, service_role;

revoke execute on function public.apply_sales_import(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.apply_sales_import(uuid, jsonb) to service_role;

revoke execute on function public.apply_finance_close(uuid) from public, anon, authenticated;
grant execute on function public.apply_finance_close(uuid) to service_role;

revoke execute on function public.apply_finance_export(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.apply_finance_export(uuid, text, text, text) to service_role;

revoke execute on function public.request_finance_export(uuid) from public, anon;
grant execute on function public.request_finance_export(uuid) to authenticated, service_role;

revoke execute on function public.close_finance_period(uuid) from public, anon;
grant execute on function public.close_finance_period(uuid) to authenticated, service_role;

revoke execute on function public.enqueue_finance_job(uuid, public.finance_job_kind, uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.enqueue_finance_job(uuid, public.finance_job_kind, uuid, uuid, jsonb)
  to service_role;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'sales_imports' and column_name = 's3_key'
  ) then
    raise exception 'sales_imports.s3_key missing';
  end if;
  if not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'finance_jobs'
  ) then
    raise exception 'finance_jobs missing';
  end if;
  raise notice 'finance ops slice 2 AWS spine applied';
end $$;
