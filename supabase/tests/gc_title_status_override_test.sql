-- gc_title_status_override_test.sql
-- G7: staff can override pre-lock-in; non-staff denied; empty reason denied;
-- lock-in blocks; archive_title still works when locked.

begin;
select plan(20);

select set_config('t.org', gen_random_uuid()::text, false);
select set_config('t.owner', gen_random_uuid()::text, false);
select set_config('t.gc', gen_random_uuid()::text, false);
select set_config('t.ready', gen_random_uuid()::text, false);
select set_config('t.pending', gen_random_uuid()::text, false);
select set_config('t.delivered', gen_random_uuid()::text, false);
select set_config('t.money', gen_random_uuid()::text, false);
select set_config('t.vendor', gen_random_uuid()::text, false);
select set_config('t.grant_p', gen_random_uuid()::text, false);
select set_config('t.grant_d', gen_random_uuid()::text, false);
select set_config('t.period', gen_random_uuid()::text, false);
select set_config('t.import', gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.owner')::uuid),
  (current_setting('t.gc')::uuid);

insert into public.organizations (id, name, status) values
  (current_setting('t.org')::uuid, 'Org A', 'active');

insert into public.memberships (org_id, user_id, role, status) values
  (current_setting('t.org')::uuid, current_setting('t.owner')::uuid, 'account_owner', 'active');

insert into public.gc_staff (user_id, role) values
  (current_setting('t.gc')::uuid, 'gc_delivery_ops');

insert into public.titles (id, org_id, title, status, created_by) values
  (current_setting('t.ready')::uuid, current_setting('t.org')::uuid, 'Ready', 'in_delivery', current_setting('t.owner')::uuid),
  (current_setting('t.pending')::uuid, current_setting('t.org')::uuid, 'Pending Only', 'in_delivery', current_setting('t.owner')::uuid),
  (current_setting('t.delivered')::uuid, current_setting('t.org')::uuid, 'Delivered', 'in_delivery', current_setting('t.owner')::uuid),
  (current_setting('t.money')::uuid, current_setting('t.org')::uuid, 'Money', 'live', current_setting('t.owner')::uuid);

insert into public.vendors (id, name, delivery_mode) values
  (current_setting('t.vendor')::uuid, 'Endpoint One', 'portal_upload');

insert into public.rights_grants (
  id, org_id, title_id, rights_type, territory_mode, territories, exclusive, effective_from
) values
  (current_setting('t.grant_p')::uuid, current_setting('t.org')::uuid, current_setting('t.pending')::uuid,
   'svod', 'include', array['US'], false, now()),
  (current_setting('t.grant_d')::uuid, current_setting('t.org')::uuid, current_setting('t.delivered')::uuid,
   'svod', 'include', array['US'], false, now());

insert into public.deliveries (
  org_id, title_id, vendor_id, grant_id, territory, status
) values
  (current_setting('t.org')::uuid, current_setting('t.pending')::uuid, current_setting('t.vendor')::uuid,
   current_setting('t.grant_p')::uuid, 'US', 'pending'),
  (current_setting('t.org')::uuid, current_setting('t.delivered')::uuid, current_setting('t.vendor')::uuid,
   current_setting('t.grant_d')::uuid, 'US', 'delivered');

insert into public.finance_periods (id, org_id, period_year, period_month, created_by)
values (current_setting('t.period')::uuid, current_setting('t.org')::uuid, 2026, 9, current_setting('t.gc')::uuid);

insert into public.sales_imports (id, org_id, period_id, filename, content_hash, imported_by)
values (
  current_setting('t.import')::uuid,
  current_setting('t.org')::uuid,
  current_setting('t.period')::uuid,
  'sep.csv',
  'hash-sep',
  current_setting('t.gc')::uuid
);

insert into public.sales_lines (
  org_id, period_id, import_id, line_no, endpoint, external_id, title_id, bank_receipt_cents
) values (
  current_setting('t.org')::uuid,
  current_setting('t.period')::uuid,
  current_setting('t.import')::uuid,
  1,
  'endpoint-a',
  'ext-1',
  current_setting('t.money')::uuid,
  1000
);

set local role authenticated;

-- ===== non-staff denied =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.gc_set_title_status(current_setting('t.ready')::uuid, 'draft', 'needs stills') $$,
  'P0001', null, 'client owner: gc_set_title_status raises (not gc_staff)');

