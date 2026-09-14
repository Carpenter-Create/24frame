-- ============================================================================
-- 20260914310000_bound_my_rpcs.sql
--
-- INTENT: Remediation class 4. Data Access — my_deliveries / my_findings /
-- my_notifications cannot return an unbounded set. Silent PostgREST max_rows
-- (1000) looked like a finished list. Named path + cardinality; probe one
-- past the cap so truncation is visible.
--
-- ACCESS PATH:
--   my_deliveries(p_limit, p_title_id)  — org-scoped via member_can;
--     optional title scope for /titles/:id. Cardinality ≤ 501.
--   my_findings(p_limit)                — open findings, member_can.
--     Cardinality ≤ 501.
--   my_notifications(p_limit)           — caller inbox, member_can.
--     Cardinality ≤ 501.
-- App probes UNPAGINATED_MAX+1 (501) and splitProbe(500). Hard max 501 so a
-- direct PostgREST call cannot dump an unbounded set.
--
-- MAPPING C (locked, unchanged): these are catalog/distribution RPCs
-- (org_id + member_can). Not Social. Do not add profile_id. Do not touch
-- posts / stories / DMs / Social Home.
--
-- OMIT: my_unread_count (scalar, cardinality 1). Class 5 Social Home
-- honesty/keyset. Class 6 DM fan-out. Education. Profile public-image.
-- Avatar. Finance. Redis/partition.
--
-- Why DROP and recreate: CREATE OR REPLACE cannot change the argument list.
-- Zero-arg callers still work (DEFAULT 500). The app must probe; a default
-- page of 500 without a probe is the silent-max failure this replaces.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- DROP FUNCTION + CREATE FUNCTION + GRANT/REVOKE EXECUTE. No table, column,
-- policy, trigger, or row changes. Forward-only.
-- CoS applies after merge + founder yes. Prod SQL apply needed after merge.
-- ROLLBACK: recreate the no-arg functions from 20260719000600 /
-- 20260720000600 / 20260720000700.
-- ============================================================================

-- 501 = UNPAGINATED_MAX (500) + 1 probe row. Keep in lockstep with
-- src/lib/list-bounds.ts and src/lib/my-lists.ts.

drop function if exists public.my_deliveries();

create function public.my_deliveries(
  p_limit integer default 500,
  p_title_id uuid default null
)
  returns table (
    delivery_id uuid,
    title_id uuid,
    title text,
    vendor_name text,
    territory text,
    status public.delivery_status,
    updated_at timestamptz
  )
  language sql
  stable
  security definer
  set search_path = public
as $$
  select d.id, d.title_id, t.title, v.name, d.territory, d.status, d.updated_at
  from public.deliveries d
  join public.titles t  on t.id = d.title_id
  join public.vendors v on v.id = d.vendor_id
  where public.member_can(auth.uid(), d.org_id, 'view')
    and (p_title_id is null or d.title_id = p_title_id)
  order by t.title, v.name, d.territory
  limit least(greatest(coalesce(p_limit, 0), 0), 501);
$$;

revoke execute on function public.my_deliveries(integer, uuid) from public, anon;
grant  execute on function public.my_deliveries(integer, uuid) to authenticated;

comment on function public.my_deliveries(integer, uuid) is
  'Caller deliveries + vendor names. Bounded (≤501). Optional title scope. Not an authorization input.';

drop function if exists public.my_findings();

create function public.my_findings(p_limit integer default 500)
  returns setof public.findings
  language sql
  stable
  security definer
  set search_path = public
as $$
  select *
  from public.findings
  where status = 'open'
    and public.member_can(auth.uid(), org_id, 'view')
  order by severity, created_at
  limit least(greatest(coalesce(p_limit, 0), 0), 501);
$$;

revoke execute on function public.my_findings(integer) from public, anon;
grant  execute on function public.my_findings(integer) to authenticated;

comment on function public.my_findings(integer) is
  'Caller open findings. Bounded (≤501). Not an authorization input.';

drop function if exists public.my_notifications();

create function public.my_notifications(p_limit integer default 500)
  returns table (
    id uuid,
    org_id uuid,
    kind public.notification_kind,
    title text,
    body text,
    source_refs jsonb,
    created_at timestamptz,
    unread boolean
  )
  language sql
  stable
  security definer
  set search_path = public
as $$
  select n.id, n.org_id, n.kind, n.title, n.body, n.source_refs, n.created_at,
         not exists (
           select 1
           from public.notification_reads r
           where r.notification_id = n.id
             and r.user_id = auth.uid()
         ) as unread
  from public.notifications n
  where public.member_can(auth.uid(), n.org_id, 'view')
  order by n.created_at desc
  limit least(greatest(coalesce(p_limit, 0), 0), 501);
$$;

revoke execute on function public.my_notifications(integer) from public, anon;
grant  execute on function public.my_notifications(integer) to authenticated;

comment on function public.my_notifications(integer) is
  'Caller inbox. Bounded (≤501). Not an authorization input.';
