import { supabase } from "@/lib/supabase";
import type { Tenant } from "@/types/database";
import type { TenantInput } from "@/schemas/tenant.schema";

export async function listTenants(groupId: string): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("group_id", groupId)
    .order("name");
  if (error) throw error;
  return data as Tenant[];
}

function normalize(input: TenantInput) {
  return {
    name: input.name,
    type: input.type,
    tin: input.tin || null,
    contact: input.contact || null,
  };
}

export async function createTenant(
  groupId: string,
  input: TenantInput,
): Promise<Tenant> {
  const { data, error } = await supabase
    .from("tenants")
    .insert({ ...normalize(input), group_id: groupId })
    .select()
    .single();
  if (error) throw error;
  return data as Tenant;
}

export async function updateTenant(
  id: string,
  input: TenantInput,
): Promise<Tenant> {
  const { data, error } = await supabase
    .from("tenants")
    .update(normalize(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Tenant;
}
