-- Aurora cutover shim — apply on the NEW 24Frame cluster only.
-- Do not apply to survivor uevsculwzwlhxeamagwg.
-- Auth identity stays Supabase Auth. No Cognito.
-- Recreates the PostgREST-shaped helpers Slice 2 RPCs already call.

create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    ),
    ''
  )::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
$$;
