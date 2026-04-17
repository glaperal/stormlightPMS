import { supabase } from "@/lib/supabase";
import type { Lease, Tenant, Unit } from "@/types/database";
import type { LeaseInput } from "@/schemas/lease.schema";

export interface LeaseWithRefs extends Lease {
  unit: Pick<Unit, "id" | "name" | "property_id"> | null;
  tenant: Pick<Tenant, "id" | "name"> | null;
}

export async function listLeases(groupId: string): Promise<LeaseWithRefs[]> {
  const { data, error } = await supabase
    .from("leases")
    .select(
      "*, unit:units(id,name,property_id), tenant:tenants(id,name)",
    )
    .eq("group_id", groupId)
    .order("status")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data as LeaseWithRefs[];
}

function normalize(input: LeaseInput) {
  return {
    unit_id: input.unit_id,
    tenant_id: input.tenant_id,
    base_rent: input.base_rent,
    dues: input.dues ?? 0,
    vat_rate: input.vat_rate,
    ewt_rate: input.ewt_rate,
    start_date: input.start_date,
    end_date: input.end_date || null,
    status: input.status,
    notes: input.notes || null,
  };
}

export async function createLease(groupId: string, input: LeaseInput) {
  const { data, error } = await supabase
    .from("leases")
    .insert({ ...normalize(input), group_id: groupId })
    .select()
    .single();
  if (error) throw error;
  return data as Lease;
}

export async function updateLease(id: string, input: LeaseInput) {
  const { data, error } = await supabase
    .from("leases")
    .update(normalize(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Lease;
}
