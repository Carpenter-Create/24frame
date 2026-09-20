-- ============================================================================
-- 20260920140100_social_follow_alerts.sql
--
-- INTENT: Social Follow end-to-end. Live follows rows are the count SoT
-- (profiles.follower_count is leftover denormalized storage — do not
-- increment it). Authenticated members can select active follow edges so
-- public Following / Followers counts are honest. On a successful follow
-- insert, notify_new_follower writes a recipient-targeted house
-- notification (kind new_follower), gated by the followee's in-app pref.
--
-- ACCESS PATH:
--   follows SELECT — active follower + followee (no is_gc_staff).
--   notify_new_follower — security definer; caller must already hold the
--     follow row. Prefs read bypass RLS (own-only table).
--   my_notifications / my_unread_count / mark_notifications_read —
--     catalog kinds stay member_can(org); new_follower is recipient only.
--   notifications.org_id nullable for social kinds only. Mapping C:
--     new_follower has no org_id.
--
-- OMIT: email send. service_role client from the app. deleting
--   profiles.follower_count. is_gc_staff on follows.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- DROP/CREATE POLICY, ALTER COLUMN NULL, ADD COLUMN, ADD CONSTRAINT,
-- CREATE OR REPLACE FUNCTION, GRANT/REVOKE. Forward-only.
-- CoS applies after merge + founder yes. Prod SQL apply needed after merge.
-- ROLLBACK: restore follows_select to follower/followee = auth.uid();
--   drop notify_new_follower; restore my_* / mark from
--   20260914310000 / 20260720000700; drop recipient_user_id and
--   notifications_kind_scope; set org_id NOT NULL after backfill.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Follows — public counts need live rows, not leftover follower_count
-- ----------------------------------------------------------------------------
drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows
  for select to authenticated
  using (
    public.is_active_profile(follower_id)
    and public.is_active_profile(followee_id)
  );

-- ----------------------------------------------------------------------------
-- 2. House notifications — recipient-targeted social kind
-- ----------------------------------------------------------------------------
alter table public.notifications
  alter column org_id drop not null;

alter table public.notifications
  add column if not exists recipient_user_id uuid references auth.users(id) on delete restrict;

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_user_id, created_at desc)
  where recipient_user_id is not null;

alter table public.notifications
  drop constraint if exists notifications_kind_scope;

