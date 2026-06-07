/* StormlightPMS UI kit — LeaseDetailView (full page) */

function InfoRow({ k, v, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 13.5 }}>
      <span style={{ color: "var(--fg-3)" }}>{k}</span>
      <span style={{ color: "var(--fg-1)", fontWeight: 500, textAlign: "right", fontFamily: mono ? "var(--font-mono)" : "inherit", fontVariantNumeric: mono ? "tabular-nums" : "normal" }}>{v}</span>
    </div>
  );
}

const DOC_ICON = {
  contract: { name: "file-text", color: "var(--navy-500)", bg: "var(--navy-50)" },
  id: { name: "id-card", color: "var(--teal-600)", bg: "var(--teal-50)" },
  receipt: { name: "receipt", color: "var(--success-600)", bg: "var(--success-50)" },
  clearance: { name: "file-check", color: "var(--gold-700)", bg: "var(--gold-100)" },
};

function TermGroup({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--teal-700)", margin: "14px 0 0" }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px" }}>{children}</div>
    </div>
  );
}

function LeaseTimeline({ tenant }) {
  const S = window.STORM;
  const L = S.leaseFor(tenant);
  const sch = S.leaseSchedule(tenant);
  const bs = S.billingStatusOf(tenant);
  return (
    <Card pad={22} style={{ marginBottom: 16 }}>
      <SectionTitle action={<span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: bs.color, background: bs.bg, border: "1px solid " + bs.border, padding: "3px 9px", borderRadius: "var(--radius-full)" }}>{bs.label}</span>
        <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{L.termMonths}-month term</span>
      </span>}>Lease timeline</SectionTitle>
      <TimelineBar schedule={sch} startLabel={sch.start} endLabel={sch.end} />
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap", fontSize: 12, color: "var(--fg-2)" }}>
        {L.rentFreeMonths > 0 && <TLLegend c="var(--gold-200)" label={"Rent-free (" + L.rentFreeMonths + " mo)"} />}
        <TLLegend c="var(--navy-500)" label="Billing period" />
        {L.advanceMonths > 0 && !L.advanceConsumed && <TLLegend c="var(--teal-500)" label={"Advance-covered (" + L.advanceMonths + " mo)"} />}
        {L.escalationPct > 0 && sch.markers.length > 0 && <TLLegend c="var(--gold-600)" label={"Escalation +" + L.escalationPct + "%"} />}
        {sch.todayIn && <TLLegend c="var(--danger-500)" label="Today" />}
      </div>
    </Card>
  );
}

