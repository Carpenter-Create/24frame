-- ============================================================================
-- 20260921010000_social_comments.sql
--
-- INTENT: Comments v1 SoT. posts.comment_count already exists and is
-- privileged. like_target already includes 'comment' — this slice does
-- not build comment likes. Mapping C unchanged from likes:
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   comments.author_id    FK to profiles.id
--   no org_id             on comments
--   a user without an     active profile cannot comment
--   org membership is     not required to comment on a visible post
--   do not wire           is_gc_staff into these social policies as a
--                         privilege bridge
--
-- CREATE: comments table + indexes; refresh_comment_engagement trigger
-- (insert +1, hard delete −1, soft-delete deleted_at null→set −1);
-- REPLACE protect_post_privileged_columns so
-- app.refreshing_post_comment_count bypasses comment_count / like_count
-- / embedding the same way app.refreshing_post_like_count already does.
-- RLS fail-closed, authenticated only.
--
-- OMIT: comment likes UI, nested replies, edit, @mentions, notifications.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE TABLE, CREATE FUNCTION, CREATE TRIGGER, ENABLE RLS, GRANT,
-- CREATE POLICY, REPLACE protect_post_privileged_columns. No DROP of
-- existing dashboard objects. Forward-only.
-- ROLLBACK: drop public.comments, public.refresh_comment_engagement,
-- public.protect_comment_columns; restore protect_post_privileged_columns
-- from 20260912180000_likes.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Mapping C: no org_id. author_id FK is person/social, not catalog.
-- posts are not deleted (status change only) — no ON DELETE CASCADE
-- from posts. ON DELETE CASCADE on author_id is donor personal-content
-- cleanup (auth.users → profiles → comments), not org-owned catalog.

alter table public.comments
  add constraint comments_body_len
  check (char_length(body) >= 1 and char_length(body) <= 500);

create index if not exists comments_post_created_idx
  on public.comments (post_id, created_at, id)
  where deleted_at is null;

create index if not exists comments_author_created_idx
  on public.comments (author_id, created_at desc, id)
  where deleted_at is null;

-- ----------------------------------------------------------------------------
-- 2. Functions + trigger
--    Session-flag bypass so the engagement loop can write
--    posts.comment_count. Do not call is_gc_staff.
-- ----------------------------------------------------------------------------

create or replace function public.protect_post_privileged_columns()
returns trigger
language plpgsql
-- extensions must stay on the path: embedding is vector(1536) and
-- `IS DISTINCT FROM` needs extensions.= . public-only search_path 42883s.
set search_path to 'public', 'extensions'
as $$
begin
  if current_setting('app.refreshing_post_like_count', true) = 'on'
     or current_setting('app.refreshing_post_comment_count', true) = 'on' then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.like_count <> 0
       or new.comment_count <> 0
       or new.embedding is not null then
      raise exception 'privileged post columns are not client-writable';
    end if;
    return new;
  end if;

  if new.like_count is distinct from old.like_count
     or new.comment_count is distinct from old.comment_count
     or new.embedding is distinct from old.embedding then
    raise exception 'privileged post columns are not client-writable';
  end if;

  return new;
end;
$$;

create or replace function public.protect_comment_columns()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if tg_op = 'UPDATE' then
    if new.post_id is distinct from old.post_id
       or new.author_id is distinct from old.author_id
       or new.body is distinct from old.body
       or new.created_at is distinct from old.created_at then
      raise exception 'comment fields are not client-writable';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.refresh_comment_engagement()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  target uuid;
  delta integer := 0;
begin
  perform set_config('app.refreshing_post_comment_count', 'on', true);

  if tg_op = 'INSERT' then
    if new.deleted_at is null then
      target := new.post_id;
      delta := 1;
    end if;
  elsif tg_op = 'DELETE' then
    if old.deleted_at is null then
      target := old.post_id;
      delta := -1;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.deleted_at is null and new.deleted_at is not null then
      target := new.post_id;
      delta := -1;
    elsif old.deleted_at is not null and new.deleted_at is null then
      target := new.post_id;
      delta := 1;
    end if;
  end if;

  if delta = 0 or target is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if delta > 0 then
    update public.posts
    set comment_count = comment_count + delta
    where id = target;

    if not found then
      raise exception 'comment target post does not exist';
    end if;
  else
    update public.posts
    set comment_count = greatest(comment_count + delta, 0)
    where id = target;
  end if;

  perform set_config('app.refreshing_post_comment_count', '', true);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists comments_protect_columns on public.comments;
