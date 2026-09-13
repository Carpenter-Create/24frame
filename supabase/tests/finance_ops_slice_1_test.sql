-- finance_ops_slice_1_test.sql
-- Staff monthly finance. Isolation: Client A title never receives Client B import.
-- RLS: view_financial reads; manage_tax_banking writes. Mapping C: org-scoped,
-- no profile privilege bridge. Close applies contract_terms client share.

begin;
select plan(35);

select set_config('t.org_a', gen_random_uuid()::text, false);
select set_config('t.org_b', gen_random_uuid()::text, false);
select set_config('t.title_a', gen_random_uuid()::text, false);
select set_config('t.title_b', gen_random_uuid()::text, false);
select set_config('t.owner_a', gen_random_uuid()::text, false);
select set_config('t.view_a', gen_random_uuid()::text, false);
select set_config('t.owner_b', gen_random_uuid()::text, false);
select set_config('t.acct', gen_random_uuid()::text, false);
select set_config('t.legal', gen_random_uuid()::text, false);
select set_config('t.ops', gen_random_uuid()::text, false);
select set_config('t.profile', gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.owner_a')::uuid),
  (current_setting('t.view_a')::uuid),
  (current_setting('t.owner_b')::uuid),
  (current_setting('t.acct')::uuid),
  (current_setting('t.legal')::uuid),
  (current_setting('t.ops')::uuid),
  (current_setting('t.profile')::uuid);

insert into public.organizations (id, name, status) values
  (current_setting('t.org_a')::uuid, 'Client A', 'active'),
  (current_setting('t.org_b')::uuid, 'Client B', 'active');

insert into public.memberships (org_id, user_id, role, status) values
  (current_setting('t.org_a')::uuid, current_setting('t.owner_a')::uuid, 'account_owner', 'active'),
  (current_setting('t.org_a')::uuid, current_setting('t.view_a')::uuid, 'viewer', 'active'),
  (current_setting('t.org_b')::uuid, current_setting('t.owner_b')::uuid, 'account_owner', 'active');

insert into public.gc_staff (user_id, role) values
  (current_setting('t.acct')::uuid, 'gc_accountant'),
  (current_setting('t.legal')::uuid, 'gc_legal'),
  (current_setting('t.ops')::uuid, 'gc_delivery_ops');

insert into public.titles (id, org_id, title) values
  (current_setting('t.title_a')::uuid, current_setting('t.org_a')::uuid, 'Title A'),
  (current_setting('t.title_b')::uuid, current_setting('t.org_b')::uuid, 'Title B');

insert into public.contract_terms
  (org_id, tier, revenue_share_rate_bp, effective_from, term_length_months, expires_at, trigger)
  values
  (current_setting('t.org_a')::uuid, 'premium', 8500, '2026-01-01', 36, '2029-01-01', 'signup');

-- Source fields stay on the import so statements can show endpoint input later.
select is((select count(*)::int from information_schema.columns
           where table_schema='public' and table_name='sales_lines'
             and column_name in
               ('endpoint','external_id','bank_receipt_cents','reported_cents','raw')),
          5, 'sales_lines keeps endpoint-sourced input fields');
select is((select count(*)::int from information_schema.columns
           where table_schema='public'
             and table_name in
               ('finance_periods','sales_imports','sales_lines','ledger_entries','title_external_ids')
             and column_name in
               ('aggregator_rate','client_tier_percent','aggregator_keep_bp')),
          0, 'no second independent fee field');

-- Mapping C: finance tables are org-owned, not Social profiles.
select is((select count(*)::int from information_schema.columns
           where table_schema='public'
             and table_name in ('finance_periods','sales_imports','sales_lines','ledger_entries','title_external_ids')
             and column_name='profile_id'),
          0, 'mapping C: finance tables have no profile_id');
select is((select count(distinct table_name)::int from information_schema.columns
           where table_schema='public'
             and table_name in ('finance_periods','sales_imports','sales_lines','ledger_entries','title_external_ids')
             and column_name='org_id'),
          5, 'mapping C: every finance table has org_id');

-- Client owner cannot create a period.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner_a'), 'role', 'authenticated')::text, true);
select throws_ok(
  $$ select public.create_finance_period(current_setting('t.org_a')::uuid, 2026, 8, 1000) $$,
  'P0001', 'Not authorized',
  'client owner A: create_finance_period BLOCKED');

-- gc_delivery_ops cannot import or close (no finance).
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.ops'), 'role', 'authenticated')::text, true);
select throws_ok(
  $$ select public.create_finance_period(current_setting('t.org_a')::uuid, 2026, 8, 1000) $$,
  'P0001', 'Not authorized',
  'gc_delivery_ops: create_finance_period BLOCKED');

-- gc_legal reads money, writes nothing.
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.legal'), 'role', 'authenticated')::text, true);
select throws_ok(
  $$ select public.create_finance_period(current_setting('t.org_a')::uuid, 2026, 8, 1000) $$,
  'P0001', 'Not authorized',
  'gc_legal: create_finance_period BLOCKED');

-- Accountant opens the period and imports.
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.acct'), 'role', 'authenticated')::text, true);
select lives_ok(
  $$ select set_config('t.period_a', public.create_finance_period(current_setting('t.org_a')::uuid, 2026, 8, 500)::text, false) $$,
  'gc_accountant: create_finance_period permitted');
select lives_ok(
  $$ select set_config('t.period_b', public.create_finance_period(current_setting('t.org_b')::uuid, 2026, 8, null)::text, false) $$,
  'gc_accountant: create_finance_period for org B');

select lives_ok(
  $$ select set_config('t.import_a', public.import_sales(
       current_setting('t.period_a')::uuid,
       'a.csv',
       'hash-a',
       '[{"endpoint":"tubi","external_id":"EXT-1","bank_receipt_cents":1000,"currency":"USD"}]'::jsonb
     )::text, false) $$,
  'gc_accountant: import_sales for org A');

-- Client B mapping must not attach to Client A import.
select lives_ok(
  $$ select public.upsert_title_external_id(current_setting('t.title_b')::uuid, 'tubi', 'EXT-1') $$,
  'gc_accountant: map endpoint onto org B title');

select is(
  public.map_sales_import(current_setting('t.import_a')::uuid),
  0,
  'map_sales_import: Client B title does not receive Client A import');

select is((select title_id from public.sales_lines
           where import_id = current_setting('t.import_a')::uuid)::text,
          null,
          'sales_line stays unmapped when the only pair belongs to org B');

select throws_ok(
  $$ select public.map_sales_line(
       (select id from public.sales_lines where import_id = current_setting('t.import_a')::uuid),
       current_setting('t.title_b')::uuid) $$,
  'P0001', 'Client A title never receives Client B import',
  'map_sales_line: org B title rejected on org A line');

select throws_ok(
  $$ select public.post_ledger_entry(
       current_setting('t.period_a')::uuid, 'sale', 1000,
       current_setting('t.title_b')::uuid, 'cross', null) $$,
  'P0001', 'Client A title never receives Client B import',
  'post_ledger_entry: org B title rejected on org A period');

-- Same org mapping succeeds.
select lives_ok(
  $$ select public.upsert_title_external_id(current_setting('t.title_a')::uuid, 'fast', 'A-1') $$,
  'upsert_title_external_id on org A title');
select lives_ok(
  $$ select public.import_sales(
       current_setting('t.period_a')::uuid,
       'a2.csv',
       'hash-a2',
       '[{"endpoint":"fast","external_id":"A-1","bank_receipt_cents":2500,"currency":"USD"}]'::jsonb) $$,
  'second import for org A');
select is(
  (select public.map_sales_import(id) from public.sales_imports where filename = 'a2.csv'),
  1,
  'map_sales_import attaches the org A title only');
select is((select title_id from public.sales_lines
           where endpoint = 'fast' and external_id = 'A-1')::text,
          current_setting('t.title_a'),
          'org A line maps to org A title');

select lives_ok(
  $$ select public.close_finance_period(current_setting('t.period_a')::uuid) $$,
  'close_finance_period permitted for accountant');

select is((select amount_cents from public.ledger_entries
           where period_id = current_setting('t.period_a')::uuid and kind = 'sale'
           limit 1),
          2125,
          'close posts client share of bank receipt (8500bp of 2500)');
select is((select (source_refs->>'aggregator_keep_cents')::int from public.ledger_entries
           where period_id = current_setting('t.period_a')::uuid and kind = 'sale'
           limit 1),
          375,
          'aggregator keep is the remainder, shown on the sale lineage');
select is((select logic_version from public.ledger_entries
           where period_id = current_setting('t.period_a')::uuid and kind = 'payable'
           limit 1),
          'finance-ops-slice-1.1-client-tier-remainder',
          'close lineage is the complementary-split version');
select is((select (source_refs->>'complementary_split')::boolean from public.ledger_entries
           where period_id = current_setting('t.period_a')::uuid and kind = 'sale'
           limit 1),
          true,
          'sale lineage records the complementary split');
select is((select endpoint from public.sales_lines where external_id = 'A-1'),
          'fast',
          'import source endpoint is preserved after close');

-- RLS reads
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner_a'), 'role', 'authenticated')::text, true);
select is((select count(*)::int from public.finance_periods
           where org_id = current_setting('t.org_a')::uuid),
          1, 'owner A: own finance_periods permitted');
select is((select count(*)::int from public.finance_periods
           where org_id = current_setting('t.org_b')::uuid),
          0, 'owner A: org B finance_periods BLOCKED');
select is((select count(*)::int from public.sales_lines
           where org_id = current_setting('t.org_b')::uuid),
          0, 'owner A: org B sales_lines BLOCKED');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.view_a'), 'role', 'authenticated')::text, true);
select is((select count(*)::int from public.finance_periods
           where org_id = current_setting('t.org_a')::uuid),
          0, 'viewer A: finance_periods BLOCKED (no view_financial)');
select throws_ok(
  $$ select public.import_sales(
       current_setting('t.period_b')::uuid,
       'evil.csv', 'h',
       '[{"endpoint":"x","external_id":"y","bank_receipt_cents":1}]'::jsonb) $$,
  'P0001', 'Not authorized',
  'viewer A: import_sales BLOCKED');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.ops'), 'role', 'authenticated')::text, true);
select is((select count(*)::int from public.ledger_entries
           where org_id = current_setting('t.org_a')::uuid),
          0, 'gc_delivery_ops: ledger_entries BLOCKED');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.legal'), 'role', 'authenticated')::text, true);
select ok((select count(*) from public.finance_periods
           where org_id = current_setting('t.org_a')::uuid) = 1,
          'gc_legal: finance_periods permitted');

-- Social profile is not a finance privilege.
reset role;
insert into public.profiles (id, handle, display_name, birth_date)
  values (current_setting('t.profile')::uuid, 'finops_social', 'Fin Ops', '1990-01-01');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.profile'), 'role', 'authenticated')::text, true);
select is((select count(*)::int from public.finance_periods), 0,
          'mapping C: Social profile cannot read finance_periods');
select throws_ok(
  $$ select public.close_finance_period(current_setting('t.period_b')::uuid) $$,
  'P0001', 'Not authorized',
  'mapping C: Social profile cannot close a period');

select * from finish();
rollback;
