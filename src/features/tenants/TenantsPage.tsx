import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { useAuth } from "@/features/auth/AuthProvider";
import { RoleGate } from "@/features/auth/RoleGate";
import { listTenants } from "@/features/tenants/api";
import { TenantSheet } from "@/features/tenants/TenantSheet";
import type { Tenant } from "@/types/database";

export function TenantsPage() {
  const { activeGroupId } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["tenants", activeGroupId],
    queryFn: () => listTenants(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const columns: DataTableColumn<Tenant>[] = [
    { key: "name", header: "Name", accessor: (r) => r.name, sortValue: (r) => r.name },
    {
      key: "type",
      header: "Type",
      accessor: (r) => (r.type === "Corp" ? "Corporate" : "Individual"),
      sortValue: (r) => r.type,
    },
    {
      key: "tin",
      header: "TIN",
      accessor: (r) => r.tin ?? "—",
      sortValue: (r) => r.tin ?? "",
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
        title="Tenants"
        subtitle={isLoading ? "Loading…" : `${rows.length} tenants`}
        actions={
          <RoleGate allow={["super_admin", "landlord", "property_manager"]}>
            <Button
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus className="size-4" />
              New tenant
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
          emptyMessage={isLoading ? "Loading…" : "No tenants yet."}
          filterPlaceholder="Filter tenants…"
        />
      </div>
      <TenantSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tenant={editing}
      />
    </>
  );
}
