import { supabase } from "@/lib/supabase";

export interface PaymentPoint {
  amount: string;
  date_received: string;
  ledger: {
    type: string;
    lease: {
      unit: { name: string } | null;
      tenant: { name: string } | null;
    } | null;
  } | null;
}

export async function listPaymentsForGroup(groupId: string): Promise<PaymentPoint[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(
      "amount, date_received, ledger:ledgers(type, lease:leases(unit:units(name), tenant:tenants(name)))",
    )
    .eq("group_id", groupId)
    .order("date_received");
  if (error) throw error;
  return (data ?? []) as unknown as PaymentPoint[];
}
