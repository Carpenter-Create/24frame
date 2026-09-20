-- ============================================================================
-- 20260920140200_profile_welcome_video.sql
--
-- INTENT: One current welcome-video pointer on profiles. Public profile
-- renders the band only when this key is set. Replacing updates the
-- pointer; prior objects stay in the member media bucket (nothing is
-- deleted). Founder applies; do not run this from the PR.
--
-- CHANGE: add nullable welcome_video_key. Existing profiles_update RLS
-- stays the write gate. No DELETE.
--
-- ROLLBACK: alter table public.profiles drop column welcome_video_key;
-- ============================================================================

alter table public.profiles
  add column if not exists welcome_video_key text;

comment on column public.profiles.welcome_video_key is
  'Current welcome video object key in the member media lane. Null omits the public band.';
