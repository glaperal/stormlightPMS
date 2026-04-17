import { z } from "zod";

const decimalString = (max = 14, digits = 2) =>
  z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "number" ? v : Number(v)))
    .refine((v) => !Number.isNaN(v), "Must be a number")
    .refine((v) => v >= 0, "Must be >= 0")
    .refine(
      (v) => Number(v.toFixed(digits)).toString().replace(".", "").length <= max,
      `Too many digits (max ${max})`,
    );

const rate = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v : Number(v)))
  .refine((v) => !Number.isNaN(v), "Must be a number")
  .refine((v) => v >= 0 && v <= 100, "Rate must be between 0 and 100");

export const leaseSchema = z
  .object({
    unit_id: z.string().uuid("Select a unit"),
    tenant_id: z.string().uuid("Select a tenant"),
    base_rent: decimalString(),
    dues: decimalString().default(0 as unknown as number),
    vat_rate: rate,
    ewt_rate: rate,
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().optional().or(z.literal("")),
    status: z.enum(["Active", "Ended", "Terminated"]).default("Active"),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine(
    (v) => !v.end_date || new Date(v.end_date) >= new Date(v.start_date),
    { message: "End date must be on or after start date", path: ["end_date"] },
  );

export type LeaseInput = z.infer<typeof leaseSchema>;
