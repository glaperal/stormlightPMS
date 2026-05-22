-- StormlightPMS — enums (SRS §4.1)

create type user_role as enum ('superadmin', 'admin', 'property_manager');
create type org_status as enum ('active', 'suspended');
create type profile_status as enum ('active', 'inactive');
create type property_type as enum ('residential', 'commercial', 'mixed');
create type property_status as enum ('active', 'archived');
create type unit_status as enum ('vacant', 'occupied', 'under_maintenance', 'unavailable');
create type lease_status as enum ('draft', 'active', 'expired', 'terminated', 'renewed');
create type charge_type as enum (
  'rent',
  'utility_electricity',
  'utility_water',
  'association_dues',
  'parking',
  'penalty',
  'move_out_balance',
  'other'
);
create type charge_status as enum ('unpaid', 'partially_paid', 'paid', 'void');
create type payment_method as enum ('cash', 'bank_transfer', 'gcash', 'maya', 'check', 'other');
create type payment_status as enum ('active', 'void');
create type deduction_category as enum ('unpaid_utility', 'damage');
create type maintenance_status as enum ('open', 'in_progress', 'completed', 'cancelled');
create type maintenance_priority as enum ('low', 'medium', 'high', 'urgent');
create type doc_type as enum (
  'lease_contract',
  'tenant_id',
  'payment_proof',
  'property_photo',
  'settlement',
  'other'
);
create type notification_type as enum (
  'rent_due',
  'rent_overdue',
  'lease_expiring',
  'maintenance_update',
  'system'
);
