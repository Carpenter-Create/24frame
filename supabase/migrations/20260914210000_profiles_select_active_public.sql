-- ============================================================================
-- 20260914210000_profiles_select_active_public.sql
--
-- INTENT: Public /social/u/{handle} must be selectable by other
-- authenticated members. profiles_select used
--   id = auth.uid() OR discoverable = true OR status <> 'active'
-- which hid active + discoverable=false rows and exposed every inactive
-- row. The public profile page treats a RLS-null maybeSingle the same as
-- a missing handle ("No public profile for that handle").
--
-- CHANGE: replace the status clause so active members are selectable.
-- Self still matches auth.uid(). discoverable = true stays additive.
--
-- ACCESS PATH: authenticated SELECT on profiles via the user-scoped
-- client. No service_role. No org_id. Do not wire is_gc_staff.
--
-- OMIT: Education, avatar IAM, remediations class 4–6, production apply.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- DROP/CREATE POLICY profiles_select. Forward-only.
-- CoS applies after merge + founder yes. Prod SQL apply needed after merge.
-- ROLLBACK: restore
--   id = auth.uid() OR discoverable = true OR status <> 'active'
-- ============================================================================

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or status = 'active'
    or discoverable = true
  );

do $$
declare
  expr text;
begin
  select pg_get_expr(pol.polqual, pol.polrelid)
    into expr
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'profiles'
    and pol.polname = 'profiles_select';
  if expr is null or expr not like '%status = ''active''%' then
    raise exception 'profiles_select must allow status = active';
  end if;
  if expr like '%status <> ''active''%' then
    raise exception 'profiles_select must not use status <> active';
  end if;
end $$;
