-- StormlightPMS — unit-status trigger + status-column guard + audit triggers
-- SRS §6.5 transition table, §5.3 status protection, §4.17/§9.4 audit log

-- Lease → unit status transitions (SRS §6.5).
create or replace function public.apply_lease_unit_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_status unit_status;
begin
  if tg_op = 'INSERT' then
    return new;
  end if;
  if old.lease_status is not distinct from new.lease_status then
    return new;
  end if;

  -- only manipulate unit if not under_maintenance / unavailable
  select unit_status into v_unit_status from public.units where id = new.unit_id for update;
  if v_unit_status in ('under_maintenance','unavailable') then
    return new;
  end if;

  if old.lease_status = 'draft' and new.lease_status = 'active' then
    update public.units set unit_status = 'occupied' where id = new.unit_id;
  elsif new.lease_status in ('terminated','expired') and old.lease_status = 'active' then
    update public.units set unit_status = 'vacant' where id = new.unit_id;
  end if;

  return new;
end;
$$;
create trigger trg_leases_unit_status
  after update of lease_status on public.leases
  for each row execute function public.apply_lease_unit_status();

-- Forbid activating against a unit in under_maintenance / unavailable
create or replace function public.leases_activate_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status unit_status;
begin
  if tg_op = 'UPDATE' and new.lease_status = 'active' and old.lease_status <> 'active' then
    select unit_status into v_status from public.units where id = new.unit_id;
    if v_status in ('under_maintenance','unavailable') then
      raise exception 'cannot activate lease: unit is %', v_status;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_leases_activate_guard
  before update of lease_status on public.leases
  for each row execute function public.leases_activate_guard();

-- Status-column guard: prevent client from setting trigger-maintained columns directly.
-- Implemented per-table because the SECURITY DEFINER paths (recompute_charge_status,
-- payment_allocations_after_change, payments_void_cascade, etc.) bypass the guard
-- by running with elevated rights via SET LOCAL role.

create or replace function public.guard_charge_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and current_setting('app.trigger_internal', true) is distinct from 'on'
     and new.charge_status is distinct from old.charge_status
     and not (new.charge_status = 'void' and old.charge_status <> 'void') then
    raise exception 'charges.charge_status is maintained by trigger; only voiding is permitted from the client';
  end if;
  return new;
end;
$$;
-- This guard runs BEFORE; internal triggers temporarily set app.trigger_internal = 'on'.
-- We update those internal trigger functions to flip the flag.
create trigger trg_charges_status_guard
  before update on public.charges
  for each row execute function public.guard_charge_status();

create or replace function public.guard_unit_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and current_setting('app.trigger_internal', true) is distinct from 'on'
     and new.unit_status is distinct from old.unit_status
     and new.unit_status not in ('under_maintenance','unavailable','vacant') then
    -- allow manual moves only to under_maintenance/unavailable/vacant; occupied is lease-driven.
    raise exception 'units.unit_status cannot be set to % manually', new.unit_status;
  end if;
  return new;
end;
$$;
create trigger trg_units_status_guard
  before update on public.units
  for each row execute function public.guard_unit_status();

-- Re-wire the SECURITY DEFINER status-mutating functions to set the internal flag.
create or replace function public.recompute_charge_status(p_charge_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_charge_amount numeric(14,2);
  v_charge_status charge_status;
  v_applied numeric(14,2);
  v_new charge_status;
begin
  perform set_config('app.trigger_internal','on', true);

  select amount, charge_status
    into v_charge_amount, v_charge_status
    from public.charges
   where id = p_charge_id
   for update;

  if not found then
    return;
  end if;

  if v_charge_status = 'void' then
    return;
  end if;

  select coalesce(sum(pa.amount_applied), 0)
    into v_applied
    from public.payment_allocations pa
    join public.payments p on p.id = pa.payment_id
   where pa.charge_id = p_charge_id
     and p.payment_status = 'active';

  if v_applied <= 0 then
    v_new := 'unpaid';
  elsif v_applied < v_charge_amount then
    v_new := 'partially_paid';
  else
    v_new := 'paid';
  end if;

  if v_new is distinct from v_charge_status then
    update public.charges
       set charge_status = v_new
     where id = p_charge_id;
  end if;
end;
$$;

create or replace function public.apply_lease_unit_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_status unit_status;
begin
  if tg_op = 'INSERT' then
    return new;
  end if;
  if old.lease_status is not distinct from new.lease_status then
    return new;
  end if;

  perform set_config('app.trigger_internal','on', true);

  select unit_status into v_unit_status from public.units where id = new.unit_id for update;
  if v_unit_status in ('under_maintenance','unavailable') then
    return new;
  end if;

  if old.lease_status = 'draft' and new.lease_status = 'active' then
    update public.units set unit_status = 'occupied' where id = new.unit_id;
  elsif new.lease_status in ('terminated','expired') and old.lease_status = 'active' then
    update public.units set unit_status = 'vacant' where id = new.unit_id;
  end if;

  return new;
end;
$$;

-- Audit triggers (NFR-11). One generic function over the financial tables.
create or replace function public.audit_trigger() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_org uuid;
  v_entity_id uuid;
  v_detail jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
    v_entity_id := (to_jsonb(new) ->> 'id')::uuid;
    v_org := (to_jsonb(new) ->> 'org_id')::uuid;
    v_detail := jsonb_build_object('after', to_jsonb(new));
  elsif tg_op = 'UPDATE' then
    v_entity_id := (to_jsonb(new) ->> 'id')::uuid;
    v_org := (to_jsonb(new) ->> 'org_id')::uuid;
    if (tg_table_name = 'charges'   and new.charge_status  = 'void' and old.charge_status  <> 'void')
       or (tg_table_name = 'payments' and new.payment_status = 'void' and old.payment_status <> 'void')
       or (tg_table_name = 'leases'   and new.lease_status   = 'terminated' and old.lease_status <> 'terminated') then
      v_action := 'void';
    else
      v_action := 'update';
    end if;
    v_detail := jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new));
  else
    v_action := 'delete';
    v_entity_id := (to_jsonb(old) ->> 'id')::uuid;
    v_org := (to_jsonb(old) ->> 'org_id')::uuid;
    v_detail := jsonb_build_object('before', to_jsonb(old));
  end if;

  insert into public.audit_log(org_id, profile_id, action, entity_type, entity_id, detail)
  values (v_org, auth.uid(), v_action, tg_table_name, v_entity_id, v_detail);
  return null;
end;
$$;

create trigger trg_audit_leases
  after insert or update or delete on public.leases
  for each row execute function public.audit_trigger();
create trigger trg_audit_charges
  after insert or update or delete on public.charges
  for each row execute function public.audit_trigger();
create trigger trg_audit_payments
  after insert or update or delete on public.payments
  for each row execute function public.audit_trigger();
create trigger trg_audit_payment_allocations
  after insert or update or delete on public.payment_allocations
  for each row execute function public.audit_trigger();
create trigger trg_audit_deposit_deductions
  after insert or update or delete on public.deposit_deductions
  for each row execute function public.audit_trigger();
