import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { useAuth } from "@/features/auth/AuthProvider";
import { RoleGate } from "@/features/auth/RoleGate";
import { listLeases, type LeaseWithRefs } from "@/features/leases/api";
import { LeaseSheet } from "@/features/leases/LeaseSheet";
import { formatPeso } from "@/lib/currency";
import type { LeaseStatus } from "@/types/database";

const statusVariant: Record<LeaseStatus, "success" | "secondary" | "destructive"> = {
  Active: "success",
  Ended: "secondary",
  Terminated: "destructive",
};

export function LeasesPage() {
  const { activeGroupId } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<LeaseWithRefs | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["leases", activeGroupId],
    queryFn: () => listLeases(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const columns: DataTableColumn<LeaseWithRefs>[] = [
    {
      key: "unit",
      header: "Unit",
      accessor: (r) => r.unit?.name ?? "—",
      sortValue: (r) => r.unit?.name ?? "",
      filterValue: (r) => r.unit?.name ?? "",
    },
    {
      key: "tenant",
      header: "Tenant",
      accessor: (r) => r.tenant?.name ?? "—",
      sortValue: (r) => r.tenant?.name ?? "",
      filterValue: (r) => r.tenant?.name ?? "",
    },
    {
      key: "base_rent",
      header: "Rent / mo",
      accessor: (r) => formatPeso(Number(r.base_rent)),
      sortValue: (r) => Number(r.base_rent),
      className: "text-right tabular-nums",
    },
    {
      key: "vat",
      header: "VAT",
      accessor: (r) => `${Number(r.vat_rate).toFixed(2)}%`,
      sortValue: (r) => Number(r.vat_rate),
      className: "text-right tabular-nums",
    },
    {
      key: "start_date",
      header: "Start",
      accessor: (r) => r.start_date,
      sortValue: (r) => r.start_date,
    },
    {
      key: "end_date",
      header: "End",
      accessor: (r) => r.end_date ?? "—",
      sortValue: (r) => r.end_date ?? "",
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (
        <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
      ),
      sortValue: (r) => r.status,
    },
  ];

  return (
    <>
      <PageHeader
        title="Leases"
        subtitle={isLoading ? "Loading…" : `${rows.length} leases`}
        actions={
          <RoleGate allow={["super_admin", "landlord", "property_manager"]}>
            <Button
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus className="size-4" />
              New lease
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
            setEditing(r);
            setSheetOpen(true);
          }}
          emptyMessage={isLoading ? "Loading…" : "No leases yet."}
          filterPlaceholder="Filter leases…"
        />
      </div>
      <LeaseSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        lease={editing}
      />
    </>
  );
}
