-- ============================================================================
-- 20260920150000_profile_topics.sql
--
-- INTENT: Ordered industry-interest Topics on profiles, separate from
-- Professions (crafts). Home Topics. and serving read this list first.
-- Founder applies; do not run this from the PR.
--
-- CHANGE: add topics text[] default {}. Existing profiles_update RLS
-- stays the write gate. No DELETE.
--
-- ROLLBACK: alter table public.profiles drop column topics;
-- ============================================================================

alter table public.profiles
  add column if not exists topics text[] not null default '{}';

comment on column public.profiles.topics is
  'Ordered Social Topics (industry interests). Separate from crafts / Professions.';

create index if not exists profiles_topics_gin
  on public.profiles using gin (topics);
