import { supabase } from "@/lib/supabase";
import type { Ticket, Unit } from "@/types/database";
import type { TicketInput } from "@/schemas/ticket.schema";

export interface TicketWithRefs extends Ticket {
  unit: Pick<Unit, "id" | "name" | "property_id"> | null;
}

export async function listTickets(groupId: string): Promise<TicketWithRefs[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, unit:units(id,name,property_id)")
    .eq("group_id", groupId)
    .order("status")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as TicketWithRefs[];
}

export async function listTicketsForUnit(unitId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("unit_id", unitId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Ticket[];
}

function normalize(input: TicketInput) {
  return {
    unit_id: input.unit_id,
    issue: input.issue,
    status: input.status,
    cost: input.cost,
  };
}

export async function createTicket(groupId: string, input: TicketInput) {
  const { data, error } = await supabase
    .from("tickets")
    .insert({ ...normalize(input), group_id: groupId })
    .select()
    .single();
  if (error) throw error;
  return data as Ticket;
}

export async function updateTicket(id: string, input: TicketInput) {
  const { data, error } = await supabase
    .from("tickets")
    .update(normalize(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Ticket;
}
