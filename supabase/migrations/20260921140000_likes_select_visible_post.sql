-- ============================================================================
-- 20260921140000_likes_select_visible_post.sql
--
-- INTENT: Who-liked sheet (founder lock 2026-09-21). likes SELECT was
-- self-only (`likes_select_self`). Listing likers on a visible post
-- needs a second SELECT policy. Existing table. No view. No service
-- role. Posts RLS applies inside the EXISTS subquery.
--
-- CREATE: likes_select_visible_post (SELECT, authenticated).
-- KEEP: likes_select_self (own rows, including likes on posts the
-- viewer can no longer see).
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE POLICY. No DROP of existing policies or grants.
-- ROLLBACK: drop policy likes_select_visible_post on public.likes.
-- ============================================================================

drop policy if exists likes_select_visible_post on public.likes;
create policy likes_select_visible_post on public.likes
  for select to authenticated
  using (
    target_type = 'post'
    and exists (
      select 1
      from public.posts p
      where p.id = likes.target_id
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
      and c.relname = 'likes'
      and pol.polname = 'likes_select_visible_post'
      and pol.polcmd = 'r'
  ) then
    raise exception 'likes_select_visible_post missing after create';
  end if;

  if exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'likes'
      and pol.polname = 'likes_select_visible_post'
      and (
        coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
        or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
      )
  ) then
    raise exception 'likes_select_visible_post must not call is_gc_staff';
  end if;
end
$$;
