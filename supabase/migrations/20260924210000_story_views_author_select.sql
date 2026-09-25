-- ============================================================================
-- 20260924210000_story_views_author_select.sql
--
-- INTENT: Stories viewer Activity. The author SELECTs story_views for their
-- own stories. story_views_select_own stays (a viewer reads their row).
-- Policies OR. No DELETE. No Boost. No new viewers table.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE POLICY. Forward-only.
-- ROLLBACK: drop policy story_views_select_author on public.story_views.
-- ============================================================================

drop policy if exists story_views_select_author on public.story_views;
create policy story_views_select_author on public.story_views
  for select to authenticated
  using (
    exists (
      select 1
      from public.stories s
      where s.id = story_id
        and s.author_id = (select auth.uid())
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'story_views'
      and pol.polname = 'story_views_select_author'
  ) then
    raise exception 'story_views_select_author missing';
  end if;
end $$;
