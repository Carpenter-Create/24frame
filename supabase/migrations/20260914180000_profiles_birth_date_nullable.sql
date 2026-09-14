-- ============================================================================
-- 20260914180000_profiles_birth_date_nullable.sql
--
-- INTENT: Product lane — any signed-in account can post a story. Mapping C
-- stays stories.author_id → profiles.id. ensure-own-profile (app, session
-- user only) must insert a profiles row without inventing a birth date.
-- Org invite / membership / auth.users triggers still do not create a
-- profile. This is not data-access remediation.
--
-- CHANGE: profiles.birth_date becomes nullable. The 13+ check remains when
-- a date is present.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- ALTER COLUMN DROP NOT NULL, DROP/ADD CHECK. ROLLBACK: restore NOT NULL
-- after filling remaining nulls, restore the original check.
-- ============================================================================

alter table public.profiles
  alter column birth_date drop not null;

alter table public.profiles
  drop constraint if exists profiles_birth_date_13_plus;

alter table public.profiles
  add constraint profiles_birth_date_13_plus
  check (
    birth_date is null
    or birth_date <= (current_date - interval '13 years')
  );
