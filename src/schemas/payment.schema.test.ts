import { describe, it, expect } from "vitest";
import { paymentSchema } from "@/schemas/payment.schema";

describe("paymentSchema", () => {
  it("accepts a valid payment", () => {
    const parsed = paymentSchema.safeParse({
      amount: 13604.5,
      date_received: "2026-04-05",
      reference_no: "BPI-TRF-240405",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const parsed = paymentSchema.safeParse({
      amount: 0,
      date_received: "2026-04-05",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const parsed = paymentSchema.safeParse({
      amount: -1,
      date_received: "2026-04-05",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires date_received", () => {
    const parsed = paymentSchema.safeParse({ amount: 100, date_received: "" });
    expect(parsed.success).toBe(false);
  });
});
