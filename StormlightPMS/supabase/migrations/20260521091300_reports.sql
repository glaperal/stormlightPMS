-- StormlightPMS — reports as SECURITY INVOKER views/RPCs so RLS scopes them (SRS §6.12)

-- Outstanding balance per charge.
create or replace view public.v_charge_balances as
  select
    c.id as charge_id,
    c.org_id,
    c.lease_id,
    c.charge_type,
    c.amount,
    c.due_date,
    c.charge_status,
    coalesce(applied.applied, 0) as applied_amount,
    greatest(c.amount - coalesce(applied.applied, 0), 0) as outstanding
  from public.charges c
  left join lateral (
    select sum(pa.amount_applied) as applied
      from public.payment_allocations pa
      join public.payments p on p.id = pa.payment_id
     where pa.charge_id = c.id and p.payment_status = 'active'
  ) applied on true
  where c.charge_status <> 'void';

-- Per-lease ledger figures (FR-LEASE-7).
create or replace view public.v_lease_ledger as
  with payments_total as (
    select p.lease_id, sum(p.amount) as paid_total
      from public.payments p
     where p.payment_status = 'active'
     group by p.lease_id
  ),
  allocated_total as (
    select p.lease_id, sum(pa.amount_applied) as alloc_total
      from public.payments p
      join public.payment_allocations pa on pa.payment_id = p.id
      join public.charges c on c.id = pa.charge_id
     where p.payment_status = 'active' and c.charge_status <> 'void'
     group by p.lease_id
  ),
  charge_total as (
    select c.lease_id, sum(c.amount) as charged_total
      from public.charges c
     where c.charge_status <> 'void'
     group by c.lease_id
  )
  select
    l.id as lease_id,
    l.org_id,
    coalesce(ct.charged_total, 0)   as charged_total,
    coalesce(at.alloc_total, 0)     as allocated_total,
    coalesce(pt.paid_total, 0)      as paid_total,
    greatest(coalesce(ct.charged_total,0) - coalesce(at.alloc_total,0), 0) as outstanding_balance,
    greatest(coalesce(pt.paid_total,0)    - coalesce(at.alloc_total,0), 0) as unapplied_credit,
    l.security_deposit_amount as deposit_held,
    l.advance_amount          as advance_held
  from public.leases l
  left join payments_total pt on pt.lease_id = l.id
  left join allocated_total at on at.lease_id = l.id
  left join charge_total ct on ct.lease_id = l.id;

