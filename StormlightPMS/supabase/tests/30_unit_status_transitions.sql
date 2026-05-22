-- Unit-status transition tests (SRS §6.5 table)
begin;
select plan(4);

insert into public.organizations(id,name) values
  ('00000000-0000-0000-0000-00000000001a','UStatus') on conflict (id) do nothing;
insert into public.properties(id,org_id,name,property_type) values
  ('00000000-0000-0000-0000-00000000010a','00000000-0000-0000-0000-00000000001a','P','residential')
  on conflict (id) do nothing;
insert into public.units(id,org_id,property_id,unit_label,base_monthly_rent) values
  ('00000000-0000-0000-0000-00000000020a','00000000-0000-0000-0000-00000000001a','00000000-0000-0000-0000-00000000010a','U',10000)
  on conflict (id) do nothing;
insert into public.tenants(id,org_id,full_name) values
  ('00000000-0000-0000-0000-00000000030a','00000000-0000-0000-0000-00000000001a','T')
  on conflict (id) do nothing;

insert into public.leases(id,org_id,unit_id,tenant_id,lease_status,start_date,end_date,monthly_rent) values
  ('00000000-0000-0000-0000-00000000040a','00000000-0000-0000-0000-00000000001a','00000000-0000-0000-0000-00000000020a','00000000-0000-0000-0000-00000000030a','draft','2026-01-01','2026-12-31',10000)
  on conflict (id) do nothing;

-- draft → active flips unit to occupied
update public.leases set lease_status = 'active'
  where id = '00000000-0000-0000-0000-00000000040a';
select results_eq(
  $$ select unit_status::text from public.units where id = '00000000-0000-0000-0000-00000000020a' $$,
  $$ values ('occupied') $$,
  'activating lease flips unit to occupied'
);

-- partial-unique-index: second active on same unit is rejected
insert into public.leases(id,org_id,unit_id,tenant_id,lease_status,start_date,end_date,monthly_rent) values
  ('00000000-0000-0000-0000-00000000041a','00000000-0000-0000-0000-00000000001a','00000000-0000-0000-0000-00000000020a','00000000-0000-0000-0000-00000000030a','draft','2026-02-01','2026-12-31',10000)
  on conflict (id) do nothing;
prepare second_active as
  update public.leases set lease_status = 'active'
    where id = '00000000-0000-0000-0000-00000000041a';
select throws_ok('second_active', null, 'second active lease on same unit rejected');

-- terminate flips unit back to vacant
update public.leases set lease_status = 'terminated', termination_date = '2026-06-30'
  where id = '00000000-0000-0000-0000-00000000040a';
select results_eq(
  $$ select unit_status::text from public.units where id = '00000000-0000-0000-0000-00000000020a' $$,
  $$ values ('vacant') $$,
  'terminating active lease flips unit to vacant'
);

-- cannot activate a lease against a unit under_maintenance
update public.units set unit_status = 'under_maintenance' where id = '00000000-0000-0000-0000-00000000020a';
prepare activate_into_maint as
  update public.leases set lease_status = 'active'
    where id = '00000000-0000-0000-0000-00000000041a';
select throws_ok('activate_into_maint', null, 'cannot activate against under_maintenance unit');

select * from finish();
rollback;
