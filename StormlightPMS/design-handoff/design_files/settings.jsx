/* StormlightPMS UI kit — SettingsView (profile, billing, notifications) */

function SettingsTabs({ tab, onTab }) {
  const tabs = [
    { id: "profile", label: "Profile", icon: "user" },
    { id: "billing", label: "Billing & plan", icon: "credit-card" },
    { id: "notifications", label: "Notifications", icon: "bell" },
  ];
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", marginBottom: 22 }}>
      {tabs.map((t) => {
        const on = tab === t.id;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", border: 0, background: "transparent", color: on ? "var(--navy-500)" : "var(--fg-2)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, borderBottom: "2px solid " + (on ? "var(--navy-500)" : "transparent"), marginBottom: -1, cursor: "pointer" }}>
            <Icon name={t.icon} size={16} />{t.label}
          </button>
        );
      })}
    </div>
  );
}

function ProfilePanel() {
  const o = window.STORM.owner;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
      <Card pad={24}>
        <h3 style={{ margin: "0 0 18px", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16 }}>Account</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <Avatar initials={o.initials} size={56} seed={1} />
          <div>
            <Btn kind="secondary" size="sm" icon="upload">Change photo</Btn>
            <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 6 }}>JPG or PNG, up to 2 MB.</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Full name"><Input value={o.name} onChange={() => {}} /></Field>
          <Field label="Email"><Input icon="mail" value={o.email} onChange={() => {}} /></Field>
          <Field label="Mobile number"><Input icon="phone" value={o.phone} onChange={() => {}} /></Field>
        </div>
      </Card>
      <Card pad={24}>
        <h3 style={{ margin: "0 0 18px", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16 }}>Business</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Business / registered name"><Input icon="briefcase" value={o.business} onChange={() => {}} /></Field>
          <Field label="TIN" hint="Shown on BIR-ready exports."><Input value={o.tin} onChange={() => {}} /></Field>
          <Field label="Default currency"><Select value="PHP" onChange={() => {}} options={[{ value: "PHP", label: "₱ Philippine Peso (PHP)" }]} /></Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border-subtle)" }}>
          <Btn kind="ghost">Cancel</Btn>
          <Btn icon="check">Save changes</Btn>
        </div>
      </Card>
    </div>
  );
}

function BillingPanel() {
  const b = window.STORM.billing;
  const S = window.STORM;
  const pct = Math.round((b.unitsUsed / b.unitsCap) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Plan card */}
        <Card pad={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "22px 24px", background: "linear-gradient(135deg, var(--navy-500), var(--navy-700))", color: "#fff", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "var(--gold-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <img src="assets/logo-bolt.svg" width="14" height="14" style={{ filter: "none" }} alt="" />Current plan
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, marginTop: 6 }}>{b.plan}</div>
              <div style={{ fontSize: 13.5, color: "var(--navy-100)", marginTop: 2 }}>Up to {b.unitsCap} units · priority support</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 24 }}>{S.peso(b.price).replace(".00", "")}</div>
              <div style={{ fontSize: 12, color: "var(--navy-200)" }}>per {b.cycle}</div>
            </div>
          </div>
          <div style={{ padding: "18px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{b.unitsUsed} of {b.unitsCap} units used</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--navy-500)" }}>{pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--slate-100)", overflow: "hidden" }}>
              <div style={{ width: pct + "%", height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--teal-500), var(--navy-500))" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Btn>Upgrade plan</Btn>
              <Btn kind="secondary">Manage</Btn>
            </div>
          </div>
        </Card>

        {/* Payment method */}
        <Card pad={24}>
          <h3 style={{ margin: "0 0 16px", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16 }}>Payment method</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-subtle)" }}>
            <span style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--teal-50)", color: "var(--teal-700)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="wallet" size={20} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{b.method.type}</div>
              <div style={{ fontSize: 12.5, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{b.method.detail}</div>
            </div>
            <Pill status="paid" dot={false}>Active</Pill>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginTop: 14, display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="calendar" size={15} color="var(--fg-3)" />Next charge on {b.nextDate}
          </div>
          <div style={{ marginTop: 16 }}><Btn kind="secondary" size="sm" icon="pencil" full>Update payment method</Btn></div>
        </Card>
      </div>

      {/* Billing history */}
      <Card pad={0}>
        <div style={{ padding: "18px 24px 12px" }}>
          <SectionTitle action={<a href="#" style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-link)", textDecoration: "none" }}>Download all</a>}>Billing history</SectionTitle>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Invoice", "Date", "Amount", "Status", ""].map((h, i) => (
                <th key={h} style={{ textAlign: i === 2 ? "right" : "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--fg-3)", padding: "9px 24px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.history.map((inv) => (
              <tr key={inv.ref} className="storm-row">
                <td style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-1)", fontWeight: 500 }}>{inv.ref}</td>
                <td style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-subtle)", color: "var(--fg-2)" }}>{inv.date}</td>
                <td style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: "var(--fg-1)" }}>{S.peso(inv.amount)}</td>
                <td style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-subtle)" }}><Pill status="paid">Paid</Pill></td>
                <td style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-subtle)", textAlign: "right" }}>
                  <button style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--fg-link)", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="download" size={15} />Receipt</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function NotificationsPanel() {
  const groups = [
    { title: "Rent", items: [
      { id: "n1", label: "Payment received", desc: "When a tenant pays rent.", on: true },
      { id: "n2", label: "Rent due soon", desc: "3 days before a due date.", on: true },
      { id: "n3", label: "Overdue alert", desc: "When a payment becomes overdue.", on: true },
    ]},
    { title: "Maintenance", items: [
      { id: "n4", label: "New work order", desc: "When a tenant reports an issue.", on: true },
      { id: "n5", label: "Status changes", desc: "When a ticket is updated.", on: false },
    ]},
    { title: "Channels", items: [
      { id: "n6", label: "Email", desc: "admin@visionhomes.ph", on: true },
      { id: "n7", label: "SMS", desc: "0917 555 0143", on: true },
    ]},
  ];
  const [state, setState] = React.useState(Object.fromEntries(groups.flatMap((g) => g.items.map((i) => [i.id, i.on]))));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 }}>
      {groups.map((g) => (
        <Card key={g.title} pad={0}>
          <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--border-subtle)", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--fg-3)" }}>{g.title}</div>
          {g.items.map((it, i) => (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{it.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{it.desc}</div>
              </div>
              <Toggle on={state[it.id]} onChange={(v) => setState((s) => ({ ...s, [it.id]: v }))} />
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function SettingsView() {
  const [tab, setTab] = React.useState("profile");
  return (
    <div>
      <PageHead title="Settings" subtitle="Manage your account, plan, and notifications." />
      <SettingsTabs tab={tab} onTab={setTab} />
      {tab === "profile" && <ProfilePanel />}
      {tab === "billing" && <BillingPanel />}
      {tab === "notifications" && <NotificationsPanel />}
    </div>
  );
}

Object.assign(window, { SettingsView });
