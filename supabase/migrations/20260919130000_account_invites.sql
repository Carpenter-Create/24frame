-- ============================================================================
-- 20260919130000_account_invites.sql
--
-- INTENT: one SoT for pending account invites — team seats and house
-- grant/comp. Does not fork memberships, org_role, gc_staff, or
-- contract_terms. Email-first: auth.users may not exist until accept.
--
-- Founder locks 2026-09-19:
--   1. One account model. Solo vs company = org size only.
--   2. Every account user can invite people to their own team.
--   3. House has owners / staff / team (same pattern, different who).
--   4. Comp = house creates/grants an account user + tier, email accept.
--   5. No third species of user.
--
-- AUTHZ (fail-closed):
--   Team invite / revoke: member_can(uid, org, 'manage_team')
--     — account_owner of that org; gc_account_owner via gc_can.
--   House grant / revoke: is_gc_staff AND gc_can(uid, 'operate')
--     — gc_account_owner + gc_delivery_ops. Legal / accountant cannot.
--   Accept: authenticated, email match, pending, unexpired.
--   Peek: knowledge of token_hash (anon + authenticated). Hash is the
--     capability; raw token never stored.
--   Team roster / pending team invites: member_can(uid, org, 'view').
--   Pending house grants: is_gc_staff.
--
-- ENTITLEMENT: contract_terms.tier remains the plan SoT. House grant
-- writes a term on accept (no Stripe subscription). trigger = signup
-- (term_trigger_enum ADD VALUE cannot be used in the same transaction).
-- source_documents.kind = house_grant is the grant provenance.
-- Clickwrap assent is not written — deferred, founder/counsel.
--
-- DESTRUCTIVE OPS (draft only; do NOT apply to production from this PR):
--   CREATE TYPE + TABLE + INDEX + TRIGGER + POLICY + FUNCTION + GRANT/REVOKE.
--   No DROP of existing objects. No row deletes. Forward-only.
--   CoS applies after merge + founder yes. Prod SQL apply needed after merge.
-- ROLLBACK: drop the new functions, policies, triggers, table, types.
-- ============================================================================

