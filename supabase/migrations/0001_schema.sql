-- Stormlight PMS — core schema
-- All money stored as NUMERIC(14,2) (pesos); rates as NUMERIC(5,2) percentage.

create extension if not exists "pgcrypto";

-- Enums -----------------------------------------------------------------
do $$ begin
  create type unit_status as enum ('Vacant', 'Occupied', 'Renovation');
exception when duplicate_object then null; end $$;

do $$ begin
  create type unit_kind as enum ('Commercial', 'Residential', 'Parking');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lease_status as enum ('Active', 'Ended', 'Terminated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ledger_status as enum ('Unpaid', 'Partial', 'Cleared');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ledger_type as enum ('Rent', 'Dues', 'VAT', 'Penalty');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tenant_type as enum ('Corp', 'Ind');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('super_admin', 'landlord', 'property_manager', 'maintenance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('Open', 'InProgress', 'Resolved', 'Cancelled');
exception when duplicate_object then null; end $$;

-- Tables ----------------------------------------------------------------
create table if not exists landlord_groups (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  vat_registered  boolean not null default false,
  address         text,
  created_at      timestamptz not null default now()
);

create table if not exists user_roles (
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      app_role not null,
  group_id  uuid not null references landlord_groups(id) on delete cascade,
  primary key (user_id, group_id)
);
create index if not exists user_roles_group_idx on user_roles(group_id);

create table if not exists properties (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references landlord_groups(id) on delete cascade,
  name        text not null,
  type        text not null default 'Commercial',
  address     text,
  created_at  timestamptz not null default now()
);
create index if not exists properties_group_idx on properties(group_id);

create table if not exists units (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references landlord_groups(id) on delete cascade,
  property_id  uuid not null references properties(id) on delete cascade,
  name         text not null,
  kind         unit_kind not null default 'Commercial',
  area_sqm     numeric(10,2),
  status       unit_status not null default 'Vacant',
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists units_property_idx on units(property_id);
create index if not exists units_group_idx on units(group_id);
create unique index if not exists units_property_name_uniq on units(property_id, name);

create table if not exists tenants (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references landlord_groups(id) on delete cascade,
  name        text not null,
  tin         text,
  type        tenant_type not null default 'Corp',
  contact     text,
  created_at  timestamptz not null default now()
);
create index if not exists tenants_group_idx on tenants(group_id);

create table if not exists leases (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references landlord_groups(id) on delete cascade,
  unit_id     uuid not null references units(id) on delete restrict,
  tenant_id   uuid not null references tenants(id) on delete restrict,
  base_rent   numeric(14,2) not null check (base_rent >= 0),
  dues        numeric(14,2) not null default 0 check (dues >= 0),
  vat_rate    numeric(5,2) not null default 0 check (vat_rate >= 0 and vat_rate <= 100),
  ewt_rate    numeric(5,2) not null default 0 check (ewt_rate >= 0 and ewt_rate <= 100),
  start_date  date not null,
  end_date    date,
  status      lease_status not null default 'Active',
  notes       text,
  created_at  timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);
create index if not exists leases_group_idx on leases(group_id);
create index if not exists leases_unit_idx on leases(unit_id);
create index if not exists leases_tenant_idx on leases(tenant_id);
create unique index if not exists leases_one_active_per_unit
  on leases(unit_id) where status = 'Active';

create table if not exists ledgers (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references landlord_groups(id) on delete cascade,
  lease_id    uuid not null references leases(id) on delete cascade,
  amount      numeric(14,2) not null check (amount >= 0),
  type        ledger_type not null default 'Rent',
  due_date    date not null,
  status      ledger_status not null default 'Unpaid',
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists ledgers_group_idx on ledgers(group_id);
create index if not exists ledgers_lease_idx on ledgers(lease_id);
create index if not exists ledgers_due_idx on ledgers(due_date);
create unique index if not exists ledgers_lease_type_due_uniq
  on ledgers(lease_id, type, due_date);

create table if not exists payments (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references landlord_groups(id) on delete cascade,
  ledger_id      uuid not null references ledgers(id) on delete cascade,
  amount         numeric(14,2) not null check (amount > 0),
  date_received  date not null default current_date,
  reference_no   text,
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists payments_group_idx on payments(group_id);
create index if not exists payments_ledger_idx on payments(ledger_id);

create table if not exists tickets (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references landlord_groups(id) on delete cascade,
  unit_id      uuid not null references units(id) on delete cascade,
  issue        text not null,
  cost         numeric(14,2) check (cost is null or cost >= 0),
  status       ticket_status not null default 'Open',
  assigned_to  uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
create index if not exists tickets_group_idx on tickets(group_id);
create index if not exists tickets_unit_idx on tickets(unit_id);
