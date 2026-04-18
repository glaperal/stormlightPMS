import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { RoleGate } from "@/features/auth/RoleGate";
import {
  getProperty,
  listUnitsForProperty,
} from "@/features/properties/api-unit";
import { UnitSheet } from "@/features/properties/UnitSheet";
import { useAuth } from "@/features/auth/AuthProvider";
import { listTickets } from "@/features/maintenance/api";
import { formatPeso } from "@/lib/currency";
import type { Unit, UnitStatus } from "@/types/database";

const statusVariant: Record<UnitStatus, "success" | "secondary" | "warning"> = {
  Vacant: "secondary",
  Occupied: "success",
  Renovation: "warning",
};

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeGroupId } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);

  const { data: property } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getProperty(id!),
    enabled: !!id,
  });

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["units", id],
    queryFn: () => listUnitsForProperty(id!),
    enabled: !!id,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets", activeGroupId],
    queryFn: () => listTickets(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const capexByUnit = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tickets) {
      if (t.cost == null) continue;
      m.set(t.unit_id, (m.get(t.unit_id) ?? 0) + Number(t.cost));
    }
    return m;
  }, [tickets]);

  const columns: DataTableColumn<Unit>[] = [
    { key: "name", header: "Name", accessor: (r) => r.name, sortValue: (r) => r.name },
    { key: "kind", header: "Kind", accessor: (r) => r.kind, sortValue: (r) => r.kind },
    {
      key: "area_sqm",
      header: "Area (sqm)",
      accessor: (r) => (r.area_sqm != null ? Number(r.area_sqm).toFixed(2) : "—"),
      sortValue: (r) => (r.area_sqm != null ? Number(r.area_sqm) : 0),
    },
    {
      key: "status",
      header: "Status",
      accessor: (r) => (
        <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
      ),
      sortValue: (r) => r.status,
    },
    {
      key: "capex",
      header: "Maintenance",
      accessor: (r) => {
        const total = capexByUnit.get(r.id) ?? 0;
        return total > 0 ? (
          <span className="tabular-nums">{formatPeso(total)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      sortValue: (r) => capexByUnit.get(r.id) ?? 0,
      className: "text-right",
    },
    {
      key: "notes",
      header: "Notes",
      accessor: (r) => <span className="text-muted-foreground">{r.notes ?? ""}</span>,
      sortValue: (r) => r.notes ?? "",
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      className: "w-24 text-right",
      accessor: (r) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(r);
            setSheetOpen(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={property?.name ?? "Property"}
        subtitle={
          property?.address ?? (isLoading ? "Loading units…" : `${units.length} units`)
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/properties")}
            >
              <ArrowLeft className="size-4" />
              All properties
            </Button>
            <RoleGate allow={["super_admin", "landlord", "property_manager"]}>
              <Button
                onClick={() => {
                  setEditing(null);
                  setSheetOpen(true);
                }}
              >
                <Plus className="size-4" />
                New unit
              </Button>
            </RoleGate>
          </>
        }
      />
      <div className="flex-1 overflow-hidden">
        <DataTable
          rows={units}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => {
            setEditing(r);
            setSheetOpen(true);
          }}
          emptyMessage={isLoading ? "Loading…" : "No units yet."}
          filterPlaceholder="Filter units…"
        />
      </div>
      {id ? (
        <UnitSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          propertyId={id}
          unit={editing}
        />
      ) : null}
    </>
  );
}
