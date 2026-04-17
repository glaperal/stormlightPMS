import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  type: z.string().trim().min(1, "Type is required").max(60),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PropertyInput = z.infer<typeof propertySchema>;
