-- legal_entities_test.sql
-- Tests the legal entities foundation: default entity on create_org,
-- backfill, titles FK, membership scope, and scope-aware queries.

begin;
select plan(15);

-- ===== Setup: create a user =====
select set_config('t.user_a', gen_random_uuid()::text, false);
insert into auth.users (id, email) values (
  current_setting('t.user_a')::uuid,
  'owner@test.example'
);

-- Become user_a.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object(
    'sub', current_setting('t.user_a'),
    'role', 'authenticated',
    'email', 'owner@test.example'
  )::text, true);

-- 1. create_org_and_membership creates a default legal entity.
select set_config('t.org_id',
  (select public.create_org_and_membership('Test Films'))::text, true);

select isnt_empty(
  $$ select 1 from public.legal_entities
     where org_id = current_setting('t.org_id')::uuid
       and is_default = true $$,
  'create_org_and_membership creates a default legal entity');

select is(
  (select name from public.legal_entities
     where org_id = current_setting('t.org_id')::uuid
       and is_default = true),
  'Test Films',
  'default entity is named after the rights holder');

-- 2. Only one default per org (unique partial index).
select set_config('t.default_entity',
  (select id::text from public.legal_entities
     where org_id = current_setting('t.org_id')::uuid
       and is_default = true), false);

-- Activate the org so we can create titles.
reset role;
update public.organizations
  set status = 'active'
  where id = current_setting('t.org_id')::uuid;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object(
    'sub', current_setting('t.user_a'),
    'role', 'authenticated',
    'email', 'owner@test.example'
  )::text, true);

-- 3. create_title defaults to the default entity when no entity specified.
select set_config('t.title_id',
  (select public.create_title(
    current_setting('t.org_id')::uuid,
    'My Movie',
    'new_release'::public.release_type
  ))::text, false);

select is(
  (select legal_entity_id::text from public.titles
     where id = current_setting('t.title_id')::uuid),
  current_setting('t.default_entity'),
  'create_title defaults to the default legal entity');

-- 4. create_legal_entity adds a second entity.
select set_config('t.entity_b',
  (select public.create_legal_entity(
    current_setting('t.org_id')::uuid,
    'Test LLC',
    'llc'::public.entity_type,
    'Delaware'
  ))::text, false);

select isnt(
  current_setting('t.entity_b'),
  current_setting('t.default_entity'),
  'second entity has a distinct id');

select is(
  (select entity_type::text from public.legal_entities
     where id = current_setting('t.entity_b')::uuid),
  'llc',
  'new entity has the specified type');

select is(
  (select jurisdiction from public.legal_entities
     where id = current_setting('t.entity_b')::uuid),
  'Delaware',
  'new entity has the specified jurisdiction');

-- 5. create_title can specify a legal entity.
select set_config('t.title_b',
  (select public.create_title(
    current_setting('t.org_id')::uuid,
    'LLC Movie',
    'new_release'::public.release_type,
    null,
    current_setting('t.entity_b')::uuid
  ))::text, false);

select is(
  (select legal_entity_id::text from public.titles
     where id = current_setting('t.title_b')::uuid),
  current_setting('t.entity_b'),
  'create_title uses specified legal entity');

-- 6. org_legal_entities returns both entities.
select is(
  (select count(*)::int from public.org_legal_entities(
    current_setting('t.org_id')::uuid
  )),
  2,
  'org_legal_entities returns both entities');

-- 7. Membership starts with entity_scope = all.
select is(
  (select entity_scope::text from public.memberships
     where org_id = current_setting('t.org_id')::uuid
       and user_id = current_setting('t.user_a')::uuid),
  'all',
  'owner membership has entity_scope = all');

-- 8. member_can_entity returns true for all scope.
select is(
  (select public.member_can_entity(
    current_setting('t.user_a')::uuid,
    current_setting('t.org_id')::uuid,
    current_setting('t.entity_b')::uuid
  ))::text,
  'true',
  'member_can_entity returns true when scope = all');

-- 9. my_entity_ids returns all entities for scope=all user.
select is(
  (select count(*)::int from public.my_entity_ids(
    current_setting('t.org_id')::uuid
  )),
  2,
  'my_entity_ids returns all entities for scope=all');

-- 10. scoped_title_ids returns all titles for scope=all user.
select is(
  (select count(*)::int from public.scoped_title_ids(
    current_setting('t.user_a')::uuid,
    current_setting('t.org_id')::uuid
  )),
  2,
  'scoped_title_ids returns all titles for scope=all');

-- 11. Create a second user with scope=selected on entity_b only.
reset role;
select set_config('t.user_b', gen_random_uuid()::text, false);
insert into auth.users (id, email) values (
  current_setting('t.user_b')::uuid,
  'viewer@test.example'
);

insert into public.memberships (org_id, user_id, role, status, entity_scope)
  values (
    current_setting('t.org_id')::uuid,
    current_setting('t.user_b')::uuid,
    'viewer',
    'active',
    'selected'
  );

select set_config('t.membership_b',
  (select id::text from public.memberships
     where org_id = current_setting('t.org_id')::uuid
       and user_id = current_setting('t.user_b')::uuid), false);

insert into public.membership_entity_grants (membership_id, legal_entity_id)
  values (
    current_setting('t.membership_b')::uuid,
    current_setting('t.entity_b')::uuid
  );

-- Become user_b.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object(
    'sub', current_setting('t.user_b'),
    'role', 'authenticated',
    'email', 'viewer@test.example'
  )::text, true);

-- 12. Scoped user can access entity_b.
select is(
  (select public.member_can_entity(
    current_setting('t.user_b')::uuid,
    current_setting('t.org_id')::uuid,
    current_setting('t.entity_b')::uuid
  ))::text,
  'true',
  'scoped user can access granted entity');

-- 13. Scoped user cannot access default entity.
select is(
  (select public.member_can_entity(
    current_setting('t.user_b')::uuid,
    current_setting('t.org_id')::uuid,
    current_setting('t.default_entity')::uuid
  ))::text,
  'false',
  'scoped user cannot access non-granted entity');

-- 14. scoped_title_ids for user_b returns only entity_b titles.
select is(
  (select count(*)::int from public.scoped_title_ids(
    current_setting('t.user_b')::uuid,
    current_setting('t.org_id')::uuid
  )),
  1,
  'scoped_title_ids returns only entity_b titles for scoped user');

reset role;
select * from finish();
rollback;
