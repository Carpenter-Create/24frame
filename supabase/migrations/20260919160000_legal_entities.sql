-- ============================================================================
-- 20260919160000_legal_entities.sql
--
-- INTENT: Legal entities foundation (Phase 1). Every Rights Holder (org)
-- can own one or more legal entities. Titles attach to a legal entity.
-- Team memberships carry an entity scope (all entities vs selected).
--
-- Hierarchy:
--   User (human + Social)
--     Rights Holder (organizations table -- commercial account)
--       Legal entities[] (any structure)
--         Titles / deals
--
-- Ships in dependency order:
--   1. enum (entity_type, entity_status, entity_scope)
--   2. table legal_entities + indexes
--   3. default-entity helper + backfill existing orgs
--   4. titles.legal_entity_id FK + backfill + NOT NULL
--   5. memberships entity_scope column
--   6. membership_entity_grants join table
--   7. account_invites entity_scope + invite_entity_grants
--   8. RLS on all new tables
--   9. triggers (audit + updated_at)
--  10. updated RPCs: create_org_and_membership, create_title,
--      invite_org_member, accept_account_invite + scope helpers
--  11. grants/revokes
--
-- DESTRUCTIVE OPS (draft only; do NOT apply without founder + CoS review):
--   CREATE TYPE + TABLE + COLUMN + INDEX + TRIGGER + POLICY + FUNCTION.
--   ALTER TABLE titles ADD COLUMN, ALTER TABLE memberships ADD COLUMN,
--   ALTER TABLE account_invites ADD COLUMN.
--   DROP FUNCTION (replaced overloads of create_title, invite_org_member,
--     org_team, org_pending_invites -- return type changed, requires drop).
--   No DROP of existing tables. No row deletes. Forward-only.
-- ROLLBACK: drop new functions, policies, triggers, columns, tables, types.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------

