-- StormlightPMS — Integrity hardening: accepted SRS §12 Open Recommendations.
-- OR-1 tenant-delete guard, OR-4 allocation org consistency, OR-5 documents RLS
-- tightened to PM property scope, OR-6 child↔parent org_id assertions (retrofit),
-- OR-10 maintenance-status-change notification (FR-MNT-4).

-- ---- OR-1: a tenant with an active/draft lease cannot be deleted (FR-TEN-4) ----
create or replace function public.tenants_delete_guard() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.leases l
     where l.tenant_id = old.id and l.lease_status in ('active','draft')
  ) then
    raise exception 'cannot delete tenant with an active or draft lease; archive instead';
  end if;
  return old;
end; $$;
create trigger trg_tenants_delete_guard before delete on public.tenants
  for each row execute function public.tenants_delete_guard();

-- ---- OR-4: payment_allocations org_id must equal payment's and charge's org ----
create or replace function public.assert_allocation_org() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_pay_org uuid; v_chg_org uuid;
begin
  select org_id into v_pay_org from public.payments where id = new.payment_id;
  select org_id into v_chg_org from public.charges  where id = new.charge_id;
  if new.org_id is null then new.org_id := v_pay_org; end if;
  if new.org_id <> v_pay_org or new.org_id <> v_chg_org then
    raise exception 'payment_allocations.org_id must equal payment org (%) and charge org (%)', v_pay_org, v_chg_org;
  end if;
  return new;
end; $$;
-- runs alongside the existing allocation guard; both are BEFORE INSERT/UPDATE.
create trigger trg_assert_allocation_org before insert or update on public.payment_allocations
  for each row execute function public.assert_allocation_org();

-- ---- OR-6 (retrofit): child org_id must match parent ----
-- charges/payments/deposit_deductions -> lease.org_id
create or replace function public.assert_lease_child_org() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.leases where id = new.lease_id;
  if v_org is null then raise exception '%: lease % not found', tg_table_name, new.lease_id; end if;
  if new.org_id is null then new.org_id := v_org; end if;
  if new.org_id <> v_org then raise exception '%.org_id (%) must match lease org (%)', tg_table_name, new.org_id, v_org; end if;
  return new;
end; $$;
create trigger trg_charges_org_guard before insert or update on public.charges
  for each row execute function public.assert_lease_child_org();
create trigger trg_payments_org_guard before insert or update on public.payments
  for each row execute function public.assert_lease_child_org();
create trigger trg_deposit_deductions_org_guard before insert or update on public.deposit_deductions
  for each row execute function public.assert_lease_child_org();

-- units -> property.org_id
create or replace function public.assert_unit_property_org() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.properties where id = new.property_id;
  if v_org is null then raise exception 'units: property % not found', new.property_id; end if;
  if new.org_id is null then new.org_id := v_org; end if;
  if new.org_id <> v_org then raise exception 'units.org_id (%) must match property org (%)', new.org_id, v_org; end if;
  return new;
end; $$;
create trigger trg_units_org_guard before insert or update on public.units
  for each row execute function public.assert_unit_property_org();

-- leases -> unit.org_id (and tenant must be same org)
create or replace function public.assert_lease_org() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_unit_org uuid; v_tenant_org uuid;
begin
  select org_id into v_unit_org from public.units where id = new.unit_id;
  select org_id into v_tenant_org from public.tenants where id = new.tenant_id;
  if v_unit_org is null then raise exception 'leases: unit % not found', new.unit_id; end if;
  if new.org_id is null then new.org_id := v_unit_org; end if;
  if new.org_id <> v_unit_org then raise exception 'leases.org_id (%) must match unit org (%)', new.org_id, v_unit_org; end if;
  if v_tenant_org is distinct from v_unit_org then raise exception 'leases: tenant org (%) must match unit org (%)', v_tenant_org, v_unit_org; end if;
  return new;
end; $$;
create trigger trg_leases_org_guard before insert or update on public.leases
  for each row execute function public.assert_lease_org();

-- maintenance_requests -> unit.org_id
create or replace function public.assert_maintenance_org() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.units where id = new.unit_id;
  if v_org is null then raise exception 'maintenance_requests: unit % not found', new.unit_id; end if;
  if new.org_id is null then new.org_id := v_org; end if;
  if new.org_id <> v_org then raise exception 'maintenance_requests.org_id (%) must match unit org (%)', new.org_id, v_org; end if;
  return new;
end; $$;
create trigger trg_maintenance_org_guard before insert or update on public.maintenance_requests
  for each row execute function public.assert_maintenance_org();

-- ---- OR-5: tighten documents RLS to the PM's assigned-property scope ----
-- Resolve the property a document belongs to (null for tenant-scoped docs).
create or replace function public.doc_property_id(p_entity_type text, p_entity_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select case p_entity_type
    when 'property' then p_entity_id
    when 'unit'     then (select property_id from public.units where id = p_entity_id)
    when 'lease'    then (select u.property_id from public.leases l join public.units u on u.id = l.unit_id where l.id = p_entity_id)
    when 'payment'  then (select u.property_id from public.payments pm join public.leases l on l.id = pm.lease_id join public.units u on u.id = l.unit_id where pm.id = p_entity_id)
    else null
  end;
$$;

drop policy if exists documents_org on public.documents;
create policy documents_admin on public.documents
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));
create policy documents_pm on public.documents
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and org_id = (select public.app_org())
    and public.doc_property_id(entity_type, entity_id) in (select public.app_pm_property_ids())
  )
  with check (
    public.app_role() = 'property_manager'
    and org_id = (select public.app_org())
    and public.doc_property_id(entity_type, entity_id) in (select public.app_pm_property_ids())
  );

-- ---- OR-10 (FR-MNT-4): notify reporter on maintenance status change ----
create or replace function public.maintenance_status_notify() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_unit_label text;
begin
  if new.created_by is null then return null; end if;
  select unit_label into v_unit_label from public.units where id = new.unit_id;
  insert into public.notifications(org_id, profile_id, notification_type, title, body, entity_type, entity_id, dedupe_key)
  values (new.org_id, new.created_by, 'maintenance_update',
          format('Maintenance %s', replace(new.status::text, '_', ' ')),
          format('"%s" on unit %s is now %s.', new.title, coalesce(v_unit_label,'?'), replace(new.status::text,'_',' ')),
          'maintenance_request', new.id,
          format('maintenance_update:%s:%s', new.id, new.status))
  on conflict (dedupe_key) do nothing;
  return null;
end; $$;
create trigger trg_maintenance_status_notify
  after update of status on public.maintenance_requests
  for each row when (old.status is distinct from new.status)
  execute function public.maintenance_status_notify();
