-- StormlightPMS — properties, property_assignments, units, tenants (SRS §4.4–§4.7)

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  name text not null,
  property_type property_type not null,
  region text,
  province text,
  city_municipality text,
  barangay text,
  street_address text,
  postal_code text,
  description text,
  status property_status not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
create index properties_org_idx on public.properties(org_id);
create index properties_status_idx on public.properties(status);
create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

create table public.property_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  profile_id uuid not null references public.profiles(id),
  property_id uuid not null references public.properties(id),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  unique (profile_id, property_id)
);
create index property_assignments_org_idx on public.property_assignments(org_id);
create index property_assignments_profile_idx on public.property_assignments(profile_id);
create index property_assignments_property_idx on public.property_assignments(property_id);

-- assigned profile must be a property_manager (enforced via trigger because
-- a check constraint cannot reference another table)
create or replace function public.enforce_assignment_role() returns trigger
  language plpgsql security definer set search_path = public
  as $$
  declare v_role user_role;
  begin
    select role into v_role from public.profiles where id = new.profile_id;
    if v_role is distinct from 'property_manager'::user_role then
      raise exception 'property_assignments.profile_id must reference a property_manager profile';
    end if;
    return new;
  end;
  $$;
create trigger trg_property_assignments_role
  before insert or update on public.property_assignments
  for each row execute function public.enforce_assignment_role();

-- app_pm_property_ids — SECURITY DEFINER so policies don't recurse via RLS
create or replace function public.app_pm_property_ids() returns setof uuid
  language sql stable security definer set search_path = public
  as $$
    select property_id from public.property_assignments where profile_id = auth.uid()
  $$;

create table public.units (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  property_id uuid not null references public.properties(id),
  unit_label text not null,
  floor text,
  bedrooms integer,
  floor_area_sqm numeric(10,2),
  base_monthly_rent numeric(14,2) not null check (base_monthly_rent >= 0),
  unit_status unit_status not null default 'vacant',
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (property_id, unit_label)
);
create index units_org_idx on public.units(org_id);
create index units_property_idx on public.units(property_id);
create index units_status_idx on public.units(unit_status);
create trigger trg_units_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  full_name text not null,
  email text,
  phone text,
  gov_id_type text,
  gov_id_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
create index tenants_org_idx on public.tenants(org_id);
create index tenants_status_idx on public.tenants(status);
create trigger trg_tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();
