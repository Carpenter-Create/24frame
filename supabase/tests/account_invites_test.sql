-- account_invites_test.sql
-- Team invite + accept + authz + house grant/comp creates an account on a tier.
-- Fail-closed: viewer cannot invite; non-staff cannot grant; email must match.

begin;
select plan(28);

select set_config('t.org',          gen_random_uuid()::text, false);
select set_config('t.org_b',        gen_random_uuid()::text, false);
select set_config('t.owner',        gen_random_uuid()::text, false);
select set_config('t.viewer',       gen_random_uuid()::text, false);
select set_config('t.invitee',      gen_random_uuid()::text, false);
select set_config('t.grant_user',   gen_random_uuid()::text, false);
select set_config('t.outsider',     gen_random_uuid()::text, false);
select set_config('t.gc_owner',     gen_random_uuid()::text, false);
select set_config('t.gc_ops',       gen_random_uuid()::text, false);
select set_config('t.gc_legal',     gen_random_uuid()::text, false);
select set_config('t.hash_team',    repeat('ab', 32), false);
select set_config('t.hash_team2',   repeat('cd', 32), false);
select set_config('t.hash_grant',   repeat('ef', 32), false);
select set_config('t.hash_bad',     repeat('00', 32), false);

insert into auth.users (id, email) values
  (current_setting('t.owner')::uuid,      'owner@test.example'),
  (current_setting('t.viewer')::uuid,     'viewer@test.example'),
  (current_setting('t.invitee')::uuid,    'invitee@test.example'),
  (current_setting('t.grant_user')::uuid, 'grant@test.example'),
  (current_setting('t.outsider')::uuid,   'outsider@test.example'),
  (current_setting('t.gc_owner')::uuid,   'gc-owner@test.example'),
  (current_setting('t.gc_ops')::uuid,     'gc-ops@test.example'),
  (current_setting('t.gc_legal')::uuid,   'gc-legal@test.example');

insert into public.organizations (id, name, status) values
  (current_setting('t.org')::uuid,   'Acme Films', 'active'),
  (current_setting('t.org_b')::uuid, 'Other Films', 'active');

insert into public.memberships (org_id, user_id, role, status) values
  (current_setting('t.org')::uuid,   current_setting('t.owner')::uuid,  'account_owner', 'active'),
  (current_setting('t.org')::uuid,   current_setting('t.viewer')::uuid, 'viewer',        'active'),
  (current_setting('t.org_b')::uuid, current_setting('t.outsider')::uuid, 'account_owner', 'active');

insert into public.gc_staff (user_id, role) values
  (current_setting('t.gc_owner')::uuid, 'gc_account_owner'),
  (current_setting('t.gc_ops')::uuid,   'gc_delivery_ops'),
  (current_setting('t.gc_legal')::uuid, 'gc_legal');

-- ===== Viewer cannot invite =====
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.viewer'), 'role', 'authenticated')::text, true);

select throws_ok(
  format(
    $$ select public.invite_org_member(%L::uuid, 'invitee@test.example', 'viewer', %L) $$,
    current_setting('t.org'), current_setting('t.hash_team')
  ),
  'P0001', 'Not authorized', 'viewer cannot invite');

-- ===== Outsider cannot invite into another org =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.outsider'), 'role', 'authenticated')::text, true);

select throws_ok(
  format(
    $$ select public.invite_org_member(%L::uuid, 'invitee@test.example', 'viewer', %L) $$,
    current_setting('t.org'), current_setting('t.hash_team')
  ),
  'P0001', 'Not authorized', 'other-org owner cannot invite');

-- ===== Owner invites =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);

select set_config('t.invite_id',
  (select public.invite_org_member(
    current_setting('t.org')::uuid,
    '  invitee@test.example  ',
    'delivery_ops',
    current_setting('t.hash_team')
  )::text),
  true);

select is(
  (select email from public.account_invites where id = current_setting('t.invite_id')::uuid),
  'invitee@test.example',
  'team invite stores lowercase email');

select is(
  (select kind::text from public.account_invites where id = current_setting('t.invite_id')::uuid),
  'team',
  'team invite kind');

select throws_ok(
  format(
    $$ select public.invite_org_member(%L::uuid, 'invitee@test.example', 'viewer', %L) $$,
    current_setting('t.org'), current_setting('t.hash_team2')
  ),
  'P0001', 'An invite is already pending for that email', 'duplicate pending team invite rejected');

select throws_ok(
  format(
    $$ select public.invite_org_member(%L::uuid, 'owner@test.example', 'viewer', %L) $$,
    current_setting('t.org'), current_setting('t.hash_team2')
  ),
  'P0001', 'You cannot invite your own email', 'owner cannot invite self');

select throws_ok(
  format(
    $$ select public.invite_org_member(%L::uuid, 'viewer@test.example', 'legal', %L) $$,
    current_setting('t.org'), current_setting('t.hash_team2')
  ),
  'P0001', 'That email already has a seat on this team', 'active seat rejected');

-- ===== Wrong email cannot accept =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.outsider'), 'role', 'authenticated')::text, true);

select throws_ok(
  format($$ select public.accept_account_invite(%L) $$, current_setting('t.hash_team')),
  'P0001', 'Sign in with the invited email to accept', 'email mismatch fails closed');

-- ===== Invitee accepts =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.invitee'), 'role', 'authenticated')::text, true);

