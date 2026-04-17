import { describe, it, expect } from "vitest";
import { leaseSchema } from "@/schemas/lease.schema";

const baseInput = {
  unit_id: "33333333-3333-3333-3333-333333330101",
  tenant_id: "55555555-5555-5555-5555-555555555001",
  base_rent: 41780.1,
  dues: 0,
  vat_rate: 12,
  ewt_rate: 0,
  start_date: "2025-08-01",
  end_date: "2026-07-31",
  status: "Active" as const,
  notes: "",
};

describe("leaseSchema", () => {
  it("accepts a valid lease input", () => {
    const parsed = leaseSchema.safeParse(baseInput);
    expect(parsed.success).toBe(true);
  });

  it("rejects when end_date is before start_date", () => {
    const parsed = leaseSchema.safeParse({
      ...baseInput,
      start_date: "2026-01-01",
      end_date: "2025-12-31",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const msg = parsed.error.issues[0].message;
      expect(msg).toMatch(/End date/i);
    }
  });

  it("rejects negative base_rent", () => {
    const parsed = leaseSchema.safeParse({ ...baseInput, base_rent: -100 });
    expect(parsed.success).toBe(false);
  });

  it("rejects VAT rate > 100", () => {
    const parsed = leaseSchema.safeParse({ ...baseInput, vat_rate: 120 });
    expect(parsed.success).toBe(false);
  });

  it("allows empty end_date (open-ended lease)", () => {
    const parsed = leaseSchema.safeParse({ ...baseInput, end_date: "" });
    expect(parsed.success).toBe(true);
  });

  it("requires a unit and tenant", () => {
    const parsed = leaseSchema.safeParse({ ...baseInput, unit_id: "" });
    expect(parsed.success).toBe(false);
  });
});
