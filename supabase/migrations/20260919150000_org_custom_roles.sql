-- ============================================================================
-- 20260919150000_org_custom_roles.sql
--
-- INTENT: org-scoped custom roles with capability sets grounded in the
-- existing member_can() capability model. System roles (org_role enum)
-- remain the baseline. Custom roles let account owners define named
-- capability bundles for their team. member_can() is extended to
-- resolve custom role capabilities alongside the enum mapping.
--
-- Capability set: view, view_financial, operate, manage_tax_banking,
-- manage_billing, manage_team, manage_settings (same names as the
-- member_can() CASE branches).
--
-- AUTHZ:
--   Create/update custom role: member_can(manage_team) = account_owner.
--   Assign custom role: same gate as membership management (manage_team).
--   Read custom roles: member_can(view) = any org member.
--   Custom roles cannot be deleted (status change only).
--
-- SCHEMA CHANGES:
--   1. org_custom_roles table (id, org_id, name, description, status)
--   2. org_custom_role_capabilities join (role_id, capability)
--   3. memberships.custom_role_id nullable FK
--   4. account_invites.custom_role_id nullable FK
--   5. member_can() updated to check custom role capabilities
--   6. RPCs: create_org_custom_role, list_org_custom_roles
--   7. org_team / org_pending_invites updated for custom role info
--   8. last-owner guard follows member_can()'s custom-role override
--
-- DESTRUCTIVE OPS (draft only; founder applies after CoS review):
--   CREATE TABLE + INDEX + TRIGGER + POLICY + FUNCTION + ALTER TABLE.
--   ALTER member_can (replaces function body).
--   Replaces tg_memberships_last_owner_guard body (same signature).
--   No DROP of existing objects. No row deletes. Forward-only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Custom roles table
-- ----------------------------------------------------------------------------
create table if not exists public.org_custom_roles (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete restrict,
  name        text not null,
  description text not null default '',
  status      text not null default 'active'
    check (status in ('active', 'archived')),
  created_by  uuid not null references auth.users(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Expression uniqueness cannot live in a table UNIQUE constraint.
create unique index if not exists org_custom_roles_org_name_key
  on public.org_custom_roles (org_id, lower(name));

create index if not exists org_custom_roles_org_idx
  on public.org_custom_roles (org_id);

-- ----------------------------------------------------------------------------
-- 2. Capability join
-- ----------------------------------------------------------------------------
create table if not exists public.org_custom_role_capabilities (
  role_id    uuid not null references public.org_custom_roles(id) on delete restrict,
  capability text not null
    check (capability in (
      'view', 'view_financial', 'operate',
      'manage_tax_banking', 'manage_billing',
      'manage_team', 'manage_settings'
    )),
  primary key (role_id, capability)
);

-- ----------------------------------------------------------------------------
-- 3. Add custom_role_id to memberships
-- ----------------------------------------------------------------------------
alter table public.memberships
  add column if not exists custom_role_id uuid
    references public.org_custom_roles(id) on delete restrict;

-- ----------------------------------------------------------------------------
-- 4. Add custom_role_id to account_invites
-- ----------------------------------------------------------------------------
alter table public.account_invites
  add column if not exists custom_role_id uuid
    references public.org_custom_roles(id) on delete restrict;

-- ----------------------------------------------------------------------------
-- 5. Triggers: updated_at + audit
-- ----------------------------------------------------------------------------
drop trigger if exists set_updated_at_org_custom_roles on public.org_custom_roles;
create trigger set_updated_at_org_custom_roles
  before update on public.org_custom_roles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists audit_org_custom_roles on public.org_custom_roles;
create trigger audit_org_custom_roles
  after insert or update or delete on public.org_custom_roles
  for each row execute function public.tg_audit();

-- ----------------------------------------------------------------------------
-- 6. RLS
-- ----------------------------------------------------------------------------
alter table public.org_custom_roles enable row level security;
alter table public.org_custom_role_capabilities enable row level security;

revoke all on public.org_custom_roles from anon;
revoke all on public.org_custom_role_capabilities from anon;

drop policy if exists org_custom_roles_select on public.org_custom_roles;
create policy org_custom_roles_select on public.org_custom_roles
  for select to authenticated
  using (public.member_can(auth.uid(), org_id, 'view'));

drop policy if exists org_custom_roles_insert on public.org_custom_roles;
create policy org_custom_roles_insert on public.org_custom_roles
  for insert to authenticated
  with check (public.member_can(auth.uid(), org_id, 'manage_team'));

drop policy if exists org_custom_roles_update on public.org_custom_roles;
create policy org_custom_roles_update on public.org_custom_roles
  for update to authenticated
  using (public.member_can(auth.uid(), org_id, 'manage_team'))
  with check (public.member_can(auth.uid(), org_id, 'manage_team'));

drop policy if exists org_custom_role_capabilities_select
  on public.org_custom_role_capabilities;
create policy org_custom_role_capabilities_select
  on public.org_custom_role_capabilities
  for select to authenticated
  using (
    exists (
      select 1 from public.org_custom_roles r
      where r.id = role_id
        and public.member_can(auth.uid(), r.org_id, 'view')
    )
  );

drop policy if exists org_custom_role_capabilities_insert
  on public.org_custom_role_capabilities;
create policy org_custom_role_capabilities_insert
  on public.org_custom_role_capabilities
  for insert to authenticated
  with check (
    exists (
      select 1 from public.org_custom_roles r
      where r.id = role_id
        and public.member_can(auth.uid(), r.org_id, 'manage_team')
    )
  );

-- ----------------------------------------------------------------------------
-- 7. member_can() extended: check custom_role_id capabilities
-- ----------------------------------------------------------------------------
create or replace function public.member_can(p_uid uuid, p_org uuid, p_capability text)
  returns boolean
  language sql stable security definer set search_path = public
as $$
  select case
    when p_uid is null then false
    when public.is_gc_staff(p_uid) then public.gc_can(p_uid, p_capability)
    else exists (
      select 1 from public.memberships m
      where m.user_id = p_uid
        and m.org_id  = p_org
        and m.status  = 'active'
        and (
          case
            when m.custom_role_id is not null then
              exists (
                select 1 from public.org_custom_role_capabilities c
                where c.role_id = m.custom_role_id
                  and c.capability = p_capability
              )
            else
              case p_capability
                when 'view'               then m.role in ('account_owner','accountant','legal','delivery_ops','viewer')
                when 'view_financial'     then m.role in ('account_owner','accountant','legal')
                when 'operate'            then m.role in ('account_owner','delivery_ops')
                when 'manage_tax_banking' then m.role in ('account_owner','accountant')
                when 'manage_billing'     then m.role =  'account_owner'
                when 'manage_team'        then m.role =  'account_owner'
                when 'manage_settings'    then m.role =  'account_owner'
                else false
              end
          end
        )
    )
  end;
$$;

-- ----------------------------------------------------------------------------
-- 8. RPC: create_org_custom_role
-- ----------------------------------------------------------------------------
create or replace function public.create_org_custom_role(
  p_org uuid,
  p_name text,
  p_description text,
  p_capabilities text[]
)
  returns uuid
  language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role_id uuid;
  v_cap text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.member_can(v_uid, p_org, 'manage_team') then
    raise exception 'Not authorized';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'Role name is required';
  end if;
  if p_capabilities is null or array_length(p_capabilities, 1) is null then
    raise exception 'At least one capability is required';
  end if;

  foreach v_cap in array p_capabilities loop
    if v_cap not in (
      'view', 'view_financial', 'operate',
      'manage_tax_banking', 'manage_billing',
      'manage_team', 'manage_settings'
    ) then
      raise exception 'Unknown capability: %', v_cap;
    end if;
  end loop;

  insert into public.org_custom_roles (org_id, name, description, created_by)
  values (p_org, btrim(p_name), coalesce(btrim(p_description), ''), v_uid)
  returning id into v_role_id;

  insert into public.org_custom_role_capabilities (role_id, capability)
  select v_role_id, unnest(p_capabilities);

  return v_role_id;
end;
$$;

revoke execute on function public.create_org_custom_role(uuid, text, text, text[])
  from public, anon;
grant execute on function public.create_org_custom_role(uuid, text, text, text[])
  to authenticated;

-- ----------------------------------------------------------------------------
-- 9. RPC: list_org_custom_roles
-- ----------------------------------------------------------------------------
create or replace function public.list_org_custom_roles(p_org uuid)
  returns table (
    id uuid,
    name text,
    description text,
    status text,
    capabilities text[],
    member_count bigint,
    created_at timestamptz
  )
  language sql stable security definer set search_path = public
as $$
  select
    r.id,
    r.name,
    r.description,
    r.status,
    array(
      select c.capability
      from public.org_custom_role_capabilities c
      where c.role_id = r.id
      order by c.capability
    ) as capabilities,
    (
      select count(*)
      from public.memberships m
      where m.custom_role_id = r.id
        and m.status = 'active'
    ) as member_count,
    r.created_at
  from public.org_custom_roles r
  where r.org_id = p_org
    and r.status = 'active'
    and public.member_can(auth.uid(), p_org, 'view')
  order by r.created_at;
$$;

revoke execute on function public.list_org_custom_roles(uuid)
  from public, anon;
grant execute on function public.list_org_custom_roles(uuid)
  to authenticated;

-- ----------------------------------------------------------------------------
-- 10. Grant authenticated access to new tables
-- ----------------------------------------------------------------------------
grant select, insert, update on public.org_custom_roles to authenticated;
grant select, insert on public.org_custom_role_capabilities to authenticated;

-- ----------------------------------------------------------------------------
-- 11. Last-owner guard follows the custom-role override
--
-- member_can() ignores org_role once custom_role_id is set, so a limited
-- custom role strips manage_team while role stays account_owner. The guard
-- from 20260726000500 only watched role and status, and its "still an owner"
-- early return skipped custom_role_id changes entirely. A sole owner could
-- assign that limited role to themselves, or a co-owner could be stripped
-- and then the acting owner could demote: the other row still counted.
--
-- An active account_owner counts only while manage_team remains (no custom
-- role, or a custom role that grants it). manage_team is the client recovery
-- path: it can clear custom_role_id and restore the enum bundle, including
-- billing and settings. custom_role_id null keeps the previous meaning.
-- Capability rows are insert-only for authenticated, so the client strips
-- manage_team by changing custom_role_id, which this trigger sees.
-- ----------------------------------------------------------------------------
create or replace function public.tg_memberships_last_owner_guard()
  returns trigger
  language plpgsql security definer set search_path = public
as $$
declare
  v_org       uuid := coalesce(old.org_id, new.org_id);
  v_remaining int;
  v_old_keeps boolean;
  v_new_keeps boolean;
begin
  -- Only interesting when a recoverable owner stops being one.
  v_old_keeps := old.role = 'account_owner'
    and old.status = 'active'
    and (
      old.custom_role_id is null
      or exists (
        select 1 from public.org_custom_role_capabilities c
        where c.role_id = old.custom_role_id
          and c.capability = 'manage_team'
      )
    );

  if tg_op = 'UPDATE' then
    v_new_keeps := new.role = 'account_owner'
      and new.status = 'active'
      and (
        new.custom_role_id is null
        or exists (
          select 1 from public.org_custom_role_capabilities c
          where c.role_id = new.custom_role_id
            and c.capability = 'manage_team'
        )
      );
    if v_old_keeps and v_new_keeps then
      return new;
    end if;
    if not v_old_keeps then
      return new;
    end if;
  elsif tg_op = 'DELETE' then
    if not v_old_keeps then
      return old;
    end if;
  end if;

  select count(*) into v_remaining
  from public.memberships m
  where m.org_id = v_org
    and m.role = 'account_owner'
    and m.status = 'active'
    and (
      m.custom_role_id is null
      or exists (
        select 1 from public.org_custom_role_capabilities c
        where c.role_id = m.custom_role_id
          and c.capability = 'manage_team'
      )
    );

  if v_remaining = 0 then
    raise exception
      'Organization % would be left with no active account owner. Promote another member to account_owner first.',
      v_org
      using errcode = 'raise_exception',
            hint = 'Promote another member first; the two changes may be separate requests.';
  end if;

  return coalesce(new, old);
end;
$$;

revoke execute on function public.tg_memberships_last_owner_guard() from public, anon, authenticated, service_role;
