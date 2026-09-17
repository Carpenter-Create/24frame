-- ============================================================================
-- 20260917120000_title_status_archived.sql
--
-- INTENT: first-class Archived value on the existing title_status enum.
-- Isolated ADD VALUE: Postgres cannot USE a newly added enum value in the same
-- transaction it was added, so delete/archive RPCs live in 20260917120100.
--
-- APPLY (founder / CoS / Adam — after merge, not from this PR):
--   Run this file, then 20260917120100_titles_delete_archive.sql, in order.
--   Do not prod-apply from the PR. No other schema in this pack.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
--   ALTER TYPE title_status ADD VALUE. Forward-only + idempotent.
-- ROLLBACK: Postgres cannot drop an enum value. Leave unused if reverting.
-- ============================================================================

alter type public.title_status add value if not exists 'archived';
