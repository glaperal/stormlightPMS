-- StormlightPMS — custom access-token hook (SRS §5.2 / D2)
-- Stamps role, org_id, profile_status into JWT app_metadata at mint time.
-- Refuses to mint claims for inactive profiles (§5.8).

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (event ->> 'user_id')::uuid;
  v_claims  jsonb := event -> 'claims';
  v_app     jsonb := coalesce(v_claims -> 'app_metadata', '{}'::jsonb);
  v_profile record;
begin
  select p.role, p.org_id, p.status, o.status as org_status
    into v_profile
    from public.profiles p
    left join public.organizations o on o.id = p.org_id
   where p.id = v_user_id;

  if v_profile.role is null then
    return event;
  end if;

  -- refuse to mint app claims if profile inactive (§5.8)
  if v_profile.status <> 'active' then
    v_app := v_app
      || jsonb_build_object(
        'role', '',
        'org_id', null,
        'profile_status', v_profile.status::text
      );
  else
    v_app := v_app
      || jsonb_build_object(
        'role', v_profile.role::text,
        'org_id', v_profile.org_id,
        'profile_status', v_profile.status::text
      );
  end if;

  v_claims := jsonb_set(v_claims, '{app_metadata}', v_app);
  event := jsonb_set(event, '{claims}', v_claims);
  return event;
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
