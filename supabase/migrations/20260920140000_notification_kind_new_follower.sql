-- ============================================================================
-- 20260920140000_notification_kind_new_follower.sql
--
-- INTENT: commit new_follower on notification_kind and member on
-- notification_sender before any later migration uses them. Isolated
-- so the new enum values are visible after this file commits (same
-- reason as asset_kind trailer / screener).
--
-- ACCESS PATH: enum values only. No table, policy, or row changes.
-- Social follow alerts land in the next migration.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- ALTER TYPE ... ADD VALUE. Forward-only + idempotent.
-- CoS applies after merge + founder yes. Prod SQL apply needed after merge.
-- ROLLBACK: enum values cannot be dropped; leave unused.
-- ============================================================================

alter type public.notification_kind add value if not exists 'new_follower';
alter type public.notification_sender add value if not exists 'member';
