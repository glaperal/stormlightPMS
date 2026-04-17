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
import { propertySchema, type PropertyInput } from "@/schemas/property.schema";
import { createProperty, updateProperty } from "@/features/properties/api";
import type { Property } from "@/types/database";

interface PropertySheetProps {
  open: boolean;
  onClose: () => void;
  property?: Property | null;
}

const TYPES = ["Commercial", "Residential", "Mixed-Use", "Industrial"];

export function PropertySheet({ open, onClose, property }: PropertySheetProps) {
  const { activeGroupId } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const form = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: "", type: "Commercial", address: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        property
          ? {
              name: property.name,
              type: property.type,
              address: property.address ?? "",
            }
          : { name: "", type: "Commercial", address: "" },
      );
    }
  }, [open, property, form]);

  const mutation = useMutation({
    mutationFn: async (input: PropertyInput) => {
      if (!activeGroupId) throw new Error("No active group");
      return property
        ? updateProperty(property.id, input)
        : createProperty(activeGroupId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast({
        title: property ? "Property updated" : "Property created",
        variant: "success",
      });
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
      title={property ? `Edit ${property.name}` : "New property"}
      description="Create or update a property in the active portfolio."
    >
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="space-y-4"
      >
        <FormField
          label="Name"
          htmlFor="prop-name"
          required
          error={form.formState.errors.name?.message}
        >
          <Input id="prop-name" {...form.register("name")} autoFocus />
        </FormField>
        <FormField
          label="Type"
          htmlFor="prop-type"
          required
          error={form.formState.errors.type?.message}
        >
          <Select id="prop-type" {...form.register("type")}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Address"
          htmlFor="prop-address"
          error={form.formState.errors.address?.message}
        >
          <Input id="prop-address" {...form.register("address")} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : property ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
