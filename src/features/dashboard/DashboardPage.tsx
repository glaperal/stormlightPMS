import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Building2,
  FileSignature,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { listProperties } from "@/features/properties/api";
import { listTenants } from "@/features/tenants/api";
import { listLeases } from "@/features/leases/api";
import { listLedgers } from "@/features/financials/api";
import { listPaymentsForGroup } from "@/features/dashboard/api";
import { aggregateRentByMonthYear } from "@/features/dashboard/rentCollected";
import { formatPeso } from "@/lib/currency";
import { cn } from "@/lib/cn";

const CHART_PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

interface KpiProps {
  label: string;
  value: string;
  hint?: string;
  trend?: { direction: "up" | "down" | "flat"; text: string };
  icon: typeof Building2;
}

function Kpi({ label, value, hint, trend, icon: Icon }: KpiProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5",
              trend.direction === "up" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              trend.direction === "down" && "bg-destructive/10 text-destructive",
              trend.direction === "flat" && "bg-muted text-muted-foreground",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="size-3" />
            ) : trend.direction === "down" ? (
              <ArrowDownRight className="size-3" />
            ) : null}
            {trend.text}
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions}
      </header>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

function compactPeso(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `₱${(n / 1_000).toFixed(0)}k`;
  return `₱${n.toFixed(0)}`;
}

export function DashboardPage() {
  const { activeGroupId } = useAuth();
  const [chartMode, setChartMode] = useState<"grouped" | "stacked">("grouped");

  const { data: properties = [] } = useQuery({
    queryKey: ["properties", activeGroupId],
    queryFn: () => listProperties(activeGroupId!),
    enabled: !!activeGroupId,
  });
  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants", activeGroupId],
    queryFn: () => listTenants(activeGroupId!),
    enabled: !!activeGroupId,
  });
  const { data: leases = [] } = useQuery({
    queryKey: ["leases", activeGroupId],
    queryFn: () => listLeases(activeGroupId!),
    enabled: !!activeGroupId,
  });
  const { data: ledgers = [] } = useQuery({
    queryKey: ["ledgers", activeGroupId],
    queryFn: () => listLedgers(activeGroupId!),
    enabled: !!activeGroupId,
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["payments-all", activeGroupId],
    queryFn: () => listPaymentsForGroup(activeGroupId!),
    enabled: !!activeGroupId,
  });

  const activeLeases = leases.filter((l) => l.status === "Active");
  const monthlyRent = activeLeases.reduce((s, l) => s + Number(l.base_rent), 0);
  const outstanding = ledgers.reduce(
    (s, l) => s + Math.max(0, Number(l.amount) - Number(l.paid_amount ?? 0)),
    0,
  );

  const rentData = useMemo(() => aggregateRentByMonthYear(payments), [payments]);
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  const curTotal = rentData.totalsByYear[currentYear] ?? 0;
  const prevTotal = rentData.totalsByYear[prevYear] ?? 0;
  const yoyPct =
    prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : null;

  const statusBreakdown = useMemo(() => {
    let cleared = 0;
    let partial = 0;
    let unpaid = 0;
    for (const l of ledgers) {
      if (l.status === "Cleared") cleared += Number(l.amount);
      else if (l.status === "Partial") {
        partial += Number(l.amount) - Number(l.paid_amount ?? 0);
      } else unpaid += Number(l.amount);
    }
    return [
      { name: "Unpaid", value: unpaid, color: "hsl(var(--muted-foreground))" },
      { name: "Partial", value: partial, color: "hsl(var(--chart-4))" },
      { name: "Cleared", value: cleared, color: "hsl(var(--chart-3))" },
    ];
  }, [ledgers]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Portfolio snapshot for the active organization."
      />
      <div className="flex-1 overflow-auto bg-muted/30 px-6 py-5">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Rent collected (YTD)"
            value={formatPeso(curTotal)}
            icon={TrendingUp}
            trend={
              yoyPct == null
                ? undefined
                : {
                    direction: yoyPct >= 0 ? "up" : "down",
                    text: `${yoyPct >= 0 ? "+" : ""}${yoyPct.toFixed(1)}% YoY`,
                  }
            }
            hint={`vs ${formatPeso(prevTotal)} in ${prevYear}`}
          />
          <Kpi
            label="Monthly rent roll"
            value={formatPeso(monthlyRent)}
            icon={Wallet}
            hint={`${activeLeases.length} active leases`}
          />
          <Kpi
            label="Outstanding"
            value={formatPeso(outstanding)}
            icon={FileSignature}
            hint={`${ledgers.filter((l) => l.status !== "Cleared").length} open ledgers`}
          />
          <Kpi
            label="Portfolio"
            value={`${properties.length} × ${tenants.length}`}
            icon={Building2}
            hint={`${properties.length} properties · ${tenants.length} tenants`}
          />
        </div>

        {/* Main chart row */}
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card
            title="Rent collected per month"
            subtitle="Comparing Rent / VAT / Dues payments by year"
            className="xl:col-span-2"
            actions={
              <div className="flex items-center gap-1 rounded-md border p-0.5 text-xs">
                <button
                  type="button"
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    chartMode === "grouped"
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setChartMode("grouped")}
                >
                  Grouped
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    chartMode === "stacked"
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setChartMode("stacked")}
                >
                  Stacked
                </button>
              </div>
            }
          >
            <div className="h-72 w-full">
              {rentData.years.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No payments yet. Record a payment to see collections here.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rentData.rows}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={compactPeso}
                      width={55}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--accent) / 0.5)" }}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatPeso(v)}
                      labelClassName="font-medium"
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                    {rentData.years.map((y, i) => (
                      <Bar
                        key={y}
                        dataKey={`y${y}`}
                        name={String(y)}
                        stackId={chartMode === "stacked" ? "a" : undefined}
                        fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                        radius={chartMode === "stacked" ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-4">
              {rentData.years.slice(-4).map((y, i) => (
                <div key={y} className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{
                        background: CHART_PALETTE[(rentData.years.length - (rentData.years.slice(-4).length - i) + rentData.years.length) % CHART_PALETTE.length],
                      }}
                    />
                    {y}
                  </div>
                  <div className="truncate text-sm font-semibold tabular-nums">
                    {formatPeso(rentData.totalsByYear[y] ?? 0)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Receivables status"
            subtitle="Amount by ledger status"
          >
            <div className="flex h-72 flex-col">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statusBreakdown}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickFormatter={compactPeso}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--accent) / 0.5)" }}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatPeso(v)}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {statusBreakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5 border-t pt-3 text-xs">
                {statusBreakdown.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ background: s.color }}
                      />
                      {s.name}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatPeso(s.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent leases table (mini) */}
        <Card
          title="Active leases"
          subtitle="Currently billed units in the portfolio"
          className="mt-5"
        >
          {activeLeases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active leases.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3 text-left font-medium">Unit</th>
                    <th className="py-2 pr-3 text-left font-medium">Tenant</th>
                    <th className="py-2 pr-3 text-right font-medium">Base rent</th>
                    <th className="py-2 pr-3 text-right font-medium">Dues</th>
                    <th className="py-2 pr-3 text-left font-medium">VAT</th>
                    <th className="py-2 pr-3 text-left font-medium">Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLeases.slice(0, 10).map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 font-medium">
                        {l.unit?.name ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {l.tenant?.name ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {formatPeso(Number(l.base_rent))}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {formatPeso(Number(l.dues ?? 0))}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {Number(l.vat_rate).toFixed(2)}%
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {l.end_date ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
