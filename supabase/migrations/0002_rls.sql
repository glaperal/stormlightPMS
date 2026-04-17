-- Stormlight PMS — Row Level Security
-- Every row is scoped to a landlord_group; users see only rows where
-- group_id is one of their assigned groups. super_admin sees all.

-- Helper: set of groups the current auth user belongs to ---------------
create or replace function public.auth_group_ids()
returns setof uuid
language sql stable
security definer
set search_path = public
as $$
  select group_id from public.user_roles where user_id = auth.uid();
$$;

create or replace function public.auth_has_role(
  p_group uuid,
  p_roles app_role[]
) returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and group_id = p_group
      and role = any (p_roles)
  );
$$;

create or replace function public.auth_is_super_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

-- Enable RLS ------------------------------------------------------------
alter table landlord_groups  enable row level security;
alter table user_roles       enable row level security;
alter table properties       enable row level security;
alter table units            enable row level security;
alter table tenants          enable row level security;
alter table leases           enable row level security;
alter table ledgers          enable row level security;
alter table payments         enable row level security;
alter table tickets          enable row level security;

-- landlord_groups -------------------------------------------------------
create policy lg_select on landlord_groups for select
  using (public.auth_is_super_admin() or id in (select public.auth_group_ids()));
create policy lg_mutate on landlord_groups for all
  using (public.auth_is_super_admin())
  with check (public.auth_is_super_admin());

-- user_roles ------------------------------------------------------------
create policy ur_select on user_roles for select
  using (public.auth_is_super_admin() or user_id = auth.uid());
create policy ur_mutate on user_roles for all
  using (public.auth_is_super_admin())
  with check (public.auth_is_super_admin());

-- Common group-scoped SELECT: helper predicate used inline -------------
-- properties
create policy prop_select on properties for select
  using (public.auth_is_super_admin() or group_id in (select public.auth_group_ids()));
create policy prop_mutate on properties for all
  using (public.auth_is_super_admin()
         or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]))
  with check (public.auth_is_super_admin()
              or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]));

-- units
create policy unit_select on units for select
  using (public.auth_is_super_admin() or group_id in (select public.auth_group_ids()));
create policy unit_mutate on units for all
  using (public.auth_is_super_admin()
         or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]))
  with check (public.auth_is_super_admin()
              or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]));

-- tenants
create policy tenant_select on tenants for select
  using (public.auth_is_super_admin() or group_id in (select public.auth_group_ids()));
create policy tenant_mutate on tenants for all
  using (public.auth_is_super_admin()
         or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]))
  with check (public.auth_is_super_admin()
              or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]));

-- leases
create policy lease_select on leases for select
  using (public.auth_is_super_admin() or group_id in (select public.auth_group_ids()));
create policy lease_mutate on leases for all
  using (public.auth_is_super_admin()
         or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]))
  with check (public.auth_is_super_admin()
              or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]));

-- ledgers (PM + landlord can read/write; ledgers are system-generated primarily)
create policy ledger_select on ledgers for select
  using (public.auth_is_super_admin() or group_id in (select public.auth_group_ids()));
create policy ledger_mutate on ledgers for all
  using (public.auth_is_super_admin()
         or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]))
  with check (public.auth_is_super_admin()
              or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]));

-- payments
create policy payment_select on payments for select
  using (public.auth_is_super_admin() or group_id in (select public.auth_group_ids()));
create policy payment_mutate on payments for all
  using (public.auth_is_super_admin()
         or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]))
  with check (public.auth_is_super_admin()
              or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]));

-- tickets: maintenance role may update its assigned tickets' cost/status
create policy ticket_select on tickets for select
  using (public.auth_is_super_admin() or group_id in (select public.auth_group_ids()));

create policy ticket_insert on tickets for insert
  with check (public.auth_is_super_admin()
              or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]));

create policy ticket_update on tickets for update
  using (
    public.auth_is_super_admin()
    or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[])
    or (public.auth_has_role(group_id, array['maintenance']::app_role[]) and assigned_to = auth.uid())
  )
  with check (
    public.auth_is_super_admin()
    or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[])
    or (public.auth_has_role(group_id, array['maintenance']::app_role[]) and assigned_to = auth.uid())
  );

create policy ticket_delete on tickets for delete
  using (public.auth_is_super_admin()
         or public.auth_has_role(group_id, array['landlord','property_manager']::app_role[]));
