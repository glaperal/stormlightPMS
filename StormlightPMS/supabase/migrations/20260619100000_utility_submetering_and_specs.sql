-- StormlightPMS — D7 utility sub-metering + D8 unit specs (SRS §4.6, §4.23–4.24, §6.16, §9.5)
-- Built on the existing v0.2 money model: generation creates ordinary `charges`,
-- so the charge-status + allocation triggers are reused unchanged.

-- ---- D8: optional polymorphic unit specs ----------------------------------
alter table public.units
  add column specs jsonb not null default '{}'::jsonb;

-- ---- D7: enums ------------------------------------------------------------
create type utility_type as enum ('electricity', 'water');
create type utility_allocation_method as enum ('by_submeter', 'equal_split', 'by_floor_area');

-- ---- D7: utility_bills (§4.23) -------------------------------------------
create table public.utility_bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.app_org() references public.organizations(id),
  property_id uuid not null references public.properties(id),
  utility_type utility_type not null,
  billing_period date not null,
  provider text,
  total_amount numeric(14,2) not null check (total_amount > 0),
  total_consumption numeric(14,2),
  bill_date date,
  due_date date not null,
  allocation_method utility_allocation_method not null default 'by_submeter',
  charges_generated_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (property_id, utility_type, billing_period)
);
create index utility_bills_org_idx on public.utility_bills(org_id);
create index utility_bills_property_idx on public.utility_bills(property_id);
create index utility_bills_period_idx on public.utility_bills(org_id, utility_type, billing_period);
create trigger trg_utility_bills_updated_at before update on public.utility_bills
  for each row execute function public.set_updated_at();

-- ---- D7: utility_meter_readings (§4.24) ----------------------------------
create table public.utility_meter_readings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.app_org() references public.organizations(id),
  utility_bill_id uuid not null references public.utility_bills(id) on delete cascade,
  lease_id uuid not null references public.leases(id),
  previous_reading numeric(14,2) not null check (previous_reading >= 0),
  current_reading numeric(14,2) not null check (current_reading >= 0),
  consumption numeric(14,2) not null,
  computed_share numeric(14,2),
  generated_charge_id uuid references public.charges(id),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (utility_bill_id, lease_id),
  constraint utility_reading_monotonic_chk check (current_reading >= previous_reading),
  constraint utility_reading_consumption_chk check (consumption = current_reading - previous_reading)
);
create index utility_meter_readings_org_idx on public.utility_meter_readings(org_id);
create index utility_meter_readings_bill_idx on public.utility_meter_readings(utility_bill_id);
create index utility_meter_readings_lease_idx on public.utility_meter_readings(lease_id);
create trigger trg_utility_meter_readings_updated_at before update on public.utility_meter_readings
  for each row execute function public.set_updated_at();

-- ---- OR-6: child org_id must match parent ---------------------------------
-- utility_bills.org_id must equal the property's org_id
create or replace function public.assert_utility_bill_org() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.properties where id = new.property_id;
  if v_org is null then raise exception 'utility_bills: property % not found', new.property_id; end if;
  if new.org_id is null then new.org_id := v_org; end if;
  if new.org_id <> v_org then raise exception 'utility_bills.org_id (%) must match property org (%)', new.org_id, v_org; end if;
  return new;
end; $$;
create trigger trg_utility_bills_org_guard before insert or update on public.utility_bills
  for each row execute function public.assert_utility_bill_org();

-- utility_meter_readings.org_id must equal the bill's org_id; lease must be same org
create or replace function public.assert_utility_reading_org() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_bill_org uuid; v_lease_org uuid;
begin
  select org_id into v_bill_org from public.utility_bills where id = new.utility_bill_id;
  if v_bill_org is null then raise exception 'utility_meter_readings: bill % not found', new.utility_bill_id; end if;
  if new.org_id is null then new.org_id := v_bill_org; end if;
  if new.org_id <> v_bill_org then raise exception 'utility_meter_readings.org_id (%) must match bill org (%)', new.org_id, v_bill_org; end if;
  select org_id into v_lease_org from public.leases where id = new.lease_id;
  if v_lease_org is distinct from v_bill_org then
    raise exception 'utility_meter_readings: lease org (%) must match bill org (%)', v_lease_org, v_bill_org;
  end if;
  return new;
end; $$;
create trigger trg_utility_meter_readings_org_guard before insert or update on public.utility_meter_readings
  for each row execute function public.assert_utility_reading_org();

-- ---- RLS (§5.3) -----------------------------------------------------------
alter table public.utility_bills enable row level security;
alter table public.utility_bills force row level security;

create policy utility_bills_superadmin on public.utility_bills
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');
create policy utility_bills_admin on public.utility_bills
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));
create policy utility_bills_pm on public.utility_bills
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and property_id in (select public.app_pm_property_ids())
  )
  with check (
    public.app_role() = 'property_manager'
    and property_id in (select public.app_pm_property_ids())
  );

alter table public.utility_meter_readings enable row level security;
alter table public.utility_meter_readings force row level security;

create policy utility_meter_readings_superadmin on public.utility_meter_readings
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');
create policy utility_meter_readings_admin on public.utility_meter_readings
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));
create policy utility_meter_readings_pm on public.utility_meter_readings
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = utility_meter_readings.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  )
  with check (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = utility_meter_readings.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  );

