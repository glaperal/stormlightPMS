-- RLS smoke tests: properties / units / leases — positive, cross-org, cross-assignment.
begin;
select plan(8);

-- Seed two orgs with admins and a PM
insert into auth.users (id, email)
  values ('00000000-0000-0000-0000-0000000000a1','adminA@x'),
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

insert into public.properties(id,org_id,name,property_type) values
  ('00000000-0000-0000-0000-0000000000p1','00000000-0000-0000-0000-00000000000a','A1','residential'),
  ('00000000-0000-0000-0000-0000000000p2','00000000-0000-0000-0000-00000000000a','A2','residential'),
  ('00000000-0000-0000-0000-0000000000p3','00000000-0000-0000-0000-00000000000b','B1','residential')
  on conflict (id) do nothing;

insert into public.property_assignments(org_id,profile_id,property_id) values
  ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000p1')
  on conflict (profile_id, property_id) do nothing;

-- Admin A sees only its org
select tests.set_claims('00000000-0000-0000-0000-0000000000a1','admin','00000000-0000-0000-0000-00000000000a');
select results_eq(
  $$ select count(*)::int from public.properties $$,
  $$ values (2) $$,
  'Admin A sees both Org A properties'
);
select results_eq(
  $$ select bool_or(org_id = '00000000-0000-0000-0000-00000000000b') from public.properties $$,
  $$ values (false) $$,
  'Admin A does not see Org B properties'
);

-- PM A1 sees only assigned property
select tests.set_claims('00000000-0000-0000-0000-0000000000a3','property_manager','00000000-0000-0000-0000-00000000000a');
select results_eq(
  $$ select count(*)::int from public.properties $$,
  $$ values (1) $$,
  'PM A1 sees only the assigned property'
);
select results_eq(
  $$ select id = '00000000-0000-0000-0000-0000000000p1' from public.properties limit 1 $$,
  $$ values (true) $$,
  'PM A1 sees property p1'
);

-- Admin B cross-org write rejected
select tests.set_claims('00000000-0000-0000-0000-0000000000a2','admin','00000000-0000-0000-0000-00000000000b');
prepare insert_cross as
  insert into public.properties(org_id,name,property_type)
  values ('00000000-0000-0000-0000-00000000000a','Sneaky','residential');
select throws_ok('insert_cross', null, 'cross-org insert blocked');

-- Admin B does not see Org A
select results_eq(
  $$ select count(*)::int from public.properties $$,
  $$ values (1) $$,
  'Admin B sees only Org B properties'
);

-- PM cannot insert against a property they are not assigned to
select tests.set_claims('00000000-0000-0000-0000-0000000000a3','property_manager','00000000-0000-0000-0000-00000000000a');
prepare insert_unassigned as
  insert into public.units(org_id,property_id,unit_label,base_monthly_rent)
  values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000p2','U-1', 10000);
select throws_ok('insert_unassigned', null, 'PM blocked from cross-assignment insert');

-- PM may insert under assigned property
prepare insert_assigned as
  insert into public.units(org_id,property_id,unit_label,base_monthly_rent)
  values ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-0000000000p1','U-1', 10000);
select lives_ok('insert_assigned', 'PM allowed under assigned property');

select * from finish();
rollback;
