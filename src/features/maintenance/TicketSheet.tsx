import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/components/ui/toast";
import { ticketSchema, type TicketInput } from "@/schemas/ticket.schema";
import {
  createTicket,
  updateTicket,
  type TicketWithRefs,
} from "@/features/maintenance/api";
import { supabase } from "@/lib/supabase";
import type { Unit } from "@/types/database";

interface TicketSheetProps {
  open: boolean;
  onClose: () => void;
  ticket?: TicketWithRefs | null;
  defaultUnitId?: string;
}

async function listUnits(groupId: string): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("id,name,property_id,group_id,kind,status,area_sqm,notes,created_at")
    .eq("group_id", groupId)
    .order("name");
  if (error) throw error;
  return data as Unit[];
}

export function TicketSheet({
  open,
  onClose,
  ticket,
  defaultUnitId,
}: TicketSheetProps) {
  const { activeGroupId, role } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const form = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      unit_id: defaultUnitId ?? "",
      issue: "",
      status: "Open",
      cost: "" as unknown as number | null,
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units", activeGroupId],
    queryFn: () => listUnits(activeGroupId!),
    enabled: !!activeGroupId && open,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        ticket
          ? {
              unit_id: ticket.unit_id,
              issue: ticket.issue,
              status: ticket.status as TicketInput["status"],
              cost: (ticket.cost == null ? "" : Number(ticket.cost)) as unknown as
                | number
                | null,
            }
          : {
              unit_id: defaultUnitId ?? "",
              issue: "",
              status: "Open",
              cost: "" as unknown as number | null,
            },
      );
    }
  }, [open, ticket, defaultUnitId, form]);

  const mutation = useMutation({
    mutationFn: async (input: TicketInput) => {
      if (!activeGroupId) throw new Error("No active group");
      return ticket
        ? updateTicket(ticket.id, input)
        : createTicket(activeGroupId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast({
        title: ticket ? "Ticket updated" : "Ticket created",
        variant: "success",
      });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "error" });
    },
  });

  // Maintenance staff can only change status/cost on their own tickets; the
  // form disables other fields when a ticket is already on file.
  const lockForMaintenance = role === "maintenance" && !!ticket;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={ticket ? "Edit ticket" : "New ticket"}
      widthClassName="w-[520px]"
    >
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="space-y-4"
      >
        <FormField
          label="Unit"
          htmlFor="t-unit"
          required
          error={form.formState.errors.unit_id?.message}
        >
          <Select
            id="t-unit"
            {...form.register("unit_id")}
            disabled={lockForMaintenance || !!defaultUnitId}
          >
            <option value="">Select unit…</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.kind})
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Issue"
          htmlFor="t-issue"
          required
          error={form.formState.errors.issue?.message}
        >
          <Input
            id="t-issue"
            {...form.register("issue")}
            autoFocus
            disabled={lockForMaintenance}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Status"
            htmlFor="t-status"
            required
            error={form.formState.errors.status?.message}
          >
            <Select id="t-status" {...form.register("status")}>
              <option value="Open">Open</option>
              <option value="InProgress">In progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
          </FormField>
          <FormField
            label="Cost (₱)"
            htmlFor="t-cost"
            hint="Leave blank if not yet known"
            error={form.formState.errors.cost?.message}
          >
            <Input
              id="t-cost"
              type="number"
              step="0.01"
              {...form.register("cost")}
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : ticket ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
