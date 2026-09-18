-- news_items_test.sql
-- Industry News catalog. No org_id. Authenticated SELECT only.
-- Append-only: UPDATE/DELETE blocked. Unique on canonical_url.
-- No summary / body / rewrite columns.

begin;
select plan(16);

select set_config('t.reader', gen_random_uuid()::text, false);
insert into auth.users (id) values (current_setting('t.reader')::uuid);

select ok(to_regclass('public.news_items') is not null, 'news_items table exists');
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

select throws_ok(
  $$ update public.news_items set title = 'Tamper' $$,
  'P0001',
  null,
  'news_items UPDATE blocked (append-only)');
select throws_ok(
  $$ delete from public.news_items $$,
  'P0001',
  null,
  'news_items DELETE blocked (append-only)');

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
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tg_news_items_immutable'
  ),
  'append-only trigger function exists');
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.news_items'::regclass
      and tgname = 'news_items_immutable'
  ),
  'append-only trigger is attached');
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'news_items'
      and indexname = 'news_items_published_at_idx'
  ),
  'published_at index exists');
select is(
  (select count(*)::int from public.news_items where canonical_url = 'https://variety.com/harbor-cut'),
  1,
  'one row survived the unique conflict');

select * from finish();
rollback;
