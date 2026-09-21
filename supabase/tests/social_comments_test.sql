-- social_comments_test.sql
-- Comments v1 Mapping C: comments.author_id → optional profiles.
-- Insert requires an active profile and a visible post. Soft-delete
-- and hard-delete decrement posts.comment_count. Catalog membership
-- revoke must not delete a comment, profile, or post. Dashboard
-- org_status stays unchanged. Social policies must not privilege-bridge
-- via is_gc_staff. Comment likes stay out of this slice.

begin;
select plan(29);

select set_config('t.org',      gen_random_uuid()::text, false);
select set_config('t.owner',    gen_random_uuid()::text, false);
select set_config('t.author',   gen_random_uuid()::text, false);
select set_config('t.commenter', gen_random_uuid()::text, false);
select set_config('t.noprof',   gen_random_uuid()::text, false);

insert into auth.users (id) values
  (current_setting('t.owner')::uuid),
  (current_setting('t.author')::uuid),
  (current_setting('t.commenter')::uuid),
  (current_setting('t.noprof')::uuid);

-- ---- schema presence -------------------------------------------------------
select ok(to_regclass('public.comments') is not null, 'comments table exists');
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comments'
      and column_name = 'org_id'
  ),
  'comments has no org_id');
select is(
  (select array_agg(e.enumlabel::text order by e.enumsortorder)
     from pg_enum e
     join pg_type t on t.oid = e.enumtypid
     join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'like_target'),
  array['post','comment']::text[],
  'like_target labels stay post|comment');
select is(
  (select array_agg(e.enumlabel::text order by e.enumsortorder)
     from pg_enum e
     join pg_type t on t.oid = e.enumtypid
     join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'org_status'),
  array['registered','awaiting_payment','active','payment_lapsed','closed']::text[],
  'org_status enum values unchanged');
select ok(
  has_table_privilege('authenticated', 'public.comments', 'SELECT')
    and has_table_privilege('authenticated', 'public.comments', 'INSERT')
    and has_table_privilege('authenticated', 'public.comments', 'UPDATE')
    and has_table_privilege('authenticated', 'public.comments', 'DELETE'),
  'authenticated has select/insert/update/delete on comments');
select ok(
  not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'comments'
      and (
        coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') ilike '%is_gc_staff%'
        or coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') ilike '%is_gc_staff%'
      )
  ),
  'comments policies do not call is_gc_staff');
select ok(
  not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'protect_post_privileged_columns',
        'refresh_comment_engagement'
      )
      and (
        p.prosrc like '%set_config(''24frame.%'
        or p.prosrc like '%current_setting(''24frame.%'
      )
  ),
  'comment functions use app.* GUCs, not 24frame.*');

-- ---- insert requires active profile + existing post ------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.noprof'), 'role', 'authenticated')::text,
  true);

select throws_ok(
  format($sql$
    insert into public.comments (post_id, author_id, body)
    values (%L, %L, 'hello')
  $sql$, gen_random_uuid(), current_setting('t.noprof')),
  '42501',
  null,
  'user without a profile cannot insert a comment');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.author'), 'role', 'authenticated')::text,
  true);

select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'authorone', 'Author One', (current_date - interval '22 years')::date)
  $sql$, current_setting('t.author')),
  'creating a profile does not require an org');
select lives_ok(
  format($sql$
    insert into public.posts (author_id, body)
    values (%L, 'comment target')
  $sql$, current_setting('t.author')),
  'active profile can insert a feed post');

select set_config('t.post',
  (select id::text from public.posts where body = 'comment target' limit 1), true);

select throws_ok(
  format($sql$
    insert into public.comments (post_id, author_id, body)
    values (%L, %L, 'ghost')
  $sql$, gen_random_uuid(), current_setting('t.author')),
  '42501',
  null,
  'comment insert requires an existing post');

select lives_ok(
  format($sql$
    insert into public.comments (post_id, author_id, body)
    values (%L, %L, 'own note')
  $sql$, current_setting('t.post'), current_setting('t.author')),
  'author can comment on own visible post');
select is(
  (select comment_count from public.posts
    where id = current_setting('t.post')::uuid)::int,
  1,
  'insert increments comment_count');

