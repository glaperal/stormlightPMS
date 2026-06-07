/* StormlightPMS UI kit — ReportsView: collection rate, arrears aging, income by property. */

function MiniLegend({ items }) {
  return (
    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--fg-2)" }}>
      {items.map((it) => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function CollectionRateChart() {
  const data = window.STORM.trend;
  const H = 168;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: H, padding: "10px 4px 0" }}>
      {data.map((d, i) => {
        const last = i === data.length - 1;
        const rate = Math.round((d.collected / d.due) * 100);
        const barH = (rate / 100) * (H - 26);
        return (
          <div key={d.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: last ? "var(--gold-700)" : "var(--fg-3)" }}>{rate}%</span>
            <div style={{ width: "100%", maxWidth: 36, height: barH, borderRadius: "5px 5px 0 0", background: last ? "linear-gradient(180deg, var(--gold-300), var(--gold-500))" : "linear-gradient(180deg, var(--navy-400), var(--navy-600))" }} />
            <span style={{ fontSize: 11, fontWeight: last ? 700 : 500, color: last ? "var(--navy-500)" : "var(--fg-3)" }}>{d.m}</span>
          </div>
        );
      })}
    </div>
  );
}

function ArrearsAging() {
  // aging buckets (₱)
  const buckets = [
    { label: "0–30 days", amount: 25574.07, c: "var(--warning-500)" },
    { label: "31–60 days", amount: 0, c: "var(--warning-600)" },
    { label: "61–90 days", amount: 0, c: "var(--danger-500)" },
    { label: "90+ days", amount: 0, c: "var(--danger-700)" },
  ];
  const max = Math.max(...buckets.map((b) => b.amount), 1);
  const S = window.STORM;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {buckets.map((b) => (
        <div key={b.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
            <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{b.label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: b.amount ? "var(--fg-1)" : "var(--fg-3)" }}>{b.amount ? S.peso(b.amount) : "—"}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--slate-100)", overflow: "hidden" }}>
            <div style={{ width: (b.amount / max) * 100 + "%", height: "100%", borderRadius: 4, background: b.c }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function IncomeByProperty() {
  const S = window.STORM;
  const rows = S.floorsOf("vh")
    .map((f) => ({ name: f.name + " Floor", city: f.occupied + "/" + f.count + " occupied", amount: f.monthly }))
    .sort((a, b) => b.amount - a.amount);
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {rows.map((r, i) => (
        <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 150, flex: "0 0 auto" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{r.city}</div>
          </div>
          <div style={{ flex: 1, height: 22, borderRadius: 5, background: "var(--slate-50)", overflow: "hidden", position: "relative" }}>
            <div style={{ width: (r.amount / max) * 100 + "%", height: "100%", borderRadius: 5, background: i === 0 ? "linear-gradient(90deg, var(--navy-500), var(--navy-400))" : "linear-gradient(90deg, var(--teal-600), var(--teal-400))" }} />
          </div>
          <div style={{ width: 110, textAlign: "right", flex: "0 0 auto", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 13.5, color: "var(--fg-1)" }}>{S.peso(r.amount).replace(".00", "")}</div>
        </div>
      ))}
    </div>
  );
}

function ReportsView({ onToast }) {
  const S = window.STORM;
  const [period, setPeriod] = React.useState("month");
  const periods = [
    { id: "month", label: "This month" },
    { id: "quarter", label: "Quarter" },
    { id: "year", label: "Year" },
  ];
  return (
    <div>
      <PageHead
        title="Reports"
        subtitle="Collection, arrears, and income for Vision Homes."
        actions={<>
          <span style={{ display: "inline-flex", background: "var(--bg-muted)", borderRadius: "var(--radius-md)", padding: 3 }}>
            {periods.map((p) => (
              <button key={p.id} onClick={() => setPeriod(p.id)} style={{ border: 0, background: period === p.id ? "var(--bg-surface)" : "transparent", color: period === p.id ? "var(--navy-500)" : "var(--fg-2)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, padding: "6px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer", boxShadow: period === p.id ? "var(--shadow-xs)" : "none" }}>{p.label}</button>
            ))}
          </span>
          <Btn kind="secondary" icon="download" onClick={() => onToast && onToast("BIR-ready report exported.")}>Export for BIR</Btn>
        </>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard icon="percent" iconBg="var(--gold-100)" iconColor="var(--gold-700)" label="Collection rate" value="85%" trend="2 still due" trendKind="flat" />
        <StatCard icon="wallet" iconBg="var(--navy-50)" iconColor="var(--navy-500)" label="Collected · April" value={S.peso(S.totals.collected).replace(".00", "")} trend="of ₱284k due" trendKind="flat" />
        <StatCard icon="triangle-alert" iconBg="var(--danger-50)" iconColor="var(--danger-500)" label="Outstanding arrears" value={S.peso(S.totals.arrears).replace(".00", "")} trend="1 tenant" trendKind="flat" />
        <StatCard icon="chart-no-axes-column" iconBg="var(--teal-50)" iconColor="var(--teal-600)" label="Collected · 2025" value="₱3.86M" trend="full year" trendKind="up" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card pad={22}>
          <SectionTitle action={<MiniLegend items={[{ label: "Past months", color: "var(--navy-500)" }, { label: "Current", color: "var(--gold-400)" }]} />}>Collection rate — last 6 months</SectionTitle>
          <CollectionRateChart />
        </Card>
        <Card pad={22}>
          <SectionTitle action={<span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--danger-600)" }}>{S.peso(S.totals.arrears).replace(".00", "")}</span>}>Arrears aging</SectionTitle>
          <ArrearsAging />
        </Card>
      </div>

      <Card pad={22}>
        <SectionTitle action={<a href="#" style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-link)", textDecoration: "none" }}>Full breakdown</a>}>Income by floor · monthly</SectionTitle>
        <IncomeByProperty />
      </Card>
    </div>
  );
}

Object.assign(window, { ReportsView });
