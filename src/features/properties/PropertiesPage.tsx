import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { useAuth } from "@/features/auth/AuthProvider";
import { RoleGate } from "@/features/auth/RoleGate";
import { listProperties } from "@/features/properties/api";
import { PropertySheet } from "@/features/properties/PropertySheet";
import type { Property } from "@/types/database";

export function PropertiesPage() {
  const { activeGroupId } = useAuth();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["properties", activeGroupId],
    queryFn: () => listProperties(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const columns: DataTableColumn<Property>[] = [
    { key: "name", header: "Name", accessor: (r) => r.name, sortValue: (r) => r.name },
    { key: "type", header: "Type", accessor: (r) => r.type, sortValue: (r) => r.type },
    {
      key: "address",
      header: "Address",
      accessor: (r) => r.address ?? "—",
      sortValue: (r) => r.address ?? "",
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
        title="Properties"
        subtitle={isLoading ? "Loading…" : `${rows.length} properties`}
        actions={
          <RoleGate allow={["super_admin", "landlord", "property_manager"]}>
            <Button
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus className="size-4" />
              New property
            </Button>
          </RoleGate>
        }
      />
      <div className="flex-1 overflow-hidden">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/properties/${r.id}`)}
          emptyMessage={isLoading ? "Loading…" : "No properties yet. Create your first one."}
          filterPlaceholder="Filter properties…"
        />
      </div>
      <PropertySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        property={editing}
      />
    </>
  );
}