-- ---- Generation RPC (§9.5, FR-UTIL-3..5) ----------------------------------
-- SECURITY INVOKER: RLS-scoped to the caller. Idempotent via charges_generated_at.
create or replace function public.generate_utility_charges(p_utility_bill_id uuid)
returns table (
  bill_id uuid,
  total_amount numeric(14,2),
  allocated_total numeric(14,2),
  variance numeric(14,2),
  charges_created integer,
  already_generated boolean
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_bill record;
  v_charge_type charge_type;
  v_sum_consumption numeric(14,2);
  v_count integer;
  v_sum_area numeric(14,2);
  r record;
  v_share numeric(14,2);
  v_allocated numeric(14,2) := 0;
  v_created integer := 0;
  v_charge_id uuid;
begin
  select * into v_bill from public.utility_bills where id = p_utility_bill_id;
  if not found then raise exception 'utility bill % not found', p_utility_bill_id; end if;

  -- Idempotency gate: if already generated, return the existing summary (no-op).
  if v_bill.charges_generated_at is not null then
    select coalesce(sum(computed_share), 0) into v_allocated
      from public.utility_meter_readings where utility_bill_id = p_utility_bill_id;
    return query select v_bill.id, v_bill.total_amount, v_allocated,
      (v_bill.total_amount - v_allocated)::numeric(14,2),
      0, true;
    return;
  end if;

  v_charge_type := case v_bill.utility_type
                     when 'electricity' then 'utility_electricity'::charge_type
                     else 'utility_water'::charge_type end;

  -- denominators per allocation method
  select coalesce(sum(consumption), 0), count(*)
    into v_sum_consumption, v_count
    from public.utility_meter_readings where utility_bill_id = p_utility_bill_id;
  select coalesce(sum(u.floor_area_sqm), 0)
    into v_sum_area
    from public.utility_meter_readings rd
    join public.leases l on l.id = rd.lease_id
    join public.units u on u.id = l.unit_id
   where rd.utility_bill_id = p_utility_bill_id;

  for r in
    select rd.id as reading_id, rd.lease_id, rd.consumption,
           coalesce(u.floor_area_sqm, 0) as area
      from public.utility_meter_readings rd
      join public.leases l on l.id = rd.lease_id
      join public.units u on u.id = l.unit_id
     where rd.utility_bill_id = p_utility_bill_id
  loop
    v_share := case v_bill.allocation_method
      when 'by_submeter' then
        case when v_sum_consumption > 0
             then round(v_bill.total_amount * r.consumption / v_sum_consumption, 2) else 0 end
      when 'equal_split' then
        case when v_count > 0 then round(v_bill.total_amount / v_count, 2) else 0 end
      when 'by_floor_area' then
        case when v_sum_area > 0
             then round(v_bill.total_amount * r.area / v_sum_area, 2) else 0 end
    end;

    if v_share > 0 then
      insert into public.charges(org_id, lease_id, charge_type, description, billing_period, amount, due_date, created_by)
      values (v_bill.org_id, r.lease_id, v_charge_type,
              format('%s sub-meter %s', initcap(v_bill.utility_type::text), to_char(v_bill.billing_period, 'Mon YYYY')),
              v_bill.billing_period, v_share, v_bill.due_date, auth.uid())
      returning id into v_charge_id;
      update public.utility_meter_readings
         set computed_share = v_share, generated_charge_id = v_charge_id
       where id = r.reading_id;
      v_allocated := v_allocated + v_share;
      v_created := v_created + 1;
    else
      update public.utility_meter_readings set computed_share = 0 where id = r.reading_id;
    end if;
  end loop;

  update public.utility_bills set charges_generated_at = now() where id = p_utility_bill_id;

  return query select v_bill.id, v_bill.total_amount, v_allocated,
    (v_bill.total_amount - v_allocated)::numeric(14,2), v_created, false;
end;
$$;
grant execute on function public.generate_utility_charges(uuid) to authenticated;

-- Preview RPC (FR-UTIL-3): compute shares WITHOUT generating charges.
create or replace function public.preview_utility_charges(p_utility_bill_id uuid)
returns table (
  lease_id uuid,
  consumption numeric(14,2),
  floor_area_sqm numeric(10,2),
  computed_share numeric(14,2)
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_bill record;
  v_sum_consumption numeric(14,2);
  v_count integer;
  v_sum_area numeric(14,2);
begin
  select * into v_bill from public.utility_bills where id = p_utility_bill_id;
  if not found then raise exception 'utility bill % not found', p_utility_bill_id; end if;

  select coalesce(sum(consumption), 0), count(*) into v_sum_consumption, v_count
    from public.utility_meter_readings where utility_bill_id = p_utility_bill_id;
  select coalesce(sum(u.floor_area_sqm), 0) into v_sum_area
    from public.utility_meter_readings rd
    join public.leases l on l.id = rd.lease_id
    join public.units u on u.id = l.unit_id
   where rd.utility_bill_id = p_utility_bill_id;

  return query
    select rd.lease_id, rd.consumption, u.floor_area_sqm,
      (case v_bill.allocation_method
        when 'by_submeter' then case when v_sum_consumption > 0 then round(v_bill.total_amount * rd.consumption / v_sum_consumption, 2) else 0 end
        when 'equal_split' then case when v_count > 0 then round(v_bill.total_amount / v_count, 2) else 0 end
        when 'by_floor_area' then case when v_sum_area > 0 then round(v_bill.total_amount * coalesce(u.floor_area_sqm,0) / v_sum_area, 2) else 0 end
      end)::numeric(14,2) as computed_share
    from public.utility_meter_readings rd
    join public.leases l on l.id = rd.lease_id
    join public.units u on u.id = l.unit_id
   where rd.utility_bill_id = p_utility_bill_id;
end;
$$;
grant execute on function public.preview_utility_charges(uuid) to authenticated;
