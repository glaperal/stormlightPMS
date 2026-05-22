-- StormlightPMS — RLS policies (SRS §5.3, §5.5)
-- ENABLE + FORCE on every operational table; no anon role granted.

-- organizations ------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organizations force row level security;

create policy organizations_superadmin on public.organizations
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy organizations_admin_read on public.organizations
  for select to authenticated
  using (public.app_role() = 'admin' and id = (select public.app_org()));

create policy organizations_admin_update on public.organizations
  for update to authenticated
  using (public.app_role() = 'admin' and id = (select public.app_org()))
  with check (public.app_role() = 'admin' and id = (select public.app_org()));

create policy organizations_pm_read on public.organizations
  for select to authenticated
  using (public.app_role() = 'property_manager' and id = (select public.app_org()));

-- org_settings -------------------------------------------------
alter table public.org_settings enable row level security;
alter table public.org_settings force row level security;

create policy org_settings_superadmin on public.org_settings
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy org_settings_admin on public.org_settings
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy org_settings_pm_read on public.org_settings
  for select to authenticated
  using (public.app_role() = 'property_manager' and org_id = (select public.app_org()));

-- profiles -----------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
-- profiles policies use auth.uid() directly (do not call app_org/app_role since the JWT hook reads profiles)
create policy profiles_superadmin on public.profiles
  for all to authenticated
  using (
    exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'superadmin')
  )
  with check (
    exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'superadmin')
  );

create policy profiles_self_select on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_same_org_select on public.profiles
  for select to authenticated
  using (
    org_id is not null
    and org_id = (
      select p2.org_id from public.profiles p2 where p2.id = auth.uid()
    )
  );

create policy profiles_admin_manage on public.profiles
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p2
       where p2.id = auth.uid()
         and p2.role = 'admin'
         and p2.org_id = public.profiles.org_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p2
       where p2.id = auth.uid()
         and p2.role = 'admin'
         and p2.org_id = public.profiles.org_id
    )
  );

-- property_assignments ----------------------------------------
alter table public.property_assignments enable row level security;
alter table public.property_assignments force row level security;

create policy property_assignments_superadmin on public.property_assignments
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy property_assignments_admin on public.property_assignments
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy property_assignments_pm_self on public.property_assignments
  for select to authenticated
  using (public.app_role() = 'property_manager' and profile_id = auth.uid());

-- properties ---------------------------------------------------
alter table public.properties enable row level security;
alter table public.properties force row level security;

create policy properties_superadmin on public.properties
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy properties_admin on public.properties
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy properties_pm on public.properties
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and id in (select public.app_pm_property_ids())
  )
  with check (
    public.app_role() = 'property_manager'
    and id in (select public.app_pm_property_ids())
  );

-- units --------------------------------------------------------
alter table public.units enable row level security;
alter table public.units force row level security;

create policy units_superadmin on public.units
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy units_admin on public.units
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy units_pm on public.units
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and property_id in (select public.app_pm_property_ids())
  )
  with check (
    public.app_role() = 'property_manager'
    and property_id in (select public.app_pm_property_ids())
  );

-- tenants ------------------------------------------------------
alter table public.tenants enable row level security;
alter table public.tenants force row level security;

create policy tenants_superadmin on public.tenants
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy tenants_admin on public.tenants
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy tenants_pm on public.tenants
  for all to authenticated
  using (public.app_role() = 'property_manager' and org_id = (select public.app_org()))
  with check (public.app_role() = 'property_manager' and org_id = (select public.app_org()));

-- leases -------------------------------------------------------
alter table public.leases enable row level security;
alter table public.leases force row level security;

create policy leases_superadmin on public.leases
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy leases_admin on public.leases
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy leases_pm on public.leases
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.units u
       where u.id = leases.unit_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  )
  with check (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.units u
       where u.id = leases.unit_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  );

-- charges ------------------------------------------------------
alter table public.charges enable row level security;
alter table public.charges force row level security;

create policy charges_superadmin on public.charges
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy charges_admin on public.charges
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy charges_pm on public.charges
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = charges.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  )
  with check (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = charges.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  );

-- payments -----------------------------------------------------
alter table public.payments enable row level security;
alter table public.payments force row level security;

create policy payments_superadmin on public.payments
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy payments_admin on public.payments
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy payments_pm on public.payments
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = payments.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  )
  with check (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = payments.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  );

-- payment_allocations -----------------------------------------
alter table public.payment_allocations enable row level security;
alter table public.payment_allocations force row level security;

create policy payment_allocations_superadmin on public.payment_allocations
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy payment_allocations_admin on public.payment_allocations
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy payment_allocations_pm on public.payment_allocations
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.payments pm
        join public.leases l on l.id = pm.lease_id
        join public.units u on u.id = l.unit_id
       where pm.id = payment_allocations.payment_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  )
  with check (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.payments pm
        join public.leases l on l.id = pm.lease_id
        join public.units u on u.id = l.unit_id
       where pm.id = payment_allocations.payment_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  );

-- deposit_deductions ------------------------------------------
alter table public.deposit_deductions enable row level security;
alter table public.deposit_deductions force row level security;

create policy deposit_deductions_superadmin on public.deposit_deductions
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy deposit_deductions_admin on public.deposit_deductions
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy deposit_deductions_pm on public.deposit_deductions
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = deposit_deductions.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  )
  with check (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = deposit_deductions.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  );

-- maintenance_requests ----------------------------------------
alter table public.maintenance_requests enable row level security;
alter table public.maintenance_requests force row level security;

create policy maintenance_superadmin on public.maintenance_requests
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy maintenance_admin on public.maintenance_requests
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy maintenance_pm on public.maintenance_requests
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.units u
       where u.id = maintenance_requests.unit_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  )
  with check (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.units u
       where u.id = maintenance_requests.unit_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  );

-- documents ----------------------------------------------------
alter table public.documents enable row level security;
alter table public.documents force row level security;

create policy documents_superadmin on public.documents
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy documents_org on public.documents
  for all to authenticated
  using (public.app_role() in ('admin','property_manager') and org_id = (select public.app_org()))
  with check (public.app_role() in ('admin','property_manager') and org_id = (select public.app_org()));

-- notifications ------------------------------------------------
alter table public.notifications enable row level security;
alter table public.notifications force row level security;

create policy notifications_superadmin on public.notifications
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');

create policy notifications_admin_read on public.notifications
  for select to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy notifications_admin_update on public.notifications
  for update to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));

create policy notifications_pm_read on public.notifications
  for select to authenticated
  using (public.app_role() = 'property_manager' and profile_id = auth.uid());

create policy notifications_pm_update on public.notifications
  for update to authenticated
  using (public.app_role() = 'property_manager' and profile_id = auth.uid())
  with check (public.app_role() = 'property_manager' and profile_id = auth.uid());

-- audit_log: append-only, read-scoped --------------------------
alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

create policy audit_log_superadmin_read on public.audit_log
  for select to authenticated
  using (public.app_role() = 'superadmin');

create policy audit_log_admin_read on public.audit_log
  for select to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()));
-- no INSERT/UPDATE/DELETE policies — only SECURITY DEFINER triggers write here.
