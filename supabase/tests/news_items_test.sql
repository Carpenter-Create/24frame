-- news_items_test.sql
-- Industry News catalog. No org_id. Authenticated SELECT only.
-- Unique on canonical_url. Service_role upsert + 30-day purge.
-- Health is service_role only. No summary / body / rewrite columns.

begin;
select plan(20);

select set_config('t.reader', gen_random_uuid()::text, false);
insert into auth.users (id) values (current_setting('t.reader')::uuid);

select ok(to_regclass('public.news_items') is not null, 'news_items table exists');
select ok(to_regclass('public.news_source_health') is not null, 'news_source_health table exists');
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'news_items'
      and column_name = 'org_id'
  ),
  'news_items has no org_id');
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'news_items'
      and column_name in ('summary', 'body', 'content', 'rewrite', 'ai_summary')
  ),
  'news_items has no summary / republish columns');
select ok(
  (select relrowsecurity from pg_class
    where oid = 'public.news_items'::regclass),
  'news_items has RLS enabled');
select ok(
  (select relrowsecurity from pg_class
    where oid = 'public.news_source_health'::regclass),
  'news_source_health has RLS enabled');

insert into public.news_items (title, url, canonical_url, source, published_at, image_url)
values (
  'Harbor Cut lands a festival slot',
  'https://variety.com/harbor-cut',
  'https://variety.com/harbor-cut',
  'variety',
  timestamptz '2026-09-18T12:00:00Z',
  null
);

select throws_ok(
  $$ insert into public.news_items (title, url, canonical_url, source, published_at)
     values (
       'Dupe',
       'https://variety.com/harbor-cut?utm_source=rss',
       'https://variety.com/harbor-cut',
       'variety',
       timestamptz '2026-09-18T13:00:00Z'
     ) $$,
  '23505',
  null,
  'canonical_url is unique');

insert into public.news_items (title, url, canonical_url, source, published_at)
values (
  'Harbor Cut lands a festival slot',
  'https://variety.com/harbor-cut',
  'https://variety.com/harbor-cut',
  'variety',
  timestamptz '2026-09-18T12:30:00Z'
)
on conflict (canonical_url) do update
  set title = excluded.title,
      fetched_at = now();

select is(
  (select count(*)::int from public.news_items where canonical_url = 'https://variety.com/harbor-cut'),
  1,
  'upsert keeps one row per canonical URL');

insert into public.news_items (title, url, canonical_url, source, published_at)
values (
  'Old headline',
  'https://variety.com/old',
  'https://variety.com/old',
  'variety',
  timestamptz '2026-08-01T12:00:00Z'
);

delete from public.news_items
where published_at < timestamptz '2026-08-19T18:00:00Z';

select is(
  (select count(*)::int from public.news_items where canonical_url = 'https://variety.com/old'),
  0,
  'purge removes rows older than 30 days');
select is(
  (select count(*)::int from public.news_items where canonical_url = 'https://variety.com/harbor-cut'),
  1,
  'purge keeps rows inside the 30-day window');

select is(
  (select enabled from public.news_source_health where source = 'variety'),
  true,
  'allowlist health seed is enabled');

update public.news_source_health
set enabled = false
where source = 'indiewire';

select is(
  (select enabled from public.news_source_health where source = 'indiewire'),
  false,
  'ops can kill a source without a deploy');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.reader'), 'role', 'authenticated')::text,
  true);

select isnt_empty(
  $$ select 1 from public.news_items where source = 'variety' $$,
  'authenticated can select news_items');
select throws_ok(
  $$ insert into public.news_items (title, url, canonical_url, source, published_at)
     values (
       'Member write',
       'https://variety.com/member',
       'https://variety.com/member',
       'variety',
       timestamptz '2026-09-18T14:00:00Z'
     ) $$,
  '42501',
  null,
  'authenticated cannot insert news_items');
select throws_ok(
  $$ update public.news_items set title = 'Hijack' $$,
  '42501',
  null,
  'authenticated cannot update news_items');
select throws_ok(
  $$ delete from public.news_items $$,
  '42501',
  null,
  'authenticated cannot delete news_items');
select throws_ok(
  $$ select 1 from public.news_source_health $$,
  '42501',
  null,
  'authenticated cannot select news_source_health');

reset role;
set local role anon;

select throws_ok(
  $$ select 1 from public.news_items $$,
  '42501',
  null,
  'anon cannot select news_items');

reset role;

select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'news_items'
      and indexname = 'news_items_published_at_idx'
  ),
  'published_at index exists');
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'news_items'
      and indexname = 'news_items_source_published_idx'
  ),
  'source + published_at index exists');
select ok(
  not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.news_items'::regclass
      and tgname = 'news_items_immutable'
  ),
  'abandoned append-only trigger is not attached');

select * from finish();
rollback;
