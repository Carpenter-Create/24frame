-- finance_ops_slice_2_aws_spine_test.sql
-- AWS worker is the sole import-parse and close-compute path.
-- Staff enqueue; service_role apply. Next.js must not call apply_*.
-- Isolation: Client A keys never attach to Client B periods.

begin;
select plan(14);

select set_config('t.org_a', gen_random_uuid()::text, false);
select set_config('t.org_b', gen_random_uuid()::text, false);
select set_config('t.title_a', gen_random_uuid()::text, false);
select set_config('t.owner_a', gen_random_uuid()::text, false);
select set_config('t.acct', gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.owner_a')::uuid),
  (current_setting('t.acct')::uuid);

insert into public.organizations (id, name, status) values
  (current_setting('t.org_a')::uuid, 'Client A', 'active'),
  (current_setting('t.org_b')::uuid, 'Client B', 'active');

insert into public.memberships (org_id, user_id, role, status) values
  (current_setting('t.org_a')::uuid, current_setting('t.owner_a')::uuid, 'account_owner', 'active');

insert into public.gc_staff (user_id, role) values
  (current_setting('t.acct')::uuid, 'gc_accountant');

insert into public.titles (id, org_id, title) values
  (current_setting('t.title_a')::uuid, current_setting('t.org_a')::uuid, 'Title A');

insert into public.contract_terms
  (org_id, tier, revenue_share_rate_bp, effective_from, term_length_months, expires_at, trigger)
  values
  (current_setting('t.org_a')::uuid, 'premium', 8500, '2026-01-01', 36, '2029-01-01', 'signup');

select is((select count(*)::int from information_schema.columns
           where table_schema='public'
             and table_name in ('finance_jobs','finance_statement_exports')
             and column_name='profile_id'),
          0, 'AWS spine tables have no profile_id');
select is((select count(distinct table_name)::int from information_schema.columns
           where table_schema='public'
             and table_name in ('finance_jobs','finance_statement_exports')
             and column_name='org_id'),
          2, 'AWS spine tables are org-scoped');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.acct'), 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select set_config('t.period_a', public.create_finance_period(current_setting('t.org_a')::uuid, 2026, 8, 1000)::text, false) $$,
  'open period');

select throws_ok(
  $$ select public.import_sales(
       current_setting('t.period_a')::uuid,
       'soft.csv', 'hash-soft',
       '[{"endpoint":"avod","external_id":"S-1","bank_receipt_cents":1000}]'::jsonb) $$,
  'P0001', 'Import parse runs on the finance worker; use request_sales_import',
  'soft-path import_sales is retired');

select throws_ok(
  $$ select public.request_sales_import(
       current_setting('t.period_a')::uuid,
       'cross.csv', 'hash-cross',
       'orgs/' || current_setting('t.org_b') || '/imports/hash-cross/cross.csv') $$,
  'P0001', 'Client A never reads Client B money',
  'Client B s3_key rejected on Client A period');

select throws_ok(
  $$ select public.apply_sales_import(
       gen_random_uuid(),
       '[{"endpoint":"avod","external_id":"X-1","bank_receipt_cents":1}]'::jsonb) $$,
  'P0001', 'Finance compute is AWS-worker only',
  'authenticated cannot apply an import');

select throws_ok(
  $$ select public.apply_finance_close(current_setting('t.period_a')::uuid) $$,
  'P0001', 'Finance compute is AWS-worker only',
  'authenticated cannot apply close');

select lives_ok(
  $$ select set_config('t.import_a', public.request_sales_import(
       current_setting('t.period_a')::uuid,
       'a.csv', 'hash-a',
       'orgs/' || current_setting('t.org_a') || '/imports/hash-a/a.csv'
     )::text, false) $$,
  'staff enqueue ingest');

select is((select status::text from public.sales_imports where id = current_setting('t.import_a')::uuid),
          'queued', 'import stays queued until the worker applies lines');

reset role;
set local role service_role;
select set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
select lives_ok(
  $$ select public.apply_sales_import(
       current_setting('t.import_a')::uuid,
       '[{"endpoint":"fast","external_id":"A-1","bank_receipt_cents":2000,"currency":"USD"}]'::jsonb) $$,
  'worker apply ingest');
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.acct'), 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select public.upsert_title_external_id(current_setting('t.title_a')::uuid, 'fast', 'A-1') $$,
  'map endpoint');
select is(public.map_sales_import(current_setting('t.import_a')::uuid), 1, 'map the imported line');

select lives_ok(
  $$ select public.close_finance_period(current_setting('t.period_a')::uuid) $$,
  'staff enqueue close');
select is((select status::text from public.finance_periods where id = current_setting('t.period_a')::uuid),
          'open', 'thin close does not post; period stays open until the worker applies');

select * from finish();
rollback;
