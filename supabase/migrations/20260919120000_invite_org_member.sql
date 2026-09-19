-- ============================================================================
-- 20260919120000_invite_org_member.sql
--
-- INTENT: Org Team on Aggregation Settings. An account_owner adds a person by
-- email and sets org_role + membership_status. RLS already allows membership
-- INSERT/UPDATE when member_can(..., 'manage_team'), but a client cannot
-- resolve auth.users.email → user_id (auth.users is not a PostgREST table).
-- This RPC is that lookup + write. It does not send mail. It does not create
-- a Social profile (identity spine Mapping C). It does not touch gc_staff.
--
-- ACCESS PATH:
--   invite_org_member(p_org, p_email, p_role, p_status default 'invited')
--     — manage_team; idempotent on (org, email); returns membership id.
--     Resolves an existing auth.users row by lower(trim(email)). If none
--     exists, raises 'User not found' so the app can provision via the
--     house magic-link path (generateLink / createUser) and retry. Login
--     OTP on that email activates the seat. No Auth mail from SQL.
--   org_team_directory(p_org, p_limit default 500)
--     — manage_team; name/email/role/status for the Settings list.
--     Cardinality ≤ 501 (UNPAGINATED_MAX + probe).
--
-- LAST-OWNER GUARD: unchanged. Upsert/update still fire
-- tg_memberships_last_owner_guard. This file does not replace, drop, or
-- weaken that trigger.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
-- CREATE FUNCTION + GRANT/REVOKE EXECUTE. No table, column, policy,
-- trigger, or row changes. Forward-only.
-- ROLLBACK: drop function public.invite_org_member(uuid, text, public.org_role, public.membership_status);
--           drop function public.org_team_directory(uuid, integer);
-- ============================================================================

create or replace function public.invite_org_member(
  p_org uuid,
  p_email text,
  p_role public.org_role,
  p_status public.membership_status default 'invited'
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_user  uuid;
  v_id    uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.member_can(auth.uid(), p_org, 'manage_team') then
    raise exception 'Not authorized';
  end if;
  if v_email = '' then
    raise exception 'Email is required';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 320 then
    raise exception 'Invalid email';
  end if;

  select u.id into v_user
  from auth.users u
  where lower(u.email) = v_email
  order by u.created_at asc
  limit 1;

  if v_user is null then
    raise exception 'User not found'
      using hint = 'Provision the login identity, then retry. This RPC does not insert auth.users.';
  end if;

  insert into public.memberships (org_id, user_id, role, status)
  values (p_org, v_user, p_role, p_status)
  on conflict (org_id, user_id) do update
    set role = excluded.role,
        status = excluded.status
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function
  public.invite_org_member(uuid, text, public.org_role, public.membership_status)
  from public, anon;
grant execute on function
  public.invite_org_member(uuid, text, public.org_role, public.membership_status)
  to authenticated;

comment on function
  public.invite_org_member(uuid, text, public.org_role, public.membership_status) is
  'Account-owner team add. Resolves email→user_id, writes membership, no mail, no profile.';

create or replace function public.org_team_directory(
  p_org uuid,
  p_limit integer default 500
)
  returns table (
    membership_id uuid,
    user_id uuid,
    email text,
    display_name text,
    role public.org_role,
    status public.membership_status
  )
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.member_can(auth.uid(), p_org, 'manage_team') then
    raise exception 'Not authorized';
  end if;

  return query
    select
      m.id,
      m.user_id,
      u.email::text,
      nullif(btrim(coalesce(p.display_name, '')), ''),
      m.role,
      m.status
    from public.memberships m
    join auth.users u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id
    where m.org_id = p_org
    order by
      case m.status
        when 'active' then 0
        when 'invited' then 1
        else 2
      end,
      u.email,
      m.created_at
    limit least(greatest(coalesce(p_limit, 0), 0), 501);
end;
$$;

revoke execute on function public.org_team_directory(uuid, integer) from public, anon;
grant execute on function public.org_team_directory(uuid, integer) to authenticated;

comment on function public.org_team_directory(uuid, integer) is
  'Account-owner org team list (email/role/status). Bounded (≤501). Not an authorization input.';
