-- D5 PDC vault: clear creates a linked payment; bounce voids it; RLS scope; stale sweep.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1','adminA@x'),
  ('00000000-0000-0000-0000-0000000000a2','adminB@x')
  on conflict (id) do nothing;
insert into public.organizations(id,name) values
  ('00000000-0000-0000-0000-00000000000a','Org A'),
  ('00000000-0000-0000-0000-00000000000b','Org B')
  on conflict (id) do nothing;
insert into public.profiles(id,org_id,role,full_name,email,status) values
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-00000000000a','admin','Admin A','adminA@x','active'),
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-00000000000b','admin','Admin B','adminB@x','active')
  on conflict (id) do nothing;
insert into public.properties(id,org_id,name,property_type) values
  ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-00000000000a','A1','residential')
  on conflict (id) do nothing;
insert into public.units(id,org_id,property_id,unit_label,base_monthly_rent) values
  ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000f1','U1',10000)
  on conflict (id) do nothing;
insert into public.tenants(id,org_id,full_name) values
  ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-00000000000a','Tenant 1')
  on conflict (id) do nothing;
insert into public.leases(id,org_id,unit_id,tenant_id,lease_status,start_date,end_date,monthly_rent) values
  ('00000000-0000-0000-0000-00000000a111','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000e1','active','2026-01-01','2026-12-31',10000)
  on conflict (id) do nothing;

-- ---- cleared creates exactly one linked payment ----
select tests.set_claims('00000000-0000-0000-0000-0000000000a1','admin','00000000-0000-0000-0000-00000000000a');
insert into public.post_dated_checks(id,org_id,lease_id,check_number,issuing_bank,check_date,amount,status)
  values ('00000000-0000-0000-0000-00000000d0c1','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000a111','CHK-1','BPI','2026-07-01',5000,'vaulted');

update public.post_dated_checks set status = 'cleared', cleared_date = '2026-07-01'
  where id = '00000000-0000-0000-0000-00000000d0c1';

select results_eq(
  $$ select count(*)::int from public.payments where lease_id = '00000000-0000-0000-0000-00000000a111' $$,
  $$ values (1) $$, 'clearing a PDC creates exactly one payment');
select results_eq(
  $$ select payment_method::text || ':' || amount::text from public.payments where lease_id = '00000000-0000-0000-0000-00000000a111' $$,
  $$ values ('check:5000.00') $$, 'linked payment is a check for the PDC amount');
select isnt(
  (select linked_payment_id from public.post_dated_checks where id = '00000000-0000-0000-0000-00000000d0c1'),
  null, 'PDC is linked to the created payment');

-- ---- bounced voids the linked payment ----
update public.post_dated_checks set status = 'bounced', bounced_reason = 'insufficient funds'
  where id = '00000000-0000-0000-0000-00000000d0c1';
select results_eq(
  $$ select payment_status::text from public.payments where lease_id = '00000000-0000-0000-0000-00000000a111' $$,
  $$ values ('void') $$, 'bouncing the PDC voids the linked payment');

-- ---- RLS: Org B admin cannot see Org A checks ----
select tests.set_claims('00000000-0000-0000-0000-0000000000a2','admin','00000000-0000-0000-0000-00000000000b');
select results_eq(
  $$ select count(*)::int from public.post_dated_checks $$,
  $$ values (0) $$, 'cross-org isolation: Org B admin sees no Org A checks');

-- ---- JOB-5 stale sweep ----
select tests.set_claims('00000000-0000-0000-0000-0000000000a1','admin','00000000-0000-0000-0000-00000000000a');
insert into public.post_dated_checks(id,org_id,lease_id,check_number,issuing_bank,check_date,amount,status)
  values ('00000000-0000-0000-0000-00000000d0c2','00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000a111','CHK-2','BPI',
          (public.manila_today() - interval '7 months')::date, 3000, 'vaulted');

select tests.reset();
select run_scheduled_jobs();
select results_eq(
  $$ select status::text from public.post_dated_checks where id = '00000000-0000-0000-0000-00000000d0c2' $$,
  $$ values ('stale') $$, 'JOB-5 marks a 7-month-old vaulted check stale');

-- idempotency: re-running does not duplicate the pdc_stale notification
select run_scheduled_jobs();
select results_eq(
  $$ select count(*)::int from public.notifications
       where notification_type = 'pdc_stale' and entity_id = '00000000-0000-0000-0000-00000000d0c2' $$,
  $$ values (1) $$, 'stale-PDC notification is idempotent across runs');

select * from finish();
rollback;
