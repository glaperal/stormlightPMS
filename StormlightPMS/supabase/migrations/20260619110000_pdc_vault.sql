-- StormlightPMS — D5 Post-Dated Check (PDC) Digital Vault
-- (SRS §4.1 pdc_status, §4.22, §6.14, §9 JOB-5, §9.4 PDC-clearing trigger, FR-RPT-8)
-- A PDC is a promise of future payment; only the `cleared` transition creates money.

create type pdc_status as enum ('vaulted', 'deposited', 'cleared', 'bounced', 'stale');
alter type notification_type add value if not exists 'pdc_stale';

create table public.post_dated_checks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.app_org() references public.organizations(id),
  lease_id uuid not null references public.leases(id),
  check_number text not null,
  issuing_bank text not null,
  check_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  status pdc_status not null default 'vaulted',
  deposited_date date,
  cleared_date date,
  bounced_reason text,
  linked_payment_id uuid references public.payments(id),
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (org_id, issuing_bank, check_number)
);
create index post_dated_checks_org_idx on public.post_dated_checks(org_id);
create index post_dated_checks_lease_idx on public.post_dated_checks(lease_id);
create index post_dated_checks_status_check_date_idx
  on public.post_dated_checks(org_id, status, check_date);
create trigger trg_post_dated_checks_updated_at before update on public.post_dated_checks
  for each row execute function public.set_updated_at();

-- OR-6: PDC org_id must match the lease's org.
create or replace function public.assert_pdc_org() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.leases where id = new.lease_id;
  if v_org is null then raise exception 'post_dated_checks: lease % not found', new.lease_id; end if;
  if new.org_id is null then new.org_id := v_org; end if;
  if new.org_id <> v_org then raise exception 'post_dated_checks.org_id (%) must match lease org (%)', new.org_id, v_org; end if;
  return new;
end; $$;
create trigger trg_post_dated_checks_org_guard before insert or update on public.post_dated_checks
  for each row execute function public.assert_pdc_org();

-- PDC-clearing trigger (§9.4): cleared materializes a payment; bounced voids it.
create or replace function public.pdc_status_change() returns trigger
  language plpgsql security definer set search_path = public as $$
declare v_payment_id uuid;
begin
  -- on transition to cleared: create one linked payment if not already linked
  if new.status = 'cleared' and old.status <> 'cleared' and new.linked_payment_id is null then
    insert into public.payments(org_id, lease_id, amount, payment_date, payment_method, reference_no, notes, recorded_by)
    values (new.org_id, new.lease_id, new.amount,
            coalesce(new.cleared_date, public.manila_today()), 'check',
            new.check_number,
            format('Cleared PDC %s / %s', new.issuing_bank, new.check_number),
            coalesce(auth.uid(), new.created_by))
    returning id into v_payment_id;
    new.linked_payment_id := v_payment_id;
    if new.cleared_date is null then new.cleared_date := public.manila_today(); end if;
  end if;

  -- on transition to bounced: void any linked payment (allocations cascade off).
  if new.status = 'bounced' and old.status <> 'bounced' and new.linked_payment_id is not null then
    update public.payments set payment_status = 'void' where id = new.linked_payment_id;
  end if;

  return new;
end; $$;
-- BEFORE so we can write linked_payment_id/cleared_date on NEW.
create trigger trg_post_dated_checks_status before update of status on public.post_dated_checks
  for each row execute function public.pdc_status_change();

-- Audit (NFR-11 includes post_dated_checks).
create trigger trg_audit_post_dated_checks
  after insert or update or delete on public.post_dated_checks
  for each row execute function public.audit_trigger();

-- RLS (§5.3): admin = own org; PM = lease reachable via assigned property.
alter table public.post_dated_checks enable row level security;
alter table public.post_dated_checks force row level security;

create policy post_dated_checks_superadmin on public.post_dated_checks
  for all to authenticated
  using (public.app_role() = 'superadmin')
  with check (public.app_role() = 'superadmin');
create policy post_dated_checks_admin on public.post_dated_checks
  for all to authenticated
  using (public.app_role() = 'admin' and org_id = (select public.app_org()))
  with check (public.app_role() = 'admin' and org_id = (select public.app_org()));
create policy post_dated_checks_pm on public.post_dated_checks
  for all to authenticated
  using (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = post_dated_checks.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  )
  with check (
    public.app_role() = 'property_manager'
    and exists (
      select 1 from public.leases l
        join public.units u on u.id = l.unit_id
       where l.id = post_dated_checks.lease_id
         and u.property_id in (select public.app_pm_property_ids())
    )
  );

-- Responsible recipients for a PDC (mirror responsible_for_lease).
create or replace function public.responsible_for_pdc(p_pdc_id uuid)
returns table (profile_id uuid, org_id uuid)
language sql stable security definer set search_path = public as $$
  with cx as (
    select pdc.org_id, u.property_id
      from public.post_dated_checks pdc
      join public.leases l on l.id = pdc.lease_id
      join public.units u on u.id = l.unit_id
     where pdc.id = p_pdc_id
  )
  select p.id, p.org_id
    from public.profiles p, cx
   where p.status = 'active'
     and (
       (p.role = 'admin' and p.org_id = cx.org_id)
       or (p.role = 'property_manager' and p.org_id = cx.org_id
           and exists (select 1 from public.property_assignments pa
                        where pa.profile_id = p.id and pa.property_id = cx.property_id))
     );
$$;

