-- StormlightPMS — organizations + profiles (SRS §4.2, §4.3)

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_profile_id uuid,
  contact_email text,
  contact_phone text,
  status org_status not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now()
);

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id),
  role user_role not null,
  full_name text not null,
  email text not null,
  phone text,
  status profile_status not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  -- enforce: org_id may be null only for superadmin
  constraint profiles_org_id_role_chk
    check ((role = 'superadmin' and org_id is null) or (role <> 'superadmin' and org_id is not null))
);

create index profiles_org_idx on public.profiles(org_id);
create index profiles_role_idx on public.profiles(role);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- now that profiles exists, finish FKs on organizations
alter table public.organizations
  add constraint organizations_owner_fk foreign key (owner_profile_id)
    references public.profiles(id) deferrable initially deferred;
alter table public.organizations
  add constraint organizations_created_by_fk foreign key (created_by)
    references public.profiles(id);
alter table public.profiles
  add constraint profiles_created_by_fk foreign key (created_by)
    references public.profiles(id);

-- handle_new_user trigger (SRS §5.1 / P0-4)
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public
  as $$
  declare
    v_org uuid;
    v_role user_role;
    v_full_name text;
  begin
    v_org      := nullif(new.raw_user_meta_data ->> 'org_id', '')::uuid;
    v_role     := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'admin');
    v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));

    insert into public.profiles (id, org_id, role, full_name, email, status)
    values (new.id, v_org, v_role, v_full_name, new.email, 'active')
    on conflict (id) do nothing;

    -- first admin of an org becomes owner if owner is not yet set
    if v_role = 'admin' and v_org is not null then
      update public.organizations
         set owner_profile_id = new.id
       where id = v_org
         and owner_profile_id is null;
    end if;

    return new;
  end;
  $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
