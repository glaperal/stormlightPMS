/* StormlightPMS UI kit — PropertiesView, TenantsView, MaintenanceView, RecordPaymentModal */

function OccupancyBar({ occupied, units }) {
  const pct = Math.round((occupied / units) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{occupied} of {units} occupied</span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: pct === 100 ? "var(--success-600)" : "var(--navy-500)" }}>{pct}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "var(--slate-100)", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", borderRadius: 4, background: pct === 100 ? "var(--success-500)" : "linear-gradient(90deg, var(--teal-500), var(--navy-500))" }} />
      </div>
    </div>
  );
}

function PropertiesView({ onAdd, onOpen }) {
  const S = window.STORM;
  return (
    <div>
      <PageHead
        title="Properties"
        subtitle={S.properties.length + " property · " + S.totals.units + " units in " + S.properties[0].city}
        actions={<Btn icon="plus" onClick={onAdd}>Add property</Btn>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {S.properties.map((p) => {
          const st = S.statsOf(p.id);
          return (
            <Card key={p.id} pad={0} style={{ overflow: "hidden", cursor: "pointer" }} className="storm-lift" >
              <div onClick={() => onOpen(p)}>
                <div style={{ display: "flex", gap: 14, padding: 18, alignItems: "flex-start" }}>
                  <div style={{ width: 52, height: 52, flex: "0 0 auto", borderRadius: "var(--radius-md)", background: "linear-gradient(150deg, var(--navy-500), var(--navy-700))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="building-2" size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>{p.name}</h3>
                      {st.vacant === 0 && <Pill status="paid" dot={false}>Full</Pill>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-3)", marginTop: 3 }}>
                      <Icon name="map-pin" size={13} />{p.brgy}, {p.city}
                    </div>
                    <div style={{ marginTop: 6, display: "flex", gap: 6 }}><Tag>{p.kind}</Tag><Tag>{st.floors} floors</Tag></div>
                  </div>
                  <Icon name="chevron-right" size={18} color="var(--fg-3)" />
                </div>
                <div style={{ padding: "0 18px 16px" }}>
                  <OccupancyBar occupied={st.occupied} units={st.units} />
                </div>
                <div style={{ display: "flex", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-subtle)" }}>
                  <div style={{ flex: 1, padding: "12px 18px", borderRight: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--fg-1)", marginTop: 3 }}>{S.peso(st.monthly).replace(".00", "")}</div>
                  </div>
                  <div style={{ flex: 1, padding: "12px 18px" }}>
                    <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vacant</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: st.vacant ? "var(--warning-600)" : "var(--fg-1)", marginTop: 3 }}>{st.vacant} unit{st.vacant === 1 ? "" : "s"}</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TenantsView({ onSelect, onAdd, onToast }) {
  const S = window.STORM;
  return (
    <div>
      <PageHead
        title="Tenants"
        subtitle={S.tenants.length + " active leases · Vision Homes"}
        actions={<><Btn kind="secondary" icon="upload" onClick={() => onToast && onToast("Import started \u2014 we'll process your tenant list.")}>Import</Btn><Btn icon="user-plus" onClick={onAdd}>Add tenant</Btn></>}
      />
      <Card pad={0}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Tenant", "Unit", "Lease since", "Phone", "Monthly", ""].map((h, i) => (
                <th key={i} style={{ textAlign: i === 4 ? "right" : "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--fg-3)", padding: "10px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {S.tenants.map((t) => (
              <tr key={t.id} className="storm-row" style={{ cursor: "pointer" }} onClick={() => onSelect(t)}>
                <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <Avatar initials={t.initials} size={34} />
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--fg-1)" }}>{t.name}</div>
                      <div style={{ color: "var(--fg-3)" }}>{S.floorName(t)}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "var(--fg-2)" }}>Unit {t.unit}</td>
                <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", color: "var(--fg-2)" }}>{t.since}</td>
                <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", color: "var(--fg-2)" }}>{t.phone}</td>
                <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: "var(--fg-1)" }}>{S.peso(t.rent)}</td>
                <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right" }}><Icon name="chevron-right" size={16} color="var(--fg-3)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function TenantDrawer({ tenant, onClose, onRecord, onViewLease }) {
  if (!tenant) return null;
  const S = window.STORM;
  const rows = [
    ["Property", S.propName(tenant.prop)],
    ["Floor", S.floorName(tenant)],
    ["Address", S.propAddr(tenant.prop)],
    ["Unit", "Unit " + tenant.unit],
    ["Lease since", tenant.since],
    ["Phone", tenant.phone],
    ["Preferred method", tenant.method],
  ];
  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,31,56,0.45)", zIndex: 100, display: "flex", justifyContent: "flex-end", animation: "storm-fade .15s ease" }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: "92vw", background: "var(--bg-surface)", height: "100%", boxShadow: "var(--shadow-xl)", animation: "storm-slide .22s cubic-bezier(0.2,0,0,1)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 24px", background: "linear-gradient(150deg, var(--navy-500), var(--navy-700))", color: "#fff", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: 0, background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: "var(--radius-sm)", padding: 5, cursor: "pointer", display: "flex" }}><Icon name="x" size={18} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar initials={tenant.initials} size={48} />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22 }}>{tenant.name}</div>
              <div style={{ fontSize: 13, color: "var(--navy-100)" }}>Unit {tenant.unit} · {S.floorName(tenant)}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <Btn kind="accent" size="sm" icon="plus" onClick={() => { onClose(); onRecord(tenant); }}>Record payment</Btn>
            <Btn kind="secondary" size="sm" icon="message-circle">Message</Btn>
          </div>
        </div>
        <div style={{ padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "14px 16px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly rent</div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 20, color: "var(--fg-1)", marginTop: 3 }}>{S.peso(tenant.rent)}</div>
            </div>
            {tenant.status === "overdue" ? <Pill status="overdue">Overdue {tenant.overdueDays}d</Pill> : tenant.status === "paid" ? <Pill status="paid">Paid</Pill> : <Pill status="due">Due 01 Apr</Pill>}
          </div>
          <h4 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>Lease details</h4>
          <div>
            {rows.map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}>
                <span style={{ color: "var(--fg-3)" }}>{k}</span>
                <span style={{ color: "var(--fg-1)", fontWeight: 500, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
            <Btn kind="secondary" icon="file-text" iconRight="arrow-right" full onClick={() => onViewLease(tenant)}>View full lease</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

const PRIORITY = {
  high: { bg: "var(--danger-50)", fg: "var(--danger-700)", label: "High" },
  medium: { bg: "var(--warning-50)", fg: "var(--warning-700)", label: "Medium" },
  low: { bg: "var(--bg-muted)", fg: "var(--fg-2)", label: "Low" },
};
const COLS = [
  { id: "open", label: "Open", icon: "circle-dot" },
  { id: "in_progress", label: "In progress", icon: "loader" },
  { id: "resolved", label: "Resolved", icon: "circle-check" },
];

function MaintenanceView({ onToast }) {
  const S = window.STORM;
  return (
    <div>
      <PageHead title="Maintenance" subtitle="5 work orders · 1 high priority" actions={<Btn icon="plus" onClick={() => onToast && onToast("Opening a new work order.")}>New work order</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {COLS.map((c) => {
          const items = S.tickets.filter((t) => t.status === c.id);
          return (
            <div key={c.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 2px" }}>
                <Icon name={c.icon} size={16} color={c.id === "resolved" ? "var(--success-500)" : c.id === "in_progress" ? "var(--teal-600)" : "var(--fg-3)"} />
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--fg-1)" }}>{c.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", background: "var(--bg-muted)", borderRadius: "var(--radius-full)", padding: "1px 8px" }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((t) => {
                  const pr = PRIORITY[t.priority];
                  return (
                    <Card key={t.id} pad={14} style={{ cursor: "pointer", opacity: t.status === "resolved" ? 0.75 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase" }}>{t.id}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: "var(--radius-full)", background: pr.bg, color: pr.fg }}>{pr.label}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.35 }}>{t.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg-3)", marginTop: 8 }}>
                        <Icon name="map-pin" size={13} />Unit {t.unit} · {t.floor} Floor
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--border-subtle)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--fg-2)" }}><Avatar initials={t.tenant.split(" ").map((w) => w[0]).join("").slice(0, 2)} size={22} />{t.tenant.split(" ")[0]}</span>
                        <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>{t.age}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecordPaymentModal({ tenant, onClose, onConfirm }) {
  const S = window.STORM;
  const [t, setT] = React.useState(tenant);
  const [amount, setAmount] = React.useState(tenant ? String(tenant.rent) : "");
  const [method, setMethod] = React.useState(tenant ? tenant.method : "PDC");
  const methods = ["PDC", "BankTransfer", "Cash", "Other"];
  const unpaid = S.tenants.filter((x) => x.status !== "paid");
  return (
    <Modal
      title="Record payment"
      onClose={onClose}
      width={460}
      footer={<>
        <Btn kind="secondary" onClick={onClose}>Cancel</Btn>
        <Btn icon="check" onClick={() => onConfirm(t, amount, method)} disabled={!t}>Confirm payment</Btn>
      </>}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Tenant">
          {t ? (
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-subtle)" }}>
              <Avatar initials={t.initials} size={30} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--fg-1)" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Unit {t.unit} · {S.floorName(t)}</div>
              </div>
              <button onClick={() => setT(null)} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--fg-3)", display: "flex" }}><Icon name="x" size={16} /></button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 6 }}>
              {unpaid.map((x) => (
                <button key={x.id} onClick={() => { setT(x); setAmount(String(x.rent)); setMethod(x.method); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", border: 0, background: "transparent", cursor: "pointer", borderRadius: "var(--radius-sm)", textAlign: "left" }} className="storm-pick">
                  <Avatar initials={x.initials} size={26} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{x.name} · Unit {x.unit}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>{S.peso(x.rent)}</span>
                </button>
              ))}
            </div>
          )}
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Amount">
            <Input prefix="₱" value={amount} onChange={setAmount} />
          </Field>
          <Field label="Date received">
            <Input icon="calendar" value="07 Apr 2026" onChange={() => {}} />
          </Field>
        </div>
        <Field label="Payment method">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {methods.map((m) => (
              <button key={m} onClick={() => setMethod(m)} style={{ padding: "9px 0", borderRadius: "var(--radius-md)", border: "1px solid " + (method === m ? "var(--gold-500)" : "var(--border-strong)"), background: method === m ? "var(--gold-50)" : "var(--bg-surface)", color: method === m ? "var(--gold-700)" : "var(--fg-2)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: "pointer", boxShadow: method === m ? "var(--shadow-focus)" : "none" }}>{m}</button>
            ))}
          </div>
        </Field>
        <Field label="Reference no. (optional)">
          <Input placeholder="e.g. GCash 0143-882-119" value="" onChange={() => {}} />
        </Field>
      </div>
    </Modal>
  );
}

Object.assign(window, { PropertiesView, TenantsView, TenantDrawer, MaintenanceView, RecordPaymentModal });
