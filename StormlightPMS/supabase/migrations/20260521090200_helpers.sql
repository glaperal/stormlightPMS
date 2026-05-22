-- StormlightPMS — JWT-claim helpers (SRS §5.2 / D2)
-- These read only auth.jwt() — never SELECT from profiles inside a policy.

create or replace function public.app_role() returns text
  language sql stable
  as $$
    select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
  $$;

create or replace function public.app_org() returns uuid
  language sql stable
  as $$
    select nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', '')::uuid
  $$;

-- set_updated_at trigger function (SRS §9.4 / P1-16)
create or replace function public.set_updated_at() returns trigger
  language plpgsql
  as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;
