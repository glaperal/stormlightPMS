-- StormlightPMS — leases, charges, payments, allocations, deposits (SRS §4.8–§4.12)

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  tenant_id uuid not null references public.tenants(id),
  lease_status lease_status not null default 'draft',
  start_date date not null,
  end_date date not null,
  monthly_rent numeric(14,2) not null check (monthly_rent > 0),
  payment_due_day integer not null default 5 check (payment_due_day between 1 and 28),
  advance_months numeric(4,2) not null default 1 check (advance_months >= 0),
  advance_amount numeric(14,2) not null default 0 check (advance_amount >= 0),
  security_deposit_months numeric(4,2) not null default 2 check (security_deposit_months >= 0),
  security_deposit_amount numeric(14,2) not null default 0 check (security_deposit_amount >= 0),
  escalation_rate numeric(5,2) not null default 0,
  escalation_frequency_months integer not null default 12,
  renewed_from_lease_id uuid references public.leases(id),
  termination_date date,
  termination_reason text,
  deposit_settled_date date,
  deposit_refund_amount numeric(14,2),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  constraint leases_dates_chk check (end_date >= start_date)
);
create index leases_org_idx on public.leases(org_id);
create index leases_unit_idx on public.leases(unit_id);
create index leases_tenant_idx on public.leases(tenant_id);
create index leases_status_idx on public.leases(lease_status);
create index leases_org_status_end_idx on public.leases(org_id, lease_status, end_date);
create unique index leases_one_active_per_unit_idx
  on public.leases(unit_id) where lease_status = 'active';
create trigger trg_leases_updated_at
  before update on public.leases
  for each row execute function public.set_updated_at();

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  lease_id uuid not null references public.leases(id),
  charge_type charge_type not null,
  description text,
  billing_period date,
  amount numeric(14,2) not null check (amount > 0),
  due_date date not null,
  charge_status charge_status not null default 'unpaid',
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
create index charges_org_idx on public.charges(org_id);
create index charges_lease_idx on public.charges(lease_id);
create index charges_due_idx on public.charges(due_date);
create index charges_org_status_due_idx on public.charges(org_id, charge_status, due_date);
create trigger trg_charges_updated_at
  before update on public.charges
  for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  lease_id uuid not null references public.leases(id),
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null,
  payment_method payment_method not null,
  reference_no text,
  proof_url text,
  notes text,
  payment_status payment_status not null default 'active',
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_org_idx on public.payments(org_id);
create index payments_lease_idx on public.payments(lease_id);
create index payments_date_idx on public.payments(payment_date);
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  payment_id uuid not null references public.payments(id),
  charge_id uuid not null references public.charges(id),
  amount_applied numeric(14,2) not null check (amount_applied > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, charge_id)
);
create index payment_allocations_payment_idx on public.payment_allocations(payment_id);
create index payment_allocations_charge_idx on public.payment_allocations(charge_id);
create index payment_allocations_org_idx on public.payment_allocations(org_id);

create table public.deposit_deductions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  lease_id uuid not null references public.leases(id),
  deduction_category deduction_category not null,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);
create index deposit_deductions_lease_idx on public.deposit_deductions(lease_id);
create index deposit_deductions_org_idx on public.deposit_deductions(org_id);
