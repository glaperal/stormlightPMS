-- StormlightPMS — maintenance, documents, notifications, audit_log, org_settings (SRS §4.13–§4.18)

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  lease_id uuid references public.leases(id),
  title text not null,
  description text,
  priority maintenance_priority not null default 'medium',
  status maintenance_status not null default 'open',
  reported_date date not null default (now() at time zone 'Asia/Manila')::date,
  resolved_date date,
  cost numeric(14,2) check (cost is null or cost >= 0),
  assigned_to text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  constraint maintenance_resolved_chk
    check (status <> 'completed' or resolved_date is not null)
);
create index maintenance_org_idx on public.maintenance_requests(org_id);
create index maintenance_unit_idx on public.maintenance_requests(unit_id);
create index maintenance_status_idx on public.maintenance_requests(status);
create trigger trg_maintenance_updated_at
  before update on public.maintenance_requests
  for each row execute function public.set_updated_at();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  doc_type doc_type not null,
  entity_type text not null check (entity_type in ('lease','tenant','property','unit','payment')),
  entity_id uuid not null,
  bucket text not null check (bucket in ('documents','payment-proofs','property-photos')),
  file_path text not null,
  file_name text,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index documents_org_idx on public.documents(org_id);
create index documents_entity_idx on public.documents(entity_type, entity_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  profile_id uuid not null references public.profiles(id),
  notification_type notification_type not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  dedupe_key text not null unique,
  is_read boolean not null default false,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_profile_idx on public.notifications(profile_id);
create index notifications_org_idx on public.notifications(org_id);
create index notifications_unread_idx on public.notifications(profile_id) where is_read = false;

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  profile_id uuid,
  action text not null check (action in ('create','update','delete','void')),
  entity_type text not null,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_org_idx on public.audit_log(org_id);
create index audit_log_entity_idx on public.audit_log(entity_type, entity_id);

create table public.org_settings (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  rent_due_window_days integer not null default 3 check (rent_due_window_days >= 0),
  lease_expiry_thresholds integer[] not null default '{60,30}',
  reminder_email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger trg_org_settings_updated_at
  before update on public.org_settings
  for each row execute function public.set_updated_at();

-- auto-create org_settings when an organization is created
create or replace function public.handle_new_organization() returns trigger
  language plpgsql security definer set search_path = public
  as $$
  begin
    insert into public.org_settings(org_id) values (new.id)
    on conflict (org_id) do nothing;
    return new;
  end;
  $$;

create trigger trg_organizations_settings
  after insert on public.organizations
  for each row execute function public.handle_new_organization();