do $$ begin
  create type public.account_invite_kind as enum ('team', 'house_grant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_invite_status as enum
    ('pending', 'accepted', 'revoked', 'expired');
exception when duplicate_object then null; end $$;

create table if not exists public.account_invites (
  id           uuid primary key default gen_random_uuid(),
  kind         public.account_invite_kind not null,
  status       public.account_invite_status not null default 'pending',
  email        text not null,
  org_id       uuid references public.organizations(id) on delete restrict,
  role         public.org_role,
  tier         public.tier_enum,
  org_name     text,
  token_hash   text not null,
  invited_by   uuid not null references auth.users(id) on delete restrict,
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  accepted_by  uuid references auth.users(id) on delete restrict,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint account_invites_email_shape
    check (email = lower(email) and email ~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$'),
  constraint account_invites_token_hash_sha256
    check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint account_invites_kind_shape
    check (
      (kind = 'team'
        and org_id is not null
        and role is not null
        and tier is null
        and org_name is null)
      or
      (kind = 'house_grant'
        and tier is not null
        and org_name is not null
        and btrim(org_name) <> ''
        and role is null)
    )
);

create unique index if not exists account_invites_token_hash_uidx
  on public.account_invites (token_hash);
create index if not exists account_invites_org_idx
  on public.account_invites (org_id);
create index if not exists account_invites_email_idx
  on public.account_invites (email);
create unique index if not exists account_invites_pending_team_uidx
  on public.account_invites (org_id, email)
  where status = 'pending' and kind = 'team';
create unique index if not exists account_invites_pending_grant_uidx
  on public.account_invites (email)
  where status = 'pending' and kind = 'house_grant';

drop trigger if exists set_updated_at_account_invites on public.account_invites;
create trigger set_updated_at_account_invites
  before update on public.account_invites
  for each row execute function public.tg_set_updated_at();

-- Redact token_hash from audit_log. The hash is the accept capability.
create or replace function public.tg_audit_account_invites()
  returns trigger
  language plpgsql security definer set search_path = public
as $$
declare
  v_actor  uuid := auth.uid();
  v_before jsonb;
  v_after  jsonb;
  v_org    uuid;
begin
  if    tg_op = 'INSERT' then v_after := to_jsonb(new) - 'token_hash'; v_before := null;
  elsif tg_op = 'UPDATE' then v_after := to_jsonb(new) - 'token_hash'; v_before := to_jsonb(old) - 'token_hash';
  elsif tg_op = 'DELETE' then v_before := to_jsonb(old) - 'token_hash'; v_after := null;
  end if;

  v_org := coalesce((v_after->>'org_id')::uuid, (v_before->>'org_id')::uuid);

  insert into public.audit_log (org_id, entity, entity_id, action, actor, before, after)
  values (
    v_org, tg_table_name,
    coalesce((v_after->>'id')::uuid, (v_before->>'id')::uuid),
    lower(tg_op), v_actor, v_before, v_after
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_account_invites on public.account_invites;
create trigger audit_account_invites
  after insert or update or delete on public.account_invites
  for each row execute function public.tg_audit_account_invites();

revoke execute on function public.tg_audit_account_invites()
  from public, anon, authenticated, service_role;

alter table public.account_invites enable row level security;
revoke all on public.account_invites from public, anon, authenticated;
-- Table-level GRANT SELECT includes every column; REVOKE on one
-- column does not punch a hole in that grant. Enumerate instead.
grant select (
  id, kind, status, email, org_id, role, tier, org_name,
  invited_by, expires_at, accepted_at, accepted_by, revoked_at,
  created_at, updated_at
) on public.account_invites to authenticated;
grant select on public.account_invites to service_role;

drop policy if exists account_invites_select on public.account_invites;
create policy account_invites_select on public.account_invites
  for select to authenticated
  using (
    (kind = 'team' and org_id is not null and public.member_can(auth.uid(), org_id, 'view'))
    or
    (kind = 'house_grant' and public.is_gc_staff(auth.uid()))
  );
-- INSERT/UPDATE/DELETE: RPC only.

create or replace function public.account_invite_normalize_email(p_email text)
  returns text
  language sql immutable
as $$
  select lower(btrim(p_email));
$$;

revoke execute on function public.account_invite_normalize_email(text)
  from public, anon;
grant execute on function public.account_invite_normalize_email(text)
  to authenticated, service_role;

create or replace function public.invite_org_member(
  p_org uuid,
  p_email text,
  p_role public.org_role,
  p_token_hash text
)
  returns uuid
  language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := public.account_invite_normalize_email(p_email);
  v_id    uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_org is null then raise exception 'Organization is required'; end if;
  if p_role is null then raise exception 'Role is required'; end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invite token is invalid';
  end if;
  if v_email is null or v_email !~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$' then
    raise exception 'Email is required';
  end if;
  if not public.member_can(v_uid, p_org, 'manage_team') then
    raise exception 'Not authorized';
  end if;
  if exists (
    select 1 from auth.users u
    where u.id = v_uid and lower(u.email) = v_email
  ) then
    raise exception 'You cannot invite your own email';
  end if;
  if exists (
    select 1
    from public.memberships m
    join auth.users u on u.id = m.user_id
    where m.org_id = p_org
      and m.status = 'active'
      and lower(u.email) = v_email
  ) then
    raise exception 'That email already has a seat on this team';
  end if;
  if exists (
    select 1 from public.account_invites i
    where i.kind = 'team'
      and i.status = 'pending'
      and i.org_id = p_org
      and i.email = v_email
  ) then
    raise exception 'An invite is already pending for that email';
  end if;

  insert into public.account_invites (
    kind, email, org_id, role, token_hash, invited_by, expires_at
  ) values (
    'team', v_email, p_org, p_role, p_token_hash, v_uid, now() + interval '14 days'
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.invite_org_member(uuid, text, public.org_role, text)
  from public, anon;
grant execute on function public.invite_org_member(uuid, text, public.org_role, text)
  to authenticated;

comment on function public.invite_org_member(uuid, text, public.org_role, text) is
  'Account owner (manage_team) invites an email onto this org. Token hash only. Fail-closed.';

create or replace function public.grant_house_account(
  p_email text,
  p_org_name text,
  p_tier public.tier_enum,
  p_token_hash text
)
  returns uuid
  language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := public.account_invite_normalize_email(p_email);
  v_name  text := btrim(p_org_name);
  v_id    uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_gc_staff(v_uid) or not public.gc_can(v_uid, 'operate') then
    raise exception 'Not authorized';
  end if;
  if p_tier is null then raise exception 'Plan is required'; end if;
  if v_name is null or v_name = '' then raise exception 'Organization name is required'; end if;
  if char_length(v_name) > 200 then raise exception 'Organization name is too long'; end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invite token is invalid';
  end if;
  if v_email is null or v_email !~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$' then
    raise exception 'Email is required';
  end if;
  if exists (
    select 1 from auth.users u
    where u.id = v_uid and lower(u.email) = v_email
  ) then
    raise exception 'You cannot grant your own email';
  end if;
  if exists (
    select 1
    from public.memberships m
    join auth.users u on u.id = m.user_id
    where m.role = 'account_owner'
      and m.status = 'active'
      and lower(u.email) = v_email
  ) then
    raise exception 'That email already has an account';
  end if;
  if exists (
    select 1 from public.account_invites i
    where i.kind = 'house_grant'
      and i.status = 'pending'
      and i.email = v_email
  ) then
    raise exception 'A grant is already pending for that email';
  end if;

  insert into public.account_invites (
    kind, email, org_name, tier, token_hash, invited_by, expires_at
  ) values (
    'house_grant', v_email, v_name, p_tier, p_token_hash, v_uid, now() + interval '14 days'
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.grant_house_account(text, text, public.tier_enum, text)
  from public, anon;
grant execute on function public.grant_house_account(text, text, public.tier_enum, text)
  to authenticated;

comment on function public.grant_house_account(text, text, public.tier_enum, text) is
  'House staff (gc_can operate) grants a new account + tier by email. Token hash only.';

create or replace function public.peek_account_invite(p_token_hash text)
  returns table (
    id         uuid,
    kind       public.account_invite_kind,
    status     public.account_invite_status,
    email      text,
    org_name   text,
    role       public.org_role,
    tier       public.tier_enum,
    expires_at timestamptz
  )
  language plpgsql security definer set search_path = public
as $$
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return;
  end if;

  return query
    select
      i.id,
      i.kind,
      case
        when i.status = 'pending' and i.expires_at <= now() then 'expired'::public.account_invite_status
        else i.status
      end,
      i.email,
      coalesce(o.name, i.org_name),
      i.role,
      i.tier,
      i.expires_at
    from public.account_invites i
    left join public.organizations o on o.id = i.org_id
    where i.token_hash = p_token_hash;
end;
$$;

revoke execute on function public.peek_account_invite(text) from public;
grant execute on function public.peek_account_invite(text) to anon, authenticated;

comment on function public.peek_account_invite(text) is
  'Token-hash peek for the accept page. No session. Never returns token_hash.';

create or replace function public.accept_account_invite(p_token_hash text)
  returns jsonb
  language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_inv   public.account_invites%rowtype;
  v_org   uuid;
  v_doc   uuid;
  v_term  int;
  v_rate  int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invite token is invalid';
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_uid;
  if v_email is null then raise exception 'Sign-in email is required'; end if;

  select * into v_inv
  from public.account_invites
  where token_hash = p_token_hash
  for update;

  if not found then raise exception 'Invite not found'; end if;
  if v_inv.status <> 'pending' then raise exception 'Invite is no longer pending'; end if;
  if v_inv.expires_at <= now() then
    update public.account_invites
      set status = 'expired'
      where id = v_inv.id and status = 'pending';
    raise exception 'Invite has expired';
  end if;
  if v_inv.email <> v_email then
    raise exception 'Sign in with the invited email to accept';
  end if;

  if v_inv.kind = 'team' then
    v_org := v_inv.org_id;
    if exists (
      select 1 from public.memberships m
      where m.org_id = v_org and m.user_id = v_uid and m.status = 'active'
    ) then
      raise exception 'You already have a seat on this team';
    end if;

    update public.memberships
      set role = v_inv.role, status = 'active'
      where org_id = v_org and user_id = v_uid and status = 'removed';

    if not found then
      insert into public.memberships (org_id, user_id, role, status)
      values (v_org, v_uid, v_inv.role, 'active');
    end if;
  elsif v_inv.kind = 'house_grant' then
    if exists (
      select 1 from public.memberships m
      where m.user_id = v_uid and m.role = 'account_owner' and m.status = 'active'
    ) then
      raise exception 'This email already has an account';
    end if;

    insert into public.organizations (name, status)
    values (v_inv.org_name, 'active')
    returning id into v_org;

    insert into public.memberships (org_id, user_id, role, status)
    values (v_org, v_uid, 'account_owner', 'active');

    insert into public.source_documents (org_id, kind, provided_by, content_hash, raw)
    values (
      v_org,
      'house_grant',
      v_uid,
      v_inv.token_hash,
      jsonb_build_object(
        'invite_id', v_inv.id,
        'tier', v_inv.tier,
        'org_name', v_inv.org_name,
        'granted_by', v_inv.invited_by
      )
    )
    returning id into v_doc;

    v_term := case when v_inv.tier = 'premium' then 24 else 12 end;
    v_rate := public.tier_revenue_share_bp(v_inv.tier);

    insert into public.contract_terms (
      org_id, tier, revenue_share_rate_bp, effective_from,
      term_length_months, expires_at, trigger, source_document_id
    ) values (
      v_org, v_inv.tier, v_rate, now(),
      v_term, now() + (v_term || ' months')::interval, 'signup', v_doc
    );
  else
    raise exception 'Unknown invite kind';
  end if;

  update public.account_invites
    set status = 'accepted',
        accepted_at = now(),
        accepted_by = v_uid,
        org_id = v_org
    where id = v_inv.id;

  return jsonb_build_object('org_id', v_org, 'kind', v_inv.kind);
end;
$$;

revoke execute on function public.accept_account_invite(text)
  from public, anon;
grant execute on function public.accept_account_invite(text)
  to authenticated;

comment on function public.accept_account_invite(text) is
  'Accept a team or house-grant invite. Email must match. Creates membership; grant also writes org + contract_terms.tier.';

create or replace function public.revoke_account_invite(p_id uuid)
  returns void
  language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.account_invites%rowtype;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_id is null then raise exception 'Invite is required'; end if;

  select * into v_inv from public.account_invites where id = p_id for update;
  if not found then raise exception 'Invite not found'; end if;
  if v_inv.status <> 'pending' then raise exception 'Invite is no longer pending'; end if;

  if v_inv.kind = 'team' then
    if v_inv.org_id is null or not public.member_can(v_uid, v_inv.org_id, 'manage_team') then
      raise exception 'Not authorized';
    end if;
  elsif v_inv.kind = 'house_grant' then
    if not public.is_gc_staff(v_uid) or not public.gc_can(v_uid, 'operate') then
      raise exception 'Not authorized';
    end if;
  else
    raise exception 'Unknown invite kind';
  end if;

  update public.account_invites
    set status = 'revoked', revoked_at = now()
    where id = v_inv.id and status = 'pending';
end;
$$;

revoke execute on function public.revoke_account_invite(uuid)
  from public, anon;
grant execute on function public.revoke_account_invite(uuid)
  to authenticated;

create or replace function public.org_team(p_org uuid, p_limit integer default 500)
  returns table (
    user_id    uuid,
    email      text,
    role       public.org_role,
    status     public.membership_status,
    joined_at  timestamptz
  )
  language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_org is null then raise exception 'Organization is required'; end if;
  if not public.member_can(auth.uid(), p_org, 'view') then
    raise exception 'Not authorized';
  end if;

  return query
    select m.user_id, u.email::text, m.role, m.status, m.created_at
    from public.memberships m
    join auth.users u on u.id = m.user_id
    where m.org_id = p_org
      and m.status = 'active'
    order by
      case m.role
        when 'account_owner' then 0
        when 'delivery_ops' then 1
        when 'accountant' then 2
        when 'legal' then 3
        else 4
      end,
      u.email
    limit least(greatest(coalesce(p_limit, 0), 0), 501);
end;
$$;

revoke execute on function public.org_team(uuid, integer)
  from public, anon;
grant execute on function public.org_team(uuid, integer)
  to authenticated;

create or replace function public.org_pending_invites(p_org uuid, p_limit integer default 500)
  returns table (
    id         uuid,
    email      text,
    role       public.org_role,
    expires_at timestamptz,
    created_at timestamptz
  )
  language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_org is null then raise exception 'Organization is required'; end if;
  if not public.member_can(auth.uid(), p_org, 'view') then
    raise exception 'Not authorized';
  end if;

  return query
    select i.id, i.email, i.role, i.expires_at, i.created_at
    from public.account_invites i
    where i.org_id = p_org
      and i.kind = 'team'
      and i.status = 'pending'
      and i.expires_at > now()
    order by i.created_at desc
    limit least(greatest(coalesce(p_limit, 0), 0), 501);
end;
$$;

revoke execute on function public.org_pending_invites(uuid, integer)
  from public, anon;
grant execute on function public.org_pending_invites(uuid, integer)
  to authenticated;

create or replace function public.pending_house_grants(p_limit integer default 500)
  returns table (
    id         uuid,
    email      text,
    org_name   text,
    tier       public.tier_enum,
    expires_at timestamptz,
    created_at timestamptz
  )
  language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not public.is_gc_staff(auth.uid()) then raise exception 'Not authorized'; end if;

  return query
    select i.id, i.email, i.org_name, i.tier, i.expires_at, i.created_at
    from public.account_invites i
    where i.kind = 'house_grant'
      and i.status = 'pending'
      and i.expires_at > now()
    order by i.created_at desc
    limit least(greatest(coalesce(p_limit, 0), 0), 501);
end;
$$;

revoke execute on function public.pending_house_grants(integer)
  from public, anon;
grant execute on function public.pending_house_grants(integer)
  to authenticated;

comment on function public.pending_house_grants(integer) is
  'Staff-only pending house grants. Not a platform user directory. Never returns token_hash.';
