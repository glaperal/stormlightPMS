-- Stormlight PMS — automated billing engine
-- Inserts monthly Rent / Dues / VAT ledgers for every Active lease.
-- Idempotent via the unique index ledgers_lease_type_due_uniq.

create extension if not exists pg_cron;

create or replace function public.generate_monthly_ledgers(p_billing_month date default date_trunc('month', current_date)::date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_vat_registered boolean;
  v_rent numeric(14,2);
  v_vat  numeric(14,2);
  v_dues numeric(14,2);
  v_due_date date := p_billing_month;
  v_count integer := 0;
begin
  for r in
    select l.*, g.vat_registered, g.id as group_id_ref
      from public.leases l
      join public.landlord_groups g on g.id = l.group_id
     where l.status = 'Active'
       and l.start_date <= v_due_date
       and (l.end_date is null or l.end_date >= v_due_date)
  loop
    v_vat_registered := r.vat_registered and r.vat_rate > 0;

    -- Base rent
    v_rent := r.base_rent;
    if v_rent > 0 then
      insert into public.ledgers (group_id, lease_id, amount, type, due_date, status)
        values (r.group_id_ref, r.id, v_rent, 'Rent', v_due_date, 'Unpaid')
        on conflict (lease_id, type, due_date) do nothing;
      v_count := v_count + 1;
    end if;

    -- VAT (only if group is VAT registered AND lease has a nonzero rate)
    if v_vat_registered then
      v_vat := round(v_rent * (r.vat_rate / 100.0), 2);
      if v_vat > 0 then
        insert into public.ledgers (group_id, lease_id, amount, type, due_date, status)
          values (r.group_id_ref, r.id, v_vat, 'VAT', v_due_date, 'Unpaid')
          on conflict (lease_id, type, due_date) do nothing;
        v_count := v_count + 1;
      end if;
    end if;

    -- Association dues (stored on lease.dues if nonzero)
    v_dues := coalesce(r.dues, 0);
    if v_dues > 0 then
      insert into public.ledgers (group_id, lease_id, amount, type, due_date, status)
        values (r.group_id_ref, r.id, v_dues, 'Dues', v_due_date, 'Unpaid')
        on conflict (lease_id, type, due_date) do nothing;
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end
$$;

-- Schedule: 00:00 on the 1st of every month.
-- pg_cron may not be available in every local Docker stack; wrapped in DO.
do $$
begin
  perform cron.schedule(
    'stormlight-monthly-billing',
    '0 0 1 * *',
    $cron$ select public.generate_monthly_ledgers(); $cron$
  );
exception when undefined_table or undefined_function or undefined_schema then
  raise notice 'pg_cron not available in this environment; skipping schedule';
end $$;
