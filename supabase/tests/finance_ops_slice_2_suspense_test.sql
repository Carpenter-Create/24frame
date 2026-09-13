-- finance_ops_slice_2_suspense_test.sql
-- Staff may park unmapped lines and attach them to another open period
-- of the same org. Recipients never see or write suspense. Isolation:
-- Client A lines never enter Client B suspense. Compute unchanged.

begin;
select plan(17);

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

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.acct'), 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select set_config('t.period_a', public.create_finance_period(current_setting('t.org_a')::uuid, 2026, 8, 1000)::text, false) $$,
  'open Aug period');
select lives_ok(
  $$ select set_config('t.period_a2', public.create_finance_period(current_setting('t.org_a')::uuid, 2026, 9, 1000)::text, false) $$,
  'open Sep period');
select lives_ok(
  $$ select set_config('t.period_b', public.create_finance_period(current_setting('t.org_b')::uuid, 2026, 8, null)::text, false) $$,
  'open org B period');

select lives_ok(
  $$ select public.import_sales(
       current_setting('t.period_a')::uuid,
       'park.csv', 'hash-park',
       '[{"endpoint":"avod","external_id":"U-1","bank_receipt_cents":4000,"reported_cents":4100,"currency":"USD"}]'::jsonb) $$,
  'import unmapped line on Aug');

select lives_ok(
  $$ select set_config('t.line_u', (
       select id::text from public.sales_lines where external_id = 'U-1'
     ), false) $$,
  'capture unmapped line id');

select throws_ok(
  $$ select public.close_finance_period(current_setting('t.period_a')::uuid) $$,
  'P0001', 'Map unmapped lines or move them to suspense before close',
  'close blocked while unmapped lines remain on the period');

select lives_ok(
  $$ select public.move_sales_lines_to_suspense(array[current_setting('t.line_u')::uuid]) $$,
  'move unmapped lines to suspense');

select is((select period_id from public.sales_lines where id = current_setting('t.line_u')::uuid),
          null, 'suspense line has null period_id');
select is((select origin_period_id from public.sales_lines where id = current_setting('t.line_u')::uuid)::text,
          current_setting('t.period_a'),
          'origin period preserved');

select lives_ok(
  $$ select public.close_finance_period(current_setting('t.period_a')::uuid) $$,
  'close allowed after unmapped lines move to suspense');

select is((select count(*)::int from public.ledger_entries
           where period_id = current_setting('t.period_a')::uuid and kind = 'sale'),
          0, 'close ignores suspense — no sale posted from parked line');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner_a'), 'role', 'authenticated')::text, true);
select is((select count(*)::int from public.sales_lines
           where id = current_setting('t.line_u')::uuid),
          0, 'recipient cannot see a line while it is in suspense');
select throws_ok(
  $$ select public.move_sales_lines_to_suspense(array[current_setting('t.line_u')::uuid]) $$,
  'P0001', 'Not authorized',
  'recipient cannot write suspense');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.acct'), 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.assign_suspense_lines_to_period(
       array[current_setting('t.line_u')::uuid],
       current_setting('t.period_a')::uuid) $$,
  'P0001', 'Cannot assign suspense to a closed period',
  'cannot assign to a closed period');

select throws_ok(
  $$ select public.assign_suspense_lines_to_period(
       array[current_setting('t.line_u')::uuid],
       current_setting('t.period_b')::uuid) $$,
  'P0001', 'Client A lines never enter Client B suspense',
  'cannot cross org');

select lives_ok(
  $$ select public.assign_suspense_lines_to_period(
       array[current_setting('t.line_u')::uuid],
       current_setting('t.period_a2')::uuid) $$,
  'assign suspense lines to an open period');

select is((select period_id from public.sales_lines where id = current_setting('t.line_u')::uuid)::text,
          current_setting('t.period_a2'),
          'line attached to the staff-chosen open period');

select * from finish();
rollback;
