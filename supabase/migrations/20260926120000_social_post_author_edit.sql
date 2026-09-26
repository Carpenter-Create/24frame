-- ============================================================================
-- 20260926120000_social_post_author_edit.sql
--
-- INTENT: Own-post caption edit and soft-delete. Extends Pack 2 posts
-- (posts_update_author, post_status active|hidden|removed, edited_at,
-- no client DELETE). Does not add a posts.deleted_at column.
--
-- Author (auth.uid() = author_id) may:
--   1. change body on an active post — trigger stamps edited_at.
--      No age window. Media, author, group, category, pins, counts stay.
--   2. set status active → removed. Other columns stay. Row remains.
--      posts SELECT already requires status = active (or create_group).
--      comments_select_visible and likes_select_visible_post EXISTS
--      posts, so comments and the public like list leave with the post.
--      likes_select_self is unchanged (a liker may still see their row).
--
-- Non-authors: posts_update_author USING already misses. create_group
-- staff (posts_update_staff) may set active → hidden only. They cannot
-- edit a caption or set removed. That is the author lock, not a new
-- moderation product.
--
-- OMIT: media replace/remove, Mux asset GC, stories, hard DELETE,
-- undelete, age window.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE FUNCTION, CREATE TRIGGER. No DROP of existing policies, grants,
-- or tables. Forward-only.
-- ROLLBACK: drop trigger posts_protect_author_mutation on public.posts;
-- drop function public.protect_post_author_mutation().
-- ============================================================================

create or replace function public.protect_post_author_mutation()
returns trigger
language plpgsql
set search_path to 'public', 'extensions'
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.author_id is distinct from old.author_id
     or new.group_id is distinct from old.group_id
     or new.media is distinct from old.media
     or new.required_entitlement_key is distinct from old.required_entitlement_key
     or new.pinned is distinct from old.pinned
     or new.created_at is distinct from old.created_at
     or new.category is distinct from old.category
     or new.like_count is distinct from old.like_count
     or new.comment_count is distinct from old.comment_count
     or new.embedding is distinct from old.embedding
  then
    raise exception 'post fields are not client-writable';
  end if;

  if auth.uid() is distinct from old.author_id then
    if old.status is distinct from 'active'::public.post_status
       or new.status is distinct from 'hidden'::public.post_status
       or new.body is distinct from old.body
       or new.edited_at is distinct from old.edited_at
    then
      raise exception 'only the author may edit or remove a post';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if old.status is distinct from 'active'::public.post_status
       or new.status is distinct from 'removed'::public.post_status
       or new.body is distinct from old.body
       or new.edited_at is distinct from old.edited_at
    then
      raise exception 'post removal changes status only';
    end if;
    return new;
  end if;

  if new.status is distinct from 'active'::public.post_status then
    raise exception 'only an active post caption may be edited';
  end if;

  if new.body is not distinct from old.body then
    raise exception 'post fields are not client-writable';
  end if;

  new.edited_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists posts_protect_author_mutation on public.posts;
create trigger posts_protect_author_mutation
  before update on public.posts
  for each row execute function public.protect_post_author_mutation();

revoke execute on function public.protect_post_author_mutation()
  from public, anon, authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'posts'
      and t.tgname = 'posts_protect_author_mutation'
      and not t.tgisinternal
  ) then
    raise exception 'posts_protect_author_mutation missing after create';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'protect_post_author_mutation'
      and (
        p.prosrc ilike '%is_gc_staff%'
        or p.prosrc like '%set_config(''24frame.%'
        or p.prosrc like '%current_setting(''24frame.%'
      )
  ) then
    raise exception 'protect_post_author_mutation must not call is_gc_staff or 24frame.*';
  end if;

  if has_table_privilege('authenticated', 'public.posts', 'DELETE') then
    raise exception 'authenticated must not gain DELETE on posts';
  end if;
end
$$;
