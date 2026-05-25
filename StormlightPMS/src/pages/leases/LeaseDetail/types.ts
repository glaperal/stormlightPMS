export interface LeaseFull {
  id: string;
  org_id: string;
  lease_status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
  start_date: string;
  end_date: string;
  monthly_rent: string;
  payment_due_day: number;
  advance_months: string;
  advance_amount: string;
  security_deposit_months: string;
  security_deposit_amount: string;
  escalation_rate: string;
  escalation_frequency_months: number;
  termination_date: string | null;
  termination_reason: string | null;
  deposit_settled_date: string | null;
  deposit_refund_amount: string | null;
  units: { id: string; unit_label: string; properties: { name: string; id: string } | null } | null;
  tenants: { id: string; full_name: string } | null;
}

export interface ChargeRow {
  id: string;
  charge_type: string;
  description: string | null;
  billing_period: string | null;
  amount: string;
  due_date: string;
  charge_status: string;
}

export interface PaymentRow {
  id: string;
  payment_date: string;
  amount: string;
  payment_method: string;
  payment_status: string;
  reference_no: string | null;
}

export interface AllocationRow {
  id: string;
  payment_id: string;
  charge_id: string;
  amount_applied: string;
}

export interface LedgerRow {
  charged_total: string;
  allocated_total: string;
  paid_total: string;
  outstanding_balance: string;
  unapplied_credit: string;
  deposit_held: string;
  advance_held: string;
}
