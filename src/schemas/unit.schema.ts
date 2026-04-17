import { z } from "zod";

export const unitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  kind: z.enum(["Commercial", "Residential", "Parking"]),
  area_sqm: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : Number(v)))
    .refine((v) => v === null || (!Number.isNaN(v) && v >= 0), "Area must be >= 0"),
  status: z.enum(["Vacant", "Occupied", "Renovation"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type UnitInput = z.infer<typeof unitSchema>;
