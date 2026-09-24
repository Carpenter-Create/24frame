-- portal_otp_attempt_test.sql
-- GC-P0-1: portal_claim_otp_attempt increments portal_otps.attempts by one
-- only while attempts < the caller's cap, and returns null once the cap is
-- reached (the same state a waiter sees after a concurrent claim commits).
-- No second counter. Cap is an argument, not a hardcoded twin of PORTAL.otpMaxAttempts.

begin;
select plan(18);

select set_config('t.org', gen_random_uuid()::text, false);
select set_config('t.title', gen_random_uuid()::text, false);
select set_config('t.link', gen_random_uuid()::text, false);
select set_config('t.otp', gen_random_uuid()::text, false);
select set_config('t.otp_full', gen_random_uuid()::text, false);
select set_config('t.otp_used', gen_random_uuid()::text, false);
select set_config('t.otp_role', gen_random_uuid()::text, false);

insert into public.organizations (id, name, status)
  values (current_setting('t.org')::uuid, 'OTP Attempt Org', 'active');
insert into public.titles (id, org_id, title, status)
  values (current_setting('t.title')::uuid, current_setting('t.org')::uuid, 'OTP Film', 'in_delivery');
insert into public.portal_links (id, purpose, title_id, token_hash, expires_at)
  values (
    current_setting('t.link')::uuid,
    'screener_view',
    current_setting('t.title')::uuid,
    gen_random_uuid()::text,
    now() + interval '1 day'
  );

insert into public.portal_otps (id, link_id, email, code_hash, expires_at, attempts)
  values (
    current_setting('t.otp')::uuid,
    current_setting('t.link')::uuid,
    'buyer@example.test',
    'hash',
    now() + interval '10 minutes',
    0
  );
insert into public.portal_otps (id, link_id, email, code_hash, expires_at, attempts)
  values (
    current_setting('t.otp_full')::uuid,
    current_setting('t.link')::uuid,
    'full@example.test',
    'hash',
    now() + interval '10 minutes',
    5
  );
insert into public.portal_otps (id, link_id, email, code_hash, expires_at, attempts, consumed_at)
  values (
    current_setting('t.otp_used')::uuid,
    current_setting('t.link')::uuid,
    'used@example.test',
    'hash',
    now() + interval '10 minutes',
    1,
    now()
  );
insert into public.portal_otps (id, link_id, email, code_hash, expires_at, attempts)
  values (
    current_setting('t.otp_role')::uuid,
    current_setting('t.link')::uuid,
    'role@example.test',
    'hash',
    now() + interval '10 minutes',
    0
  );

select is(public.portal_claim_otp_attempt(current_setting('t.otp')::uuid, 5), 1, 'claim 1 records attempt 1');
select is(public.portal_claim_otp_attempt(current_setting('t.otp')::uuid, 5), 2, 'claim 2 records attempt 2');
select is(public.portal_claim_otp_attempt(current_setting('t.otp')::uuid, 5), 3, 'claim 3 records attempt 3');
select is(public.portal_claim_otp_attempt(current_setting('t.otp')::uuid, 5), 4, 'claim 4 records attempt 4');
select is(public.portal_claim_otp_attempt(current_setting('t.otp')::uuid, 5), 5, 'claim 5 records attempt 5');
select ok(
  public.portal_claim_otp_attempt(current_setting('t.otp')::uuid, 5) is null,
  'claim past the cap returns null'
);
select is(
  (select attempts from public.portal_otps where id = current_setting('t.otp')::uuid),
  5,
  'counter stays at the cap after a rejected claim'
);

select ok(
  public.portal_claim_otp_attempt(current_setting('t.otp_full')::uuid, 5) is null,
  'a row already at the cap is rejected'
);
select is(
  (select attempts from public.portal_otps where id = current_setting('t.otp_full')::uuid),
  5,
  'a rejected at-cap claim does not increment'
);

select ok(
  public.portal_claim_otp_attempt(current_setting('t.otp_used')::uuid, 5) is null,
  'a consumed code is not claimed'
);
select is(
  (select attempts from public.portal_otps where id = current_setting('t.otp_used')::uuid),
  1,
  'a consumed row is not incremented'
);

select throws_ok(
  format(
    'select public.portal_claim_otp_attempt(%L::uuid, 0)',
    current_setting('t.otp')
  ),
  'P0001',
  'invalid otp attempt claim',
  'a non-positive cap is rejected'
);
select is(
  (select attempts from public.portal_otps where id = current_setting('t.otp')::uuid),
  5,
  'a rejected cap does not move the counter'
);

select ok(
  not has_function_privilege('public', 'public.portal_claim_otp_attempt(uuid, integer)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.portal_claim_otp_attempt(uuid, integer)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.portal_claim_otp_attempt(uuid, integer)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.portal_claim_otp_attempt(uuid, integer)', 'EXECUTE'),
  'execute is service_role only'
);

set local role service_role;
select is(
  public.portal_claim_otp_attempt(current_setting('t.otp_role')::uuid, 5),
  1,
  'service_role claim increments by one'
);
reset role;
select is(
  (select attempts from public.portal_otps where id = current_setting('t.otp_role')::uuid),
  1,
  'service_role claim persisted'
);

select ok(
  (select prosecdef from pg_proc where proname = 'portal_claim_otp_attempt'),
  'portal_claim_otp_attempt is security definer'
);
select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'portal_claim_otp_attempt'
      and 'search_path=public' = any (proconfig)
  ),
  'search_path is pinned to public'
);

select * from finish();
rollback;
