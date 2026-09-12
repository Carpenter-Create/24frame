-- ============================================================================
-- 20260912220000_leaderboards.sql
--
-- INTENT: Phase 1B #16. Port 24Frame leaderboards onto this dashboard as a
-- NEW forward-only migration. Behavioral SSOT was donor Carpenter-Create/24frame
-- #16 (branch cursor/leaderboards-slice-3-eb11, file
-- supabase/migrations/20260912140000_leaderboards.sql). Donor repo was not
-- readable from this agent and was not written. Donor #16 stays parked. Do
-- not paste the donor "apply only to qxribdfzkvffambaartp" header. Survivor
-- project is uevsculwzwlhxeamagwg. Do not apply this file to production
-- from this PR. CoS merges and applies.
--
-- MAPPING C (locked, unchanged from Packs 1–4):
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   no org_id             on leaderboard_entries / level_distribution
--   catalog membership    is not required to read the board
--   do not wire           is_gc_staff into these policies as a privilege bridge
--
-- CREATE (if absent): leaderboard_entries, level_distribution;
-- point_events_created_at_idx; rebuild_leaderboards(); SELECT RLS;
-- first fill; pg_cron every 15m when the extension can be created.
--
-- OMIT:
--   donor org_status entirely. Dashboard org_status stays
--   registered|awaiting_payment|active|payment_lapsed|closed.
--   badges, streaks/heatmap UI, slices 4–7, Expo, media/avatars, Auth,
--   group-chat, repo rename, donor apply, Cognito.
--   Historical Pack 0–4 migration files untouched.
--   No live ranking on the read path. Clients only SELECT materialized rows.
--   The app must never call rebuild_leaderboards().
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TABLE, CREATE INDEX, CREATE FUNCTION, ENABLE RLS, GRANT,
-- CREATE POLICY, optional CREATE EXTENSION pg_cron. No DROP of existing
-- dashboard objects. Forward-only. ROLLBACK: drop public.leaderboard_entries,
-- public.level_distribution, public.rebuild_leaderboards(), and unschedule
-- cron job rebuild-leaderboards if present. point_events_created_at_idx
-- may stay.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tables (exact columns; FKs to profiles / levels; no org_id)
--    "window" is quoted: WINDOW is reserved in Postgres (not a blind paste).
-- ----------------------------------------------------------------------------
create table if not exists public.leaderboard_entries (
  "window"    text not null check ("window" in ('7d', '30d', 'all')),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rank        integer not null check (rank >= 1),
  points      integer not null,
  computed_at timestamptz not null,
  primary key ("window", user_id)
);

create index if not exists leaderboard_entries_window_rank_idx
  on public.leaderboard_entries ("window", rank);

create table if not exists public.level_distribution (
  level        integer primary key references public.levels(level),
  member_count integer not null check (member_count >= 0),
  pct          numeric(5, 2) not null check (pct >= 0 and pct <= 100),
  computed_at  timestamptz not null
);

create index if not exists point_events_created_at_idx
  on public.point_events (created_at);

-- ----------------------------------------------------------------------------
-- 2. rebuild_leaderboards() — service_role only; no live ranking on reads
--    7d/30d = sum(point_events.delta) in window
--    all-time = profiles.points_total
--    active profiles only; rank() ties share position
--    every active member gets a row (incl 0 points) so your-rank is PK lookup
--    level_distribution from active profiles vs levels
-- ----------------------------------------------------------------------------
create or replace function public.rebuild_leaderboards()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  now_ts timestamptz := clock_timestamp();
begin
  delete from public.leaderboard_entries;

  insert into public.leaderboard_entries ("window", user_id, rank, points, computed_at)
  select
    '7d',
    p.id,
    rank() over (order by coalesce(w.points, 0) desc)::integer,
    coalesce(w.points, 0),
    now_ts
  from public.profiles p
  left join (
    select pe.user_id, sum(pe.delta)::integer as points
    from public.point_events pe
    where pe.created_at >= now_ts - interval '7 days'
    group by pe.user_id
  ) w on w.user_id = p.id
  where p.status = 'active';

  insert into public.leaderboard_entries ("window", user_id, rank, points, computed_at)
  select
    '30d',
    p.id,
    rank() over (order by coalesce(w.points, 0) desc)::integer,
    coalesce(w.points, 0),
    now_ts
  from public.profiles p
  left join (
    select pe.user_id, sum(pe.delta)::integer as points
    from public.point_events pe
    where pe.created_at >= now_ts - interval '30 days'
    group by pe.user_id
  ) w on w.user_id = p.id
  where p.status = 'active';

  insert into public.leaderboard_entries ("window", user_id, rank, points, computed_at)
  select
    'all',
    p.id,
    rank() over (order by p.points_total desc)::integer,
    p.points_total,
    now_ts
  from public.profiles p
  where p.status = 'active';

  delete from public.level_distribution;

  insert into public.level_distribution (level, member_count, pct, computed_at)
  select
    l.level,
    coalesce(c.n, 0),
    case
      when t.n = 0 then 0
      else round((coalesce(c.n, 0)::numeric / t.n) * 100, 2)
    end,
    now_ts
  from public.levels l
  cross join (
    select count(*)::numeric as n
    from public.profiles
    where status = 'active'
  ) t
  left join (
    select p.level, count(*)::integer as n
    from public.profiles p
    where p.status = 'active'
    group by p.level
  ) c on c.level = l.level;
