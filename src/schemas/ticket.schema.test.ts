import { describe, it, expect } from "vitest";
import { ticketSchema } from "@/schemas/ticket.schema";

const base = {
  unit_id: "33333333-3333-3333-3333-333333330104",
  issue: "AC unit leaking",
  status: "Open" as const,
  cost: "",
};

describe("ticketSchema", () => {
  it("accepts a minimal open ticket with no cost", () => {
    const parsed = ticketSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.cost).toBeNull();
  });

  it("coerces a numeric cost from string input", () => {
    const parsed = ticketSchema.safeParse({ ...base, cost: "1250.50" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.cost).toBe(1250.5);
  });

  it("rejects negative cost", () => {
    const parsed = ticketSchema.safeParse({ ...base, cost: -5 });
    expect(parsed.success).toBe(false);
  });

  it("rejects missing unit", () => {
    const parsed = ticketSchema.safeParse({ ...base, unit_id: "" });
    expect(parsed.success).toBe(false);
  });

  it("rejects an issue shorter than 3 chars", () => {
    const parsed = ticketSchema.safeParse({ ...base, issue: "AC" });
    expect(parsed.success).toBe(false);
  });
});
