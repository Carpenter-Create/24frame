-- ============================================================================
-- 20260924120000_like_target_story_item.sql
--
-- INTENT: Stories viewer IG actions lock v1. Extend like_target so a story
-- item can be liked. Existing labels stay post | comment. Isolated ADD
-- VALUE: Postgres cannot use a newly added enum label in the same
-- transaction it was added. Policies, the engagement trigger, and
-- stories.like_count live in 20260924120100_story_item_likes.sql.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- ALTER TYPE ADD VALUE. No DROP. Forward-only.
-- ROLLBACK: enum labels cannot be removed in place. Restoring the prior
-- set means a new type and a column rewrite, which this draft does not do.
-- ============================================================================

alter type public.like_target add value if not exists 'story_item';
