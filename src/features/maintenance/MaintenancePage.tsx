import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { useAuth } from "@/features/auth/AuthProvider";
import { RoleGate } from "@/features/auth/RoleGate";
import { listTickets, type TicketWithRefs } from "@/features/maintenance/api";
import { TicketSheet } from "@/features/maintenance/TicketSheet";
import { formatPeso } from "@/lib/currency";
import type { TicketStatus } from "@/types/database";

const statusVariant: Record<
  TicketStatus,
  "default" | "success" | "secondary" | "warning" | "destructive"
> = {
  Open: "warning",
  InProgress: "default",
  Resolved: "success",
  Cancelled: "secondary",
};

const statusLabel: Record<TicketStatus, string> = {
  Open: "Open",
  InProgress: "In progress",
  Resolved: "Resolved",
  Cancelled: "Cancelled",
};

export function MaintenancePage() {
  const { activeGroupId } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TicketWithRefs | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["tickets", activeGroupId],
    queryFn: () => listTickets(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const totals = useMemo(() => {
    let open = 0;
    let spent = 0;
    for (const t of rows) {
      if (t.status === "Open" || t.status === "InProgress") open += 1;
      if (t.cost != null) spent += Number(t.cost);
    }
    return { open, spent };
  }, [rows]);

  const columns: DataTableColumn<TicketWithRefs>[] = [
    {
      key: "unit",
      header: "Unit",
      accessor: (r) => r.unit?.name ?? "—",
      sortValue: (r) => r.unit?.name ?? "",
      filterValue: (r) => r.unit?.name ?? "",
    },
    {
      key: "issue",
      header: "Issue",
      accessor: (r) => r.issue,
      sortValue: (r) => r.issue,
    },
    {
      key: "cost",
      header: "Cost",
      accessor: (r) => (r.cost != null ? formatPeso(Number(r.cost)) : "—"),
      sortValue: (r) => (r.cost != null ? Number(r.cost) : 0),
      className: "text-right tabular-nums",
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (
        <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
      ),
      sortValue: (r) => r.status,
    },
    {
      key: "created",
      header: "Opened",
      accessor: (r) => r.created_at?.slice(0, 10) ?? "",
      sortValue: (r) => r.created_at ?? "",
    },
  ];

  return (
    <>
      <PageHeader
        title="Maintenance"
        subtitle={
          isLoading
            ? "Loading…"
            : `${rows.length} tickets · ${totals.open} open · ${formatPeso(totals.spent)} lifetime cost`
        }
        actions={
          <RoleGate allow={["super_admin", "landlord", "property_manager"]}>
            <Button
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus className="size-4" />
              New ticket
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
          emptyMessage={isLoading ? "Loading…" : "No tickets yet."}
          filterPlaceholder="Filter tickets…"
        />
      </div>
      <TicketSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        ticket={editing}
      />
    </>
  );
}