do $$ begin
  create type public.entity_type as enum
    ('sole_prop','llc','corporation','partnership','trust','nonprofit','individual','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.entity_status as enum ('active','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.entity_scope as enum ('all','selected');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. TABLE: legal_entities
-- ----------------------------------------------------------------------------

create table if not exists public.legal_entities (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete restrict,
  name         text not null,
  entity_type  public.entity_type not null default 'other',
  jurisdiction text,
  is_default   boolean not null default false,
  status       public.entity_status not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists legal_entities_org_idx
  on public.legal_entities (org_id);
create unique index if not exists legal_entities_default_uidx
  on public.legal_entities (org_id) where is_default = true;

-- ----------------------------------------------------------------------------
-- 3. DEFAULT-ENTITY HELPER + BACKFILL
-- ----------------------------------------------------------------------------

-- Returns the default legal entity for an org, creating one if absent.
-- SECURITY DEFINER so it can INSERT regardless of the caller's RLS.
create or replace function public.ensure_default_legal_entity(p_org_id uuid)
  returns uuid
  language plpgsql security definer set search_path = public
as $$
declare
  v_entity_id uuid;
  v_org_name  text;
begin
  select id into v_entity_id
    from public.legal_entities
   where org_id = p_org_id and is_default = true
   limit 1;

  if v_entity_id is not null then
    return v_entity_id;
  end if;

  select name into v_org_name
    from public.organizations
   where id = p_org_id;

  if v_org_name is null then
    raise exception 'Organization not found';
  end if;

  insert into public.legal_entities (org_id, name, is_default)
    values (p_org_id, v_org_name, true)
    returning id into v_entity_id;

  return v_entity_id;
end;
$$;

revoke execute on function public.ensure_default_legal_entity(uuid)
  from public, anon, authenticated;

-- Backfill: create one default legal entity per existing org (idempotent).
do $$
declare
  r record;
begin
  for r in
    select o.id, o.name
      from public.organizations o
     where not exists (
       select 1 from public.legal_entities le
        where le.org_id = o.id and le.is_default = true
     )
  loop
    insert into public.legal_entities (org_id, name, is_default)
      values (r.id, r.name, true);
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. TITLES: legal_entity_id FK
-- ----------------------------------------------------------------------------

alter table public.titles
  add column if not exists legal_entity_id uuid
    references public.legal_entities(id) on delete restrict;

create index if not exists titles_legal_entity_idx
  on public.titles (legal_entity_id);

-- Backfill existing titles to their org's default entity.
update public.titles t
   set legal_entity_id = le.id
  from public.legal_entities le
 where le.org_id = t.org_id
   and le.is_default = true
   and t.legal_entity_id is null;

-- Now safe to set NOT NULL (every row has a value).
alter table public.titles
  alter column legal_entity_id set not null;

-- Default-entity trigger: any INSERT that omits legal_entity_id (or sets it
-- NULL) gets the org's default entity automatically. One SoT path so that
-- existing pgTAP fixtures and direct inserts (e.g. service-role backfills)
-- never violate the NOT NULL constraint.
create or replace function public.tg_titles_default_legal_entity()
  returns trigger
  language plpgsql security definer set search_path = public
as $$
begin
  if new.legal_entity_id is null then
    new.legal_entity_id := public.ensure_default_legal_entity(new.org_id);
  end if;
  return new;
end;
$$;

drop trigger if exists titles_default_legal_entity on public.titles;
create trigger titles_default_legal_entity
  before insert on public.titles
  for each row execute function public.tg_titles_default_legal_entity();

revoke execute on function public.tg_titles_default_legal_entity()
  from public, anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. MEMBERSHIPS: entity_scope
-- ----------------------------------------------------------------------------

alter table public.memberships
  add column if not exists entity_scope public.entity_scope
    not null default 'all';

-- ----------------------------------------------------------------------------
-- 6. membership_entity_grants (join table for scope=selected)
-- ----------------------------------------------------------------------------

create table if not exists public.membership_entity_grants (
  id                uuid primary key default gen_random_uuid(),
  membership_id     uuid not null references public.memberships(id) on delete restrict,
  legal_entity_id   uuid not null references public.legal_entities(id) on delete restrict,
  created_at        timestamptz not null default now(),
  unique (membership_id, legal_entity_id)
);

create index if not exists meg_membership_idx
  on public.membership_entity_grants (membership_id);
create index if not exists meg_entity_idx
  on public.membership_entity_grants (legal_entity_id);

-- ----------------------------------------------------------------------------
-- 7. ACCOUNT INVITES: entity_scope + invite_entity_grants
-- ----------------------------------------------------------------------------

alter table public.account_invites
  add column if not exists entity_scope public.entity_scope
    not null default 'all';

create table if not exists public.invite_entity_grants (
  id                uuid primary key default gen_random_uuid(),
  invite_id         uuid not null references public.account_invites(id) on delete restrict,
  legal_entity_id   uuid not null references public.legal_entities(id) on delete restrict,
  created_at        timestamptz not null default now(),
  unique (invite_id, legal_entity_id)
);

create index if not exists ieg_invite_idx
  on public.invite_entity_grants (invite_id);
create index if not exists ieg_entity_idx
  on public.invite_entity_grants (legal_entity_id);

-- ----------------------------------------------------------------------------
-- 8. RLS
-- ----------------------------------------------------------------------------

alter table public.legal_entities enable row level security;
alter table public.membership_entity_grants enable row level security;
alter table public.invite_entity_grants enable row level security;

revoke all on public.legal_entities from anon;
revoke all on public.membership_entity_grants from anon;
revoke all on public.invite_entity_grants from anon;

grant select on public.legal_entities to authenticated;
grant select on public.membership_entity_grants to authenticated;
grant select on public.invite_entity_grants to authenticated;

-- legal_entities: read by org members (or GC staff).
drop policy if exists legal_entities_select on public.legal_entities;
create policy legal_entities_select on public.legal_entities
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view'));

-- legal_entities: insert/update by manage_settings.
drop policy if exists legal_entities_insert on public.legal_entities;
create policy legal_entities_insert on public.legal_entities
  for insert to authenticated
  with check (public.member_can(auth.uid(), org_id, 'manage_settings'));

drop policy if exists legal_entities_update on public.legal_entities;
create policy legal_entities_update on public.legal_entities
  for update to authenticated
  using (public.member_can(auth.uid(), org_id, 'manage_settings'))
  with check (public.member_can(auth.uid(), org_id, 'manage_settings'));

-- membership_entity_grants: readable by org members via membership's org_id.
drop policy if exists meg_select on public.membership_entity_grants;
create policy meg_select on public.membership_entity_grants
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
       where m.id = membership_id
         and public.member_can(auth.uid(), m.org_id, 'view')
    )
  );

