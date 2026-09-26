-- social_post_author_edit_test.sql
-- Author may edit caption on a new or old post and soft-delete
-- (status = removed). Non-authors, including create_group staff, cannot.
-- Removed posts leave feed select, comments, and the public like list.
-- The row stays. Pack 2 grants authenticated SELECT, INSERT, UPDATE
-- on posts and does not grant DELETE. There is no DELETE policy.
-- A hard DELETE is permission denied, not an RLS no-op under a
-- speculative grant. Stories are not in this file.

begin;
select plan(43);

select set_config('t.author', gen_random_uuid()::text, false);
select set_config('t.other', gen_random_uuid()::text, false);
select set_config('t.reader', gen_random_uuid()::text, false);
select set_config('t.admin', gen_random_uuid()::text, false);
-- Version-4 object id. posts_media_author_bound requires
-- posts/{author}/{uuid}.ext; a bare posts/a.jpg key fails the CHECK.
select set_config('t.object', '22222222-2222-4222-8222-222222222222', false);
select set_config('t.foreign', '33333333-3333-4333-8333-333333333333', false);

insert into auth.users (id) values
  (current_setting('t.author')::uuid),
  (current_setting('t.other')::uuid),
  (current_setting('t.reader')::uuid),
  (current_setting('t.admin')::uuid);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'protect_post_author_mutation'
  ),
  'protect_post_author_mutation exists');
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
      and cmd = 'DELETE'
  ),
  'posts has no DELETE policy');
select ok(
  not has_table_privilege('authenticated', 'public.posts', 'DELETE'),
  'authenticated has no DELETE privilege on posts');
select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'protect_post_author_mutation'
      and p.prosrc ilike '%is_gc_staff%'
  ),
  'author mutation does not call is_gc_staff');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.author'), 'role', 'authenticated')::text,
  true);

select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'postauthor', 'Post Author', (current_date - interval '30 years')::date)
  $sql$, current_setting('t.author')),
  'author profile insert');
select lives_ok(
  format($sql$
    insert into public.posts (author_id, body, media)
    values (
      %L,
      'original caption',
      jsonb_build_array(
        jsonb_build_object(
          'kind', 'image',
          'key', 'posts/' || %L || '/' || %L || '.jpg'
        )
      )
    )
  $sql$, current_setting('t.author'), current_setting('t.author'), current_setting('t.object')),
  'author can insert a post');

select set_config('t.post',
  (select id::text from public.posts where body = 'original caption' limit 1), true);

reset role;
set local role service_role;
select set_config('request.jwt.claims',
  json_build_object('role', 'service_role')::text, true);
update public.posts
   set created_at = now() - interval '400 days'
 where id = current_setting('t.post')::uuid;
select set_config('t.created',
  (select created_at::text from public.posts where id = current_setting('t.post')::uuid),
  true);

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.author'), 'role', 'authenticated')::text,
  true);

select lives_ok(
  format($sql$
    update public.posts
       set body = 'revised caption'
     where id = %L
  $sql$, current_setting('t.post')),
  'author can edit caption on an old post');
select is(
  (select body from public.posts where id = current_setting('t.post')::uuid),
  'revised caption',
  'caption text is stored');
select ok(
  (select edited_at is not null from public.posts where id = current_setting('t.post')::uuid),
  'caption edit stamps edited_at');
select ok(
  (select created_at = current_setting('t.created')::timestamptz
     from public.posts where id = current_setting('t.post')::uuid),
  'caption edit has no age window');
select throws_ok(
  format($sql$
    update public.posts
       set media = '[]'::jsonb
     where id = %L
  $sql$, current_setting('t.post')),
  'P0001',
  'post fields are not client-writable',
  'author cannot replace media');
