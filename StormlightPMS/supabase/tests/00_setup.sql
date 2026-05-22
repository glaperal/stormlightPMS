-- pgTAP setup helpers for StormlightPMS RLS/trigger tests.
-- Loaded automatically by `supabase test db`.

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

-- Build a JWT-like claims object and a helper to switch identity.
create or replace function tests.set_claims(p_user_id uuid, p_role text, p_org uuid)
returns void
language plpgsql
as $$
declare
  v_claims jsonb;
begin
  v_claims := jsonb_build_object(
    'sub', p_user_id::text,
    'role', 'authenticated',
    'app_metadata', jsonb_build_object(
      'role', p_role,
      'org_id', p_org,
      'profile_status', 'active'
    )
  );
  perform set_config('request.jwt.claims', v_claims::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function tests.reset()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'postgres', true);
end;
$$;

create schema if not exists tests;