function LeaseDetailView({ tenant, onBack, onRecord, onRemind, onToast }) {
  const S = window.STORM;
  const lease = S.leaseFor(tenant);
  const history = S.paymentHistory(tenant);
  const statusPill = tenant.status === "overdue" ? <Pill status="overdue">Overdue {tenant.overdueDays}d</Pill> : tenant.status === "paid" ? <Pill status="paid">Paid</Pill> : <Pill status="due">Due 01 Apr</Pill>;
  return (
    <div>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: 0, background: "transparent", cursor: "pointer", color: "var(--fg-2)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 16 }}>
        <Icon name="arrow-left" size={16} />Back to tenants
      </button>

      {/* Header */}
      <Card pad={0} style={{ overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "22px 24px", background: "linear-gradient(135deg, var(--navy-500), var(--navy-700))", color: "#fff", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Avatar initials={tenant.initials} size={52} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, letterSpacing: "-0.01em" }}>{tenant.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--navy-100)", marginTop: 3 }}>
              <Icon name="map-pin" size={14} />Unit {tenant.unit} · {S.floorName(tenant)} · {S.propName(tenant.prop)}, {S.propAddr(tenant.prop)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn kind="accent" icon="plus" onClick={() => onRecord(tenant)}>Record payment</Btn>
            <Btn kind="secondary" icon="bell" onClick={() => onRemind(tenant)}>Send reminder</Btn>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {[
            ["Monthly rent", S.peso(tenant.rent), true],
            ["Status", statusPill, false],
            ["Lease ends", lease.end, false],
            ["Deposit held", S.peso(lease.deposit), true],
          ].map(([k, v, mono], i) => (
            <div key={k} style={{ flex: "1 1 160px", padding: "14px 24px", borderRight: i < 3 ? "1px solid var(--border-subtle)" : "none", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
              <div style={{ marginTop: 5, fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", fontWeight: 600, fontSize: mono ? 17 : 15, color: "var(--fg-1)" }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <LeaseTimeline tenant={tenant} />

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Left: terms + history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card pad={22}>
            <SectionTitle action={<Btn kind="ghost" size="sm" icon="pencil" onClick={() => onToast && onToast("Opening lease-terms editor.")}>Edit</Btn>}>Lease terms</SectionTitle>
            <TermGroup title="Commercials">
              <InfoRow k="Floor area" v={lease.area + " m²"} />
              <InfoRow k="Rate / m²" v={lease.rate} />
              <InfoRow k="Basic rent" v={S.peso(lease.basicRent)} mono />
              <InfoRow k="CUSA (common area)" v={lease.cusa ? S.peso(lease.cusa) : "—"} mono />
              <InfoRow k="Parking" v={lease.parking ? S.peso(lease.parking) : "None"} mono />
              <InfoRow k="VAT" v={lease.vat ? "VAT-inclusive" : "Non-VAT"} />
            </TermGroup>
            <TermGroup title="Term">
              <InfoRow k="Lease start" v={lease.start} />
              <InfoRow k="Lease end" v={lease.end} />
              <InfoRow k="Term length" v={lease.termMonths + " months"} />
              <InfoRow k="Tenant since" v={tenant.since} />
            </TermGroup>
            <TermGroup title="Deposits & advances">
              <InfoRow k={"Security deposit (" + lease.depositMonths + " mo)"} v={S.peso(lease.deposit)} mono />
              <InfoRow k={"Advance rent (" + lease.advanceMonths + " mo)"} v={S.peso(lease.advance)} mono />
              <InfoRow k="Advance applied to" v={lease.advanceConsumed ? "Consumed" : "Last " + lease.advanceMonths + " mo"} />
              <InfoRow k="Payment method" v={tenant.method} />
            </TermGroup>
            <TermGroup title="Concessions & escalation">
              <InfoRow k="Rent-free period" v={lease.rentFreeMonths ? lease.rentFreeMonths + " mo (to " + lease.rentFreeEnd + ")" : "None"} />
              <InfoRow k="Escalation" v={lease.escalationPct ? "+" + lease.escalationPct + "%/yr on " + (lease.escalationOn === "basic+cusa" ? "rent + CUSA" : "basic rent") : "Fixed (none)"} />
              {lease.escalationNext ? <InfoRow k="Next escalation" v={lease.escalationNext} /> : null}
            </TermGroup>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--navy-50)", border: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-600)" }}>Total monthly billing</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: "var(--navy-600)" }}>{S.peso(tenant.rent)}</span>
            </div>
          </Card>

          <Card pad={0}>
            <div style={{ padding: "18px 22px 12px" }}>
              <SectionTitle action={<a href="#" onClick={(e) => { e.preventDefault(); onToast && onToast("Payment history exported (CSV)."); }} style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-link)", textDecoration: "none" }}>Export</a>}>Payment history</SectionTitle>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Receipt", "Period", "Date paid", "Amount", "Status"].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 3 ? "right" : "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--fg-3)", padding: "9px 22px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.ref} className="storm-row">
                    <td style={{ padding: "11px 22px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)" }}>{p.ref}</td>
                    <td style={{ padding: "11px 22px", borderBottom: "1px solid var(--border-subtle)", color: "var(--fg-1)", fontWeight: 500 }}>{p.period}</td>
                    <td style={{ padding: "11px 22px", borderBottom: "1px solid var(--border-subtle)", color: "var(--fg-2)" }}>{p.date}</td>
                    <td style={{ padding: "11px 22px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: "var(--fg-1)" }}>{S.peso(p.amount)}</td>
                    <td style={{ padding: "11px 22px", borderBottom: "1px solid var(--border-subtle)" }}><Pill status="paid" dot={false}>Paid</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Right: documents + notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card pad={22}>
            <SectionTitle action={<Btn kind="ghost" size="sm" icon="upload">Upload</Btn>}>Documents</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {S.documents.map((d) => {
                const ic = DOC_ICON[d.kind] || DOC_ICON.contract;
                return (
                  <div key={d.name} className="storm-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
                    <span style={{ width: 34, height: 34, flex: "0 0 auto", borderRadius: "var(--radius-md)", background: ic.bg, color: ic.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={ic.name} size={17} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{d.size} · {d.date}</div>
                    </div>
                    <Icon name="download" size={16} color="var(--fg-3)" />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card pad={22}>
            <SectionTitle>Notes</SectionTitle>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.6 }}>
              {tenant.note || "No notes yet for this lease."}
            </p>
            <div style={{ marginTop: 14 }}>
              <Btn kind="secondary" size="sm" icon="plus" full>Add note</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LeaseDetailView });