select throws_ok(
  format($sql$
    update public.posts
       set media = jsonb_build_array(
         jsonb_build_object(
           'kind', 'image',
           'key', 'posts/' || %L || '/' || %L || '.jpg'
         )
       )
     where id = %L
  $sql$, current_setting('t.admin'), current_setting('t.foreign'), current_setting('t.post')),
  '23514',
  null,
  'foreign media key still fails posts_media_author_bound');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.other'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'postother', 'Post Other', (current_date - interval '28 years')::date)
  $sql$, current_setting('t.other')),
  'other profile insert');
select lives_ok(
  format($sql$
    update public.posts
       set body = 'stolen caption'
     where id = %L
  $sql$, current_setting('t.post')),
  'non-author update does not raise');
select is(
  (select body from public.posts where id = current_setting('t.post')::uuid),
  'revised caption',
  'non-author cannot change the caption');

select lives_ok(
  format($sql$
    insert into public.comments (post_id, author_id, body)
    values (%L, %L, 'a comment')
  $sql$, current_setting('t.post'), current_setting('t.other')),
  'other user can comment on the visible post');
select lives_ok(
  format($sql$
    insert into public.likes (user_id, target_type, target_id)
    values (%L, 'post', %L)
  $sql$, current_setting('t.other'), current_setting('t.post')),
  'other user can like the visible post');
select is(
  (select like_count from public.posts where id = current_setting('t.post')::uuid),
  1,
  'like refresh writes like_count');
select is(
  (select comment_count from public.posts where id = current_setting('t.post')::uuid),
  1,
  'comment refresh writes comment_count');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.reader'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'postreader', 'Post Reader', (current_date - interval '26 years')::date)
  $sql$, current_setting('t.reader')),
  'reader profile insert');
select is(
  (select count(*)::int from public.comments
    where post_id = current_setting('t.post')::uuid),
  1,
  'reader sees the comment while the post is active');
select is(
  (select count(*)::int from public.likes
    where target_type = 'post'
      and target_id = current_setting('t.post')::uuid),
  1,
  'reader sees the like while the post is active');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.admin'), 'role', 'authenticated')::text,
  true);
select lives_ok(
  format($sql$
    insert into public.profiles (id, handle, display_name, birth_date)
    values (%L, 'postadmin', 'Post Admin', (current_date - interval '32 years')::date)
  $sql$, current_setting('t.admin')),
  'admin profile insert');

reset role;
set local role service_role;
select set_config('request.jwt.claims',
  json_build_object('role', 'service_role')::text, true);
update public.profiles
   set app_role = 'admin'
 where id = current_setting('t.admin')::uuid;

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.admin'), 'role', 'authenticated')::text,
  true);

select ok(
  public.has_capability(current_setting('t.admin')::uuid, 'create_group'),
  'admin has create_group');
select throws_ok(
  format($sql$
    update public.posts
       set body = 'staff caption'
     where id = %L
  $sql$, current_setting('t.post')),
  'P0001',
  'only the author may edit or remove a post',
  'create_group staff cannot edit another caption');
select throws_ok(
  format($sql$
    update public.posts
       set status = 'removed'
     where id = %L
  $sql$, current_setting('t.post')),
  'P0001',
  'only the author may edit or remove a post',
  'create_group staff cannot soft-delete another post');
select throws_ok(
  format($sql$
    update public.posts
       set author_id = %L,
           body = 'stolen via media',
           status = 'hidden',
           pinned = true,
           media = jsonb_build_array(
             jsonb_build_object(
               'kind', 'image',
               'key', 'posts/' || %L || '/' || %L || '.jpg'
             )
           )
     where id = %L
  $sql$,
    current_setting('t.admin'),
    current_setting('t.admin'),
    current_setting('t.foreign'),
    current_setting('t.post')),
  'P0001',
  'post fields are not client-writable',
  'create_group cannot retarget author_id through an unowned media key');