-- ===== staff: reason + pre-lock-in override =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.gc'), 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.gc_set_title_status(current_setting('t.ready')::uuid, 'draft', '   ') $$,
  'P0001', null, 'gc: empty reason denied');

select is(public.title_status_override_locked(current_setting('t.ready')::uuid),
  false, 'Approved with no delivery/reporting is not locked');

select is(public.title_has_delivered_endpoint(current_setting('t.pending')::uuid),
  false, 'pending delivery is not delivered-to');

select is(public.title_status_override_locked(current_setting('t.pending')::uuid),
  false, 'Approved + pending-only is not locked');

select lives_ok(
  $$ select public.gc_set_title_status(current_setting('t.ready')::uuid, 'draft', 'needs stills') $$,
  'gc: override in_delivery → draft before lock-in');

select is((select status::text from public.titles where id = current_setting('t.ready')::uuid),
  'draft', 'ready title is now draft');

select is((select to_status::text from public.title_status_overrides
            where title_id = current_setting('t.ready')::uuid
            order by created_at desc limit 1),
  'draft', 'override audit to_status is draft');

select is((select from_status::text from public.title_status_overrides
            where title_id = current_setting('t.ready')::uuid
            order by created_at desc limit 1),
  'in_delivery', 'override audit from_status is in_delivery');

select is((select reason from public.title_status_overrides
            where title_id = current_setting('t.ready')::uuid
            order by created_at desc limit 1),
  'needs stills', 'override audit reason recorded');

select throws_ok(
  $$ select public.gc_set_title_status(current_setting('t.ready')::uuid, 'draft', 'again') $$,
  'P0001', null, 'gc: same status denied');

select lives_ok(
  $$ select public.gc_set_title_status(current_setting('t.ready')::uuid, 'in_review', 'needs review') $$,
  'gc: send to in_review before lock-in');

-- ===== lock-in: delivered endpoint =====
select is(public.title_has_delivered_endpoint(current_setting('t.delivered')::uuid),
  true, 'delivered delivery counts as delivered-to');

select is(public.title_status_override_locked(current_setting('t.delivered')::uuid),
  true, 'Approved + delivered endpoint is locked');

select throws_ok(
  $$ select public.gc_set_title_status(current_setting('t.delivered')::uuid, 'draft', 'too late') $$,
  'P0001', null, 'gc: lock-in blocks override after a delivered endpoint');

-- ===== lock-in: reporting activity =====
select is(public.title_status_override_locked(current_setting('t.money')::uuid),
  true, 'Approved + reporting activity is locked');

select throws_ok(
  $$ select public.gc_set_title_status(current_setting('t.money')::uuid, 'draft', 'too late') $$,
  'P0001', null, 'gc: lock-in blocks override when reporting exists');

select lives_ok(
  $$ select public.archive_title(current_setting('t.money')::uuid) $$,
  'archive_title still works when override is locked');

select is((select status::text from public.titles where id = current_setting('t.money')::uuid),
  'archived', 'locked title exits via archive_title');

-- ===== writes are RPC-only =====
select throws_ok(
  $$ insert into public.title_status_overrides (
       title_id, org_id, from_status, to_status, reason
     ) values (
       current_setting('t.pending')::uuid, current_setting('t.org')::uuid,
       'in_delivery', 'draft', 'direct'
     ) $$,
  null, null, 'direct insert into title_status_overrides is denied');

select is((select count(*) from public.title_status_overrides
            where title_id = current_setting('t.delivered')::uuid)::int,
  0, 'locked refusal does not write an override row');

select finish();
rollback;
