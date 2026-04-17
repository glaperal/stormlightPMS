import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export function MaintenancePage() {
  return (
    <>
      <PageHeader
        title="Maintenance"
        subtitle="Tickets, CapEx, and per-unit cost history."
      />
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
          <Wrench className="size-10 opacity-40" />
          <p className="text-sm">Maintenance module ships in the next iteration.</p>
          <p className="text-xs">
            Tables and sheets will mirror the Leases module pattern.
          </p>
        </div>
      </div>
    </>
  );
}