select is(
  (select concat_ws(
      '|',
      body,
      author_id::text,
      status::text,
      pinned::text,
      media->0->>'key'
    )
   from public.posts where id = current_setting('t.post')::uuid),
  'revised caption|'
    || current_setting('t.author') || '|active|false|posts/'
    || current_setting('t.author') || '/'
    || current_setting('t.object') || '.jpg',
  'unowned media path does not retarget or rewrite the post');
select throws_ok(
  format($sql$
    update public.posts
       set body = 'stolen caption via media',
           media = jsonb_build_array(
             jsonb_build_object(
               'kind', 'image',
               'key', 'posts/' || %L || '/' || %L || '.jpg'
             )
           )
     where id = %L
  $sql$,
    current_setting('t.admin'),
    current_setting('t.foreign'),
    current_setting('t.post')),
  'P0001',
  'only the author may edit or remove a post',
  'unowned media does not skip the caption lock');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.author'), 'role', 'authenticated')::text,
  true);

select set_config('app.refreshing_post_like_count', '', true);
select set_config('app.refreshing_post_comment_count', '', true);
select throws_ok(
  format($sql$
    update public.posts
       set like_count = like_count + 5
     where id = %L
  $sql$, current_setting('t.post')),
  'P0001',
  'privileged post columns are not client-writable',
  'bare like_count bump without the refresh GUC fails');
select throws_ok(
  format($sql$
    update public.posts
       set comment_count = comment_count + 5
     where id = %L
  $sql$, current_setting('t.post')),
  'P0001',
  'privileged post columns are not client-writable',
  'bare comment_count bump without the refresh GUC fails');
select set_config('app.refreshing_post_like_count', 'on', true);
select lives_ok(
  format($sql$
    update public.posts
       set like_count = like_count + 1
     where id = %L
  $sql$, current_setting('t.post')),
  'like-count refresh GUC can write like_count');
select is(
  (select like_count from public.posts where id = current_setting('t.post')::uuid),
  2,
  'like_count moved under the refresh GUC');
select throws_ok(
  format($sql$
    update public.posts
       set pinned = true
     where id = %L
  $sql$, current_setting('t.post')),
  'P0001',
  'post fields are not client-writable',
  'refresh GUC does not unlock a later posts update');
select set_config('app.refreshing_post_comment_count', 'on', true);
select lives_ok(
  format($sql$
    update public.posts
       set comment_count = comment_count + 1
     where id = %L
  $sql$, current_setting('t.post')),
  'comment-count refresh GUC can write comment_count');
select is(
  (select comment_count from public.posts where id = current_setting('t.post')::uuid),
  2,
  'comment_count moved under the refresh GUC');
select set_config('app.refreshing_post_like_count', '', true);
select set_config('app.refreshing_post_comment_count', '', true);

select throws_ok(
  format($sql$
    delete from public.posts where id = %L
  $sql$, current_setting('t.post')),
  '42501',
  'permission denied for table posts',
  'author hard-delete is denied without a DELETE privilege');
select is(
  (select count(*)::int from public.posts where id = current_setting('t.post')::uuid),
  1,
  'author hard-delete removes nothing');
select lives_ok(
  format($sql$
    update public.posts
       set status = 'removed'
     where id = %L
  $sql$, current_setting('t.post')),
  'author can soft-delete');

select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('t.reader'), 'role', 'authenticated')::text,
  true);
select is(
  (select count(*)::int from public.posts where id = current_setting('t.post')::uuid),
  0,
  'removed post leaves the feed');
select is(
  (select count(*)::int from public.comments
    where post_id = current_setting('t.post')::uuid),
  0,
  'removed post hides comments');
select is(
  (select count(*)::int from public.likes
    where target_type = 'post'
      and target_id = current_setting('t.post')::uuid),
  0,
  'removed post hides the public like list');

reset role;
set local role service_role;
select set_config('request.jwt.claims',
  json_build_object('role', 'service_role')::text, true);
select is(
  (select status::text from public.posts where id = current_setting('t.post')::uuid),
  'removed',
  'soft-delete keeps the row as removed');

select * from finish();
rollback;
