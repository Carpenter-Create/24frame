-- ============================================================================
-- 20260924120100_story_item_likes.sql
--
-- INTENT: Stories viewer IG actions lock v1. A story item like is a row in
-- public.likes with target_type = story_item and target_id = stories.id.
-- Counts live on stories.like_count so a viewer can read the integer
-- without a likers list. No likers SELECT policy. No point_events.
-- Comment likes stay rejected. Post likes keep the Pack 3 path.
--
-- Unlike deletes the caller's likes row. That is the existing likes
-- contract (personal engagement), not an org-owned catalog delete.
--
-- Requires 20260924120000_like_target_story_item.sql committed first.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- ALTER TABLE ADD COLUMN, CREATE FUNCTION, CREATE TRIGGER, CREATE POLICY.
-- No DROP TABLE. No DELETE of rows. Forward-only.
-- ROLLBACK: drop policy likes_insert_story_item; drop trigger
-- stories_protect_like_count; drop function protect_story_like_count;
-- restore the previous refresh_like_engagement body; drop column
-- stories.like_count. Do not drop the story_item enum label here.
-- ============================================================================

alter table public.stories
  add column if not exists like_count integer not null default 0;

-- Client story updates must not write the counter. The engagement trigger
-- sets app.refreshing_story_like_count for the one update it owns.
create or replace function public.protect_story_like_count()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if current_setting('app.refreshing_story_like_count', true) = 'on' then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.like_count <> 0 then
      raise exception 'privileged story columns are not client-writable';
    end if;
    return new;
  end if;

  if new.like_count is distinct from old.like_count then
    raise exception 'privileged story columns are not client-writable';
  end if;

  return new;
end;
$$;

drop trigger if exists stories_protect_like_count on public.stories;
create trigger stories_protect_like_count
  before insert or update on public.stories
  for each row execute function public.protect_story_like_count();

revoke execute on function public.protect_story_like_count()
  from public, anon, authenticated, service_role;

-- Post branch is the Pack 3 body. story_item bumps stories.like_count
-- only. Anything else, including comment, still raises.
create or replace function public.refresh_like_engagement()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  author uuid;
  gamification boolean;
  target public.like_target;
  target_row uuid;
  actor uuid;
begin
  if tg_op = 'INSERT' then
    target := new.target_type;
    target_row := new.target_id;
    actor := new.user_id;
  else
    target := old.target_type;
    target_row := old.target_id;
    actor := old.user_id;
  end if;

  if target = 'story_item' then
    perform set_config('app.refreshing_story_like_count', 'on', true);

    if tg_op = 'INSERT' then
      update public.stories
      set like_count = like_count + 1
      where id = target_row;

      if not found then
        raise exception 'like target story does not exist';
      end if;

      return new;
    end if;

    update public.stories
    set like_count = greatest(like_count - 1, 0)
    where id = target_row;

    return old;
  end if;

  if target <> 'post' then
    raise exception 'comment likes are not in this slice';
  end if;

  perform set_config('app.refreshing_post_like_count', 'on', true);

  if tg_op = 'INSERT' then
    update public.posts
    set like_count = like_count + 1
    where id = target_row;

    if not found then
      raise exception 'like target post does not exist';
    end if;
  else
    update public.posts
    set like_count = greatest(like_count - 1, 0)
    where id = target_row;
  end if;

  select p.author_id into author
  from public.posts p
  where p.id = target_row;

  if tg_op = 'INSERT' then
    if author is not null and author <> actor then
      select coalesce(
        (select s.gamification_enabled from public.app_settings s where s.id),
        true
      )
        into gamification;

      if gamification then
        insert into public.point_events (
          user_id,
          delta,
          reason,
          source_type,
          source_id,
          actor_id
        ) values (
          author,
          1,
          'post_liked',
          'post',
          target_row,
          actor
        )
        on conflict (user_id, reason, source_type, source_id, actor_id)
        do nothing;
      end if;
    end if;

    return new;
  end if;

  delete from public.point_events
  where reason = 'post_liked'
    and source_type = 'post'
    and source_id = target_row
    and actor_id = actor
    and (author is null or user_id = author);

  return old;
end;
$$;

revoke execute on function public.refresh_like_engagement()
  from public, anon, authenticated, service_role;

-- Second permissive INSERT policy. Post inserts stay on likes_insert_self.
drop policy if exists likes_insert_story_item on public.likes;
create policy likes_insert_story_item on public.likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_active_profile((select auth.uid()))
    and target_type = 'story_item'
    and exists (
      select 1
      from public.stories s
      where s.id = likes.target_id
        and s.status = 'active'
        and s.expires_at > now()
    )
  );

do $$
declare
  v_like_target text[];
  v_bad_pol text;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stories'
      and column_name = 'like_count'
  ) then
    raise exception 'stories.like_count missing after add';
  end if;

  select array_agg(e.enumlabel::text order by e.enumsortorder) into v_like_target
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'like_target';

  if v_like_target is distinct from array['post','comment','story_item']::text[] then
    raise exception 'like_target enum mutated: %', v_like_target;
  end if;

  if not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'likes'
      and pol.polname = 'likes_insert_story_item'
      and pol.polcmd = 'a'
  ) then
    raise exception 'likes_insert_story_item missing after create';
  end if;

  if exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'likes'
      and pol.polcmd = 'w'
  ) then
    raise exception 'likes must have no UPDATE policy';
  end if;

  select string_agg(pol.polname, ', ' order by pol.polname) into v_bad_pol
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'likes'
    and pol.polname = 'likes_insert_story_item'
    and (
      coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
      or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
    );
  if v_bad_pol is not null then
    raise exception 'story like policy must not call is_gc_staff: %', v_bad_pol;
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'refresh_like_engagement'
      and p.prosrc like '%story_item%'
      and p.prosrc like '%comment likes are not in this slice%'
  ) then
    raise exception 'refresh_like_engagement missing story_item branch';
  end if;
end
$$;
