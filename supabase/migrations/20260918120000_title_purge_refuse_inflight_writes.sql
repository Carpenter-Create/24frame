-- ============================================================================
-- 20260918120000_title_purge_refuse_inflight_writes.sql
--
-- INTENT: Close the delete-time race where purgeTitlePrefix lists empty, we
-- mark titles.s3_purged_at, then an in-flight MediaConvert job writes a
-- screener under the same prefix. register_transcode_output used to insert
-- that asset on a deleted title; the sweeper never selected the row again.
--
-- 1. mark_deleted_title_prefix_purged refuses while transcode_jobs is still
--    submitted/running — s3_purged_at stays null so the sweeper retries.
-- 2. register_transcode_output refuses a deleted title, fails the job (so
--    the mark gate can pass on a later sweep), and does not insert an asset.
--
-- APPLY (founder / CoS / Adam — after merge, not from this PR):
--   Requires 20260917120200_title_delete_s3_purge.sql already applied.
--   Do not prod-apply from the PR.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
--   CREATE OR REPLACE two SECURITY DEFINER functions. No drops, no RLS
--   changes, no column changes.
-- ROLLBACK: replace both functions with the 20260917120200 /
--   20260807000100 bodies.
-- ============================================================================

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

  if exists (
    select 1
      from public.transcode_jobs j
     where j.title_id = p_title_id
       and j.status in ('submitted', 'running')
  ) then
    raise exception 'Title still has in-flight transcode output';
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

create or replace function public.register_transcode_output(
  p_job_id       uuid,
  p_storage_key  text,
  p_bytes        bigint,
  p_content_hash text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_job public.transcode_jobs; v_asset_id uuid; v_source public.screener_source;
        v_deleted timestamptz;
begin
  select * into v_job from public.transcode_jobs where id = p_job_id for update;
  if not found then raise exception 'Job not found'; end if;

  if v_job.status = 'complete' then return v_job.output_asset_id; end if;

  if v_job.status not in ('submitted', 'running') then
    raise exception 'Job is not active';
  end if;

  -- Soft-delete does not cancel MediaConvert. AWS may still write the screener
  -- under orgs/<org>/titles/<title>/ after delete_title. Inserting here would
  -- leave a live asset and, if s3_purged_at is already set, a permanent orphan.
  select t.deleted_at into v_deleted
    from public.titles t
   where t.id = v_job.title_id
     for update;
  if v_deleted is not null then
    update public.transcode_jobs
       set status = 'failed',
           failure_reason = 'Title deleted',
           updated_at = now()
     where id = p_job_id
       and status in ('submitted', 'running');
    raise exception 'Title is deleted';
  end if;

  if coalesce(btrim(p_storage_key), '') is distinct from v_job.expected_output_key then
    raise exception 'Output key does not match the job';
  end if;

  if coalesce(btrim(p_content_hash), '') = '' then
    raise exception 'content_hash required';
  end if;

  insert into public.assets (org_id, title_id, kind, storage_key, content_hash, bytes, content_type)
  values (v_job.org_id, v_job.title_id, 'screener', v_job.expected_output_key,
          btrim(p_content_hash), coalesce(p_bytes, 0), 'video/mp4')
  returning id into v_asset_id;

  select screener_source into v_source from public.titles where id = v_job.title_id;
  if v_source = 'master' then
    update public.titles set screener_source = 'dedicated' where id = v_job.title_id;
  end if;

  update public.transcode_jobs
     set status = 'complete', output_asset_id = v_asset_id,
         completed_at = now(), updated_at = now()
   where id = p_job_id;

  insert into public.audit_log (org_id, entity, entity_id, action, actor, after)
  values (v_job.org_id, 'transcode_jobs', p_job_id, 'proxy_registered', null,
          jsonb_build_object('asset_id', v_asset_id, 'flipped_source', v_source = 'master'));

  return v_asset_id;
end; $$;

revoke execute on function public.register_transcode_output(uuid, text, bigint, text) from public, anon, authenticated;
grant  execute on function public.register_transcode_output(uuid, text, bigint, text) to service_role;