-- FR-RPT-8: PDC maturity report (SECURITY INVOKER so RLS scopes it).
create or replace function public.rpt_pdc_maturity()
returns table (
  pdc_id uuid,
  lease_id uuid,
  property_name text,
  unit_label text,
  tenant_name text,
  issuing_bank text,
  check_number text,
  check_date date,
  amount numeric(14,2),
  status pdc_status,
  days_to_maturity integer
)
language sql stable security invoker set search_path = public as $$
  select pdc.id, pdc.lease_id, p.name, u.unit_label, t.full_name,
         pdc.issuing_bank, pdc.check_number, pdc.check_date, pdc.amount, pdc.status,
         (pdc.check_date - public.manila_today())
    from public.post_dated_checks pdc
    join public.leases l on l.id = pdc.lease_id
    join public.units u on u.id = l.unit_id
    join public.properties p on p.id = u.property_id
    join public.tenants t on t.id = l.tenant_id
   where pdc.status in ('vaulted', 'deposited')
   order by pdc.check_date;
$$;
grant execute on function public.rpt_pdc_maturity() to authenticated;

-- JOB-5 stale-PDC sweep, folded into the daily run. Redefines run_scheduled_jobs
-- (create-or-replace supersedes the shipped definition; JOB-1..4 unchanged).
create or replace function public.run_scheduled_jobs()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_today date := public.manila_today();
  v_due_count int := 0;
  v_overdue_count int := 0;
  v_expiring_count int := 0;
  v_expired_count int := 0;
  v_stale_count int := 0;
  r record;
  rr record;
  v_window int;
  v_dkey text;
begin
  -- JOB-1: rent due reminders
  for r in
    select c.id as charge_id, c.org_id, c.due_date
      from public.charges c
      left join public.org_settings os on os.org_id = c.org_id
     where c.charge_status in ('unpaid','partially_paid')
       and c.due_date between v_today and v_today + coalesce(os.rent_due_window_days, 3)
  loop
    v_dkey := format('rent_due:%s:%s', r.charge_id, v_today);
    for rr in select profile_id, org_id from public.responsible_for_charge(r.charge_id) loop
      insert into public.notifications(org_id, profile_id, notification_type, title, body, entity_type, entity_id, dedupe_key)
      values (rr.org_id, rr.profile_id, 'rent_due', 'Charge due soon',
              format('Charge due on %s', r.due_date), 'charge', r.charge_id, v_dkey || ':' || rr.profile_id)
      on conflict (dedupe_key) do nothing;
      v_due_count := v_due_count + 1;
    end loop;
  end loop;

  -- JOB-2: overdue
  for r in
    select c.id as charge_id, c.org_id, c.due_date
      from public.charges c
     where c.charge_status in ('unpaid','partially_paid') and c.due_date < v_today
  loop
    v_dkey := format('rent_overdue:%s:%s', r.charge_id, v_today);
    for rr in select profile_id, org_id from public.responsible_for_charge(r.charge_id) loop
      insert into public.notifications(org_id, profile_id, notification_type, title, body, entity_type, entity_id, dedupe_key)
      values (rr.org_id, rr.profile_id, 'rent_overdue', 'Charge overdue',
              format('Charge was due on %s', r.due_date), 'charge', r.charge_id, v_dkey || ':' || rr.profile_id)
      on conflict (dedupe_key) do nothing;
      v_overdue_count := v_overdue_count + 1;
    end loop;
  end loop;

  -- JOB-3: lease expiring at any configured threshold
  for r in
    select l.id as lease_id, l.org_id, l.end_date,
           coalesce(os.lease_expiry_thresholds, '{60,30}'::int[]) as thresholds
      from public.leases l
      left join public.org_settings os on os.org_id = l.org_id
     where l.lease_status = 'active'
  loop
    foreach v_window in array r.thresholds loop
      if r.end_date - v_today = v_window then
        v_dkey := format('lease_expiring:%s:%s', r.lease_id, v_window);
        for rr in select profile_id, org_id from public.responsible_for_lease(r.lease_id) loop
          insert into public.notifications(org_id, profile_id, notification_type, title, body, entity_type, entity_id, dedupe_key)
          values (rr.org_id, rr.profile_id, 'lease_expiring',
                  format('Lease expiring in %s days', v_window),
                  format('Lease ends on %s', r.end_date), 'lease', r.lease_id, v_dkey || ':' || rr.profile_id)
          on conflict (dedupe_key) do nothing;
          v_expiring_count := v_expiring_count + 1;
        end loop;
      end if;
    end loop;
  end loop;

  -- JOB-4: transition active -> expired when end_date passed
  update public.leases set lease_status = 'expired'
   where lease_status = 'active' and end_date < v_today;
  get diagnostics v_expired_count = row_count;

  -- JOB-5: stale-PDC sweep (D5). Vaulted checks older than 6 months -> stale.
  update public.post_dated_checks
     set status = 'stale'
   where status = 'vaulted' and check_date < (v_today - interval '6 months');
  get diagnostics v_stale_count = row_count;

  for r in
    select id as pdc_id from public.post_dated_checks where status = 'stale'
  loop
    v_dkey := format('pdc_stale:%s', r.pdc_id);
    for rr in select profile_id, org_id from public.responsible_for_pdc(r.pdc_id) loop
      insert into public.notifications(org_id, profile_id, notification_type, title, body, entity_type, entity_id, dedupe_key)
      values (rr.org_id, rr.profile_id, 'pdc_stale', 'Post-dated check is stale',
              'A vaulted check is more than 6 months past its date and needs follow-up.',
              'post_dated_check', r.pdc_id, v_dkey || ':' || rr.profile_id)
      on conflict (dedupe_key) do nothing;
    end loop;
  end loop;

  return jsonb_build_object(
    'manila_today', v_today,
    'rent_due', v_due_count,
    'rent_overdue', v_overdue_count,
    'lease_expiring', v_expiring_count,
    'leases_expired', v_expired_count,
    'pdc_stale', v_stale_count
  );
end;
$$;
grant execute on function public.run_scheduled_jobs() to service_role;
