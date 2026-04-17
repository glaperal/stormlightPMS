import { supabase } from "@/lib/supabase";
import type { Unit } from "@/types/database";
import type { UnitInput } from "@/schemas/unit.schema";

export async function getProperty(id: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function listUnitsForProperty(propertyId: string): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("property_id", propertyId)
    .order("kind")
    .order("name");
  if (error) throw error;
  return data as Unit[];
}

export async function createUnit(
  groupId: string,
  propertyId: string,
  input: UnitInput,
): Promise<Unit> {
  const { data, error } = await supabase
    .from("units")
    .insert({
      group_id: groupId,
      property_id: propertyId,
      name: input.name,
      kind: input.kind,
      area_sqm: input.area_sqm,
      status: input.status,
      notes: input.notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Unit;
}

export async function updateUnit(id: string, input: UnitInput): Promise<Unit> {
  const { data, error } = await supabase
    .from("units")
    .update({
      name: input.name,
      kind: input.kind,
      area_sqm: input.area_sqm,
      status: input.status,
      notes: input.notes || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Unit;
}