alter table public.notifications
  add constraint notifications_kind_scope check (
    (
      kind in (
        'title_rejected'::public.notification_kind,
        'delivery_update'::public.notification_kind
      )
      and org_id is not null
      and recipient_user_id is null
    )
    or (
      kind = 'new_follower'::public.notification_kind
      and org_id is null
      and recipient_user_id is not null
    )
  );

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated
  using (
    (
      kind in (
        'title_rejected'::public.notification_kind,
        'delivery_update'::public.notification_kind
      )
      and org_id is not null
      and (
        public.is_gc_staff(auth.uid())
        or public.member_can(auth.uid(), org_id, 'view')
      )
    )
    or (
      kind = 'new_follower'::public.notification_kind
      and recipient_user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Inbox RPCs — catalog stays org-scoped; new_follower is recipient only
-- ----------------------------------------------------------------------------
create or replace function public.my_notifications(p_limit integer default 500)
  returns table (
    id uuid,
    org_id uuid,
    kind public.notification_kind,
    title text,
    body text,
    source_refs jsonb,
    created_at timestamptz,
    unread boolean
  )
  language sql
  stable
  security definer
  set search_path = public
as $$
  select n.id, n.org_id, n.kind, n.title, n.body, n.source_refs, n.created_at,
         not exists (
           select 1
           from public.notification_reads r
           where r.notification_id = n.id
             and r.user_id = auth.uid()
         ) as unread
  from public.notifications n
  where (
      n.kind in (
        'title_rejected'::public.notification_kind,
        'delivery_update'::public.notification_kind
      )
      and n.org_id is not null
      and public.member_can(auth.uid(), n.org_id, 'view')
    )
    or (
      n.kind = 'new_follower'::public.notification_kind
      and n.recipient_user_id = auth.uid()
    )
  order by n.created_at desc
  limit least(greatest(coalesce(p_limit, 0), 0), 501);
$$;

revoke execute on function public.my_notifications(integer) from public, anon;
grant execute on function public.my_notifications(integer) to authenticated;

create or replace function public.my_unread_count()
  returns int
  language sql
  stable
  security definer
  set search_path = public
as $$
  select count(*)::int
  from public.notifications n
  where (
      (
        n.kind in (
          'title_rejected'::public.notification_kind,
          'delivery_update'::public.notification_kind
        )
        and n.org_id is not null
        and public.member_can(auth.uid(), n.org_id, 'view')
      )
      or (
        n.kind = 'new_follower'::public.notification_kind
        and n.recipient_user_id = auth.uid()
      )
    )
    and not exists (
      select 1
      from public.notification_reads r
      where r.notification_id = n.id
        and r.user_id = auth.uid()
    );
$$;

revoke execute on function public.my_unread_count() from public, anon;
grant execute on function public.my_unread_count() to authenticated;

create or replace function public.mark_notifications_read(p_ids uuid[])
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.notification_reads (notification_id, user_id)
  select n.id, auth.uid()
  from public.notifications n
  where n.id = any (p_ids)
    and (
      (
        n.kind in (
          'title_rejected'::public.notification_kind,
          'delivery_update'::public.notification_kind
        )
        and n.org_id is not null
        and (
          public.is_gc_staff(auth.uid())
          or public.member_can(auth.uid(), n.org_id, 'view')
        )
      )
      or (
        n.kind = 'new_follower'::public.notification_kind
        and n.recipient_user_id = auth.uid()
      )
    )
  on conflict (notification_id, user_id) do nothing;
end;
$$;

revoke execute on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Notify followee after a real follow insert. Pref default = in-app on.
-- ----------------------------------------------------------------------------
create or replace function public.notify_new_follower(
  p_followee uuid,
  p_title text,
  p_body text,
  p_source_refs jsonb
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_id uuid;
  v_me uuid;
  v_in_app boolean;
begin
  v_me := auth.uid();
  if v_me is null then raise exception 'Not authenticated'; end if;
  if p_followee is null or p_followee = v_me then
    return null;
  end if;
  if coalesce(btrim(p_title), '') = '' or coalesce(btrim(p_body), '') = '' then
    return null;
  end if;
  if not exists (
    select 1
    from public.follows f
    where f.follower_id = v_me
      and f.followee_id = p_followee
  ) then
    return null;
  end if;
  if not public.is_active_profile(v_me)
     or not public.is_active_profile(p_followee) then
    return null;
  end if;

  select coalesce((prefs -> 'new_follower' ->> 'in_app')::boolean, true)
    into v_in_app
  from public.user_notification_preferences
  where user_id = p_followee;
  if not found then
    v_in_app := true;
  end if;
  if v_in_app is not true then
    return null;
  end if;

  insert into public.notifications (
    org_id,
    kind,
    sender,
    title,
    body,
    source_refs,
    created_by,
    recipient_user_id
  )
  values (
    null,
    'new_follower',
    'member',
    p_title,
    p_body,
    coalesce(p_source_refs, '{}'::jsonb),
    v_me,
    p_followee
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.notify_new_follower(uuid, text, text, jsonb) from public, anon;
grant execute on function public.notify_new_follower(uuid, text, text, jsonb) to authenticated;

comment on function public.notify_new_follower(uuid, text, text, jsonb) is
  'Recipient-targeted new_follower alert. Requires an existing follow row. Honors in-app pref (default on).';

-- ----------------------------------------------------------------------------
-- 5. Apply-time proofs
-- ----------------------------------------------------------------------------
do $$
declare
  v_follows_expr text;
  v_kind_scope text;
begin
  select pg_get_expr(pol.polqual, pol.polrelid)
    into v_follows_expr
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'follows'
    and pol.polname = 'follows_select';
  if v_follows_expr is null
     or v_follows_expr not ilike '%is_active_profile%' then
    raise exception 'follows_select must allow active-profile edges';
  end if;
  if v_follows_expr ilike '%is_gc_staff%' then
    raise exception 'follows_select must not call is_gc_staff';
  end if;

  select pg_get_constraintdef(oid)
    into v_kind_scope
  from pg_constraint
  where conname = 'notifications_kind_scope'
    and conrelid = 'public.notifications'::regclass;
  if v_kind_scope is null
     or v_kind_scope not ilike '%new_follower%'
     or v_kind_scope not ilike '%recipient_user_id%' then
    raise exception 'notifications_kind_scope must pin new_follower to recipient_user_id';
  end if;

  if to_regprocedure('public.notify_new_follower(uuid, text, text, jsonb)') is null then
    raise exception 'notify_new_follower missing after create';
  end if;

  raise notice 'social follow alerts applied; live follows counts; recipient new_follower';
end $$;
