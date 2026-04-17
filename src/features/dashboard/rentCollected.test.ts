import { describe, it, expect } from "vitest";
import { aggregateRentByMonthYear } from "@/features/dashboard/rentCollected";
import type { PaymentPoint } from "@/features/dashboard/api";

function p(amount: number, date: string, type = "Rent"): PaymentPoint {
  return {
    amount: String(amount),
    date_received: date,
    ledger: { type, lease: null },
  };
}

describe("aggregateRentByMonthYear", () => {
  it("groups payments into 12 rows with per-year fields", () => {
    const { years, rows, totalsByYear } = aggregateRentByMonthYear([
      p(1000, "2025-01-15"),
      p(500, "2025-01-28"),
      p(2000, "2025-03-05"),
      p(750, "2024-03-10"),
      p(250, "2026-04-05"),
    ]);
    expect(years).toEqual([2024, 2025, 2026]);
    expect(rows).toHaveLength(12);
    expect(rows[0].y2025).toBe(1500); // Jan 2025
    expect(rows[2].y2025).toBe(2000); // Mar 2025
    expect(rows[2].y2024).toBe(750);
    expect(rows[3].y2026).toBe(250);
    expect(totalsByYear[2025]).toBe(3500);
  });

  it("excludes Penalty ledger payments", () => {
    const { totalsByYear } = aggregateRentByMonthYear([
      p(1000, "2025-01-15", "Rent"),
      p(500, "2025-01-20", "Penalty"),
    ]);
    expect(totalsByYear[2025]).toBe(1000);
  });

  it("handles empty input", () => {
    const { years, rows } = aggregateRentByMonthYear([]);
    expect(years).toEqual([]);
    expect(rows).toHaveLength(12);
    expect(rows[0].month).toBe("Jan");
  });
});
