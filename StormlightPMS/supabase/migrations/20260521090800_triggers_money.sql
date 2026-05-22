-- StormlightPMS — financial integrity triggers (SRS §9.4, §4.11)
-- Allocation guard + charge-status recompute. Both lock rows with FOR UPDATE.

-- Recompute one charge's status from non-void allocations attached to non-void payments.
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

-- BEFORE INSERT/UPDATE allocation guard: lock and validate.
create or replace function public.payment_allocations_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment record;
  v_charge record;
  v_alloc_for_payment numeric(14,2);
  v_alloc_for_charge numeric(14,2);
  v_old_applied numeric(14,2) := 0;
begin
  -- Lock parents
  select id, lease_id, amount, payment_status, org_id
    into v_payment
    from public.payments
   where id = new.payment_id
   for update;

  if not found then
    raise exception 'payment_allocations: payment % not found', new.payment_id;
  end if;

  select id, lease_id, amount, charge_status, org_id
    into v_charge
    from public.charges
   where id = new.charge_id
   for update;

  if not found then
    raise exception 'payment_allocations: charge % not found', new.charge_id;
  end if;

  if v_payment.payment_status = 'void' then
    raise exception 'payment_allocations: cannot allocate against a void payment';
  end if;
  if v_charge.charge_status = 'void' then
    raise exception 'payment_allocations: cannot allocate to a void charge';
  end if;
  if v_payment.lease_id <> v_charge.lease_id then
    raise exception 'payment_allocations: payment and charge must belong to the same lease';
  end if;
  if v_payment.org_id <> v_charge.org_id then
    raise exception 'payment_allocations: payment and charge must belong to the same organization';
  end if;
  if new.org_id <> v_payment.org_id then
    new.org_id := v_payment.org_id;
  end if;

  if tg_op = 'UPDATE' then
    v_old_applied := old.amount_applied;
  end if;

  -- per-payment cap
  select coalesce(sum(amount_applied), 0) into v_alloc_for_payment
    from public.payment_allocations
   where payment_id = new.payment_id
     and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_alloc_for_payment + new.amount_applied > v_payment.amount then
    raise exception 'payment_allocations: total allocated (%) would exceed payment amount (%)',
      v_alloc_for_payment + new.amount_applied, v_payment.amount;
  end if;

  -- per-charge cap
  select coalesce(sum(pa.amount_applied), 0) into v_alloc_for_charge
    from public.payment_allocations pa
    join public.payments p on p.id = pa.payment_id
   where pa.charge_id = new.charge_id
     and p.payment_status = 'active'
     and pa.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_alloc_for_charge + new.amount_applied > v_charge.amount then
    raise exception 'payment_allocations: total applied (%) would exceed charge amount (%)',
      v_alloc_for_charge + new.amount_applied, v_charge.amount;
  end if;

  return new;
end;
$$;

create trigger trg_payment_allocations_guard
  before insert or update on public.payment_allocations
  for each row execute function public.payment_allocations_guard();

-- AFTER triggers to keep charge_status fresh.
create or replace function public.payment_allocations_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.recompute_charge_status(new.charge_id);
  elsif tg_op = 'UPDATE' then
    perform public.recompute_charge_status(new.charge_id);
    if old.charge_id is distinct from new.charge_id then
      perform public.recompute_charge_status(old.charge_id);
    end if;
  elsif tg_op = 'DELETE' then
    perform public.recompute_charge_status(old.charge_id);
  end if;
  return null;
end;
$$;

create trigger trg_payment_allocations_after_change
  after insert or update or delete on public.payment_allocations
  for each row execute function public.payment_allocations_after_change();

-- When a payment is voided/un-voided, recompute every charge it touches.
create or replace function public.payments_status_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if (tg_op = 'UPDATE' and old.payment_status is distinct from new.payment_status) then
    for r in select distinct charge_id from public.payment_allocations where payment_id = new.id loop
      perform public.recompute_charge_status(r.charge_id);
    end loop;
  end if;
  return null;
end;
$$;

create trigger trg_payments_status_after_change
  after update on public.payments
  for each row execute function public.payments_status_after_change();

-- Block client edits that would reduce a charge's amount below allocated total (FR-CHG-3).
create or replace function public.charges_amount_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applied numeric(14,2);
begin
  if tg_op = 'UPDATE' and new.amount is distinct from old.amount then
    select coalesce(sum(pa.amount_applied), 0) into v_applied
      from public.payment_allocations pa
      join public.payments p on p.id = pa.payment_id
     where pa.charge_id = new.id and p.payment_status = 'active';
    if new.amount < v_applied then
      raise exception 'charges.amount (%) cannot be reduced below allocated total (%)',
        new.amount, v_applied;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_charges_amount_guard
  before update on public.charges
  for each row execute function public.charges_amount_guard();

-- Block voiding a charge that has any active allocation (FR-CHG-3).
create or replace function public.charges_void_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applied numeric(14,2);
begin
  if tg_op = 'UPDATE'
     and new.charge_status = 'void'
     and old.charge_status <> 'void' then
    select coalesce(sum(pa.amount_applied), 0) into v_applied
      from public.payment_allocations pa
      join public.payments p on p.id = pa.payment_id
     where pa.charge_id = new.id and p.payment_status = 'active';
    if v_applied > 0 then
      raise exception 'charges: cannot void a charge with active allocations (%). Void the payment(s) first.', v_applied;
    end if;
    new.voided_at := coalesce(new.voided_at, now());
    new.voided_by := coalesce(new.voided_by, auth.uid());
  end if;
  return new;
end;
$$;
create trigger trg_charges_void_guard
  before update on public.charges
  for each row execute function public.charges_void_guard();

-- When a payment moves to 'void', drop its allocations so charges revert cleanly (FR-PAY-7).
create or replace function public.payments_void_cascade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.payment_status = 'void'
     and old.payment_status <> 'void' then
    delete from public.payment_allocations where payment_id = new.id;
    new.voided_at := coalesce(new.voided_at, now());
    new.voided_by := coalesce(new.voided_by, auth.uid());
  end if;
  return new;
end;
$$;
create trigger trg_payments_void_cascade
  before update on public.payments
  for each row execute function public.payments_void_cascade();
