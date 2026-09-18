-- title_delete_s3_purge_test.sql
-- mark_deleted_title_prefix_purged: operate/staff after delete; service_role
-- sweeper; refuse live titles and viewers; idempotent; sets both markers.
-- In-flight MediaConvert: mark refuses while submitted/running;
-- register_transcode_output refuses a deleted title, fails the job, inserts nothing.

begin;
select plan(17);

select set_config('t.org_a', gen_random_uuid()::text, false);
select set_config('t.org_b', gen_random_uuid()::text, false);
select set_config('t.owner', gen_random_uuid()::text, false);
select set_config('t.viewer', gen_random_uuid()::text, false);
select set_config('t.gc', gen_random_uuid()::text, false);
select set_config('t.draft', gen_random_uuid()::text, false);
select set_config('t.draft_job', gen_random_uuid()::text, false);
select set_config('t.live', gen_random_uuid()::text, false);
select set_config('t.asset', gen_random_uuid()::text, false);
select set_config('t.master', gen_random_uuid()::text, false);
select set_config('t.job', gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.owner')::uuid),
  (current_setting('t.viewer')::uuid),
  (current_setting('t.gc')::uuid);

insert into public.organizations (id, name, status) values
  (current_setting('t.org_a')::uuid, 'Org A', 'active'),
  (current_setting('t.org_b')::uuid, 'Org B', 'active');

insert into public.memberships (org_id, user_id, role, status) values
  (current_setting('t.org_a')::uuid, current_setting('t.owner')::uuid, 'account_owner', 'active'),
  (current_setting('t.org_a')::uuid, current_setting('t.viewer')::uuid, 'viewer', 'active');

insert into public.gc_staff (user_id, role) values
  (current_setting('t.gc')::uuid, 'gc_delivery_ops');

insert into public.titles (id, org_id, title, status, created_by) values
  (current_setting('t.draft')::uuid, current_setting('t.org_a')::uuid, 'Draft One', 'draft', current_setting('t.owner')::uuid),
  (current_setting('t.draft_job')::uuid, current_setting('t.org_a')::uuid, 'Draft Job', 'draft', current_setting('t.owner')::uuid),
  (current_setting('t.live')::uuid, current_setting('t.org_a')::uuid, 'Live One', 'live', current_setting('t.owner')::uuid);

insert into public.assets (
  id, org_id, title_id, kind, storage_key, content_hash, bytes, provided_by
) values (
  current_setting('t.asset')::uuid,
  current_setting('t.org_a')::uuid,
  current_setting('t.draft')::uuid,
  'poster',
  'orgs/' || current_setting('t.org_a') || '/titles/' || current_setting('t.draft') || '/poster/x/p.jpg',
  'abc',
  12,
  current_setting('t.owner')::uuid
);

insert into public.assets (
  id, org_id, title_id, kind, storage_key, content_hash, bytes, provided_by
) values (
  current_setting('t.master')::uuid,
  current_setting('t.org_a')::uuid,
  current_setting('t.draft_job')::uuid,
  'master',
  'orgs/' || current_setting('t.org_a') || '/titles/' || current_setting('t.draft_job') || '/master/x/m.mov',
  'def',
  24,
  current_setting('t.owner')::uuid
);

insert into public.transcode_jobs (
  id, org_id, title_id, source_asset_id, expected_output_key, status
) values (
  current_setting('t.job')::uuid,
  current_setting('t.org_a')::uuid,
  current_setting('t.draft_job')::uuid,
  current_setting('t.master')::uuid,
  'orgs/' || current_setting('t.org_a') || '/titles/' || current_setting('t.draft_job') || '/screener/out.mp4',
  'submitted'
);

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.mark_deleted_title_prefix_purged(current_setting('t.live')::uuid) $$,
  'P0001', null, 'cannot mark a live title purged');

select lives_ok(
  $$ select public.delete_title(current_setting('t.draft')::uuid) $$,
  'owner deletes own draft');

select lives_ok(
  $$ select public.mark_deleted_title_prefix_purged(current_setting('t.draft')::uuid) $$,
  'owner marks own deleted title purged');

select lives_ok(
  $$ select public.mark_deleted_title_prefix_purged(current_setting('t.draft')::uuid) $$,
  'second mark is idempotent');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.viewer'), 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.mark_deleted_title_prefix_purged(current_setting('t.draft')::uuid) $$,
  'P0001', null, 'viewer cannot mark a deleted title purged');

reset role;
select is((select s3_purged_at is not null from public.titles
            where id = current_setting('t.draft')::uuid),
  true, 'deleted title records s3_purged_at');

select is((select purged_at is not null from public.assets
            where id = current_setting('t.asset')::uuid),
  true, 'cascaded asset records purged_at');

select is((select count(*) from public.titles
            where deleted_at is not null and s3_purged_at is null)::int,
  0, 'no deleted title remains pending purge after mark');

set local role service_role;
select set_config('request.jwt.claims',
  json_build_object('role', 'service_role')::text, true);

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.gc'), 'role', 'authenticated')::text, true);
set local role authenticated;
select lives_ok(
  $$ select public.delete_title(current_setting('t.live')::uuid) $$,
  'staff deletes a live title with no reporting facts');

set local role service_role;
select set_config('request.jwt.claims',
  json_build_object('role', 'service_role')::text, true);
select lives_ok(
  $$ select public.mark_deleted_title_prefix_purged(current_setting('t.live')::uuid) $$,
  'service_role sweeper can mark a deleted title purged');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.owner'), 'role', 'authenticated')::text, true);
select lives_ok(
  $$ select public.delete_title(current_setting('t.draft_job')::uuid) $$,
  'owner deletes a draft that still has an in-flight proxy job');

select throws_ok(
  $$ select public.mark_deleted_title_prefix_purged(current_setting('t.draft_job')::uuid) $$,
  'P0001', 'Title still has in-flight transcode output',
  'cannot mark purged while a proxy job can still write the prefix');

reset role;
select is((select s3_purged_at is null from public.titles
            where id = current_setting('t.draft_job')::uuid),
  true, 'in-flight job leaves the deleted title unmarked');

set local role service_role;
select set_config('request.jwt.claims',
  json_build_object('role', 'service_role')::text, true);
select throws_ok(
  format($$ select public.register_transcode_output(%L, %L, 100, 'hash_deleted') $$,
         current_setting('t.job'),
         'orgs/' || current_setting('t.org_a') || '/titles/' || current_setting('t.draft_job') || '/screener/out.mp4'),
  'P0001', 'Title is deleted',
  'register_transcode_output refuses a deleted title');

select is((select status::text from public.transcode_jobs
            where id = current_setting('t.job')::uuid),
  'failed', 'refused register fails the in-flight job so the sweeper can finish');

select is((select count(*) from public.assets
            where title_id = current_setting('t.draft_job')::uuid and kind = 'screener')::int,
  0, 'refused register does not insert a screener asset');

select lives_ok(
  $$ select public.mark_deleted_title_prefix_purged(current_setting('t.draft_job')::uuid) $$,
  'sweeper can mark after the in-flight job is failed');

select finish();
rollback;
