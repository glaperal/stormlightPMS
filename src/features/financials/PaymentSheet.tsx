import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/components/ui/toast";
import { paymentSchema, type PaymentInput } from "@/schemas/payment.schema";
import {
  createPayment,
  listPaymentsForLedger,
  type LedgerWithRefs,
} from "@/features/financials/api";
import { formatPeso } from "@/lib/currency";

interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  ledger: LedgerWithRefs | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function PaymentSheet({ open, onClose, ledger }: PaymentSheetProps) {
  const { activeGroupId } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, date_received: today(), reference_no: "", notes: "" },
  });

  const paid = Number(ledger?.paid_amount ?? 0);
  const outstanding = ledger ? Math.max(0, Number(ledger.amount) - paid) : 0;

  useEffect(() => {
    if (open && ledger) {
      form.reset({
        amount: outstanding,
        date_received: today(),
        reference_no: "",
        notes: "",
      });
    }
  }, [open, ledger, form, outstanding]);

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", ledger?.id],
    queryFn: () => listPaymentsForLedger(ledger!.id),
    enabled: open && !!ledger,
  });

  const mutation = useMutation({
    mutationFn: async (input: PaymentInput) => {
      if (!activeGroupId || !ledger) throw new Error("Missing context");
      return createPayment(activeGroupId, ledger.id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledgers"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Payment recorded", variant: "success" });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "error" });
    },
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log payment"
      description={
        ledger
          ? `${ledger.lease?.unit?.name ?? "—"} · ${ledger.lease?.tenant?.name ?? "—"} · ${ledger.type} · due ${ledger.due_date}`
          : undefined
      }
      widthClassName="w-[520px]"
    >
      {ledger ? (
        <>
          <div className="mb-4 rounded-md border bg-muted/30 p-3 text-xs">
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span className="text-muted-foreground">Ledger amount</span>
              <span className="text-right">{formatPeso(Number(ledger.amount))}</span>
              <span className="text-muted-foreground">Paid</span>
              <span className="text-right">{formatPeso(paid)}</span>
              <span className="font-medium">Outstanding</span>
              <span className="text-right font-medium">{formatPeso(outstanding)}</span>
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Amount (₱)"
                htmlFor="p-amount"
                required
                error={form.formState.errors.amount?.message}
              >
                <Input
                  id="p-amount"
                  type="number"
                  step="0.01"
                  {...form.register("amount")}
                />
              </FormField>
              <FormField
                label="Date received"
                htmlFor="p-date"
                required
                error={form.formState.errors.date_received?.message}
              >
                <Input id="p-date" type="date" {...form.register("date_received")} />
              </FormField>
            </div>
            <FormField
              label="Reference #"
              htmlFor="p-ref"
              error={form.formState.errors.reference_no?.message}
            >
              <Input id="p-ref" {...form.register("reference_no")} />
            </FormField>
            <FormField
              label="Notes"
              htmlFor="p-notes"
              error={form.formState.errors.notes?.message}
            >
              <Input id="p-notes" {...form.register("notes")} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Recording…" : "Record payment"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium">Previous payments</h3>
            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No payments yet.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded border px-3 py-2"
                  >
                    <span>
                      {p.date_received}
                      {p.reference_no ? ` · ${p.reference_no}` : ""}
                    </span>
                    <span className="font-medium">
                      {formatPeso(Number(p.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </Sheet>
  );
}
