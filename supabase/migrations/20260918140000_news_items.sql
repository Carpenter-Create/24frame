-- ============================================================================
-- 20260918140000_news_items.sql
--
-- INTENT: Industry News (Adam lock 2026-09-18). Persist allowlisted RSS
-- items. Home serves latest 12 from this table; /news is the 30-day
-- chronological history. Link-out cards only — no summary, rewrite, or
-- full-text republish. No org_id: this is a shared catalog, not tenant
-- data. Clients SELECT. Ingest is service_role INSERT only.
--
-- ALLOWLIST SoT is src/lib/news.ts (verified 2026-09-18). This table
-- stores the source key, not the feed URL.
--
-- APPLY (founder / CoS — after merge, not from this PR):
--   Do not prod-apply from the PR.
--
-- DESTRUCTIVE OPS (do NOT apply to production from this PR):
--   CREATE TABLE news_items; CREATE INDEX; ENABLE RLS; GRANT/REVOKE;
--   CREATE FUNCTION + TRIGGER (append-only). No drops of existing
--   dashboard objects. Forward-only.
-- ROLLBACK: drop public.news_items, public.tg_news_items_immutable().
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table — persist feed items; unique on canonical URL
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

-- ----------------------------------------------------------------------------
-- 2. Append-only — sources stay immutable; hide is a query window, not DELETE
-- ----------------------------------------------------------------------------
create or replace function public.tg_news_items_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'news_items is append-only';
end;
$$;

drop trigger if exists news_items_immutable on public.news_items;
create trigger news_items_immutable
  before update or delete on public.news_items
  for each row execute function public.tg_news_items_immutable();

-- ----------------------------------------------------------------------------
-- 3. RLS — authenticated SELECT. No client writes. No anon. No org_id.
-- ----------------------------------------------------------------------------
alter table public.news_items enable row level security;

drop policy if exists news_items_select on public.news_items;
create policy news_items_select on public.news_items
  for select to authenticated
  using (true);

revoke all on public.news_items from public, anon, authenticated;
grant select on public.news_items to authenticated;
grant select, insert on public.news_items to service_role;

revoke execute on function public.tg_news_items_immutable() from public, anon, authenticated;