-- invite_entity_grants: readable by org members via invite's org_id.
drop policy if exists ieg_select on public.invite_entity_grants;
create policy ieg_select on public.invite_entity_grants
  for select to authenticated
  using (
    exists (
      select 1 from public.account_invites i
       where i.id = invite_id
         and i.org_id is not null
         and public.member_can(auth.uid(), i.org_id, 'view')
    )
  );

-- INSERT/UPDATE/DELETE on grants tables: RPC only.

-- ----------------------------------------------------------------------------
-- 9. TRIGGERS (audit + updated_at)
-- ----------------------------------------------------------------------------

drop trigger if exists audit_legal_entities on public.legal_entities;
create trigger audit_legal_entities
  after insert or update or delete on public.legal_entities
  for each row execute function public.tg_audit();

drop trigger if exists set_updated_at_legal_entities on public.legal_entities;
create trigger set_updated_at_legal_entities
  before update on public.legal_entities
  for each row execute function public.tg_set_updated_at();

drop trigger if exists audit_membership_entity_grants on public.membership_entity_grants;
create trigger audit_membership_entity_grants
  after insert or update or delete on public.membership_entity_grants
  for each row execute function public.tg_audit();

drop trigger if exists audit_invite_entity_grants on public.invite_entity_grants;
create trigger audit_invite_entity_grants
  after insert or update or delete on public.invite_entity_grants
  for each row execute function public.tg_audit();

-- ----------------------------------------------------------------------------
-- 10a. member_can_entity: scope-aware entity check
-- ----------------------------------------------------------------------------

-- Returns true if the user can access the given legal entity.
-- GC staff: always true. Account owner: always true (entity_scope forced all).
-- Others: scope=all => true; scope=selected => grant must exist.
create or replace function public.member_can_entity(
  p_uid uuid, p_org uuid, p_entity uuid
)
  returns boolean
  language sql stable security definer set search_path = public
as $$
  select case
    when p_uid is null or p_org is null or p_entity is null then false
    when public.is_gc_staff(p_uid) then true
    else exists (
      select 1 from public.memberships m
       where m.user_id = p_uid
         and m.org_id  = p_org
         and m.status  = 'active'
         and (
           m.entity_scope = 'all'
           or exists (
             select 1 from public.membership_entity_grants g
              where g.membership_id = m.id
                and g.legal_entity_id = p_entity
           )
         )
    )
  end;
$$;

revoke execute on function public.member_can_entity(uuid, uuid, uuid)
  from public, anon;
grant execute on function public.member_can_entity(uuid, uuid, uuid)
  to authenticated;

-- ----------------------------------------------------------------------------
-- 10b. org_legal_entities: list entities for an org (scope-filtered)
-- ----------------------------------------------------------------------------

create or replace function public.org_legal_entities(p_org uuid)
  returns table (
    id          uuid,
    name        text,
    entity_type public.entity_type,
    jurisdiction text,
    is_default  boolean,
    status      public.entity_status,
    created_at  timestamptz
  )
  language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_scope public.entity_scope;
  v_mid uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_org is null then raise exception 'Rights holder is required'; end if;
  if not public.member_can(v_uid, p_org, 'view') then
    raise exception 'Not authorized';
  end if;

  -- GC staff sees all.
  if public.is_gc_staff(v_uid) then
    return query
      select le.id, le.name, le.entity_type, le.jurisdiction,
             le.is_default, le.status, le.created_at
        from public.legal_entities le
       where le.org_id = p_org
       order by le.is_default desc, le.name;
    return;
  end if;

  select m.id, m.entity_scope into v_mid, v_scope
    from public.memberships m
   where m.user_id = v_uid and m.org_id = p_org and m.status = 'active'
   limit 1;

  if v_scope = 'all' or v_scope is null then
    return query
      select le.id, le.name, le.entity_type, le.jurisdiction,
             le.is_default, le.status, le.created_at
        from public.legal_entities le
       where le.org_id = p_org
       order by le.is_default desc, le.name;
  else
    return query
      select le.id, le.name, le.entity_type, le.jurisdiction,
             le.is_default, le.status, le.created_at
        from public.legal_entities le
        join public.membership_entity_grants g
          on g.legal_entity_id = le.id and g.membership_id = v_mid
       where le.org_id = p_org
       order by le.is_default desc, le.name;
  end if;
