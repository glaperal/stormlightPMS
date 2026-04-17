import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/database";
import type { PropertyInput } from "@/schemas/property.schema";

export async function listProperties(groupId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("group_id", groupId)
    .order("name");
  if (error) throw error;
  return data as Property[];
}

export async function createProperty(
  groupId: string,
  input: PropertyInput,
): Promise<Property> {
  const { data, error } = await supabase
    .from("properties")
    .insert({ ...input, address: input.address || null, group_id: groupId })
    .select()
    .single();
  if (error) throw error;
  return data as Property;
}

export async function updateProperty(
  id: string,
  input: PropertyInput,
): Promise<Property> {
  const { data, error } = await supabase
    .from("properties")
    .update({ ...input, address: input.address || null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Property;
}
