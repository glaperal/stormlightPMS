import { describe, it, expect } from "vitest";
import { formatPeso, computeLedgerBreakdown } from "@/lib/currency";

describe("formatPeso", () => {
  it("formats pesos with two decimals", () => {
    expect(formatPeso(13604.5)).toMatch(/13,604\.50/);
    expect(formatPeso(0)).toMatch(/0\.00/);
  });

  it("returns em-dash for null / NaN", () => {
    expect(formatPeso(null)).toBe("—");
    expect(formatPeso("not-a-number")).toBe("—");
  });
});

describe("computeLedgerBreakdown", () => {
  it("adds VAT when group is VAT-registered and rate > 0", () => {
    const b = computeLedgerBreakdown({
      baseRent: 1000,
      vatRate: 12,
      ewtRate: 0,
      vatRegistered: true,
    });
    expect(b.vat).toBe(120);
    expect(b.total).toBe(1120);
  });

  it("skips VAT when group is not VAT-registered", () => {
    const b = computeLedgerBreakdown({
      baseRent: 1000,
      vatRate: 12,
      ewtRate: 0,
      vatRegistered: false,
    });
    expect(b.vat).toBe(0);
    expect(b.total).toBe(1000);
  });

  it("subtracts EWT", () => {
    const b = computeLedgerBreakdown({
      baseRent: 1000,
      vatRate: 0,
      ewtRate: 5,
      vatRegistered: true,
    });
    expect(b.ewt).toBe(50);
    expect(b.total).toBe(950);
  });
});
