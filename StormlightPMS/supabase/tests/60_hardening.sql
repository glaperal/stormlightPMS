-- Integrity hardening: OR-1 tenant-delete guard, OR-5 documents PM scope,
-- OR-10 maintenance notification, and the allocation per-charge cap (OR-3 invariant).
begin;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1','adminA@x'),
  ('00000000-0000-0000-0000-0000000000a3','pmA1@x')
  on conflict (id) do nothing;
insert into public.organizations(id,name) values
  ('00000000-0000-0000-0000-00000000000a','Org A') on conflict (id) do nothing;
insert into public.profiles(id,org_id,role,full_name,email,status) values
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000000a','admin','Admin A','adminA@x','active'),
  ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-00000000000a','property_manager','PM A1','pmA1@x','active')
  on conflict (id) do nothing;
insert into public.properties(id,org_id,name,property_type) values
  ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-00000000000a','A1','residential'),
  ('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-00000000000a','A2','residential')
  on conflict (id) do nothing;
insert into public.property_assignments(org_id,profile_id,property_id) values
  ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000f1')
  on conflict (profile_id,property_id) do nothing;
insert into public.units(id,org_id,property_id,unit_label,base_monthly_rent) values
  ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000f1','U1',10000),
  ('00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000f2','U2',10000)
  on conflict (id) do nothing;
insert into public.tenants(id,org_id,full_name) values
  ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-00000000000a','Has Lease'),
  ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-00000000000a','On F2'),
  ('00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-00000000000a','No Lease')
  on conflict (id) do nothing;
insert into public.leases(id,org_id,unit_id,tenant_id,lease_status,start_date,end_date,monthly_rent) values
  ('00000000-0000-0000-0000-00000000a111','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000e1','active','2026-01-01','2026-12-31',10000),
  ('00000000-0000-0000-0000-00000000a112','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-0000000000e2','active','2026-01-01','2026-12-31',10000)
  on conflict (id) do nothing;

set local role postgres;
select tests.set_claims('00000000-0000-0000-0000-0000000000a1','admin','00000000-0000-0000-0000-00000000000a');

-- OR-1: cannot delete a tenant with an active lease; can delete one with none.
prepare del_with_lease as delete from public.tenants where id = '00000000-0000-0000-0000-0000000000e1';
select throws_ok('del_with_lease', null, 'OR-1: deleting a tenant with an active lease is blocked');
prepare del_no_lease as delete from public.tenants where id = '00000000-0000-0000-0000-0000000000e3';
select lives_ok('del_no_lease', 'OR-1: a tenant with no lease can be deleted');

-- OR-10: a maintenance status change notifies the reporter.
insert into public.maintenance_requests(id,org_id,unit_id,title,status,created_by) values
  ('00000000-0000-0000-0000-00000000ab01','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000d1','Leak','open','00000000-0000-0000-0000-0000000000a1');
update public.maintenance_requests set status = 'in_progress' where id = '00000000-0000-0000-0000-00000000ab01';
select results_eq(
  $$ select count(*)::int from public.notifications
       where notification_type = 'maintenance_update'
         and entity_id = '00000000-0000-0000-0000-00000000ab01' $$,
  $$ values (1) $$, 'OR-10: maintenance status change creates a notification for the reporter');

-- OR-5: PM sees a document on its assigned property, not one on an unassigned property.
insert into public.documents(org_id,doc_type,entity_type,entity_id,bucket,file_path,uploaded_by) values
  ('00000000-0000-0000-0000-00000000000a','lease_contract','lease','00000000-0000-0000-0000-00000000a111','documents','a/assigned.pdf','00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-00000000000a','lease_contract','lease','00000000-0000-0000-0000-00000000a112','documents','a/unassigned.pdf','00000000-0000-0000-0000-0000000000a1');
select tests.set_claims('00000000-0000-0000-0000-0000000000a3','property_manager','00000000-0000-0000-0000-00000000000a');
select results_eq(
  $$ select count(*)::int from public.documents $$,
  $$ values (1) $$, 'OR-5: PM sees only documents on its assigned property');

-- Allocation per-charge cap (OR-3 invariant): cannot allocate above the charge amount.
set local role postgres;
select tests.set_claims('00000000-0000-0000-0000-0000000000a1','admin','00000000-0000-0000-0000-00000000000a');
insert into public.charges(id,org_id,lease_id,charge_type,amount,due_date) values
  ('00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000a111','rent',500,'2026-06-05');
insert into public.payments(id,org_id,lease_id,amount,payment_date,payment_method,recorded_by) values
  ('00000000-0000-0000-0000-00000000c0a1','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000a111',1000,'2026-06-05','cash','00000000-0000-0000-0000-0000000000a1');
insert into public.payment_allocations(id,org_id,payment_id,charge_id,amount_applied) values
  ('00000000-0000-0000-0000-00000000c0b1','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000c0a1','00000000-0000-0000-0000-00000000c001',500);
prepare over_alloc as update public.payment_allocations set amount_applied = 700
  where id = '00000000-0000-0000-0000-00000000c0b1';
select throws_ok('over_alloc', null, 'allocation guard rejects pushing applied total above the charge amount');

select * from finish();
rollback;
