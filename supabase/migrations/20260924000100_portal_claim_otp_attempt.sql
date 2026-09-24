-- ============================================================================
-- 20260924000100_portal_claim_otp_attempt.sql
--
-- INTENT: GC-P0-1. Portal OTP verify counted attempts with a read, a
-- client-side cap check, then `UPDATE attempts = <stale read> + 1`.
-- Concurrent verifies could all observe the same count, all pass the cap,
-- and all compare a code. The counter is still portal_otps.attempts
-- (no second counter). The cap constant stays PORTAL.otpMaxAttempts in
-- src/lib/portal.ts and is passed in; this function does not hardcode it.
--
-- One statement, under the row lock, in READ COMMITTED (Postgres rechecks
-- WHERE after a concurrent update commits):
--   UPDATE portal_otps
--      SET attempts = attempts + 1
--    WHERE id = p_otp_id
--      AND consumed_at IS NULL
--      AND attempts < p_max_attempts
--   RETURNING attempts;
-- Zero rows → NULL. The route treats NULL as exhausted and does not
-- compare the code or open a session (fail closed). A consumed row is
-- also not incremented: that in-flight verify cannot open a second session.
--
-- Granted to service_role only (the verify-otp route). SECURITY DEFINER
-- with search_path pinned, same shape as portal_resolve_download.
--
-- DESTRUCTIVE OPS: none. CREATE OR REPLACE function + REVOKE/GRANT.
-- No table change, no RLS change, no row delete.
-- ROLLBACK: drop function public.portal_claim_otp_attempt(uuid, integer);
-- Do not apply to production from this PR — founder applies SQL.
-- ============================================================================

create or replace function public.portal_claim_otp_attempt(
  p_otp_id uuid,
  p_max_attempts integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts integer;
begin
  if p_otp_id is null or p_max_attempts is null or p_max_attempts < 1 then
    raise exception 'invalid otp attempt claim';
  end if;

  update public.portal_otps
     set attempts = attempts + 1
   where id = p_otp_id
     and consumed_at is null
     and attempts < p_max_attempts
  returning attempts into v_attempts;

  return v_attempts;
end;
$$;

revoke execute on function public.portal_claim_otp_attempt(uuid, integer) from public, anon, authenticated;
grant execute on function public.portal_claim_otp_attempt(uuid, integer) to service_role;
