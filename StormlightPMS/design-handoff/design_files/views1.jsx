/* StormlightPMS UI kit — DashboardView + RentView */

function TrendChart() {
  const data = window.STORM.trend;
  const max = 340;
  const H = 150;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: H, padding: "8px 4px 0" }}>
      {data.map((d, i) => {
        const last = i === data.length - 1;
        const dueH = (d.due / max) * H;
        const colH = (d.collected / max) * H;
        return (
          <div key={d.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 34, height: H, display: "flex", alignItems: "flex-end" }}>
              <div style={{ position: "absolute", bottom: 0, width: "100%", height: dueH, background: "var(--slate-100)", borderRadius: "5px 5px 0 0" }} />
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: colH,
                  borderRadius: "5px 5px 0 0",
                  background: last
                    ? "linear-gradient(180deg, var(--gold-300), var(--gold-500))"
                    : "linear-gradient(180deg, var(--navy-400), var(--navy-600))",
                }}
              />
            </div>
            <span style={{ fontSize: 11, fontWeight: last ? 700 : 500, color: last ? "var(--navy-500)" : "var(--fg-3)" }}>{d.m}</span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityFeed() {
  const icons = {
    payment: { name: "wallet", bg: "var(--success-50)", fg: "var(--success-700)" },
    reminder: { name: "bell", bg: "var(--warning-50)", fg: "var(--warning-700)" },
    ticket: { name: "wrench", bg: "var(--teal-50)", fg: "var(--teal-700)" },
    lease: { name: "file-check", bg: "var(--navy-50)", fg: "var(--navy-600)" },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {window.STORM.activity.map((a, i) => {
        const ic = icons[a.kind];
        return (
          <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: i < 4 ? "1px solid var(--border-subtle)" : "none" }}>
            <span style={{ width: 30, height: 30, flex: "0 0 auto", borderRadius: "var(--radius-md)", background: ic.bg, color: ic.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={ic.name} size={15} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.4 }}>
                <b style={{ fontWeight: 600 }}>{a.who}</b> <span style={{ color: "var(--fg-2)" }}>{a.what}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>{a.when}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>{children}</h3>
      {action}
    </div>
  );
}

function DashboardView({ onRecord, onRemind, onToast, tweaks }) {
  const S = window.STORM;
  const paid = arguments[0].paid || {};
  const tw = tweaks || { leaseWindow: 90, receivablesScope: "Rental + utilities", highlightUrgent: true, showInsights: true };
  const ending = S.leasesEndingWithin(tw.leaseWindow);
  const escalations = S.escalationsWithin(tw.leaseWindow);
  const deposits = S.depositsHeld();
  const rec = S.receivables(paid);
  const scope = tw.receivablesScope || "Rental + utilities";
  const scopeAmt = (r) => scope === "Rental only" ? r.rental : scope === "Utilities only" ? r.utility : r.total;
  const recRows = rec.rows.filter((r) => scopeAmt(r) > 0).sort((a, b) => scopeAmt(b) - scopeAmt(a));
  const scopeTotal = scope === "Rental only" ? rec.totalRental : scope === "Utilities only" ? rec.totalUtility : rec.total;
  const overdue = S.tenants.filter((t) => t.status === "overdue" && !paid[t.id]);
  const upcoming = S.tenants.filter((t) => (t.status === "due" || t.status === "partial") && !paid[t.id]);
  const lv = arguments[0].live || { collected: S.totals.collected, rate: S.totals.rate, arrears: S.totals.arrears, arrearsCount: 1 };
  return (
    <div>
      <PageHead
        title="Good morning, Oli"
        subtitle="Here's how Vision Homes is doing this month."
        actions={<><Btn kind="secondary" icon="download" onClick={() => onToast && onToast("April summary exported (PDF).")}>Export</Btn><Btn icon="plus" onClick={() => onRecord(null)}>Record payment</Btn></>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <StatCard icon="wallet" iconBg="var(--navy-50)" iconColor="var(--navy-500)" label="Collected · April" value={S.peso(lv.collected).replace(".00", "")} trend={lv.rate + "% of due"} trendKind="up" />
        <StatCard icon="triangle-alert" iconBg="var(--danger-50)" iconColor="var(--danger-500)" label="In arrears" value={S.peso(lv.arrears).replace(".00", "")} trend={lv.arrearsCount + (lv.arrearsCount === 1 ? " tenant" : " tenants")} trendKind="flat" />
        <StatCard icon="building-2" iconBg="var(--teal-50)" iconColor="var(--teal-600)" label="Occupancy" value={S.totals.occupied + " / " + S.totals.units} trend="60% leased" trendKind="flat" />
        <StatCard icon="file-text" iconBg="var(--gold-100)" iconColor="var(--gold-700)" label="Contracted / mo" value={S.peso(S.totals.monthly).replace(".00", "")} trend="6 leases" trendKind="gold" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card pad={22}>
          <SectionTitle action={<div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--fg-2)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--navy-500)" }} />Collected</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--slate-100)" }} />Due</span>
          </div>}>Collection trend</SectionTitle>
          <TrendChart />
        </Card>
        <Card pad={22}>
          <SectionTitle action={<a href="#" style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-link)", textDecoration: "none" }}>View all</a>}>Recent activity</SectionTitle>
          <ActivityFeed />
        </Card>
      </div>

      {tw.showInsights !== false && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card pad={0}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 12px" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Leases ending soon</h3>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)" }}>Next {tw.leaseWindow} days · {ending.length}</span>
          </div>
          {ending.length === 0 && (
            <div style={{ padding: "14px 20px 18px", borderTop: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 8 }}><Icon name="circle-check" size={16} color="var(--success-500)" />No leases ending in the next {tw.leaseWindow} days.</div>
          )}
          {ending.map(({ t, days }) => {
            const urgent = tw.highlightUrgent !== false && days <= 30;
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderTop: "1px solid var(--border-subtle)" }}>
                <Avatar initials={t.initials} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{t.name} · {t.unit}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Ends {t.term.end} · {S.floorName(t)}</div>
                </div>
                <Pill status={urgent ? "overdue" : days <= 60 ? "due" : "occupied"}>{days}d left</Pill>
                <Btn kind="secondary" size="sm" icon="file-check" onClick={() => onToast && onToast("Renewal notice prepared for " + t.name.split(" ")[0] + ".")}>Renew</Btn>
              </div>
            );
          })}
        </Card>
        <Card pad={0}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 4px" }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Receivables</h3>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>{scope} · {recRows.length} {recRows.length === 1 ? "tenant" : "tenants"}</div>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 17, fontWeight: 700, color: scopeTotal > 0 ? "var(--danger-600)" : "var(--success-600)" }}>{S.peso(scopeTotal).replace(".00", "")}</span>
          </div>
          {recRows.length === 0 && (
            <div style={{ padding: "14px 20px 18px", marginTop: 8, borderTop: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 8 }}><Icon name="circle-check" size={16} color="var(--success-500)" />Nothing outstanding. Everyone's settled up.</div>
          )}
          {recRows.map((r) => (
            <div key={r.t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderTop: "1px solid var(--border-subtle)" }}>
              <Avatar initials={r.t.initials} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{r.t.name} · {r.t.unit}</div>
                {scope === "Rental + utilities" && (
                  <div style={{ fontSize: 11.5, color: "var(--fg-3)", display: "flex", gap: 8 }}>
                    {r.rental > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--navy-400)" }} />Rent {S.peso(r.rental).replace(".00", "")}</span>}
                    {r.utility > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal-500)" }} />Util {S.peso(r.utility).replace(".00", "")}</span>}
                  </div>
                )}
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 13.5, color: "var(--fg-1)" }}>{S.peso(scopeAmt(r))}</span>
            </div>
          ))}
          {recRows.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total outstanding</span>
              <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 14, color: "var(--navy-500)" }}>{S.peso(scopeTotal)}</span>
            </div>
          )}
        </Card>
      </div>
      )}

      {tw.showInsights !== false && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card pad={0}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 12px" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Escalations due</h3>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)" }}>Next {tw.leaseWindow} days · {escalations.length}</span>
          </div>
          {escalations.length === 0 && (
            <div style={{ padding: "14px 20px 18px", borderTop: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 8 }}><Icon name="circle-check" size={16} color="var(--success-500)" />No rent escalations in the next {tw.leaseWindow} days.</div>
          )}
          {escalations.map((e) => (
            <div key={e.t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderTop: "1px solid var(--border-subtle)" }}>
              <Avatar initials={e.t.initials} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{e.t.name} · {e.t.unit}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Effective {e.next} · on {e.on === "basic+cusa" ? "rent + CUSA" : "basic rent"}</div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--gold-700)", background: "var(--gold-100)", border: "1px solid var(--gold-300)", padding: "3px 9px", borderRadius: "var(--radius-full)" }}>+{e.pct}%</span>
              <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 13, color: "var(--success-700)", whiteSpace: "nowrap" }}>+{S.peso(e.delta).replace(".00", "")}</span>
            </div>
          ))}
        </Card>
        <Card pad={22}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>Deposits & advances held</h3>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>Held in trust across {deposits.rows.length} leases</div>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 18, fontWeight: 700, color: "var(--navy-600)" }}>{S.peso(deposits.total).replace(".00", "")}</span>
          </div>
          <div style={{ display: "flex", height: 12, borderRadius: "var(--radius-full)", overflow: "hidden", background: "var(--bg-muted)" }}>
            <div style={{ width: (deposits.totalDeposit / deposits.total) * 100 + "%", background: "linear-gradient(90deg, var(--navy-500), var(--navy-400))" }} />
            <div style={{ width: (deposits.totalAdvance / deposits.total) * 100 + "%", background: "linear-gradient(90deg, var(--teal-500), var(--teal-400))" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--fg-2)", fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--navy-500)" }} />Security deposits</div>
              <div style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 16, color: "var(--fg-1)", marginTop: 4 }}>{S.peso(deposits.totalDeposit).replace(".00", "")}</div>
            </div>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--fg-2)", fontWeight: 600 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--teal-500)" }} />Advance rent</div>
              <div style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 16, color: "var(--fg-1)", marginTop: 4 }}>{S.peso(deposits.totalAdvance).replace(".00", "")}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="shield-check" size={14} color="var(--teal-600)" />Refundable at move-out, less any deductions.
          </div>
        </Card>
      </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card pad={0}>
          <div style={{ padding: "18px 20px 12px" }}>
            <SectionTitle>Needs attention</SectionTitle>
          </div>
          {overdue.length === 0 && (
            <div style={{ padding: "14px 20px 18px", borderTop: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 8 }}><Icon name="circle-check" size={16} color="var(--success-500)" />No overdue accounts. Everyone's paid up.</div>
          )}
          {overdue.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderTop: "1px solid var(--border-subtle)" }}>
              <Avatar initials={t.initials} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{t.name} · {t.unit}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{S.floorName(t)} · Unit {t.room}</div>
              </div>
              <Pill status="overdue">Overdue {t.overdueDays}d</Pill>
              <Btn kind="secondary" size="sm" icon="bell" onClick={() => onRemind(t)}>Remind</Btn>
            </div>
          ))}
        </Card>
        <Card pad={0}>
          <div style={{ padding: "18px 20px 12px" }}>
            <SectionTitle>Due this week</SectionTitle>
          </div>
          {upcoming.length === 0 && (
            <div style={{ padding: "14px 20px 18px", borderTop: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 8 }}><Icon name="circle-check" size={16} color="var(--success-500)" />Nothing due this week.</div>
          )}
          {upcoming.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderTop: "1px solid var(--border-subtle)" }}>
              <Avatar initials={t.initials} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{t.name} · {t.unit}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{S.peso(t.rent)} · via {t.method}</div>
              </div>
              <Pill status={t.status}>{t.status === "partial" ? "Partial" : "Due 01 Apr"}</Pill>
              <Btn size="sm" onClick={() => onRecord(t)}>Record</Btn>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function RentView({ onRecord, onRemind, paid, onToast }) {
  const S = window.STORM;
  const [filter, setFilter] = React.useState("all");
  const tabs = [
    { id: "all", label: "All" },
    { id: "overdue", label: "Overdue" },
    { id: "due", label: "Due" },
    { id: "paid", label: "Paid" },
  ];
  const rows = S.tenants.filter((t) => {
    const st = paid[t.id] ? "paid" : t.status;
    if (filter === "all") return true;
    return st === filter;
  });
  return (
    <div>
      <PageHead
        title="Rent collection"
        subtitle={S.peso((arguments[0].live || S.totals).collected).replace(".00", "") + " collected · " + (arguments[0].live || S.totals).rate + "% of " + S.peso(S.totals.due).replace(".00", "") + " due this month"}
        actions={<><Btn kind="secondary" icon="bell" onClick={() => onRemind(null)}>Send reminders</Btn><Btn icon="plus" onClick={() => onRecord(null)}>Record payment</Btn></>}
      />
      <Card pad={0}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={{
                  padding: "7px 13px",
                  border: 0,
                  background: filter === t.id ? "var(--navy-50)" : "transparent",
                  color: filter === t.id ? "var(--navy-500)" : "var(--fg-2)",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: 13,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Btn kind="ghost" size="sm" icon="filter" onClick={() => onToast && onToast("Use the tabs to filter by status.")}>Filter</Btn>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Unit / Tenant", "Property", "Rent", "Method", "Status", ""].map((h, i) => (
                <th key={i} style={{ textAlign: i === 2 ? "right" : "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--fg-3)", padding: "10px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const st = paid[t.id] ? "paid" : t.status;
              return (
                <tr key={t.id} className="storm-row">
                  <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <Avatar initials={t.initials} size={32} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--fg-1)" }}>Unit {t.unit}</div>
                        <div style={{ color: "var(--fg-3)" }}>{t.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "var(--fg-2)" }}>{S.floorName(t)}</td>
                  <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: "var(--fg-1)" }}>{S.peso(t.rent)}</td>
                  <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)" }}><Tag>{t.method}</Tag></td>
                  <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      {st === "overdue" ? <Pill status="overdue">Overdue {t.overdueDays}d</Pill>
                        : st === "partial" ? <Pill status="partial">Partial</Pill>
                        : st === "due" ? <Pill status="due">Due 01 Apr</Pill>
                        : <Pill status="paid">Paid</Pill>}
                      {(() => { const bs = S.billingStatusOf(t); return bs.mode !== "normal" ? <span style={{ fontSize: 11, fontWeight: 700, color: bs.color, background: bs.bg, border: "1px solid " + bs.border, padding: "2px 8px", borderRadius: "var(--radius-full)" }}>{bs.label}</span> : null; })()}
                    </div>
                  </td>
                  <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right" }}>
                    {st === "paid" ? (
                      <span style={{ fontSize: 12, color: "var(--fg-3)", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="check" size={14} color="var(--success-500)" />Receipt sent</span>
                    ) : st === "overdue" ? (
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <Btn kind="secondary" size="sm" icon="bell" onClick={() => onRemind(t)}>Remind</Btn>
                        <Btn size="sm" onClick={() => onRecord(t)}>Record</Btn>
                      </div>
                    ) : (
                      <Btn size="sm" onClick={() => onRecord(t)}>Record payment</Btn>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { DashboardView, RentView, SectionTitle });