-- Dashboard top-line numbers.
create or replace function public.rpt_dashboard()
returns table (
  occupied_units int,
  vacant_units int,
  total_outstanding numeric(14,2),
  charges_due_next_7 numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (select count(*)::int from public.units u where u.unit_status = 'occupied') as occupied_units,
    (select count(*)::int from public.units u where u.unit_status = 'vacant')   as vacant_units,
    (select coalesce(sum(outstanding), 0) from public.v_charge_balances)::numeric(14,2) as total_outstanding,
    (select coalesce(sum(outstanding), 0)
       from public.v_charge_balances vb
      where vb.due_date between public.manila_today() and public.manila_today() + 7)::numeric(14,2)
      as charges_due_next_7;
$$;

-- Rent roll: every active lease with monthly rent + current balance.
create or replace view public.v_rent_roll as
  select
    l.id as lease_id,
    l.org_id,
    p.id as property_id,
    p.name as property_name,
    u.id as unit_id,
    u.unit_label,
    t.id as tenant_id,
    t.full_name as tenant_name,
    l.monthly_rent,
    l.start_date,
    l.end_date,
    coalesce(ll.outstanding_balance, 0) as outstanding_balance,
    coalesce(ll.unapplied_credit, 0)    as unapplied_credit
  from public.leases l
  join public.units u on u.id = l.unit_id
  join public.properties p on p.id = u.property_id
  join public.tenants t on t.id = l.tenant_id
  left join public.v_lease_ledger ll on ll.lease_id = l.id
  where l.lease_status = 'active';

-- Arrears aging buckets.
create or replace function public.rpt_arrears_aging()
returns table (
  bucket text,
  outstanding numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  -- wrap the aggregate so the output alias `bucket` is a real input column to
  -- order by (a bare `order by case bucket ...` resolves against the input
  -- columns, where `bucket` does not exist, and fails on PostgreSQL).
  select g.bucket, g.outstanding
  from (
    select case
             when days_past <= 0 then 'current'
             when days_past between 1 and 30 then '1-30'
             when days_past between 31 and 60 then '31-60'
             when days_past between 61 and 90 then '61-90'
             else '90+'
           end as bucket,
           sum(outstanding)::numeric(14,2) as outstanding
      from (
        select vb.outstanding,
               public.manila_today() - vb.due_date as days_past
          from public.v_charge_balances vb
         where vb.outstanding > 0
      ) x
     group by 1
  ) g
  order by case g.bucket
             when 'current' then 0
             when '1-30' then 1
             when '31-60' then 2
             when '61-90' then 3
             when '90+' then 4
           end;
$$;

-- Collection summary: charged vs collected in a date range (payment_date).
create or replace function public.rpt_collection_summary(p_from date, p_to date, p_property_id uuid default null)
returns table (
  property_id uuid,
  property_name text,
  total_charged numeric(14,2),
  total_collected numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  with charged as (
    select p.id as property_id, p.name as property_name, sum(c.amount) as total_charged
      from public.charges c
      join public.leases l on l.id = c.lease_id
      join public.units u on u.id = l.unit_id
      join public.properties p on p.id = u.property_id
     where c.charge_status <> 'void'
       and c.due_date between p_from and p_to
       and (p_property_id is null or p.id = p_property_id)
     group by p.id, p.name
  ),
  collected as (
    select p.id as property_id, p.name as property_name, sum(pm.amount) as total_collected
      from public.payments pm
      join public.leases l on l.id = pm.lease_id
      join public.units u on u.id = l.unit_id
      join public.properties p on p.id = u.property_id
     where pm.payment_status = 'active'
       and pm.payment_date between p_from and p_to
       and (p_property_id is null or p.id = p_property_id)
     group by p.id, p.name
  )
  select
    coalesce(ch.property_id, co.property_id) as property_id,
    coalesce(ch.property_name, co.property_name) as property_name,
    coalesce(ch.total_charged, 0)::numeric(14,2)   as total_charged,
    coalesce(co.total_collected, 0)::numeric(14,2) as total_collected
  from charged ch
  full outer join collected co on co.property_id = ch.property_id
  order by property_name;
$$;

-- Per-property income from payments in a date range.
create or replace function public.rpt_property_income(p_from date, p_to date)
returns table (
  property_id uuid,
  property_name text,
  total_received numeric(14,2)
)
language sql
stable
security invoker
set search_path = public
as $$
  select p.id, p.name, sum(pm.amount)::numeric(14,2)
    from public.payments pm
    join public.leases l on l.id = pm.lease_id
    join public.units u on u.id = l.unit_id
    join public.properties p on p.id = u.property_id
   where pm.payment_status = 'active'
     and pm.payment_date between p_from and p_to
   group by p.id, p.name
   order by p.name;
$$;

-- Deposit settlement RPC (FR-DEP-1..5).
create or replace function public.finalize_lease_settlement(p_lease_id uuid)
returns table (
  lease_id uuid,
  deposit_held numeric(14,2),
  deductions_total numeric(14,2),
  refund_amount numeric(14,2),
  shortfall_charge_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lease record;
  v_deductions numeric(14,2) := 0;
  v_refund numeric(14,2);
  v_shortfall numeric(14,2);
  v_charge_id uuid;
  v_unpaid_count int;
begin
  select id, org_id, lease_status, security_deposit_amount, termination_date,
         deposit_settled_date
    into v_lease
    from public.leases
   where id = p_lease_id
   for update;

  if not found then
    raise exception 'lease_not_found';
  end if;
  if v_lease.lease_status not in ('terminated','expired') then
    raise exception 'lease_must_be_terminated_or_expired';
  end if;
  if v_lease.deposit_settled_date is not null then
    raise exception 'lease_already_settled';
  end if;

  -- block if any non-deposit charge still has balance (FR-DEP-1)
  select count(*) into v_unpaid_count
    from public.charges c
   where c.lease_id = p_lease_id
     and c.charge_status in ('unpaid','partially_paid')
     and c.charge_type <> 'move_out_balance';
  if v_unpaid_count > 0 then
    raise exception 'outstanding_non_deposit_charges:%', v_unpaid_count;
  end if;

  select coalesce(sum(amount), 0) into v_deductions
    from public.deposit_deductions where lease_id = p_lease_id;

  v_refund := greatest(0, v_lease.security_deposit_amount - v_deductions);
  v_shortfall := greatest(0, v_deductions - v_lease.security_deposit_amount);

  update public.leases
     set deposit_refund_amount = v_refund,
         deposit_settled_date = public.manila_today()
   where id = p_lease_id;

  if v_shortfall > 0 then
    insert into public.charges(org_id, lease_id, charge_type, amount, due_date, description, created_by)
    values (v_lease.org_id, p_lease_id, 'move_out_balance', v_shortfall, public.manila_today(),
            'Shortfall after deposit settlement', auth.uid())
    returning id into v_charge_id;
  end if;

  return query select p_lease_id, v_lease.security_deposit_amount, v_deductions, v_refund, v_charge_id;
end;
$$;
grant execute on function public.finalize_lease_settlement(uuid) to authenticated;

-- Copy charges from one billing_period into a new one (FR-CHG-4).
create or replace function public.copy_charges(
  p_lease_id uuid,
  p_from_period date,
  p_to_period date,
  p_due_date date
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  insert into public.charges(org_id, lease_id, charge_type, description, billing_period, amount, due_date, created_by)
  select org_id, lease_id, charge_type, description, p_to_period, amount, p_due_date, auth.uid()
    from public.charges
   where lease_id = p_lease_id
     and billing_period = p_from_period
     and charge_status <> 'void';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function public.copy_charges(uuid, date, date, date) to authenticated;

-- Transactional CSV import dispatcher (called by Edge Function).
-- Rows come as jsonb; the Edge Function has already validated/typed them.
create or replace function public.do_csv_import(p_entity text, p_rows jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  r jsonb;
begin
  if p_entity = 'properties' then
    insert into public.properties(org_id, name, property_type, region, province,
      city_municipality, barangay, street_address, postal_code, description)
    select
      (e->>'org_id')::uuid,
      e->>'name',
      (e->>'property_type')::property_type,
      e->>'region', e->>'province', e->>'city_municipality',
      e->>'barangay', e->>'street_address', e->>'postal_code', e->>'description'
      from jsonb_array_elements(p_rows) as e;
  elsif p_entity = 'units' then
    insert into public.units(org_id, property_id, unit_label, floor, bedrooms,
      floor_area_sqm, base_monthly_rent)
    select
      (e->>'org_id')::uuid,
      (e->>'property_id')::uuid,
      e->>'unit_label',
      e->>'floor',
      nullif(e->>'bedrooms','')::int,
      nullif(e->>'floor_area_sqm','')::numeric,
      (e->>'base_monthly_rent')::numeric
      from jsonb_array_elements(p_rows) as e;
  elsif p_entity = 'tenants' then
    insert into public.tenants(org_id, full_name, email, phone,
      gov_id_type, gov_id_number, emergency_contact_name, emergency_contact_phone)
    select
      (e->>'org_id')::uuid,
      e->>'full_name', e->>'email', e->>'phone',
      e->>'gov_id_type', e->>'gov_id_number',
      e->>'emergency_contact_name', e->>'emergency_contact_phone'
      from jsonb_array_elements(p_rows) as e;
  elsif p_entity = 'leases' then
    insert into public.leases(org_id, unit_id, tenant_id, start_date, end_date,
      monthly_rent, payment_due_day, advance_months, advance_amount,
      security_deposit_months, security_deposit_amount)
    select
      (e->>'org_id')::uuid,
      (e->>'unit_id')::uuid,
      (e->>'tenant_id')::uuid,
      (e->>'start_date')::date,
      (e->>'end_date')::date,
      (e->>'monthly_rent')::numeric,
      coalesce(nullif(e->>'payment_due_day','')::int, 5),
      coalesce(nullif(e->>'advance_months','')::numeric, 1),
      coalesce(nullif(e->>'advance_amount','')::numeric, 0),
      coalesce(nullif(e->>'security_deposit_months','')::numeric, 2),
      coalesce(nullif(e->>'security_deposit_amount','')::numeric, 0)
      from jsonb_array_elements(p_rows) as e;
  else
    raise exception 'unsupported_entity:%', p_entity;
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function public.do_csv_import(text, jsonb) to service_role;
