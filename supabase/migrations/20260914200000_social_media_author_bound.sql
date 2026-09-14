-- ============================================================================
-- 20260914200000_social_media_author_bound.sql
--
-- INTENT: Remediation class 3. Data Access — media object keys on
-- posts.media / stories.media must be author-bound in the database.
-- A row cannot claim or persist another author's 24frame-media key.
--
-- ACCESS PATH: jsonb keys are {posts|stories}/{author_id}/{object}.{ext}.
-- CHECK posts_media_author_bound / stories_media_author_bound call
-- social_media_keys_owned. App write/read paths still filter; the CHECK
-- is the hard boundary for PostgREST and service_role alike.
--
-- NO ORG_ID ON SOCIAL: posts / stories stay Mapping C person-scoped.
-- profiles.id is the author. Do not add org_id or is_gc_staff.
--
-- MAPPING C (locked, unchanged):
--   gc_staff              stays operator
--   organizations /
--   memberships           stay distribution/catalog
--   profiles              is the optional 24Frame audience/person row
--   posts / stories       author_id FK to profiles.id
--   media keys            lane/author/object — author is profiles.id
--
-- ALTER: add social_media_keys_owned + CHECKs on posts.media and
--        stories.media.
--
-- OMIT: my_* RPCs, Social Home honesty/keyset, DM fan-out, Education,
--   avatar/chrome, Apex vanity, handle UX, finance, Redis/partition.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE FUNCTION, GRANT/REVOKE EXECUTE, ADD CONSTRAINT. Forward-only.
-- CoS applies after merge + founder yes. Prod SQL apply needed after merge.
-- ROLLBACK: drop the two CHECKs and the function.
-- ============================================================================

create or replace function public.social_media_keys_owned(
  p_media jsonb,
  p_author uuid,
  p_lane text
)
returns boolean
language sql
immutable
parallel safe
set search_path to 'public'
as $$
  select
    p_author is not null
    and p_lane in ('posts', 'stories')
    and (
      p_media is null
      or p_media = 'null'::jsonb
      or (
        jsonb_typeof(p_media) = 'array'
        and jsonb_array_length(p_media)
          <= case p_lane when 'stories' then 1 else 4 end
        and not exists (
          select 1
          from jsonb_array_elements(p_media) as elem
          where
            jsonb_typeof(elem) is distinct from 'object'
            or coalesce(elem->>'key', '') !~* (
              '^'
              || p_lane
              || '/'
              || p_author::text
              || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif|mp4|mov|webm)$'
            )
        )
      )
    );
$$;

comment on function public.social_media_keys_owned(jsonb, uuid, text) is
  'True when every posts/stories.media key is lane/author/object for p_author.';

revoke execute on function public.social_media_keys_owned(jsonb, uuid, text)
  from public, anon;
grant execute on function public.social_media_keys_owned(jsonb, uuid, text)
  to authenticated, service_role;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'posts_media_author_bound'
      and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_media_author_bound
      check (public.social_media_keys_owned(media, author_id, 'posts'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'stories_media_author_bound'
      and conrelid = 'public.stories'::regclass
  ) then
    alter table public.stories
      add constraint stories_media_author_bound
      check (public.social_media_keys_owned(media, author_id, 'stories'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_author uuid := '11111111-1111-4111-8111-111111111111';
  v_other  uuid := '33333333-3333-4333-8333-333333333333';
  v_object uuid := '22222222-2222-4222-8222-222222222222';
  v_owned  jsonb;
  v_foreign jsonb;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name in ('posts', 'stories')
      and column_name = 'org_id'
  ) then
    raise exception 'posts/stories must not have org_id (mapping C)';
  end if;

  if to_regprocedure('public.social_media_keys_owned(jsonb, uuid, text)') is null then
    raise exception 'social_media_keys_owned missing';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'posts_media_author_bound'
      and conrelid = 'public.posts'::regclass
  ) then
    raise exception 'posts_media_author_bound missing';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'stories_media_author_bound'
      and conrelid = 'public.stories'::regclass
  ) then
    raise exception 'stories_media_author_bound missing';
  end if;

  v_owned := jsonb_build_array(
    jsonb_build_object(
      'kind', 'image',
      'key', 'posts/' || v_author::text || '/' || v_object::text || '.jpg',
      'contentType', 'image/jpeg'
    )
  );
  v_foreign := jsonb_build_array(
    jsonb_build_object(
      'kind', 'image',
      'key', 'posts/' || v_other::text || '/' || v_object::text || '.jpg',
      'contentType', 'image/jpeg'
    )
  );

  if not public.social_media_keys_owned(v_owned, v_author, 'posts') then
    raise exception 'owned posts media key must pass';
  end if;
  if public.social_media_keys_owned(v_foreign, v_author, 'posts') then
    raise exception 'foreign posts media key must fail';
  end if;
  if not public.social_media_keys_owned('[]'::jsonb, v_author, 'posts') then
    raise exception 'empty media must pass';
  end if;

  raise notice 'class 3: media keys author-bound; no org_id';
end $$;
