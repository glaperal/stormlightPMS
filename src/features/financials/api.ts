import { supabase } from "@/lib/supabase";
import type { Ledger, Payment } from "@/types/database";
import type { PaymentInput } from "@/schemas/payment.schema";

export interface LedgerWithRefs extends Ledger {
  lease: {
    id: string;
    unit: { id: string; name: string } | null;
    tenant: { id: string; name: string } | null;
  } | null;
  paid_amount?: number;
}

export async function listLedgers(groupId: string): Promise<LedgerWithRefs[]> {
  const { data, error } = await supabase
    .from("ledgers")
    .select(
      "*, lease:leases(id, unit:units(id,name), tenant:tenants(id,name)), payments(amount)",
    )
    .eq("group_id", groupId)
    .order("due_date", { ascending: false })
    .order("status");
  if (error) throw error;
  type Raw = LedgerWithRefs & { payments?: { amount: string }[] };
  return (data as Raw[]).map((r) => ({
    ...r,
    paid_amount: (r.payments ?? []).reduce((s, p) => s + Number(p.amount), 0),
  }));
}

export async function listPaymentsForLedger(ledgerId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("ledger_id", ledgerId)
    .order("date_received", { ascending: false });
  if (error) throw error;
  return data as Payment[];
}

export async function createPayment(
  groupId: string,
  ledgerId: string,
  input: PaymentInput,
) {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      group_id: groupId,
      ledger_id: ledgerId,
      amount: input.amount,
      date_received: input.date_received,
      reference_no: input.reference_no || null,
      notes: input.notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function runMonthlyBilling(billingMonth: string) {
  const { data, error } = await supabase.rpc("generate_monthly_ledgers", {
    p_billing_month: billingMonth,
  });
  if (error) throw error;
  return data as number;
}
