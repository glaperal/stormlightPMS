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
import { unitSchema, type UnitInput } from "@/schemas/unit.schema";
import { createUnit, updateUnit } from "@/features/properties/api-unit";
import type { Unit } from "@/types/database";

interface UnitSheetProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  unit?: Unit | null;
}

export function UnitSheet({ open, onClose, propertyId, unit }: UnitSheetProps) {
  const { activeGroupId } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const form = useForm<UnitInput>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      kind: "Commercial",
      area_sqm: null as unknown as number,
      status: "Vacant",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        unit
          ? {
              name: unit.name,
              kind: unit.kind as UnitInput["kind"],
              area_sqm: unit.area_sqm as unknown as number,
              status: unit.status as UnitInput["status"],
              notes: unit.notes ?? "",
            }
          : {
              name: "",
              kind: "Commercial",
              area_sqm: null as unknown as number,
              status: "Vacant",
              notes: "",
            },
      );
    }
  }, [open, unit, form]);

  const mutation = useMutation({
    mutationFn: async (input: UnitInput) => {
      if (!activeGroupId) throw new Error("No active group");
      return unit
        ? updateUnit(unit.id, input)
        : createUnit(activeGroupId, propertyId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units", propertyId] });
      qc.invalidateQueries({ queryKey: ["units"] });
      toast({ title: unit ? "Unit updated" : "Unit created", variant: "success" });
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
      title={unit ? `Edit ${unit.name}` : "New unit"}
    >
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="space-y-4"
      >
        <FormField
          label="Name"
          htmlFor="unit-name"
          required
          error={form.formState.errors.name?.message}
        >
          <Input id="unit-name" {...form.register("name")} autoFocus />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Kind"
            htmlFor="unit-kind"
            required
            error={form.formState.errors.kind?.message}
          >
            <Select id="unit-kind" {...form.register("kind")}>
              <option value="Commercial">Commercial</option>
              <option value="Residential">Residential</option>
              <option value="Parking">Parking</option>
            </Select>
          </FormField>
          <FormField
            label="Status"
            htmlFor="unit-status"
            required
            error={form.formState.errors.status?.message}
          >
            <Select id="unit-status" {...form.register("status")}>
              <option value="Vacant">Vacant</option>
              <option value="Occupied">Occupied</option>
              <option value="Renovation">Renovation</option>
            </Select>
          </FormField>
        </div>
        <FormField
          label="Area (sqm)"
          htmlFor="unit-area"
          error={form.formState.errors.area_sqm?.message}
        >
          <Input
            id="unit-area"
            type="number"
            step="0.01"
            {...form.register("area_sqm")}
          />
        </FormField>
        <FormField
          label="Notes"
          htmlFor="unit-notes"
          error={form.formState.errors.notes?.message}
        >
          <Input id="unit-notes" {...form.register("notes")} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : unit ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
