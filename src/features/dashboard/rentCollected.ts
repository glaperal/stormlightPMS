import type { PaymentPoint } from "@/features/dashboard/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export interface MonthlyRow {
  month: string;
  monthIndex: number;
  [year: `y${number}`]: number | string | undefined;
}

export interface RentCollectedResult {
  years: number[];
  rows: MonthlyRow[];
  totalsByYear: Record<number, number>;
}

/**
 * Aggregate Rent + VAT + Dues payments into month-by-year totals.
 * Returns 12 rows (Jan..Dec) with one numeric field per year, e.g. y2024, y2025.
 */
export function aggregateRentByMonthYear(
  payments: PaymentPoint[],
): RentCollectedResult {
  const byYearMonth = new Map<number, Map<number, number>>();
  const yearSet = new Set<number>();

  for (const p of payments) {
    if (!p.date_received) continue;
    // Treat Rent/VAT/Dues as "rent collected"; exclude Penalty.
    const type = p.ledger?.type;
    if (type && type === "Penalty") continue;

    const d = new Date(p.date_received);
    if (Number.isNaN(d.getTime())) continue;
    const y = d.getFullYear();
    const m = d.getMonth();
    yearSet.add(y);

    if (!byYearMonth.has(y)) byYearMonth.set(y, new Map());
    const months = byYearMonth.get(y)!;
    months.set(m, (months.get(m) ?? 0) + Number(p.amount));
  }

  const years = [...yearSet].sort();

  const rows: MonthlyRow[] = MONTHS.map((label, idx) => {
    const row: MonthlyRow = { month: label, monthIndex: idx };
    for (const y of years) {
      row[`y${y}`] = byYearMonth.get(y)?.get(idx) ?? 0;
    }
    return row;
  });

  const totalsByYear: Record<number, number> = {};
  for (const y of years) {
    totalsByYear[y] = [...(byYearMonth.get(y)?.values() ?? [])].reduce(
      (s, v) => s + v,
      0,
    );
  }

  return { years, rows, totalsByYear };
}
