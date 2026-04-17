-- Stormlight PMS — triggers
-- A) lease status -> unit status
-- B) payment -> ledger clearance

-- A) Keep unit.status in sync with its Active lease ---------------------
create or replace function public.lease_sync_unit_status()
returns trigger language plpgsql as $$
begin
  if (tg_op in ('INSERT','UPDATE')) then
    if new.status = 'Active' then
      update public.units set status = 'Occupied' where id = new.unit_id;
    elsif new.status in ('Ended','Terminated') then
      -- Only revert if there's no other Active lease on this unit.
      if not exists (
        select 1 from public.leases
        where unit_id = new.unit_id and status = 'Active' and id <> new.id
      ) then
        update public.units set status = 'Vacant' where id = new.unit_id;
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_lease_sync_unit on public.leases;
create trigger trg_lease_sync_unit
  after insert or update of status on public.leases
  for each row execute function public.lease_sync_unit_status();

-- B) Recompute ledger.status whenever a payment row changes ------------
create or replace function public.payment_recompute_ledger()
returns trigger language plpgsql as $$
declare
  v_ledger_id uuid;
  v_ledger_amount numeric(14,2);
  v_paid numeric(14,2);
begin
  v_ledger_id := coalesce(new.ledger_id, old.ledger_id);

  select amount into v_ledger_amount from public.ledgers where id = v_ledger_id;
  select coalesce(sum(amount), 0) into v_paid
    from public.payments where ledger_id = v_ledger_id;

  update public.ledgers
    set status = case
      when v_paid <= 0 then 'Unpaid'
      when v_paid >= v_ledger_amount then 'Cleared'
      else 'Partial'
    end
    where id = v_ledger_id;

  return coalesce(new, old);
end $$;

drop trigger if exists trg_payment_recompute_ledger on public.payments;
create trigger trg_payment_recompute_ledger
  after insert or update or delete on public.payments
  for each row execute function public.payment_recompute_ledger();