select set_config('t.own_comment',
  (select id::text from public.comments where body = 'own note' limit 1), true);

-- ---- other-user comment + reader select ------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.commenter'), 'role', 'authenticated')::text,
  true);

select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'commenterone', 'Commenter One', (current_date - interval '24 years')::date)
  $sql$, current_setting('t.commenter')),
  'commenter profile does not require an org');
select lives_ok(
  format($sql$
    insert into public.comments (post_id, author_id, body)
    values (%L, %L, 'other note')
  $sql$, current_setting('t.post'), current_setting('t.commenter')),
  'other user with an active profile can comment on a visible post');
select is(
  (select comment_count from public.posts
    where id = current_setting('t.post')::uuid)::int,
  2,
  'other-user comment increments comment_count');
select is(
  (select count(*) from public.comments
    where post_id = current_setting('t.post')::uuid)::int,
  2,
  'readers can select comments on a visible post');

select set_config('t.other_comment',
  (select id::text from public.comments where body = 'other note' limit 1), true);

-- ---- cannot edit body; cannot delete someone else's row --------------------
select throws_ok(
  format($sql$
    update public.comments
       set body = 'edited'
     where id = %L
  $sql$, current_setting('t.other_comment')),
  'P0001',
  'comment fields are not client-writable',
  'author cannot edit comment body');

select throws_ok(
  format($sql$
    delete from public.comments
     where id = %L
  $sql$, current_setting('t.own_comment')),
  '42501',
  null,
  'commenter cannot delete someone else''s comment');

-- ---- soft-delete own comment decrements count and hides the row ------------
select lives_ok(
  format($sql$
    update public.comments
       set deleted_at = now()
     where id = %L
  $sql$, current_setting('t.other_comment')),
  'commenter can soft-delete own comment');
select is(
  (select comment_count from public.posts
    where id = current_setting('t.post')::uuid)::int,
  1,
  'soft-delete decrements comment_count');
select is(
  (select count(*) from public.comments
    where post_id = current_setting('t.post')::uuid)::int,
  1,
  'soft-deleted comments are not selectable');

-- ---- hard-delete own remaining comment -------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.author'), 'role', 'authenticated')::text,
  true);

select lives_ok(
  format($sql$
    delete from public.comments
     where id = %L
  $sql$, current_setting('t.own_comment')),
  'author can hard-delete own comment');
select is(
  (select comment_count from public.posts
    where id = current_setting('t.post')::uuid)::int,
  0,
  'hard-delete decrements comment_count');

-- ---- privileged comment_count stays protected ------------------------------
select throws_ok(
  format($sql$
    update public.posts
       set comment_count = 99
     where id = %L
  $sql$, current_setting('t.post')),
  'P0001',
  'privileged post columns are not client-writable',
  'clients cannot write posts.comment_count');

-- ---- membership revoke does not cascade social rows ------------------------
reset role;
insert into public.organizations (id, name, status) values
  (current_setting('t.org')::uuid, 'Comment Org', 'active');
insert into public.memberships (org_id, user_id, role, status) values
  (current_setting('t.org')::uuid, current_setting('t.owner')::uuid,  'account_owner', 'active'),
  (current_setting('t.org')::uuid, current_setting('t.author')::uuid, 'viewer',        'active');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.author'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.comments (post_id, author_id, body)
    values (%L, %L, 'keep me')
  $sql$, current_setting('t.post'), current_setting('t.author')),
  'catalog member with a profile can comment');

reset role;
update public.memberships
   set status = 'removed'
 where org_id = current_setting('t.org')::uuid
   and user_id = current_setting('t.author')::uuid;

select is(
  (select count(*) from public.profiles
    where id = current_setting('t.author')::uuid)::int,
  1,
  'revoking membership does not delete the profile');
select is(
  (select count(*) from public.posts
    where id = current_setting('t.post')::uuid)::int,
  1,
  'revoking membership does not delete the post');
select is(
  (select count(*) from public.comments
    where author_id = current_setting('t.author')::uuid)::int,
  1,
  'revoking membership does not delete the comment');

select * from finish();
rollback;