end;
$$;

revoke execute on function public.rebuild_leaderboards() from public, anon, authenticated;
grant execute on function public.rebuild_leaderboards() to service_role;

-- ----------------------------------------------------------------------------
-- 3. RLS — SELECT when both kill switches are on. No client writes.
--    Grant select to authenticated. No anon grants. No is_gc_staff backdoor.
-- ----------------------------------------------------------------------------
alter table public.leaderboard_entries enable row level security;
alter table public.level_distribution enable row level security;

drop policy if exists leaderboard_entries_select on public.leaderboard_entries;
create policy leaderboard_entries_select on public.leaderboard_entries
  for select to authenticated
  using (
    exists (
      select 1
      from public.app_settings s
      where s.id = true
        and s.leaderboard_public
        and s.gamification_enabled
    )
  );

drop policy if exists level_distribution_select on public.level_distribution;
create policy level_distribution_select on public.level_distribution
  for select to authenticated
  using (
    exists (
      select 1
      from public.app_settings s
      where s.id = true
        and s.leaderboard_public
        and s.gamification_enabled
    )
  );

revoke all on public.leaderboard_entries from public, anon;
revoke all on public.level_distribution from public, anon;

grant select on public.leaderboard_entries to authenticated;
grant select on public.level_distribution to authenticated;

grant select, insert, update, delete on public.leaderboard_entries to service_role;
grant select, insert, update, delete on public.level_distribution to service_role;

-- ----------------------------------------------------------------------------
-- 4. First fill (migration owner). Clients never call this.
-- ----------------------------------------------------------------------------
select public.rebuild_leaderboards();

-- ----------------------------------------------------------------------------
-- 5. pg_cron every 15m when the extension can be created.
--    If not: NOTICE and leave the function in place. CoS fallback after
--    apply on survivor uevsculwzwlhxeamagwg (not donor). Job name
--    rebuild-leaderboards.
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice
      'pg_cron extension cannot be created; rebuild_leaderboards() left in place. CoS fallback after apply on survivor uevsculwzwlhxeamagwg (job name rebuild-leaderboards): %',
      SQLERRM;
    return;
  end;

  begin
    if exists (
      select 1
      from cron.job
      where jobname = 'rebuild-leaderboards'
    ) then
      perform cron.unschedule('rebuild-leaderboards');
    end if;

    perform cron.schedule(
      'rebuild-leaderboards',
      '*/15 * * * *',
      $cron$select public.rebuild_leaderboards()$cron$
    );
  exception when others then
    raise notice
      'pg_cron schedule failed; rebuild_leaderboards() left in place. CoS fallback after apply on survivor uevsculwzwlhxeamagwg (job name rebuild-leaderboards): %',
      SQLERRM;
  end;
end $$;

-- ----------------------------------------------------------------------------
-- 6. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_org_status text[];
  v_bad_pol text;
  v_missing text;
begin
  if to_regclass('public.leaderboard_entries') is null
     or to_regclass('public.level_distribution') is null then
    raise exception 'leaderboard tables missing after create';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('leaderboard_entries', 'level_distribution')
      and column_name = 'org_id'
  ) then
    raise exception 'leaderboard tables must not have org_id (mapping C)';
  end if;

  if to_regclass('public.conversations') is null
     or to_regclass('public.ai_conversations') is null then
    raise exception 'conversations / ai_conversations must stay';
  end if;

  select array_agg(e.enumlabel::text order by e.enumsortorder) into v_org_status
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'org_status';

  if v_org_status is distinct from
     array['registered','awaiting_payment','active','payment_lapsed','closed']::text[]
  then
    raise exception 'org_status enum mutated: %', v_org_status;
  end if;

  select string_agg(pol.polname, ', ' order by pol.polname) into v_bad_pol
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('leaderboard_entries', 'level_distribution')
    and (
      coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
      or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
    );
  if v_bad_pol is not null then
    raise exception 'leaderboard policies must not call is_gc_staff: %', v_bad_pol;
  end if;

  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rebuild_leaderboards'
      and p.prosrc ilike '%is_gc_staff%'
  ) then
    raise exception 'rebuild_leaderboards must not call is_gc_staff';
  end if;

  if has_table_privilege('anon', 'public.leaderboard_entries', 'SELECT')
     or has_table_privilege('anon', 'public.level_distribution', 'SELECT') then
    raise exception 'anon must not have leaderboard grants';
  end if;

  select string_agg(c.relname, ', ' order by c.relname) into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname in ('leaderboard_entries', 'level_distribution')
    and not has_table_privilege('authenticated', c.oid, 'SELECT');
  if v_missing is not null then
    raise exception 'leaderboard tables not readable by authenticated: %', v_missing;
  end if;

  if has_function_privilege('authenticated', 'public.rebuild_leaderboards()', 'EXECUTE')
     or has_function_privilege('anon', 'public.rebuild_leaderboards()', 'EXECUTE') then
    raise exception 'rebuild_leaderboards must not be executable by anon or authenticated';
  end if;

  if not has_function_privilege('service_role', 'public.rebuild_leaderboards()', 'EXECUTE') then
    raise exception 'rebuild_leaderboards must be executable by service_role';
  end if;

  raise notice 'leaderboards applied; mapping C; org_status unchanged; donor #16 parked';
end $$;
