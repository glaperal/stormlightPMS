import { z } from "zod";

export const paymentSchema = z.object({
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "number" ? v : Number(v)))
    .refine((v) => !Number.isNaN(v), "Must be a number")
    .refine((v) => v > 0, "Amount must be greater than zero"),
  date_received: z.string().min(1, "Date is required"),
  reference_no: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