end;
$$;

revoke execute on function public.org_legal_entities(uuid)
  from public, anon;
grant execute on function public.org_legal_entities(uuid)
  to authenticated;

-- ----------------------------------------------------------------------------
-- 10c. create_legal_entity: add entity to an org (manage_settings)
-- ----------------------------------------------------------------------------

create or replace function public.create_legal_entity(
  p_org_id      uuid,
  p_name        text,
  p_entity_type public.entity_type default 'other',
  p_jurisdiction text default null
)
  returns uuid
  language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Entity name is required';
  end if;
  if not public.member_can(auth.uid(), p_org_id, 'manage_settings') then
    raise exception 'Not authorized';
  end if;

  insert into public.legal_entities (org_id, name, entity_type, jurisdiction)
    values (p_org_id, btrim(p_name), coalesce(p_entity_type, 'other'), p_jurisdiction)
    returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.create_legal_entity(uuid, text, public.entity_type, text)
  from public, anon;
grant execute on function public.create_legal_entity(uuid, text, public.entity_type, text)
  to authenticated;

-- ----------------------------------------------------------------------------
-- 10d. UPDATED create_org_and_membership: auto-create default legal entity
-- ----------------------------------------------------------------------------

create or replace function public.create_org_and_membership(p_name text)
  returns uuid
  language plpgsql security definer set search_path = public
as $$
declare v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Organization name is required';
  end if;

  insert into public.organizations (name) values (btrim(p_name)) returning id into v_org;
  insert into public.memberships (org_id, user_id, role, status, entity_scope)
    values (v_org, auth.uid(), 'account_owner', 'active', 'all');

  -- Auto-create default legal entity named after the RH.
  insert into public.legal_entities (org_id, name, is_default)
    values (v_org, btrim(p_name), true);

  return v_org;
end;
$$;

-- ----------------------------------------------------------------------------
-- 10e. UPDATED create_title: require legal_entity_id
-- ----------------------------------------------------------------------------

drop function if exists public.create_title(uuid, text, public.release_type, date);

create or replace function public.create_title(
  p_org_id                uuid,
  p_title                 text,
  p_release_type          public.release_type,
  p_original_release_date date default null,
  p_legal_entity_id       uuid default null
) returns uuid
  language plpgsql security definer set search_path = public
as $$
declare
  v_title uuid;
  v_entity uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if coalesce(btrim(p_title), '') = '' then raise exception 'Title is required'; end if;
  if p_release_type is null then raise exception 'Release type is required'; end if;
  if p_release_type = 're_release' and p_original_release_date is null then
    raise exception 'Original release date is required for a re-release';
  end if;
  if not public.member_can(auth.uid(), p_org_id, 'operate') then
    raise exception 'Not authorized to add titles for this organization';
  end if;
  if (select status from public.organizations where id = p_org_id) <> 'active' then
    raise exception 'Your organization must finish onboarding before adding titles';
  end if;

  -- Resolve legal entity: explicit or default.
  if p_legal_entity_id is not null then
    if not exists (
      select 1 from public.legal_entities
       where id = p_legal_entity_id and org_id = p_org_id and status = 'active'
    ) then
      raise exception 'Legal entity not found or not active';
    end if;
    v_entity := p_legal_entity_id;
  else
    v_entity := public.ensure_default_legal_entity(p_org_id);
  end if;

  insert into public.titles (org_id, title, created_by, release_type, original_release_date, legal_entity_id)
    values (p_org_id, btrim(p_title), auth.uid(), p_release_type,
            case when p_release_type = 're_release' then p_original_release_date else null end,
            v_entity)
    returning id into v_title;
  return v_title;
