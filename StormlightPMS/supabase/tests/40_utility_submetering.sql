-- D7 utility sub-metering: RLS scope + generation idempotency + share math.
begin;
select plan(10);

-- Orgs, users
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1','adminA@x'),
  ('00000000-0000-0000-0000-0000000000a2','adminB@x'),
  ('00000000-0000-0000-0000-0000000000a3','pmA1@x')
  on conflict (id) do nothing;
insert into public.organizations(id,name) values
  ('00000000-0000-0000-0000-00000000000a','Org A'),
  ('00000000-0000-0000-0000-00000000000b','Org B')
  on conflict (id) do nothing;
insert into public.profiles(id,org_id,role,full_name,email,status) values
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000000a','admin','Admin A','adminA@x','active'),
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-00000000000b','admin','Admin B','adminB@x','active'),
  ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-00000000000a','property_manager','PM A1','pmA1@x','active')
  on conflict (id) do nothing;

-- Properties: f1 (assigned to PM), f2 (unassigned), f3 (org B)
insert into public.properties(id,org_id,name,property_type) values
  ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-00000000000a','A1','residential'),
  ('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-00000000000a','A2','residential'),
  ('00000000-0000-0000-0000-0000000000f3','00000000-0000-0000-0000-00000000000b','B1','residential')
  on conflict (id) do nothing;
insert into public.property_assignments(org_id,profile_id,property_id) values
  ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000f1')
  on conflict (profile_id, property_id) do nothing;

-- Units on f1
insert into public.units(id,org_id,property_id,unit_label,base_monthly_rent) values
  ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000f1','U1',10000),
  ('00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000f1','U2',10000)
  on conflict (id) do nothing;
insert into public.tenants(id,org_id,full_name) values
  ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-00000000000a','Tenant 1'),
  ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-00000000000a','Tenant 2')
  on conflict (id) do nothing;
insert into public.leases(id,org_id,unit_id,tenant_id,lease_status,start_date,end_date,monthly_rent) values
  ('00000000-0000-0000-0000-00000000a111','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000e1','active','2026-01-01','2026-12-31',10000),
  ('00000000-0000-0000-0000-00000000a112','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-0000000000e2','active','2026-01-01','2026-12-31',10000)
  on conflict (id) do nothing;

-- A bill on f1, by_submeter, total 1000
insert into public.utility_bills(id,org_id,property_id,utility_type,billing_period,total_amount,due_date,allocation_method) values
  ('00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000f1','electricity','2026-06-01',1000,'2026-06-15','by_submeter')
  on conflict (id) do nothing;
insert into public.utility_meter_readings(id,org_id,utility_bill_id,lease_id,previous_reading,current_reading,consumption) values
  ('00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000a111',0,60,60),
  ('00000000-0000-0000-0000-00000000c002','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000b001','00000000-0000-0000-0000-00000000a112',0,40,40)
  on conflict (id) do nothing;

-- ---- RLS scope ----
select tests.set_claims('00000000-0000-0000-0000-0000000000a1','admin','00000000-0000-0000-0000-00000000000a');
select results_eq($$ select count(*)::int from public.utility_bills $$, $$ values (1) $$,
  'Admin A sees its org bill');

select tests.set_claims('00000000-0000-0000-0000-0000000000a2','admin','00000000-0000-0000-0000-00000000000b');
select results_eq($$ select count(*)::int from public.utility_bills $$, $$ values (0) $$,
  'Admin B sees no Org A bills (cross-org isolation)');

select tests.set_claims('00000000-0000-0000-0000-0000000000a3','property_manager','00000000-0000-0000-0000-00000000000a');
select results_eq($$ select count(*)::int from public.utility_bills $$, $$ values (1) $$,
  'PM A1 sees the bill on its assigned property');

-- ---- Generation (as Admin A) ----
select tests.set_claims('00000000-0000-0000-0000-0000000000a1','admin','00000000-0000-0000-0000-00000000000a');
select results_eq(
  $$ select charges_created from public.generate_utility_charges('00000000-0000-0000-0000-00000000b001') $$,
  $$ values (2) $$, 'generation creates one charge per lease');
select results_eq(
  $$ select variance from public.generate_utility_charges('00000000-0000-0000-0000-00000000b001') $$,
  $$ values (0::numeric(14,2)) $$, 're-run reports zero common-area variance for a clean 60/40 split');
-- ^ second call is the idempotent no-op; it returns the existing summary.

select results_eq(
  $$ select already_generated from public.generate_utility_charges('00000000-0000-0000-0000-00000000b001') $$,
  $$ values (true) $$, 're-running generation is a no-op (already_generated)');

select results_eq(
  $$ select count(*)::int from public.charges where charge_type = 'utility_electricity' $$,
  $$ values (2) $$, 'no duplicate utility charges after repeated generation');

select results_eq(
  $$ select computed_share from public.utility_meter_readings where lease_id = '00000000-0000-0000-0000-00000000a111' $$,
  $$ values (600::numeric(14,2)) $$, 'by_submeter share for 60/100 of 1000 = 600');
select results_eq(
  $$ select computed_share from public.utility_meter_readings where lease_id = '00000000-0000-0000-0000-00000000a112' $$,
  $$ values (400::numeric(14,2)) $$, 'by_submeter share for 40/100 of 1000 = 400');

select results_eq(
  $$ select amount from public.charges c
       join public.utility_meter_readings r on r.generated_charge_id = c.id
      where r.lease_id = '00000000-0000-0000-0000-00000000a111' $$,
  $$ values (600::numeric(14,2)) $$, 'generated charge for lease 1 is 600 and linked back to the reading');

select * from finish();
rollback;
