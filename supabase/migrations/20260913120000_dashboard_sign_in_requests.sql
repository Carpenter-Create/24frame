-- ============================================================================
-- 20260913120000_dashboard_sign_in_requests.sql
--
-- INTENT: durable app-layer rate limits for dashboard magic-link send after
-- login Turnstile is removed (founder lock 2026-09-13 option A). Portal OTP
-- still uses portal_otps counts + Turnstile; this table is login-only.
--
-- Write model: service-role INSERT + SELECT from requestMagicLink. No user
-- write path. Append-only (golden rule 2): no UPDATE/DELETE, including
-- service_role. No audit trigger — this is unauthenticated abuse telemetry,
-- not an org business record (same as portal_otps).
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TABLE, indexes, ENABLE RLS, GRANT/REVOKE, CREATE POLICY.
-- Forward-only + idempotent where possible.
-- ROLLBACK: drop table public.dashboard_sign_in_requests.
-- ============================================================================

create table if not exists public.dashboard_sign_in_requests (
  id                uuid primary key default gen_random_uuid(),
  email_normalized  text not null,
  ip                inet,
  created_at        timestamptz not null default now(),
  constraint dashboard_sign_in_requests_email_nonempty
    check (char_length(btrim(email_normalized)) > 0)
);

create index if not exists dashboard_sign_in_requests_email_created_idx
  on public.dashboard_sign_in_requests (email_normalized, created_at desc);
create index if not exists dashboard_sign_in_requests_ip_created_idx
  on public.dashboard_sign_in_requests (ip, created_at desc);
create index if not exists dashboard_sign_in_requests_created_idx
  on public.dashboard_sign_in_requests (created_at desc);

alter table public.dashboard_sign_in_requests enable row level security;

revoke all on public.dashboard_sign_in_requests from public, anon, authenticated;
revoke update, delete on public.dashboard_sign_in_requests from service_role;

grant select on public.dashboard_sign_in_requests to authenticated;
grant select, insert on public.dashboard_sign_in_requests to service_role;

drop policy if exists dashboard_sign_in_requests_select on public.dashboard_sign_in_requests;
create policy dashboard_sign_in_requests_select on public.dashboard_sign_in_requests
  for select to authenticated
  using (public.is_gc_staff(auth.uid()));
