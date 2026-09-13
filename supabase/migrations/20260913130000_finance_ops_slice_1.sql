-- ============================================================================
-- 20260913130000_finance_ops_slice_1.sql
--
-- INTENT: staff finance-ops foundation for monthly Aggregation periods.
-- Schema must support org rollup + per-title breakdown. UI in this slice is
-- staff-only. ledger_entries is the source of truth.
--
-- LOCKED compute (CoS / Adam 2026-09-13):
--   1. Gross = bank-receipt cents from the endpoint (amount that hit the bank).
--   2. Client share = contract_terms.revenue_share_rate_bp of that receipt
--      (existing SoT — do not invent a second % column).
--   3. Aggregator keep = remainder (complementary split; store client % only).
--   4. Then recoup/adjustments on the ledger.
--   5. Net ≥ staff threshold → payable, else closing carry-forward.
-- Transaction date selects the term when present; otherwise the current term.
-- Day-pro-ration of undated lump sums is not in this close path.
--
-- Titles stay org-scoped. No global works table. 24Frame id is titles.catalog_id.
-- title_external_ids is endpoint + external_id, unique per pair, org-checked.
--
-- Auth: writes are gc_can(..., 'manage_tax_banking') — existing money-write
-- capability (gc_account_owner + gc_accountant). delivery_ops stays out
-- ("no finance, no tax"). legal stays read-only. Reads use view_financial
-- via member_can (staff delegate through gc_can; clients with financial_read
-- may SELECT their org later — no recipient UI in this slice).
--
-- Mapping C: these tables are Aggregation/distribution. org_id is required.
-- No profile_id. Do not wire Social profiles as a privilege bridge.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
--   CREATE TYPE, CREATE TABLE, indexes, triggers, RLS, GRANT/REVOKE,
--   REPLACE audit_log_select to include finance entities, CREATE FUNCTION.
-- Forward-only + idempotent where possible.
-- ROLLBACK: drop functions, drop tables, drop types listed below.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.finance_period_status as enum ('open', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sales_import_status as enum ('received', 'mapped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ledger_entry_kind as enum
    ('opening', 'recoup', 'adjustment', 'sale', 'payable', 'closing');
exception when duplicate_object then null; end $$;

-- Slice-1 lineage. Bump when close/post math changes.
create or replace function public.finance_logic_version()
  returns text
  language sql immutable
as $$ select 'finance-ops-slice-1.1-client-tier-remainder'::text $$;

-- Integer cents. Client share first; aggregator keep is the remainder.
create or replace function public.finance_client_share_cents(p_gross integer, p_rate_bp integer)
  returns integer
  language sql immutable
as $$
  select trunc((p_gross::numeric * p_rate_bp) / 10000)::integer;
$$;

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- Monthly period per org. USD only. Threshold is staff-set operational input,
-- not a product price. Opening is copied from the prior closed period at create.
create table if not exists public.finance_periods (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.organizations(id) on delete restrict,
  period_year          integer not null,
  period_month         integer not null,
  currency             text not null default 'USD',
  status               public.finance_period_status not null default 'open',
  opening_balance_cents integer not null default 0,
  closing_balance_cents integer,
  threshold_cents      integer,
  closed_at            timestamptz,
  closed_by            uuid references auth.users(id) on delete set null,
  created_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint finance_periods_year_chk check (period_year between 2000 and 2100),
  constraint finance_periods_month_chk check (period_month between 1 and 12),
  constraint finance_periods_usd_chk check (currency = 'USD'),
  constraint finance_periods_threshold_chk check (threshold_cents is null or threshold_cents >= 0),
  constraint finance_periods_org_month_key unique (org_id, period_year, period_month)
);
create index if not exists finance_periods_org_idx
  on public.finance_periods (org_id, period_year desc, period_month desc);

-- Immutable import batch. Status may move received → mapped. Bytes are not stored.
create table if not exists public.sales_imports (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete restrict,
  period_id     uuid not null references public.finance_periods(id) on delete restrict,
  filename      text not null,
  content_hash  text not null,
  status        public.sales_import_status not null default 'received',
  imported_by   uuid references auth.users(id) on delete set null,
  imported_at   timestamptz not null default now(),
  constraint sales_imports_filename_chk check (char_length(btrim(filename)) > 0),
  constraint sales_imports_hash_chk check (char_length(btrim(content_hash)) > 0)
);
create index if not exists sales_imports_period_idx on public.sales_imports (period_id);
create index if not exists sales_imports_org_idx on public.sales_imports (org_id);

-- Parsed source lines. bank_receipt_cents is the compute gross (amount that
-- hit the bank). reported_cents is an optional platform figure when the file
-- carried both. title_id stays null until mapped to an org-scoped title.
create table if not exists public.sales_lines (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations(id) on delete restrict,
  period_id         uuid not null references public.finance_periods(id) on delete restrict,
  import_id         uuid not null references public.sales_imports(id) on delete restrict,
  line_no           integer not null,
  endpoint          text not null,
  external_id       text not null,
  title_id          uuid references public.titles(id) on delete restrict,
  bank_receipt_cents integer not null,
  reported_cents    integer,
  currency          text not null default 'USD',
  transaction_date  date,
  raw               jsonb not null default '{}'::jsonb,
  mapped_at         timestamptz,
  created_at        timestamptz not null default now(),
  constraint sales_lines_line_no_chk check (line_no >= 1),
  constraint sales_lines_endpoint_chk check (char_length(btrim(endpoint)) > 0),
  constraint sales_lines_external_id_chk check (char_length(btrim(external_id)) > 0),
  constraint sales_lines_usd_chk check (currency = 'USD'),
  constraint sales_lines_import_line_key unique (import_id, line_no)
);
create index if not exists sales_lines_import_idx on public.sales_lines (import_id);
create index if not exists sales_lines_org_idx on public.sales_lines (org_id);
create index if not exists sales_lines_title_idx on public.sales_lines (title_id);
create index if not exists sales_lines_endpoint_ext_idx
  on public.sales_lines (org_id, endpoint, external_id);

-- Source of truth. Signed integer cents from the client-receivable view:
-- opening/sale typically +, recoup typically −, payable/closing zero the period.
create table if not exists public.ledger_entries (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete restrict,
  period_id       uuid not null references public.finance_periods(id) on delete restrict,
  title_id        uuid references public.titles(id) on delete restrict,
  kind            public.ledger_entry_kind not null,
  amount_cents    integer not null,
  currency        text not null default 'USD',
  note            text,
  sales_line_id   uuid references public.sales_lines(id) on delete restrict,
  source_refs     jsonb not null default '{}'::jsonb,
  logic_version   text not null default public.finance_logic_version(),
  derived_at      timestamptz not null default now(),
  posted_by       uuid references auth.users(id) on delete set null,
  posted_at       timestamptz not null default now(),
  constraint ledger_entries_usd_chk check (currency = 'USD')
);
create index if not exists ledger_entries_period_idx on public.ledger_entries (period_id, posted_at);
create index if not exists ledger_entries_org_idx on public.ledger_entries (org_id);
create index if not exists ledger_entries_title_idx on public.ledger_entries (title_id);

-- Per-title vendor keys. Unique (endpoint, external_id) worldwide so one
-- vendor key cannot point at two titles. org_id is denormalized for RLS and
-- must match titles.org_id (trigger).
create table if not exists public.title_external_ids (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete restrict,
  title_id     uuid not null references public.titles(id) on delete restrict,
  endpoint     text not null,
  external_id  text not null,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint title_external_ids_endpoint_chk check (char_length(btrim(endpoint)) > 0),
  constraint title_external_ids_external_id_chk check (char_length(btrim(external_id)) > 0),
  constraint title_external_ids_pair_key unique (endpoint, external_id)
);
create index if not exists title_external_ids_org_idx on public.title_external_ids (org_id);
create index if not exists title_external_ids_title_idx on public.title_external_ids (title_id);

-- ----------------------------------------------------------------------------
-- 3. TRIGGERS — audit, updated_at, isolation, source immutability
-- ----------------------------------------------------------------------------
drop trigger if exists audit_finance_periods on public.finance_periods;
create trigger audit_finance_periods after insert or update or delete on public.finance_periods
  for each row execute function public.tg_audit();
drop trigger if exists set_updated_at_finance_periods on public.finance_periods;
create trigger set_updated_at_finance_periods before update on public.finance_periods
  for each row execute function public.tg_set_updated_at();

drop trigger if exists audit_sales_imports on public.sales_imports;
create trigger audit_sales_imports after insert or update or delete on public.sales_imports
  for each row execute function public.tg_audit();

drop trigger if exists audit_sales_lines on public.sales_lines;
create trigger audit_sales_lines after insert or update or delete on public.sales_lines
  for each row execute function public.tg_audit();

drop trigger if exists audit_ledger_entries on public.ledger_entries;
create trigger audit_ledger_entries after insert or update or delete on public.ledger_entries
  for each row execute function public.tg_audit();

drop trigger if exists audit_title_external_ids on public.title_external_ids;
create trigger audit_title_external_ids after insert or update or delete on public.title_external_ids
  for each row execute function public.tg_audit();
drop trigger if exists set_updated_at_title_external_ids on public.title_external_ids;
create trigger set_updated_at_title_external_ids before update on public.title_external_ids
  for each row execute function public.tg_set_updated_at();

-- Title belongs to the row's org. Two clients never share an internal title id.
create or replace function public.tg_finance_title_org_isolation()
  returns trigger
  language plpgsql
as $$
begin
  if new.title_id is not null and not exists (
    select 1 from public.titles t
    where t.id = new.title_id and t.org_id = new.org_id
  ) then
    raise exception 'Client A title never receives Client B import (title is not in this organization)';
  end if;
  return new;
end;
$$;

drop trigger if exists sales_lines_title_org_isolation on public.sales_lines;
create trigger sales_lines_title_org_isolation
  before insert or update of title_id, org_id on public.sales_lines
  for each row execute function public.tg_finance_title_org_isolation();

drop trigger if exists ledger_entries_title_org_isolation on public.ledger_entries;
create trigger ledger_entries_title_org_isolation
  before insert or update of title_id, org_id on public.ledger_entries
  for each row execute function public.tg_finance_title_org_isolation();

drop trigger if exists title_external_ids_title_org_isolation on public.title_external_ids;
create trigger title_external_ids_title_org_isolation
  before insert or update of title_id, org_id on public.title_external_ids
  for each row execute function public.tg_finance_title_org_isolation();

-- Import/period/line org must agree.
create or replace function public.tg_sales_imports_period_org()
  returns trigger
  language plpgsql
as $$
begin
  if not exists (
    select 1 from public.finance_periods p
    where p.id = new.period_id and p.org_id = new.org_id
  ) then
    raise exception 'sales_imports.org_id must match finance_periods.org_id';
  end if;
  return new;
end;
$$;
drop trigger if exists sales_imports_period_org on public.sales_imports;
create trigger sales_imports_period_org
  before insert or update of period_id, org_id on public.sales_imports
  for each row execute function public.tg_sales_imports_period_org();

create or replace function public.tg_sales_lines_import_org()
  returns trigger
  language plpgsql
as $$
begin
  if not exists (
    select 1 from public.sales_imports i
    where i.id = new.import_id and i.org_id = new.org_id and i.period_id = new.period_id
  ) then
    raise exception 'sales_lines must stay on the import''s org and period';
  end if;
  return new;
end;
$$;
drop trigger if exists sales_lines_import_org on public.sales_lines;
create trigger sales_lines_import_org
  before insert or update of import_id, org_id, period_id on public.sales_lines
  for each row execute function public.tg_sales_lines_import_org();

create or replace function public.tg_ledger_entries_period_org()
  returns trigger
  language plpgsql
as $$
begin
  if not exists (
    select 1 from public.finance_periods p
    where p.id = new.period_id and p.org_id = new.org_id
  ) then
    raise exception 'ledger_entries.org_id must match finance_periods.org_id';
  end if;
  if new.sales_line_id is not null and not exists (
    select 1 from public.sales_lines sl
    where sl.id = new.sales_line_id
      and sl.org_id = new.org_id
      and sl.period_id = new.period_id
  ) then
    raise exception 'ledger sales_line_id must belong to the same org and period';
  end if;
  return new;
end;
$$;
drop trigger if exists ledger_entries_period_org on public.ledger_entries;
create trigger ledger_entries_period_org
  before insert or update of period_id, org_id, sales_line_id on public.ledger_entries
  for each row execute function public.tg_ledger_entries_period_org();

-- Source fields on imports/lines are write-once. Mapping may set title_id once.
create or replace function public.tg_sales_imports_source_immutable()
  returns trigger
  language plpgsql
as $$
begin
  if new.org_id is distinct from old.org_id
     or new.period_id is distinct from old.period_id
     or new.filename is distinct from old.filename
     or new.content_hash is distinct from old.content_hash
     or new.imported_by is distinct from old.imported_by
     or new.imported_at is distinct from old.imported_at then
    raise exception 'sales_imports source fields are immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists sales_imports_source_immutable on public.sales_imports;
create trigger sales_imports_source_immutable
  before update on public.sales_imports
  for each row execute function public.tg_sales_imports_source_immutable();

create or replace function public.tg_sales_lines_source_immutable()
  returns trigger
  language plpgsql
as $$
begin
  if new.org_id is distinct from old.org_id
     or new.period_id is distinct from old.period_id
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
  if old.title_id is not null and new.title_id is distinct from old.title_id then
    raise exception 'sales_lines.title_id cannot be remapped; import a correction';
  end if;
  return new;
end;
$$;
drop trigger if exists sales_lines_source_immutable on public.sales_lines;
create trigger sales_lines_source_immutable
  before update on public.sales_lines
  for each row execute function public.tg_sales_lines_source_immutable();

-- ledger_entries are append-only.
create or replace function public.tg_ledger_entries_immutable()
  returns trigger
  language plpgsql
as $$
begin
  raise exception 'ledger_entries are append-only';
end;
$$;
drop trigger if exists ledger_entries_no_update on public.ledger_entries;
create trigger ledger_entries_no_update
  before update on public.ledger_entries
  for each row execute function public.tg_ledger_entries_immutable();

-- Period identity + opening are immutable once written.
create or replace function public.tg_finance_periods_identity_immutable()
  returns trigger
  language plpgsql
as $$
begin
  if new.org_id is distinct from old.org_id
     or new.period_year is distinct from old.period_year
     or new.period_month is distinct from old.period_month
     or new.currency is distinct from old.currency
     or new.opening_balance_cents is distinct from old.opening_balance_cents then
    raise exception 'finance_periods identity and opening balance are immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists finance_periods_identity_immutable on public.finance_periods;
create trigger finance_periods_identity_immutable
  before update on public.finance_periods
  for each row execute function public.tg_finance_periods_identity_immutable();

-- ----------------------------------------------------------------------------
-- 4. RLS + GRANTS
-- ----------------------------------------------------------------------------
alter table public.finance_periods enable row level security;
alter table public.sales_imports enable row level security;
alter table public.sales_lines enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.title_external_ids enable row level security;

revoke all on public.finance_periods, public.sales_imports, public.sales_lines,
              public.ledger_entries, public.title_external_ids
  from public, anon;

revoke insert, update, delete on public.finance_periods, public.sales_imports,
  public.sales_lines, public.ledger_entries, public.title_external_ids
  from authenticated;

revoke update, delete on public.ledger_entries from service_role;

grant select on public.finance_periods, public.sales_imports, public.sales_lines,
               public.ledger_entries, public.title_external_ids
  to authenticated;
grant select, insert, update on public.finance_periods, public.sales_imports,
  public.sales_lines, public.title_external_ids to service_role;
grant select, insert on public.ledger_entries to service_role;

-- Reads: existing financial_read. member_can delegates staff to gc_can.
-- Writes: RPC only (authenticated DML revoked).
drop policy if exists finance_periods_select on public.finance_periods;
create policy finance_periods_select on public.finance_periods
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view_financial'));

drop policy if exists sales_imports_select on public.sales_imports;
create policy sales_imports_select on public.sales_imports
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view_financial'));

drop policy if exists sales_lines_select on public.sales_lines;
create policy sales_lines_select on public.sales_lines
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view_financial'));

drop policy if exists ledger_entries_select on public.ledger_entries;
create policy ledger_entries_select on public.ledger_entries
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view_financial'));

drop policy if exists title_external_ids_select on public.title_external_ids;
create policy title_external_ids_select on public.title_external_ids
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view_financial'));

-- Gate finance audit snapshots the same way as contract_terms.
drop policy if exists audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log for select to authenticated
  using (
    case
      when public.is_gc_staff(auth.uid()) then
        case
          when entity in (
            'contract_terms','subscriptions','organizations','organization_payout_details',
            'finance_periods','sales_imports','sales_lines','ledger_entries','title_external_ids'
          )
            then public.gc_can(auth.uid(), 'view_financial')
          else public.gc_can(auth.uid(), 'view')
        end
      else (
        org_id is not null
        and case
          when entity in (
            'contract_terms','subscriptions','organizations','organization_payout_details',
            'finance_periods','sales_imports','sales_lines','ledger_entries','title_external_ids'
          )
            then public.member_can(auth.uid(), org_id, 'view_financial')
          else public.member_can(auth.uid(), org_id, 'view')
        end
      )
    end
  );

-- ----------------------------------------------------------------------------
-- 5. WRITE RPCs — staff money-write capability only
-- ----------------------------------------------------------------------------

create or replace function public.create_finance_period(
  p_org_id uuid,
  p_year integer,
  p_month integer,
  p_threshold_cents integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_opening integer := 0;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;
  if p_year is null or p_month is null then
    raise exception 'Period year and month are required';
  end if;
  if not exists (select 1 from public.organizations where id = p_org_id) then
    raise exception 'Organization not found';
  end if;

  select closing_balance_cents into v_opening
  from public.finance_periods
  where org_id = p_org_id and status = 'closed'
  order by period_year desc, period_month desc
  limit 1;
  v_opening := coalesce(v_opening, 0);

  insert into public.finance_periods (
    org_id, period_year, period_month, opening_balance_cents, threshold_cents, created_by
  ) values (
    p_org_id, p_year, p_month, v_opening, p_threshold_cents, auth.uid()
  ) returning id into v_id;

  insert into public.ledger_entries (
    org_id, period_id, kind, amount_cents, source_refs, logic_version, posted_by
  ) values (
    p_org_id, v_id, 'opening', v_opening,
    jsonb_build_object('kind', 'opening'),
    public.finance_logic_version(),
    auth.uid()
  );

  return v_id;
end;
$$;

create or replace function public.set_finance_period_threshold(
  p_period_id uuid,
  p_threshold_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;
  if p_threshold_cents is not null and p_threshold_cents < 0 then
    raise exception 'Threshold cannot be negative';
  end if;
  update public.finance_periods
     set threshold_cents = p_threshold_cents
   where id = p_period_id and status = 'open';
  if not found then
    raise exception 'Period not found or already closed';
  end if;
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
declare
  v_org uuid;
  v_status public.finance_period_status;
  v_import uuid;
  v_line jsonb;
  v_n integer := 0;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;
  if coalesce(btrim(p_filename), '') = '' then raise exception 'Filename is required'; end if;
  if coalesce(btrim(p_content_hash), '') = '' then raise exception 'Content hash is required'; end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Import must include at least one line';
  end if;

  select org_id, status into v_org, v_status
  from public.finance_periods where id = p_period_id;
  if not found then raise exception 'Period not found'; end if;
  if v_status <> 'open' then raise exception 'Period is closed'; end if;

  insert into public.sales_imports (org_id, period_id, filename, content_hash, imported_by)
  values (v_org, p_period_id, btrim(p_filename), btrim(p_content_hash), auth.uid())
  returning id into v_import;

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
      v_org, p_period_id, v_import, v_n,
      lower(btrim(v_line->>'endpoint')),
      btrim(v_line->>'external_id'),
      (v_line->>'bank_receipt_cents')::integer,
      nullif(v_line->>'reported_cents', '')::integer,
      'USD',
      nullif(v_line->>'transaction_date', '')::date,
      coalesce(v_line->'raw', v_line)
    );
  end loop;

  return v_import;
end;
$$;

create or replace function public.upsert_title_external_id(
  p_title_id uuid,
  p_endpoint text,
  p_external_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
  v_endpoint text := lower(btrim(p_endpoint));
  v_ext text := btrim(p_external_id);
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;
  if v_endpoint = '' or v_ext = '' then
    raise exception 'endpoint and external_id are required';
  end if;

  select org_id into v_org from public.titles where id = p_title_id;
  if v_org is null then raise exception 'Title not found'; end if;

  insert into public.title_external_ids (org_id, title_id, endpoint, external_id, created_by)
  values (v_org, p_title_id, v_endpoint, v_ext, auth.uid())
  on conflict (endpoint, external_id) do update
    set title_id = excluded.title_id,
        org_id = excluded.org_id,
        updated_at = now()
    where public.title_external_ids.org_id = excluded.org_id
  returning id into v_id;

  if v_id is null then
    raise exception 'Client A title never receives Client B import (endpoint id belongs to another organization)';
  end if;
  return v_id;
end;
$$;

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

  -- Org-scoped lookup only. A Client B mapping cannot attach to a Client A line.
  update public.sales_lines sl
     set title_id = tei.title_id,
         mapped_at = now()
    from public.title_external_ids tei
   where sl.import_id = p_import_id
     and sl.title_id is null
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
    select 1 from public.sales_lines where import_id = p_import_id and title_id is null
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
  v_title_org uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;

  select org_id into v_org from public.sales_lines where id = p_line_id;
  if v_org is null then raise exception 'Sales line not found'; end if;
  select org_id into v_title_org from public.titles where id = p_title_id;
  if v_title_org is null then raise exception 'Title not found'; end if;
  if v_title_org is distinct from v_org then
    raise exception 'Client A title never receives Client B import';
  end if;

  update public.sales_lines
     set title_id = p_title_id,
         mapped_at = now()
   where id = p_line_id and title_id is null;
  if not found then
    raise exception 'Sales line already mapped or not found';
  end if;
end;
$$;

create or replace function public.post_ledger_entry(
  p_period_id uuid,
  p_kind public.ledger_entry_kind,
  p_amount_cents integer,
  p_title_id uuid default null,
  p_note text default null,
  p_sales_line_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status public.finance_period_status;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.gc_can(auth.uid(), 'manage_tax_banking') then
    raise exception 'Not authorized';
  end if;
  if p_kind not in ('recoup', 'adjustment', 'sale') then
    raise exception 'Staff may post recoup, adjustment, or sale only';
  end if;
  if p_amount_cents is null then raise exception 'amount_cents is required'; end if;

  select org_id, status into v_org, v_status
  from public.finance_periods where id = p_period_id;
  if not found then raise exception 'Period not found'; end if;
  if v_status <> 'open' then raise exception 'Period is closed'; end if;

  if p_title_id is not null and not exists (
    select 1 from public.titles where id = p_title_id and org_id = v_org
  ) then
    raise exception 'Client A title never receives Client B import';
  end if;

  insert into public.ledger_entries (
    org_id, period_id, title_id, kind, amount_cents, note, sales_line_id,
    source_refs, logic_version, posted_by
  ) values (
    v_org, p_period_id, p_title_id, p_kind, p_amount_cents,
    nullif(btrim(coalesce(p_note, '')), ''),
    p_sales_line_id,
    jsonb_build_object('kind', 'staff_post', 'entry_kind', p_kind::text),
    public.finance_logic_version(),
    auth.uid()
  ) returning id into v_id;

  return v_id;
end;
$$;

-- Post mapped sales using contract_terms.revenue_share_rate_bp, then close.
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

revoke execute on function public.finance_logic_version() from public;
grant execute on function public.finance_logic_version() to anon, authenticated, service_role;

revoke execute on function public.finance_client_share_cents(integer, integer) from public;
grant execute on function public.finance_client_share_cents(integer, integer) to anon, authenticated, service_role;

revoke execute on function public.create_finance_period(uuid, integer, integer, integer) from public, anon;
grant execute on function public.create_finance_period(uuid, integer, integer, integer) to authenticated, service_role;

revoke execute on function public.set_finance_period_threshold(uuid, integer) from public, anon;
grant execute on function public.set_finance_period_threshold(uuid, integer) to authenticated, service_role;

revoke execute on function public.import_sales(uuid, text, text, jsonb) from public, anon;
grant execute on function public.import_sales(uuid, text, text, jsonb) to authenticated, service_role;

revoke execute on function public.upsert_title_external_id(uuid, text, text) from public, anon;
grant execute on function public.upsert_title_external_id(uuid, text, text) to authenticated, service_role;

revoke execute on function public.map_sales_import(uuid) from public, anon;
grant execute on function public.map_sales_import(uuid) to authenticated, service_role;

revoke execute on function public.map_sales_line(uuid, uuid) from public, anon;
grant execute on function public.map_sales_line(uuid, uuid) to authenticated, service_role;

revoke execute on function public.post_ledger_entry(uuid, public.ledger_entry_kind, integer, uuid, text, uuid) from public, anon;
grant execute on function public.post_ledger_entry(uuid, public.ledger_entry_kind, integer, uuid, text, uuid) to authenticated, service_role;

revoke execute on function public.close_finance_period(uuid) from public, anon;
grant execute on function public.close_finance_period(uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 6. Apply-time proof
-- ----------------------------------------------------------------------------
do $$
declare v_bad text;
begin
  if to_regclass('public.finance_periods') is null
     or to_regclass('public.sales_imports') is null
     or to_regclass('public.sales_lines') is null
     or to_regclass('public.ledger_entries') is null
     or to_regclass('public.title_external_ids') is null then
    raise exception 'finance ops tables missing';
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name in ('finance_periods','sales_imports','sales_lines','ledger_entries','title_external_ids')
       and column_name = 'profile_id'
  ) then
    raise exception 'finance tables must not have profile_id (mapping C)';
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name in ('finance_periods','sales_imports','sales_lines','ledger_entries','title_external_ids')
       and column_name = 'org_id'
     group by table_name
    having count(*) = 0
  ) then
    raise exception 'finance tables must have org_id';
  end if;

  select string_agg(tablename||'.'||policyname, ', ') into v_bad
  from pg_policies
  where schemaname = 'public'
    and tablename in ('finance_periods','sales_imports','sales_lines','ledger_entries','title_external_ids')
    and cmd = 'SELECT'
    and qual not like '%view_financial%';
  if v_bad is not null then
    raise exception 'finance SELECT policies must use view_financial: %', v_bad;
  end if;

  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'close_finance_period'
      and (
        p.prosrc not like '%revenue_share_rate_bp%'
        or p.prosrc like '%tier_revenue_share_bp%'
        or p.prosrc like '%aggregator_rate%'
      )
  ) then
    raise exception 'close must use contract_terms.revenue_share_rate_bp and must not invent a second fee field';
  end if;

  raise notice 'finance ops slice 1 applied; client tier remainder compute';
end $$;
