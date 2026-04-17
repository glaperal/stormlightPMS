const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPeso(amount: number | string | null | undefined): string {
  if (amount == null || amount === "") return "—";
  const n = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(n)) return "—";
  return phpFormatter.format(n);
}

export function computeLedgerBreakdown(params: {
  baseRent: number;
  vatRate: number;
  ewtRate: number;
  vatRegistered: boolean;
}) {
  const { baseRent, vatRate, ewtRate, vatRegistered } = params;
  const vat = vatRegistered ? baseRent * (vatRate / 100) : 0;
  const ewt = baseRent * (ewtRate / 100);
  return {
    base: baseRent,
    vat,
    ewt,
    total: baseRent + vat - ewt,
  };
}
