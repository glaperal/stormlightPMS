import { z } from "zod";

export const tenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  type: z.enum(["Corp", "Ind"]),
  tin: z
    .string()
    .trim()
    .max(32)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^[\d-]{9,}$/.test(v),
      "TIN should contain digits and dashes only (min 9 chars).",
    ),
  contact: z.string().trim().max(200).optional().or(z.literal("")),
});

export type TenantInput = z.infer<typeof tenantSchema>;
