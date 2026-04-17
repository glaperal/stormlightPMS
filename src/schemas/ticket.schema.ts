import { z } from "zod";

export const ticketSchema = z.object({
  unit_id: z.string().uuid("Select a unit"),
  issue: z.string().trim().min(3, "Describe the issue").max(500),
  status: z.enum(["Open", "InProgress", "Resolved", "Cancelled"]),
  cost: z
    .union([z.string(), z.number(), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v == null) return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isNaN(n) ? null : n;
    })
    .refine((v) => v === null || v >= 0, "Cost must be >= 0"),
});

export type TicketInput = z.infer<typeof ticketSchema>;