end;
$$;

revoke execute on function public.create_title(uuid, text, public.release_type, date, uuid) from public, anon;
grant  execute on function public.create_title(uuid, text, public.release_type, date, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 10f. UPDATED invite_org_member: add entity_scope + entity_ids
-- ----------------------------------------------------------------------------

drop function if exists public.invite_org_member(uuid, text, public.org_role, text);

create or replace function public.invite_org_member(
  p_org         uuid,
  p_email       text,
  p_role        public.org_role,
  p_token_hash  text,
  p_entity_scope public.entity_scope default 'all',
  p_entity_ids  uuid[] default null
)
  returns uuid
  language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := public.account_invite_normalize_email(p_email);
  v_id    uuid;
  v_eid   uuid;
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
  if p_entity_scope = 'selected' and (p_entity_ids is null or array_length(p_entity_ids, 1) = 0) then
    raise exception 'At least one entity is required when scope is selected';
  end if;

  perform public.expire_stale_account_invites();

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

  -- Validate entity ids belong to this org when scope=selected.
  if p_entity_scope = 'selected' then
    for v_eid in select unnest(p_entity_ids) loop
      if not exists (
        select 1 from public.legal_entities
         where id = v_eid and org_id = p_org and status = 'active'
      ) then
        raise exception 'Entity % does not belong to this rights holder', v_eid;
      end if;
    end loop;
  end if;

  insert into public.account_invites (
    kind, email, org_id, role, token_hash, invited_by, expires_at, entity_scope
  ) values (
    'team', v_email, p_org, p_role, p_token_hash, v_uid,
    now() + interval '14 days', coalesce(p_entity_scope, 'all')
  ) returning id into v_id;

  -- Write entity grants for the invite.
  if p_entity_scope = 'selected' and p_entity_ids is not null then
    insert into public.invite_entity_grants (invite_id, legal_entity_id)
      select v_id, unnest(p_entity_ids);
  end if;

  return v_id;
end;
$$;

revoke execute on function public.invite_org_member(uuid, text, public.org_role, text, public.entity_scope, uuid[])
  from public, anon;
grant execute on function public.invite_org_member(uuid, text, public.org_role, text, public.entity_scope, uuid[])
  to authenticated;

comment on function public.invite_org_member(uuid, text, public.org_role, text, public.entity_scope, uuid[]) is
  'Account owner (manage_team) invites an email onto this org with entity scope. Token hash only. Fail-closed.';

-- ----------------------------------------------------------------------------
-- 10g. UPDATED accept_account_invite: propagate entity_scope + grants
-- ----------------------------------------------------------------------------

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
  v_mid   uuid;
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

    -- Reactivate a removed membership or insert a new one.
    update public.memberships
      set role = v_inv.role, status = 'active',
          entity_scope = v_inv.entity_scope
      where org_id = v_org and user_id = v_uid and status = 'removed'
      returning id into v_mid;

    if v_mid is null then
      insert into public.memberships (org_id, user_id, role, status, entity_scope)
        values (v_org, v_uid, v_inv.role, 'active', v_inv.entity_scope)
        returning id into v_mid;
    end if;

    -- Copy entity grants from invite to membership.
    if v_inv.entity_scope = 'selected' then
      insert into public.membership_entity_grants (membership_id, legal_entity_id)
        select v_mid, ieg.legal_entity_id
          from public.invite_entity_grants ieg
         where ieg.invite_id = v_inv.id
        on conflict (membership_id, legal_entity_id) do nothing;
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

    insert into public.memberships (org_id, user_id, role, status, entity_scope)
      values (v_org, v_uid, 'account_owner', 'active', 'all');

    -- Auto-create default legal entity for the new org.
    insert into public.legal_entities (org_id, name, is_default)
      values (v_org, v_inv.org_name, true);

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

-- ----------------------------------------------------------------------------
-- 10h. UPDATED org_team: include entity_scope
-- ----------------------------------------------------------------------------
-- Postgres cannot CREATE OR REPLACE when the returns-table shape changes.
-- Drop existing overloads first.
drop function if exists public.org_team(uuid, integer);
drop function if exists public.org_team(uuid);

create or replace function public.org_team(p_org uuid, p_limit integer default 500)
  returns table (
    user_id      uuid,
    email        text,
    role         public.org_role,
    status       public.membership_status,
    joined_at    timestamptz,
    display_name text,
    invited_at   timestamptz,
    entity_scope public.entity_scope
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
    select
      m.user_id,
      u.email::text,
      m.role,
      m.status,
      m.created_at,
      nullif(btrim(p.display_name), ''),
      inv.created_at,
      m.entity_scope
    from public.memberships m
    join auth.users u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id
    left join lateral (
      select i.created_at
      from public.account_invites i
      where i.kind = 'team'
        and i.org_id = p_org
        and i.status = 'accepted'
        and (i.accepted_by = m.user_id or i.email = lower(u.email::text))
      order by i.accepted_at desc nulls last
      limit 1
    ) inv on true
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

-- ----------------------------------------------------------------------------
-- 10i. UPDATED org_pending_invites: include entity_scope
-- ----------------------------------------------------------------------------
-- Same treatment: returns-table shape changed, so drop first.
drop function if exists public.org_pending_invites(uuid, integer);
drop function if exists public.org_pending_invites(uuid);

create or replace function public.org_pending_invites(p_org uuid, p_limit integer default 500)
  returns table (
    id            uuid,
    email         text,
    role          public.org_role,
    expires_at    timestamptz,
    created_at    timestamptz,
    entity_scope  public.entity_scope
  )
  language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_org is null then raise exception 'Organization is required'; end if;
  if not public.member_can(auth.uid(), p_org, 'view') then
    raise exception 'Not authorized';
  end if;

  perform public.expire_stale_account_invites();

  return query
    select i.id, i.email, i.role, i.expires_at, i.created_at, i.entity_scope
    from public.account_invites i
    where i.org_id = p_org
      and i.kind = 'team'
      and i.status = 'pending'
      and i.expires_at > now()
    order by i.created_at desc
    limit least(greatest(coalesce(p_limit, 0), 0), 501);
end;
$$;

-- ----------------------------------------------------------------------------
-- 10j. scoped_title_ids: returns title ids visible to a user
-- ----------------------------------------------------------------------------

create or replace function public.scoped_title_ids(p_uid uuid, p_org uuid)
  returns setof uuid
  language sql stable security definer set search_path = public
as $$
  select t.id
    from public.titles t
   where t.org_id = p_org
     and public.member_can_entity(p_uid, p_org, t.legal_entity_id);
$$;

revoke execute on function public.scoped_title_ids(uuid, uuid)
  from public, anon;
grant execute on function public.scoped_title_ids(uuid, uuid)
  to authenticated;

-- Convenience: returns legal entity ids the user can access.
create or replace function public.my_entity_ids(p_org uuid)
  returns setof uuid
  language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_scope public.entity_scope;
  v_mid uuid;
begin
  if v_uid is null then return; end if;
  if public.is_gc_staff(v_uid) then
    return query select le.id from public.legal_entities le where le.org_id = p_org;
    return;
  end if;

  select m.id, m.entity_scope into v_mid, v_scope
    from public.memberships m
   where m.user_id = v_uid and m.org_id = p_org and m.status = 'active'
   limit 1;

  if v_mid is null then return; end if;

  if v_scope = 'all' or v_scope is null then
    return query select le.id from public.legal_entities le where le.org_id = p_org;
  else
    return query
      select g.legal_entity_id
        from public.membership_entity_grants g
       where g.membership_id = v_mid;
  end if;
end;
$$;

revoke execute on function public.my_entity_ids(uuid) from public, anon;
grant execute on function public.my_entity_ids(uuid) to authenticated;