select lives_ok(
  format($$ select public.accept_account_invite(%L) $$, current_setting('t.hash_team')),
  'invitee accepts team invite');

select is(
  (select role::text from public.memberships
    where org_id = current_setting('t.org')::uuid
      and user_id = current_setting('t.invitee')::uuid),
  'delivery_ops',
  'accept writes membership on the invited role');

select is(
  (select status::text from public.memberships
    where org_id = current_setting('t.org')::uuid
      and user_id = current_setting('t.invitee')::uuid),
  'active',
  'accepted membership is active');

select is(
  (select status::text from public.account_invites where id = current_setting('t.invite_id')::uuid),
  'accepted',
  'invite marked accepted');

select throws_ok(
  format($$ select public.accept_account_invite(%L) $$, current_setting('t.hash_team')),
  'P0001', 'Invite is no longer pending', 'replay accept fails');

-- ===== Viewer still cannot revoke (nothing pending) / owner can invite then revoke =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);

select set_config('t.invite_id2',
  (select public.invite_org_member(
    current_setting('t.org')::uuid,
    'new.person@test.example',
    'viewer',
    current_setting('t.hash_team2')
  )::text),
  true);

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.viewer'), 'role', 'authenticated')::text, true);

select throws_ok(
  format($$ select public.revoke_account_invite(%L::uuid) $$, current_setting('t.invite_id2')),
  'P0001', 'Not authorized', 'viewer cannot revoke');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);

select lives_ok(
  format($$ select public.revoke_account_invite(%L::uuid) $$, current_setting('t.invite_id2')),
  'owner revokes pending invite');

select is(
  (select status::text from public.account_invites where id = current_setting('t.invite_id2')::uuid),
  'revoked',
  'revoked invite is not deleted');

-- ===== House grant authz =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);

select throws_ok(
  format(
    $$ select public.grant_house_account('grant@test.example', 'Comp Films', 'pro', %L) $$,
    current_setting('t.hash_grant')
  ),
  'P0001', 'Not authorized', 'client owner cannot grant');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.gc_legal'), 'role', 'authenticated')::text, true);

select throws_ok(
  format(
    $$ select public.grant_house_account('grant@test.example', 'Comp Films', 'pro', %L) $$,
    current_setting('t.hash_grant')
  ),
  'P0001', 'Not authorized', 'gc_legal cannot grant');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.gc_ops'), 'role', 'authenticated')::text, true);

select set_config('t.grant_id',
  (select public.grant_house_account(
    'grant@test.example',
    'Comp Films',
    'pro',
    current_setting('t.hash_grant')
  )::text),
  true);

select is(
  (select tier::text from public.account_invites where id = current_setting('t.grant_id')::uuid),
  'pro',
  'house grant stores the tier');

select throws_ok(
  format(
    $$ select public.grant_house_account('owner@test.example', 'Nope Films', 'access', %L) $$,
    current_setting('t.hash_bad')
  ),
  'P0001', 'That email already has an account', 'existing account_owner cannot be granted');

-- ===== Grant accept creates org + owner + contract_terms.tier =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.grant_user'), 'role', 'authenticated')::text, true);

select lives_ok(
  format($$ select public.accept_account_invite(%L) $$, current_setting('t.hash_grant')),
  'grant user accepts house grant');

-- Accepted house_grant rows stay kind=house_grant (staff-only SELECT).
-- Assert through the new owner's own membership / org / terms, not the invite.
select is(
  (select m.role::text
     from public.memberships m
    where m.user_id = current_setting('t.grant_user')::uuid
      and m.role = 'account_owner'
      and m.status = 'active'),
  'account_owner',
  'comp accept creates account_owner membership');

select set_config('t.grant_org',
  (select m.org_id::text
     from public.memberships m
    where m.user_id = current_setting('t.grant_user')::uuid
      and m.role = 'account_owner'
      and m.status = 'active'),
  true);

select is(
  (select o.status::text
     from public.organizations o
    where o.id = current_setting('t.grant_org')::uuid),
  'active',
  'comp org is active');

select is(
  (select t.tier::text
     from public.contract_terms t
    where t.org_id = current_setting('t.grant_org')::uuid
      and t.effective_to is null),
  'pro',
  'comp writes contract_terms.tier = pro');

select is(
  (select t.revenue_share_rate_bp
     from public.contract_terms t
    where t.org_id = current_setting('t.grant_org')::uuid
      and t.effective_to is null),
  public.tier_revenue_share_bp('pro'),
  'comp snapshots the live tier rate');

select is(
  (select count(*)::int from public.subscriptions s
    where s.org_id = current_setting('t.grant_org')::uuid),
  0,
  'comp does not invent a Stripe subscription');

-- After accept, the new account owner can invite their own team.
select lives_ok(
  format(
    $$ select public.invite_org_member(
         %L::uuid,
         'teammate@test.example',
         'viewer',
         %L
       ) $$,
    current_setting('t.grant_org'), current_setting('t.hash_bad')
  ),
  'comp account owner can invite their own team');

-- ===== token_hash is not readable to authenticated =====
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select token_hash from public.account_invites $$,
  '42501',
  'token_hash column is revoked from authenticated'
);

-- peek by hash works without leaking other rows
select is(
  (select email from public.peek_account_invite(current_setting('t.hash_team'))),
  'invitee@test.example',
  'peek returns the invite by hash');

reset role;
select * from finish();
rollback;
