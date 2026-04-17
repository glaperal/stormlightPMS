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
import { leaseSchema, type LeaseInput } from "@/schemas/lease.schema";
import { createLease, updateLease, type LeaseWithRefs } from "@/features/leases/api";
import { listTenants } from "@/features/tenants/api";
import { supabase } from "@/lib/supabase";
import type { Unit } from "@/types/database";
import { formatPeso, computeLedgerBreakdown } from "@/lib/currency";

interface LeaseSheetProps {
  open: boolean;
  onClose: () => void;
  lease?: LeaseWithRefs | null;
}

async function listUnits(groupId: string): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("group_id", groupId)
    .order("name");
  if (error) throw error;
  return data as Unit[];
}

const today = () => new Date().toISOString().slice(0, 10);

export function LeaseSheet({ open, onClose, lease }: LeaseSheetProps) {
  const { activeGroupId } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const form = useForm<LeaseInput>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      unit_id: "",
      tenant_id: "",
      base_rent: 0,
      dues: 0,
      vat_rate: 12,
      ewt_rate: 0,
      start_date: today(),
      end_date: "",
      status: "Active",
      notes: "",
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants", activeGroupId],
    queryFn: () => listTenants(activeGroupId!),
    enabled: !!activeGroupId && open,
  });
  const { data: units = [] } = useQuery({
    queryKey: ["units", activeGroupId],
    queryFn: () => listUnits(activeGroupId!),
    enabled: !!activeGroupId && open,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        lease
          ? {
              unit_id: lease.unit_id,
              tenant_id: lease.tenant_id,
              base_rent: Number(lease.base_rent),
              dues: Number(lease.dues ?? 0),
              vat_rate: Number(lease.vat_rate),
              ewt_rate: Number(lease.ewt_rate),
              start_date: lease.start_date,
              end_date: lease.end_date ?? "",
              status: lease.status as LeaseInput["status"],
              notes: lease.notes ?? "",
            }
          : {
              unit_id: "",
              tenant_id: "",
              base_rent: 0,
              dues: 0,
              vat_rate: 12,
              ewt_rate: 0,
              start_date: today(),
              end_date: "",
              status: "Active",
              notes: "",
            },
      );
    }
  }, [open, lease, form]);

  const mutation = useMutation({
    mutationFn: async (input: LeaseInput) => {
      if (!activeGroupId) throw new Error("No active group");
      return lease
        ? updateLease(lease.id, input)
        : createLease(activeGroupId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leases"] });
      qc.invalidateQueries({ queryKey: ["units"] });
      toast({ title: lease ? "Lease updated" : "Lease created", variant: "success" });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "error" });
    },
  });

  const values = form.watch();
  const breakdown = computeLedgerBreakdown({
    baseRent: Number(values.base_rent) || 0,
    vatRate: Number(values.vat_rate) || 0,
    ewtRate: Number(values.ewt_rate) || 0,
    vatRegistered: true,
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={lease ? "Edit lease" : "New lease"}
      widthClassName="w-[560px]"
    >
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Unit"
            htmlFor="l-unit"
            required
            error={form.formState.errors.unit_id?.message}
          >
            <Select id="l-unit" {...form.register("unit_id")}>
              <option value="">Select unit…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.kind})
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label="Tenant"
            htmlFor="l-tenant"
            required
            error={form.formState.errors.tenant_id?.message}
          >
            <Select id="l-tenant" {...form.register("tenant_id")}>
              <option value="">Select tenant…</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Base rent (₱)"
            htmlFor="l-rent"
            required
            error={form.formState.errors.base_rent?.message}
          >
            <Input
              id="l-rent"
              type="number"
              step="0.01"
              {...form.register("base_rent")}
            />
          </FormField>
          <FormField
            label="Assoc. dues (₱)"
            htmlFor="l-dues"
            error={form.formState.errors.dues?.message}
          >
            <Input id="l-dues" type="number" step="0.01" {...form.register("dues")} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="VAT rate (%)"
            htmlFor="l-vat"
            error={form.formState.errors.vat_rate?.message}
            hint="0 = non-VAT lease"
          >
            <Input id="l-vat" type="number" step="0.01" {...form.register("vat_rate")} />
          </FormField>
          <FormField
            label="EWT rate (%)"
            htmlFor="l-ewt"
            error={form.formState.errors.ewt_rate?.message}
          >
            <Input id="l-ewt" type="number" step="0.01" {...form.register("ewt_rate")} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Start date"
            htmlFor="l-start"
            required
            error={form.formState.errors.start_date?.message}
          >
            <Input id="l-start" type="date" {...form.register("start_date")} />
          </FormField>
          <FormField
            label="End date"
            htmlFor="l-end"
            error={form.formState.errors.end_date?.message}
          >
            <Input id="l-end" type="date" {...form.register("end_date")} />
          </FormField>
        </div>

        <FormField
          label="Status"
          htmlFor="l-status"
          required
          error={form.formState.errors.status?.message}
        >
          <Select id="l-status" {...form.register("status")}>
            <option value="Active">Active</option>
            <option value="Ended">Ended</option>
            <option value="Terminated">Terminated</option>
          </Select>
        </FormField>

        <FormField
          label="Notes"
          htmlFor="l-notes"
          error={form.formState.errors.notes?.message}
        >
          <Input id="l-notes" {...form.register("notes")} />
        </FormField>

        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <div className="mb-1 font-medium text-foreground">Monthly preview</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="text-muted-foreground">Base rent</span>
            <span className="text-right">{formatPeso(breakdown.base)}</span>
            <span className="text-muted-foreground">+ VAT</span>
            <span className="text-right">{formatPeso(breakdown.vat)}</span>
            <span className="text-muted-foreground">− EWT</span>
            <span className="text-right">{formatPeso(breakdown.ewt)}</span>
            <span className="font-medium">Net</span>
            <span className="text-right font-medium">{formatPeso(breakdown.total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : lease ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
