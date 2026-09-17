-- ============================================================================
-- 20260917120200_title_delete_s3_purge.sql
--
-- INTENT: Founder lock 2026-09-17 — soft-deleted titles always purge their
-- S3 prefix. Soft-delete rows stay for audit; bytes must go. This migration
-- only adds the DB markers + the SECURITY DEFINER writer that records a
-- successful prefix purge. ListObjectsV2 + DeleteObjects live in src/lib/s3.ts.
--
-- G2: assets.purged_at — no deleted title with unpurged assets pointing at
-- live keys after a successful purge.
-- titles.s3_purged_at — sweeper idempotency key (G5). Finds
--   titles.deleted_at IS NOT NULL AND s3_purged_at IS NULL
-- which is exactly the set that still has unpurged assets (or a prefix that
-- never got a mark after S3). Covers the no-asset leftover-object case too.
--
-- APPLY (founder / CoS / Adam — after merge, not from this PR):
--   Requires 20260917120100_titles_delete_archive.sql already applied.
--   Do not prod-apply from the PR. CoS one-shot of existing prod orphans
--   (GC-0000021, GC-0000037, GC-0000045) is a separate ops step after apply.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
--   ALTER TABLE titles / assets (add columns + indexes + check);
--   CREATE FUNCTION mark_deleted_title_prefix_purged; GRANT/REVOKE.
--   No drops. Forward-only + idempotent where possible.
-- ROLLBACK: drop the function, drop the new indexes/check, drop the columns.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COLUMNS — purge markers. Rows stay; bytes are gone.
-- ----------------------------------------------------------------------------
alter table public.titles
  add column if not exists s3_purged_at timestamptz;

alter table public.assets
  add column if not exists purged_at timestamptz;

do $$ begin
  alter table public.titles
    add constraint titles_s3_purged_requires_deleted
    check (s3_purged_at is null or deleted_at is not null);
exception when duplicate_object then null;
end $$;

create index if not exists titles_pending_s3_purge_idx
  on public.titles (deleted_at)
  where deleted_at is not null and s3_purged_at is null;

create index if not exists assets_pending_purge_idx
  on public.assets (title_id)
  where purged_at is null and deleted_at is not null;

-- ----------------------------------------------------------------------------
-- 2. MARK — RPC-only write. assets UPDATE stays revoked for every role.
--    Caller: operate / gc_staff after their own delete, or service_role
--    (the sweeper). Title must already be soft-deleted.
-- ----------------------------------------------------------------------------
create or replace function public.mark_deleted_title_prefix_purged(p_title_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_org uuid;
  v_deleted timestamptz;
begin
  if auth.role() is distinct from 'service_role' then
    if auth.uid() is null then
      raise exception 'Not authenticated';
    end if;
  end if;

  select org_id, deleted_at
    into v_org, v_deleted
    from public.titles
   where id = p_title_id;
  if v_org is null then
    raise exception 'Title not found';
  end if;
  if v_deleted is null then
    raise exception 'Title is not deleted';
  end if;

  if auth.role() is distinct from 'service_role' then
    if not public.is_gc_staff(auth.uid())
       and not public.member_can(auth.uid(), v_org, 'operate') then
      raise exception 'Not authorized to mark this title purged';
    end if;
  end if;

  update public.titles
     set s3_purged_at = coalesce(s3_purged_at, now())
   where id = p_title_id
     and deleted_at is not null;

  update public.assets
     set purged_at = coalesce(purged_at, now())
   where title_id = p_title_id
     and purged_at is null;
end;
$$;

revoke execute on function public.mark_deleted_title_prefix_purged(uuid) from public, anon;
grant  execute on function public.mark_deleted_title_prefix_purged(uuid) to authenticated, service_role;
