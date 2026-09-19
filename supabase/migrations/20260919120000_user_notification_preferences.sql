-- ============================================================================
-- 20260919120000_user_notification_preferences.sql
--
-- INTENT: durable per-user notification channel prefs for Settings →
-- Preferences. One row per auth user. prefs jsonb holds the 26 locked
-- event keys (in_app / email). Missing row or empty object = app
-- defaults in lib/notification-prefs.ts. Theme stays gc-theme
-- localStorage — this table is notifications only.
--
-- Write model: the signed-in user SELECT/INSERT/UPDATE their own row
-- via RLS. No DELETE (golden rule 2). No service-role write path.
-- Emitters do not read this table yet — org_notification_recipients
-- still returns every active member email. SoT for later gating is
-- lib/notification-prefs.ts.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TABLE, ENABLE RLS, GRANT/REVOKE, CREATE POLICY, updated_at
-- trigger. Forward-only + idempotent where possible.
-- ROLLBACK: drop table public.user_notification_preferences.
-- ============================================================================

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete restrict,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_notification_preferences_prefs_object
    check (jsonb_typeof(prefs) = 'object')
);

alter table public.user_notification_preferences enable row level security;

revoke all on public.user_notification_preferences from public, anon, authenticated;
revoke delete on public.user_notification_preferences from service_role;

grant select, insert, update on public.user_notification_preferences to authenticated;
grant select, insert, update on public.user_notification_preferences to service_role;

drop policy if exists user_notification_preferences_select_own on public.user_notification_preferences;
create policy user_notification_preferences_select_own
  on public.user_notification_preferences
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_notification_preferences_insert_own on public.user_notification_preferences;
create policy user_notification_preferences_insert_own
  on public.user_notification_preferences
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_notification_preferences_update_own on public.user_notification_preferences;
create policy user_notification_preferences_update_own
  on public.user_notification_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop trigger if exists set_updated_at_user_notification_preferences
  on public.user_notification_preferences;
create trigger set_updated_at_user_notification_preferences
  before update on public.user_notification_preferences
  for each row execute function public.tg_set_updated_at();
