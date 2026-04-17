// Hand-written types mirroring supabase/migrations/0001_schema.sql.
// Regenerate after schema changes via:
//   supabase gen types typescript --local > src/types/database.ts

export type UnitStatus = "Vacant" | "Occupied" | "Renovation";
export type UnitKind = "Commercial" | "Residential" | "Parking";
export type LeaseStatus = "Active" | "Ended" | "Terminated";
export type LedgerStatus = "Unpaid" | "Partial" | "Cleared";
export type LedgerType = "Rent" | "Dues" | "VAT" | "Penalty";
export type TenantType = "Corp" | "Ind";
export type AppRole = "super_admin" | "landlord" | "property_manager" | "maintenance";
export type TicketStatus = "Open" | "InProgress" | "Resolved" | "Cancelled";

export interface LandlordGroup {
  id: string;
  name: string;
  vat_registered: boolean;
  address: string | null;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role: AppRole;
  group_id: string;
}

export interface Property {
  id: string;
  group_id: string;
  name: string;
  type: string;
  address: string | null;
  created_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  group_id: string;
  name: string;
  kind: UnitKind;
  area_sqm: string | null;
  status: UnitStatus;
  notes: string | null;
  created_at: string;
}

export interface Tenant {
  id: string;
  group_id: string;
  name: string;
  tin: string | null;
  type: TenantType;
  contact: string | null;
  created_at: string;
}

export interface Lease {
  id: string;
  group_id: string;
  unit_id: string;
  tenant_id: string;
  base_rent: string;
  dues: string;
  vat_rate: string;
  ewt_rate: string;
  start_date: string;
  end_date: string | null;
  status: LeaseStatus;
  notes: string | null;
  created_at: string;
}

export interface Ledger {
  id: string;
  group_id: string;
  lease_id: string;
  amount: string;
  type: LedgerType;
  due_date: string;
  status: LedgerStatus;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  group_id: string;
  ledger_id: string;
  amount: string;
  date_received: string;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  group_id: string;
  unit_id: string;
  issue: string;
  cost: string | null;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
}
