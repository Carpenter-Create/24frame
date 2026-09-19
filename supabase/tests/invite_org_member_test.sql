-- invite_org_member_test.sql
-- Org Team: manage_team gate, email→membership write, directory, last-owner
-- guard still holds. Does not create a Social profile. Does not touch gc_staff.

begin;
select plan(18);

select set_config('t.org',        gen_random_uuid()::text, false);
select set_config('t.org_b',      gen_random_uuid()::text, false);
select set_config('t.owner',      gen_random_uuid()::text, false);
select set_config('t.owner_b',    gen_random_uuid()::text, false);
select set_config('t.viewer',     gen_random_uuid()::text, false);
select set_config('t.invitee',    gen_random_uuid()::text, false);
select set_config('t.existing',   gen_random_uuid()::text, false);

insert into auth.users (id, email) values
  (current_setting('t.owner')::uuid,    'owner@example.com'),
  (current_setting('t.owner_b')::uuid,  'owner-b@example.com'),
  (current_setting('t.viewer')::uuid,   'viewer@example.com'),
  (current_setting('t.invitee')::uuid,  'invitee@example.com'),
  (current_setting('t.existing')::uuid, 'Existing.User@example.com');

insert into public.organizations (id, name) values
  (current_setting('t.org')::uuid,   'Org A'),
  (current_setting('t.org_b')::uuid, 'Org B');

insert into public.memberships (org_id, user_id, role, status) values
  (current_setting('t.org')::uuid, current_setting('t.owner')::uuid,  'account_owner', 'active'),
  (current_setting('t.org')::uuid, current_setting('t.viewer')::uuid, 'viewer',        'active');

-- ===== Owner: happy-path invite =====
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);

select set_config('t.mem',
  (select public.invite_org_member(
     current_setting('t.org')::uuid,
     '  Invitee@example.com  ',
     'delivery_ops'
  ))::text, true);

select is(
  (select role from public.memberships where id = current_setting('t.mem')::uuid)::text,
  'delivery_ops',
  'owner invite writes the requested role');
select is(
  (select status from public.memberships where id = current_setting('t.mem')::uuid)::text,
  'invited',
  'new add defaults to invited');
select is(
  (select user_id from public.memberships where id = current_setting('t.mem')::uuid)::text,
  current_setting('t.invitee'),
  'email lookup is case-insensitive');
select is(
  (select count(*) from public.profiles where id = current_setting('t.invitee')::uuid)::int,
  0,
  'invite does not create a Social profile');

-- Idempotent on (org, email): same person, new role/status.
select is(
  public.invite_org_member(
    current_setting('t.org')::uuid,
    'invitee@example.com',
    'legal',
    'active'
  ),
  current_setting('t.mem')::uuid,
  're-invite updates the existing membership');
select is(
  (select role::text || '/' || status::text
     from public.memberships where id = current_setting('t.mem')::uuid),
  'legal/active',
  'idempotent re-invite writes the new role and status');

-- Existing auth email stored mixed-case still resolves.
select ok(
  public.invite_org_member(
    current_setting('t.org')::uuid,
    'existing.user@example.com',
    'accountant',
    'invited'
  ) is not null,
  'resolves an existing user whose auth email is mixed-case');

-- Directory is manage_team and includes the new row.
select is(
  (select count(*) from public.org_team_directory(current_setting('t.org')::uuid))::int,
  4,
  'directory lists every membership on the org');
select is(
  (select email from public.org_team_directory(current_setting('t.org')::uuid)
     where user_id = current_setting('t.invitee')::uuid),
  'invitee@example.com',
  'directory returns the login email');

-- Unknown email: RPC does not invent an auth.users row.
select throws_ok(
  format(
    $$ select public.invite_org_member(%L::uuid, 'new-person@example.com', 'viewer') $$,
    current_setting('t.org')
  ),
  'P0001',
  'User not found',
  'unknown email does not create auth.users');

-- Viewer cannot mutate or list.
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.viewer'), 'role', 'authenticated')::text, true);

select throws_ok(
  format(
    $$ select public.invite_org_member(%L::uuid, 'invitee@example.com', 'viewer') $$,
    current_setting('t.org')
  ),
  'P0001',
  'Not authorized',
  'viewer cannot invite');
select throws_ok(
  format($$ select public.org_team_directory(%L::uuid) $$, current_setting('t.org')),
  'P0001',
  'Not authorized',
  'viewer cannot read the team directory');

-- Unauthenticated rejected.
select set_config('request.jwt.claims',
  json_build_object('role', 'authenticated')::text, true);
select throws_ok(
  format(
    $$ select public.invite_org_member(%L::uuid, 'invitee@example.com', 'viewer') $$,
    current_setting('t.org')
  ),
  'P0001',
  'Not authenticated',
  'RPC rejects an unauthenticated caller');

-- Cross-org: owner of A cannot write B.
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);
select throws_ok(
  format(
    $$ select public.invite_org_member(%L::uuid, 'invitee@example.com', 'viewer') $$,
    current_setting('t.org_b')
  ),
  'P0001',
  'Not authorized',
  'owner of A cannot invite into B');

-- Last-owner guard still holds on a sole-owner demotion / removal.
select throws_like(
  format(
    $$ update public.memberships
         set role = 'viewer'
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.org'), current_setting('t.owner')
  ),
  '%no active account owner%',
  'sole owner cannot demote themselves to viewer');

select throws_like(
  format(
    $$ update public.memberships
         set status = 'removed'
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.org'), current_setting('t.owner')
  ),
  '%no active account owner%',
  'sole owner cannot remove themselves');

-- With a second active owner, removal is allowed.
reset role;
insert into public.memberships (org_id, user_id, role, status) values
  (current_setting('t.org')::uuid, current_setting('t.owner_b')::uuid, 'account_owner', 'active');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);

update public.memberships
   set status = 'removed'
 where org_id = current_setting('t.org')::uuid
   and user_id = current_setting('t.owner')::uuid;

select is(
  (select status from public.memberships
     where org_id = current_setting('t.org')::uuid
       and user_id = current_setting('t.owner')::uuid)::text,
  'removed',
  'an owner can step down after another active owner exists');

select is(
  (select count(*) from public.memberships
     where org_id = current_setting('t.org')::uuid
       and role = 'account_owner'
       and status = 'active')::int,
  1,
  'one active account_owner remains');

reset role;
select * from finish();
rollback;
