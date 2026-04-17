import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { useAuth } from "@/features/auth/AuthProvider";
import { RoleGate } from "@/features/auth/RoleGate";
import { useToast } from "@/components/ui/toast";
import {
  listLedgers,
  runMonthlyBilling,
  type LedgerWithRefs,
} from "@/features/financials/api";
import { PaymentSheet } from "@/features/financials/PaymentSheet";
import { formatPeso } from "@/lib/currency";
import type { LedgerStatus } from "@/types/database";

const statusVariant: Record<LedgerStatus, "success" | "secondary" | "warning"> = {
  Cleared: "success",
  Partial: "warning",
  Unpaid: "secondary",
};

function currentMonthStart() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function FinancialsPage() {
  const { activeGroupId } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<LedgerWithRefs | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["ledgers", activeGroupId],
    queryFn: () => listLedgers(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const billingMutation = useMutation({
    mutationFn: () => runMonthlyBilling(currentMonthStart()),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["ledgers"] });
      toast({
        title: "Billing run complete",
        description: `${count} ledger row${count === 1 ? "" : "s"} generated.`,
        variant: "success",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Billing failed", description: err.message, variant: "error" });
    },
  });

  const columns: DataTableColumn<LedgerWithRefs>[] = [
    {
      key: "due_date",
      header: "Due",
      accessor: (r) => r.due_date,
      sortValue: (r) => r.due_date,
    },
    {
      key: "unit",
      header: "Unit",
      accessor: (r) => r.lease?.unit?.name ?? "—",
      sortValue: (r) => r.lease?.unit?.name ?? "",
      filterValue: (r) => r.lease?.unit?.name ?? "",
    },
    {
      key: "tenant",
      header: "Tenant",
      accessor: (r) => r.lease?.tenant?.name ?? "—",
      sortValue: (r) => r.lease?.tenant?.name ?? "",
      filterValue: (r) => r.lease?.tenant?.name ?? "",
    },
    {
      key: "type",
      header: "Type",
      accessor: (r) => r.type,
      sortValue: (r) => r.type,
    },
    {
      key: "amount",
      header: "Amount",
      accessor: (r) => formatPeso(Number(r.amount)),
      sortValue: (r) => Number(r.amount),
      className: "text-right tabular-nums",
    },
    {
      key: "paid",
      header: "Paid",
      accessor: (r) => formatPeso(Number(r.paid_amount ?? 0)),
      sortValue: (r) => Number(r.paid_amount ?? 0),
      className: "text-right tabular-nums",
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge>,
      sortValue: (r) => r.status,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      className: "w-32 text-right",
      accessor: (r) => (
        <Button
          size="sm"
          variant={r.status === "Cleared" ? "outline" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            setSelected(r);
            setSheetOpen(true);
          }}
        >
          {r.status === "Cleared" ? "View" : "Log payment"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Financials"
        subtitle={isLoading ? "Loading…" : `${rows.length} ledgers`}
        actions={
          <RoleGate allow={["super_admin", "landlord", "property_manager"]}>
            <Button
              variant="outline"
              onClick={() => billingMutation.mutate()}
              disabled={billingMutation.isPending}
              title="Generates rent / VAT / dues ledgers for every Active lease for the current month."
            >
              <PlayCircle className="size-4" />
              {billingMutation.isPending ? "Running…" : "Run monthly billing"}
            </Button>
          </RoleGate>
        }
      />
      <div className="flex-1 overflow-hidden">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => {
            setSelected(r);
            setSheetOpen(true);
          }}
          emptyMessage={
            isLoading
              ? "Loading…"
              : "No ledgers yet. Click 'Run monthly billing' to generate this month's rows."
          }
          filterPlaceholder="Filter ledgers…"
        />
      </div>
      <PaymentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        ledger={selected}
      />
    </>
  );
}
