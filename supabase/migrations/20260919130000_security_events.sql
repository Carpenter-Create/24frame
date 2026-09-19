-- ============================================================================
-- 20260919130000_security_events.sql
--
-- INTENT: Durable security-event history for the Settings → Security page.
-- Stores auth boundary events (sign-in, sign-out, failed sign-in) and
-- account-lifecycle events (invite sent/accepted/withdrawn, role change)
-- with device and IP metadata.
--
-- Write model: service-role INSERT from auth callbacks and server actions.
-- Append-only (golden rule 2): no UPDATE/DELETE. Not trigger-populated —
-- explicit INSERT at auth boundaries, unlike the tg_audit trigger which
-- captures row-level DML on business tables.
--
-- DESTRUCTIVE OPS (draft only — do NOT apply without founder approval):
--   CREATE TABLE, indexes, ENABLE RLS, GRANT/REVOKE, CREATE POLICY.
-- Forward-only + idempotent. ROLLBACK: drop table public.security_events.
-- ============================================================================

-- event_kind enum for type-safe event classification
create type public.security_event_kind as enum (
  'sign_in',
  'sign_out',
  'failed_sign_in',
  'invite_sent',
  'invite_accepted',
  'invite_withdrawn',
  'role_change'
);

create table if not exists public.security_events (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete restrict,
  actor_user_id  uuid,
  event_kind     public.security_event_kind not null,
  occurred_at    timestamptz not null default now(),
  ip             inet,
  user_agent     text,
  source_label   text,
  country        text,
  metadata       jsonb
);

create index if not exists security_events_org_occurred_idx
  on public.security_events (org_id, occurred_at desc);
create index if not exists security_events_actor_idx
  on public.security_events (actor_user_id, occurred_at desc);
create index if not exists security_events_kind_idx
  on public.security_events (event_kind);
create index if not exists security_events_occurred_idx
  on public.security_events (occurred_at desc);

alter table public.security_events enable row level security;

-- No anon surface.
revoke all on public.security_events from public, anon;
-- Append-only: no UPDATE/DELETE from any role.
revoke update, delete on public.security_events from authenticated, service_role;

-- Read: org members with view capability (same as audit_log pattern).
-- GC staff can see all orgs' events.
drop policy if exists security_events_select on public.security_events;
create policy security_events_select on public.security_events
  for select to authenticated
  using (
    public.is_gc_staff(auth.uid())
    or public.member_can(auth.uid(), org_id, 'view')
  );

-- Insert: only service_role (auth callbacks run as service-role).
-- No authenticated INSERT — events are written by server-side code
-- using the service-role client, not by the user's session client.
grant select on public.security_events to authenticated;
grant select, insert on public.security_events to service_role;
