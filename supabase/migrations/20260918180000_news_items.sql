-- ============================================================================
-- 20260918180000_news_items.sql
--
-- INTENT: Industry News (Adam lock 2026-09-18). Persist allowlisted RSS
-- items on the house catalog path. Home serves latest 12 from this table;
-- /news is the 30-day chronological history. Link-out cards only — no
-- summary, rewrite, or full-text republish. No org_id: shared catalog,
-- not tenant data. Same RLS shape as courses: authenticated SELECT,
-- service_role writes (ingest upsert + 30-day purge).
--
-- ALLOWLIST SoT is src/lib/news.ts (verified 2026-09-18). This table
-- stores the source key, not the feed URL. Kill switch: NEWS_SOURCES
-- enabled (deploy) or news_source_health.enabled (no deploy).
--
-- APPLY (founder / CoS — after merge, not from this PR):
--   Do not prod-apply from the PR.
--
-- DESTRUCTIVE OPS (do NOT apply to production from this PR):
--   CREATE TABLE news_items, news_source_health; CREATE INDEX;
--   ENABLE RLS; GRANT/REVOKE; DROP leftover append-only trigger from
--   the unmerged 20260918140000 draft if present. Forward-only.
-- ROLLBACK: drop public.news_items, public.news_source_health.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. news_items — persist feed items; unique on canonical URL
-- ----------------------------------------------------------------------------
create table if not exists public.news_items (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  url            text not null,
  canonical_url  text not null,
  source         text not null,
  published_at   timestamptz not null,
  image_url      text,
  fetched_at     timestamptz not null default now(),
  constraint news_items_title_chk
    check (char_length(btrim(title)) > 0),
  constraint news_items_source_chk
    check (char_length(btrim(source)) > 0),
  constraint news_items_url_chk
    check (url ~* '^https://'),
  constraint news_items_canonical_chk
    check (canonical_url ~* '^https://'),
  constraint news_items_canonical_unique
    unique (canonical_url),
  constraint news_items_image_chk
    check (image_url is null or image_url ~* '^https://')
);

create index if not exists news_items_published_at_idx
  on public.news_items (published_at desc);

create index if not exists news_items_source_published_idx
  on public.news_items (source, published_at desc);

-- Abandoned first draft blocked UPDATE/DELETE. Ingest upsert and the
-- 30-day purge need both. These rows are a derived RSS catalog, not
-- org-owned business records.
drop trigger if exists news_items_immutable on public.news_items;
drop function if exists public.tg_news_items_immutable();

-- ----------------------------------------------------------------------------
-- 2. news_source_health — last_success_at / last_error + ops kill switch
-- ----------------------------------------------------------------------------
create table if not exists public.news_source_health (
  source           text primary key,
  enabled          boolean not null default true,
  last_success_at  timestamptz,
  last_error       text,
  last_error_at    timestamptz,
  constraint news_source_health_source_chk
    check (char_length(btrim(source)) > 0)
);

insert into public.news_source_health (source, enabled)
values
  ('indiewire', true),
  ('variety', true),
  ('deadline', true),
  ('hollywood-reporter', true),
  ('tvline', true),
  ('no-film-school', true),
  ('filmmaker-magazine', true),
  ('moviemaker', true),
  ('joblo', true),
  ('film-threat', true),
  ('screen-daily', true)
on conflict (source) do nothing;

-- ----------------------------------------------------------------------------
-- 3. RLS — courses shape. Authenticated SELECT on items. No client writes.
--    Health is service_role only (ops). No anon. No org_id.
-- ----------------------------------------------------------------------------
alter table public.news_items enable row level security;
alter table public.news_source_health enable row level security;

drop policy if exists news_items_select on public.news_items;
create policy news_items_select on public.news_items
  for select to authenticated
  using (true);

revoke all on public.news_items from public, anon, authenticated;
revoke all on public.news_source_health from public, anon, authenticated;

grant select on public.news_items to authenticated;
grant select, insert, update, delete on public.news_items to service_role;
grant select, insert, update, delete on public.news_source_health to service_role;

-- ----------------------------------------------------------------------------
-- 4. Privilege floor — fail the migration if grants drift
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  select string_agg(c.relname, ', ' order by c.relname)
    into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('news_items', 'news_source_health')
    and (
      (c.relname = 'news_items' and (
        not has_table_privilege('authenticated', c.oid, 'SELECT')
        or has_table_privilege('authenticated', c.oid, 'INSERT')
        or has_table_privilege('authenticated', c.oid, 'UPDATE')
        or has_table_privilege('authenticated', c.oid, 'DELETE')
      ))
      or (c.relname = 'news_source_health' and (
        has_table_privilege('authenticated', c.oid, 'SELECT')
        or has_table_privilege('authenticated', c.oid, 'INSERT')
        or has_table_privilege('authenticated', c.oid, 'UPDATE')
        or has_table_privilege('authenticated', c.oid, 'DELETE')
      ))
    );
  if v_missing is not null then
    raise exception 'news catalog grants drifted: %', v_missing;
  end if;
end
$$;
