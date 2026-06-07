/* StormlightPMS UI kit — UtilitiesView: electric & water, billed separately (acct 407A). */

function UtilitiesView({ onToast }) {
  const S = window.STORM;
  const rows = S.tenants;
  // demo billing state per tenant: billed | paid | pending
  const seed = { "t-arte": "paid", "t-gmmk": "pending", "t-grace": "paid", "t-bright": "billed", "t-smart": "paid", "t-chua": "billed" };
  const [state, setState] = React.useState(seed);
  const totalElec = rows.reduce((a, t) => a + t.elec, 0);
  const totalWater = rows.reduce((a, t) => a + t.water, 0);
  const total = totalElec + totalWater;

  const act = (t) => {
    setState((s) => ({ ...s, [t.id]: s[t.id] === "billed" ? "paid" : "billed" }));
    onToast(state[t.id] === "billed" ? "Utility payment recorded for " + t.name.split(" ")[0] + "." : "Utility bill sent to " + t.name.split(" ")[0] + ".");
  };

  const statusPill = (st) =>
    st === "paid" ? <Pill status="paid">Paid</Pill> : st === "pending" ? <Pill status="vacant" dot={true}>Not billed</Pill> : <Pill status="due" dot={true}>Billed</Pill>;

  return (
    <div>
      <PageHead
        title="Utilities"
        subtitle={"Electric & water — billed separately · " + S.utilPeriod}
        actions={<><Btn kind="secondary" icon="upload" onClick={() => onToast("Meter readings imported.")}>Import readings</Btn><Btn icon="send" onClick={() => onToast("Utility bills sent to all tenants.")}>Send all bills</Btn></>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard icon="zap" iconBg="var(--gold-100)" iconColor="var(--gold-700)" label="Electric · this cycle" value={S.peso(totalElec).replace(".00", "")} trend="6 meters" trendKind="flat" />
        <StatCard icon="droplet" iconBg="var(--teal-50)" iconColor="var(--teal-600)" label="Water · this cycle" value={S.peso(totalWater).replace(".00", "")} trend="6 meters" trendKind="flat" />
        <StatCard icon="receipt" iconBg="var(--navy-50)" iconColor="var(--navy-500)" label="Total to bill" value={S.peso(total).replace(".00", "")} trend="acct 407A" trendKind="gold" />
      </div>

      <Card pad={0}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Per-unit charges</h3>
          <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Separate official receipt (407A) — not part of rent.</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Unit / Tenant", "Electric", "Water", "Total", "Status", ""].map((h, i) => (
                <th key={h} style={{ textAlign: i >= 1 && i <= 3 ? "right" : "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--fg-3)", padding: "10px 22px", borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const st = state[t.id];
              return (
                <tr key={t.id} className="storm-row">
                  <td style={{ padding: "13px 22px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <Avatar initials={t.initials} size={30} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--fg-1)" }}>Unit {t.room}</div>
                        <div style={{ color: "var(--fg-3)" }}>{t.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 22px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--fg-1)" }}>{S.peso(t.elec)}</td>
                  <td style={{ padding: "13px 22px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", color: "var(--fg-1)" }}>{S.peso(t.water)}</td>
                  <td style={{ padding: "13px 22px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--fg-1)" }}>{S.peso(t.util)}</td>
                  <td style={{ padding: "13px 22px", borderBottom: "1px solid var(--border-subtle)" }}>{statusPill(st)}</td>
                  <td style={{ padding: "13px 22px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right" }}>
                    {st === "paid" ? (
                      <span style={{ fontSize: 12, color: "var(--fg-3)", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="check" size={14} color="var(--success-500)" />OR issued</span>
                    ) : st === "billed" ? (
                      <Btn size="sm" onClick={() => act(t)}>Record</Btn>
                    ) : (
                      <Btn kind="secondary" size="sm" icon="send" onClick={() => act(t)}>Send bill</Btn>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td style={{ padding: "13px 22px", fontWeight: 700, color: "var(--fg-1)" }}>Total</td>
              <td style={{ padding: "13px 22px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--fg-1)" }}>{S.peso(totalElec)}</td>
              <td style={{ padding: "13px 22px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--fg-1)" }}>{S.peso(totalWater)}</td>
              <td style={{ padding: "13px 22px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--navy-500)" }}>{S.peso(total)}</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { UtilitiesView });
