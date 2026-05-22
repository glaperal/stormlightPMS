-- Financial trigger tests: allocation cap, cross-lease rejection, void rules.
begin;
select plan(6);

-- seed an org/admin/property/unit/tenant/lease/charges/payment
insert into auth.users(id,email)
  values ('00000000-0000-0000-0000-0000000000b1','admin@guard')
  on conflict (id) do nothing;
insert into public.organizations(id,name)
  values ('00000000-0000-0000-0000-00000000000c','GuardOrg')
  on conflict (id) do nothing;
insert into public.profiles(id,org_id,role,full_name,email,status)
  values ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-00000000000c','admin','G Admin','admin@guard','active')
  on conflict (id) do nothing;
insert into public.properties(id,org_id,name,property_type)
  values ('00000000-0000-0000-0000-0000000000pp','00000000-0000-0000-0000-00000000000c','G','residential')
  on conflict (id) do nothing;
insert into public.units(id,org_id,property_id,unit_label,base_monthly_rent)
  values ('00000000-0000-0000-0000-0000000000uu','00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000pp','A',10000)
  on conflict (id) do nothing;
insert into public.tenants(id,org_id,full_name)
  values ('00000000-0000-0000-0000-0000000000tt','00000000-0000-0000-0000-00000000000c','Tenant 1')
  on conflict (id) do nothing;

insert into public.leases(id,org_id,unit_id,tenant_id,lease_status,start_date,end_date,monthly_rent,advance_amount,security_deposit_amount)
  values ('00000000-0000-0000-0000-0000000000ll','00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000uu','00000000-0000-0000-0000-0000000000tt','active','2026-01-01','2026-12-31',10000,10000,20000)
  on conflict (id) do nothing;

insert into public.charges(id,org_id,lease_id,charge_type,amount,due_date)
  values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000ll','rent',10000,'2026-02-05')
  on conflict (id) do nothing;

insert into public.payments(id,org_id,lease_id,amount,payment_date,payment_method,recorded_by)
  values ('00000000-0000-0000-0000-0000000000y1','00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000ll',8000,'2026-02-03','cash','00000000-0000-0000-0000-0000000000b1')
  on conflict (id) do nothing;

-- partial allocation: charge → partially_paid
insert into public.payment_allocations(org_id,payment_id,charge_id,amount_applied)
  values ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000y1','00000000-0000-0000-0000-0000000000c1',6000);
select results_eq(
  $$ select charge_status::text from public.charges where id = '00000000-0000-0000-0000-0000000000c1' $$,
  $$ values ('partially_paid') $$,
  'charge_status flips to partially_paid'
);

-- over-allocation on the payment is rejected
prepare over_payment as
  update public.payment_allocations
     set amount_applied = 9000
   where payment_id = '00000000-0000-0000-0000-0000000000y1';
select throws_ok('over_payment', null, 'per-payment cap rejects over-allocation');

-- finish the allocation; charge should become paid
update public.payment_allocations
   set amount_applied = 8000
 where payment_id = '00000000-0000-0000-0000-0000000000y1';

-- per-charge cap: insert a second payment & try to over-allocate to the charge
insert into public.payments(id,org_id,lease_id,amount,payment_date,payment_method,recorded_by)
  values ('00000000-0000-0000-0000-0000000000y2','00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000ll',5000,'2026-02-04','cash','00000000-0000-0000-0000-0000000000b1')
  on conflict (id) do nothing;
prepare over_charge as
  insert into public.payment_allocations(org_id,payment_id,charge_id,amount_applied)
  values ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000y2','00000000-0000-0000-0000-0000000000c1',5000);
select throws_ok('over_charge', null, 'per-charge cap rejects over-allocation');

-- close the gap, charge becomes paid
insert into public.payment_allocations(org_id,payment_id,charge_id,amount_applied)
  values ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000y2','00000000-0000-0000-0000-0000000000c1',2000);
select results_eq(
  $$ select charge_status::text from public.charges where id = '00000000-0000-0000-0000-0000000000c1' $$,
  $$ values ('paid') $$,
  'charge_status reaches paid'
);

-- void payment y2: charge reverts to partially_paid (8000 remains via y1)
update public.payments set payment_status = 'void' where id = '00000000-0000-0000-0000-0000000000y2';
select results_eq(
  $$ select charge_status::text from public.charges where id = '00000000-0000-0000-0000-0000000000c1' $$,
  $$ values ('partially_paid') $$,
  'void payment cascade reverts charge to partially_paid'
);

-- cross-lease allocation is rejected
insert into public.leases(id,org_id,unit_id,tenant_id,lease_status,start_date,end_date,monthly_rent)
  values ('00000000-0000-0000-0000-0000000000l2','00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000uu','00000000-0000-0000-0000-0000000000tt','draft','2027-01-01','2027-12-31',10000)
  on conflict (id) do nothing;
insert into public.charges(id,org_id,lease_id,charge_type,amount,due_date)
  values ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000l2','rent',5000,'2027-02-05')
  on conflict (id) do nothing;
prepare cross_lease as
  insert into public.payment_allocations(org_id,payment_id,charge_id,amount_applied)
  values ('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-0000000000y1','00000000-0000-0000-0000-0000000000c2',1);
select throws_ok('cross_lease', null, 'cross-lease allocation rejected');

select * from finish();
rollback;
