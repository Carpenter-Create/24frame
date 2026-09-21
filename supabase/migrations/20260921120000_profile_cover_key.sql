-- ============================================================================
-- 20260921120000_profile_cover_key.sql
--
-- INTENT: One current profile cover still on profiles. Public profile renders
-- the banner only when this key is set; empty omits the photo and shows the
-- house wash. Replacing updates the pointer; prior objects stay in the member
-- media bucket (nothing is deleted). Founder applies; do not run from the PR.
--
-- CHANGE: add nullable cover_key. Existing profiles_update RLS stays the
-- write gate. No DELETE.
--
-- ROLLBACK: alter table public.profiles drop column cover_key;
-- ============================================================================

alter table public.profiles
  add column if not exists cover_key text;

comment on column public.profiles.cover_key is
  'Current profile cover still in the member media posts lane. Null shows the empty wash only.';
