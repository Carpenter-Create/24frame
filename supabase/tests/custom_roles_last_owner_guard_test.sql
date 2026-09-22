-- custom_roles_last_owner_guard_test.sql
-- custom_role_id replaces enum capabilities in member_can(). An active
-- account_owner counts toward the last-owner guard only while manage_team
-- remains. A limited custom role must not lock the org out.

begin;
select plan(12);

select set_config('t.org_sole', gen_random_uuid()::text, false);
select set_config('t.org_pair', gen_random_uuid()::text, false);
select set_config('t.org_hand', gen_random_uuid()::text, false);
select set_config('t.sole',     gen_random_uuid()::text, false);
select set_config('t.owner_a',  gen_random_uuid()::text, false);
select set_config('t.owner_b',  gen_random_uuid()::text, false);
select set_config('t.hand_o',   gen_random_uuid()::text, false);
select set_config('t.hand_v',   gen_random_uuid()::text, false);
select set_config('t.limited',  gen_random_uuid()::text, false);
select set_config('t.keeper',   gen_random_uuid()::text, false);
select set_config('t.pair_lim', gen_random_uuid()::text, false);
select set_config('t.pair_keep', gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.sole')::uuid),
  (current_setting('t.owner_a')::uuid),
  (current_setting('t.owner_b')::uuid),
  (current_setting('t.hand_o')::uuid),
  (current_setting('t.hand_v')::uuid);

insert into public.organizations (id, name) values
  (current_setting('t.org_sole')::uuid, 'Sole Org'),
  (current_setting('t.org_pair')::uuid, 'Pair Org'),
  (current_setting('t.org_hand')::uuid, 'Handoff Org');

insert into public.memberships (org_id, user_id, role, status) values
  (current_setting('t.org_sole')::uuid, current_setting('t.sole')::uuid,    'account_owner', 'active'),
  (current_setting('t.org_pair')::uuid, current_setting('t.owner_a')::uuid, 'account_owner', 'active'),
  (current_setting('t.org_pair')::uuid, current_setting('t.owner_b')::uuid, 'account_owner', 'active'),
  (current_setting('t.org_hand')::uuid, current_setting('t.hand_o')::uuid,  'account_owner', 'active'),
  (current_setting('t.org_hand')::uuid, current_setting('t.hand_v')::uuid,  'viewer',        'active');

insert into public.org_custom_roles (id, org_id, name, created_by) values
  (current_setting('t.limited')::uuid,   current_setting('t.org_sole')::uuid, 'Catalog only', current_setting('t.sole')::uuid),
  (current_setting('t.keeper')::uuid,    current_setting('t.org_sole')::uuid, 'Team keeper',  current_setting('t.sole')::uuid),
  (current_setting('t.pair_lim')::uuid,  current_setting('t.org_pair')::uuid, 'Catalog only', current_setting('t.owner_a')::uuid),
  (current_setting('t.pair_keep')::uuid, current_setting('t.org_pair')::uuid, 'Team keeper',  current_setting('t.owner_a')::uuid);

insert into public.org_custom_role_capabilities (role_id, capability) values
  (current_setting('t.limited')::uuid,   'view'),
  (current_setting('t.keeper')::uuid,    'view'),
  (current_setting('t.keeper')::uuid,    'manage_team'),
  (current_setting('t.pair_lim')::uuid,  'view'),
  (current_setting('t.pair_keep')::uuid, 'view'),
  (current_setting('t.pair_keep')::uuid, 'manage_team');

-- Sole owner cannot drop manage_team via a custom role.
select throws_ok(
  format(
    $$ update public.memberships set custom_role_id = %L::uuid
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.limited'),
    current_setting('t.org_sole'),
    current_setting('t.sole')
  ),
  'P0001',
  'would be left with no active account owner',
  'sole owner cannot take a custom role that drops manage_team'
);

select ok(
  (select custom_role_id is null from public.memberships
    where org_id = current_setting('t.org_sole')::uuid
      and user_id = current_setting('t.sole')::uuid),
  'rejected custom role assignment leaves the sole owner unchanged'
);

-- A custom role that still grants manage_team is not a lockout.
select lives_ok(
  format(
    $$ update public.memberships set custom_role_id = %L::uuid
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.keeper'),
    current_setting('t.org_sole'),
    current_setting('t.sole')
  ),
  'sole owner may take a custom role that keeps manage_team'
);

select ok(
  public.member_can(
    current_setting('t.sole')::uuid,
    current_setting('t.org_sole')::uuid,
    'manage_team'
  ),
  'keeper custom role still grants manage_team'
);

-- Co-owner can be limited while another recoverable owner remains.
select lives_ok(
  format(
    $$ update public.memberships set custom_role_id = %L::uuid
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.pair_lim'),
    current_setting('t.org_pair'),
    current_setting('t.owner_b')
  ),
  'co-owner may take a limited custom role while another owner remains'
);

select ok(
  not public.member_can(
    current_setting('t.owner_b')::uuid,
    current_setting('t.org_pair')::uuid,
    'manage_team'
  ),
  'limited custom role replaces the account_owner enum for manage_team'
);

select throws_ok(
  format(
    $$ update public.memberships set role = 'viewer'
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.org_pair'),
    current_setting('t.owner_a')
  ),
  'P0001',
  'would be left with no active account owner',
  'acting owner cannot demote while the co-owner lacks manage_team'
);

select is(
  (select role::text from public.memberships
    where org_id = current_setting('t.org_pair')::uuid
      and user_id = current_setting('t.owner_a')::uuid),
  'account_owner',
  'blocked self-demotion leaves the acting owner in place'
);

-- Restoring manage_team on the co-owner makes the demotion safe.
select lives_ok(
  format(
    $$ update public.memberships set custom_role_id = %L::uuid
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.pair_keep'),
    current_setting('t.org_pair'),
    current_setting('t.owner_b')
  ),
  'co-owner can be moved onto a custom role that keeps manage_team'
);

select lives_ok(
  format(
    $$ update public.memberships set role = 'viewer', custom_role_id = null
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.org_pair'),
    current_setting('t.owner_a')
  ),
  'acting owner can demote once the co-owner keeps manage_team'
);

-- Plain handover, no custom roles: promote, then demote.
select lives_ok(
  format(
    $$ update public.memberships set role = 'account_owner'
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.org_hand'),
    current_setting('t.hand_v')
  ),
  'promoting another member to account_owner still succeeds'
);

select lives_ok(
  format(
    $$ update public.memberships set role = 'viewer'
       where org_id = %L::uuid and user_id = %L::uuid $$,
    current_setting('t.org_hand'),
    current_setting('t.hand_o')
  ),
  'demotion after a real promotion still succeeds'
);

select * from finish();
rollback;