create trigger comments_protect_columns
  before update on public.comments
  for each row execute function public.protect_comment_columns();

drop trigger if exists comments_refresh_engagement on public.comments;
create trigger comments_refresh_engagement
  after insert or update or delete on public.comments
  for each row execute function public.refresh_comment_engagement();

revoke execute on function public.protect_post_privileged_columns()
  from public, anon, authenticated, service_role;
revoke execute on function public.protect_comment_columns()
  from public, anon, authenticated, service_role;
revoke execute on function public.refresh_comment_engagement()
  from public, anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. RLS
--    Authenticated only, fail-closed. Soft-delete via UPDATE deleted_at.
--    Do not mention is_gc_staff. anon gets no table grants.
-- ----------------------------------------------------------------------------
alter table public.comments enable row level security;

-- Authors keep SELECT on their own soft-deleted rows so UPDATE
-- deleted_at can succeed (Postgres WITH CHECK + SELECT). Readers
-- and loaders still hide deleted_at IS NOT NULL.
drop policy if exists comments_select_visible on public.comments;
create policy comments_select_visible on public.comments
  for select to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = comments.post_id
    )
    and (
      deleted_at is null
      or author_id = (select auth.uid())
    )
  );

drop policy if exists comments_insert_author on public.comments;
create policy comments_insert_author on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_active_profile((select auth.uid()))
    and deleted_at is null
    and exists (
      select 1
      from public.posts p
      where p.id = comments.post_id
    )
  );

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (
    author_id = (select auth.uid())
    and deleted_at is not null
  );

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete to authenticated
  using (author_id = (select auth.uid()));

revoke all on public.comments from public, anon;
revoke truncate on public.comments from authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, update, delete on public.comments to service_role;

-- ----------------------------------------------------------------------------
-- 4. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_missing text;
  v_org_status text[];
  v_like_target text[];
  v_bad_pol text;
  v_guc text;
begin
  if to_regclass('public.comments') is null then
    raise exception 'comments table missing after create';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comments'
      and column_name = 'org_id'
  ) then
    raise exception 'comments must not have org_id (mapping C)';
  end if;

  select array_agg(e.enumlabel::text order by e.enumsortorder) into v_like_target
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'like_target';

  if v_like_target is distinct from array['post','comment']::text[] then
    raise exception 'like_target enum mutated: %', v_like_target;
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

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'refresh_comment_engagement'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    raise exception 'refresh_comment_engagement missing';
  end if;

  select string_agg(pol.polname, ', ' order by pol.polname) into v_bad_pol
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'comments'
    and (
      coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
      or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
    );
  if v_bad_pol is not null then
    raise exception 'comments policies must not call is_gc_staff: %', v_bad_pol;
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_guc
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'protect_post_privileged_columns',
      'refresh_comment_engagement'
    )
    and (
      p.prosrc like '%set_config(''24frame.%'
      or p.prosrc like '%current_setting(''24frame.%'
    );
  if v_guc is not null then
    raise exception 'comment functions still use 24frame.* GUCs: %', v_guc;
  end if;

  if not has_table_privilege('authenticated', 'public.comments', 'SELECT')
     or not has_table_privilege('authenticated', 'public.comments', 'INSERT')
     or not has_table_privilege('authenticated', 'public.comments', 'UPDATE')
     or not has_table_privilege('authenticated', 'public.comments', 'DELETE') then
    raise exception 'comments not readable/writable by authenticated';
  end if;

  select string_agg(c.relname, ', ' order by c.relname) into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname = 'comments'
    and not has_table_privilege('authenticated', c.oid, 'SELECT');
  if v_missing is not null then
    raise exception 'comments not readable by authenticated: %', v_missing;
  end if;

  raise notice 'comments applied; mapping C FK to profiles; org_status unchanged';
end $$;
