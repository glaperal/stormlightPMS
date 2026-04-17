import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { useAuth } from "@/features/auth/AuthProvider";
import { useToast } from "@/components/ui/toast";
import { tenantSchema, type TenantInput } from "@/schemas/tenant.schema";
import { createTenant, updateTenant } from "@/features/tenants/api";
import type { Tenant } from "@/types/database";

interface TenantSheetProps {
  open: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
}

export function TenantSheet({ open, onClose, tenant }: TenantSheetProps) {
  const { activeGroupId } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const form = useForm<TenantInput>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { name: "", type: "Corp", tin: "", contact: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        tenant
          ? {
              name: tenant.name,
              type: tenant.type as TenantInput["type"],
              tin: tenant.tin ?? "",
              contact: (tenant as unknown as { contact?: string | null }).contact ?? "",
            }
          : { name: "", type: "Corp", tin: "", contact: "" },
      );
    }
  }, [open, tenant, form]);

  const mutation = useMutation({
    mutationFn: async (input: TenantInput) => {
      if (!activeGroupId) throw new Error("No active group");
      return tenant ? updateTenant(tenant.id, input) : createTenant(activeGroupId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast({ title: tenant ? "Tenant updated" : "Tenant created", variant: "success" });
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
      title={tenant ? `Edit ${tenant.name}` : "New tenant"}
    >
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="space-y-4"
      >
        <FormField
          label="Name"
          htmlFor="t-name"
          required
          error={form.formState.errors.name?.message}
        >
          <Input id="t-name" {...form.register("name")} autoFocus />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Type"
            htmlFor="t-type"
            required
            error={form.formState.errors.type?.message}
          >
            <Select id="t-type" {...form.register("type")}>
              <option value="Corp">Corporate</option>
              <option value="Ind">Individual</option>
            </Select>
          </FormField>
          <FormField
            label="TIN"
            htmlFor="t-tin"
            error={form.formState.errors.tin?.message}
          >
            <Input id="t-tin" {...form.register("tin")} placeholder="123-456-789" />
          </FormField>
        </div>
        <FormField
          label="Contact"
          htmlFor="t-contact"
          error={form.formState.errors.contact?.message}
        >
          <Input id="t-contact" {...form.register("contact")} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : tenant ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
