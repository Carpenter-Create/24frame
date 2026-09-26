-- ============================================================================
-- 20260926120000_social_post_author_edit.sql
--
-- INTENT: Own-post caption edit and soft-delete. Extends Pack 2 posts
-- (posts_update_author, post_status active|hidden|removed, edited_at).
-- Does not add a posts.deleted_at column. Does not add a DELETE policy.
-- Default grants may already include table DELETE for authenticated;
-- with no DELETE policy, RLS removes nothing. This file does not REVOKE.
--
-- Author (auth.uid() = author_id) may:
--   1. change body on an active post — trigger stamps edited_at.
--      No age window. Media, author, group, category, pins stay.
--      like_count, comment_count, and embedding stay with
--      protect_post_privileged_columns (including the refresh GUCs).
--   2. set status active → removed. Other columns stay. Row remains.
--      posts SELECT requires status = active (or create_group), and
--      the new row of an UPDATE is checked against that visibility.
--      Same shape as comments: hold status active through the client
--      UPDATE, then a security-definer AFTER trigger writes removed.
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
-- ROLLBACK: drop trigger posts_apply_author_soft_delete on public.posts;
-- drop trigger posts_protect_author_mutation on public.posts;
-- drop function public.apply_post_author_soft_delete();
-- drop function public.protect_post_author_mutation().
-- ============================================================================

create or replace function public.protect_post_author_mutation()
returns trigger
language plpgsql
set search_path to 'public', 'extensions'
as $$
begin
  if current_setting('app.applying_post_soft_delete', true) = 'on' then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  -- Counts and embedding belong to protect_post_privileged_columns,
  -- which already lets the like/comment refresh GUCs through.
  -- A count-only update must not be reclassified as an author edit.
  if (
       new.like_count is distinct from old.like_count
       or new.comment_count is distinct from old.comment_count
       or new.embedding is distinct from old.embedding
     )
     and new.id is not distinct from old.id
     and new.author_id is not distinct from old.author_id
     and new.group_id is not distinct from old.group_id
     and new.body is not distinct from old.body
     and new.media is not distinct from old.media
     and new.status is not distinct from old.status
     and new.edited_at is not distinct from old.edited_at
     and new.required_entitlement_key is not distinct from old.required_entitlement_key
     and new.pinned is not distinct from old.pinned
     and new.created_at is not distinct from old.created_at
     and new.category is not distinct from old.category
  then
    return new;
  end if;

  -- A foreign key must still fail posts_media_author_bound (23514).
  -- An owned replacement, including clearing media, is refused here.
  if new.media is distinct from old.media then
    if public.social_media_keys_owned(new.media, old.author_id, 'posts') then
      raise exception 'post fields are not client-writable';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.author_id is distinct from old.author_id
     or new.group_id is distinct from old.group_id
     or new.required_entitlement_key is distinct from old.required_entitlement_key
     or new.pinned is distinct from old.pinned
     or new.created_at is distinct from old.created_at
     or new.category is distinct from old.category
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
    -- Hold active so posts SELECT still sees the new row. The AFTER
    -- trigger writes removed.
    perform set_config('app.pending_post_soft_delete', new.id::text, true);
    new.status := old.status;
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

create or replace function public.apply_post_author_soft_delete()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if current_setting('app.applying_post_soft_delete', true) is distinct from 'on'
     and current_setting('app.pending_post_soft_delete', true) = new.id::text
  then
    perform set_config('app.applying_post_soft_delete', 'on', true);
    update public.posts
       set status = 'removed'
     where id = new.id
       and status = 'active';
    perform set_config('app.applying_post_soft_delete', '', true);
    perform set_config('app.pending_post_soft_delete', '', true);
  end if;
  return new;
end;
$$;

drop trigger if exists posts_protect_author_mutation on public.posts;
create trigger posts_protect_author_mutation
  before update on public.posts
  for each row execute function public.protect_post_author_mutation();

drop trigger if exists posts_apply_author_soft_delete on public.posts;
create trigger posts_apply_author_soft_delete
  after update on public.posts
  for each row execute function public.apply_post_author_soft_delete();

revoke execute on function public.protect_post_author_mutation()
  from public, anon, authenticated, service_role;
revoke execute on function public.apply_post_author_soft_delete()
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

  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'posts'
      and t.tgname = 'posts_apply_author_soft_delete'
      and not t.tgisinternal
  ) then
    raise exception 'posts_apply_author_soft_delete missing after create';
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

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and cmd = 'DELETE'
  ) then
    raise exception 'posts must not gain a DELETE policy';
  end if;
end
$$;
