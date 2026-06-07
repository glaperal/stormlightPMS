/* StormlightPMS UI kit — App root: auth, routing, modals, toast. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "leaseWindow": 90,
  "receivablesScope": "Rental + utilities",
  "highlightUrgent": true,
  "showInsights": true
}/*EDITMODE-END*/;

function App() {
  const [authed, setAuthed] = React.useState(false);
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("dashboard");
  const [paid, setPaid] = React.useState({});
  const [payOpen, setPayOpen] = React.useState(false);
  const [payTenant, setPayTenant] = React.useState(null);
  const [drawer, setDrawer] = React.useState(null);
  const [lease, setLease] = React.useState(null);
  const [propDetail, setPropDetail] = React.useState(null);
  const [addProp, setAddProp] = React.useState(false);
  const [addTenant, setAddTenant] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const toastRef = React.useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2800);
  };
  const onRecord = (t) => { setPayTenant(t); setPayOpen(true); };
  const onConfirm = (t, amount, method) => {
    if (!t) return;
    setPaid((p) => ({ ...p, [t.id]: true }));
    setPayOpen(false);
    showToast("Payment recorded. Receipt sent to " + t.name.split(" ")[0] + ".");
  };
  const onRemind = (t) => showToast(t ? "Reminder sent to " + t.name.split(" ")[0] + "." : "Reminders sent to 2 tenants.");
  const openLease = (t) => { setDrawer(null); setLease(t); setView("lease"); };
  const openProp = (p) => { setPropDetail(p); setView("property"); };

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const S = window.STORM;
  const paidDelta = S.tenants.filter((t) => paid[t.id] && t.status !== "paid");
  const extra = paidDelta.reduce((a, t) => a + t.rent, 0);
  const liveCollected = S.totals.collected + extra;
  const paidOverdue = paidDelta.filter((t) => t.status === "overdue").reduce((a, t) => a + t.rent, 0);
  const live = {
    collected: liveCollected,
    rate: Math.min(100, Math.round((liveCollected / S.totals.due) * 100)),
    arrears: Math.max(0, S.totals.arrears - paidOverdue),
    arrearsCount: S.tenants.filter((t) => t.status === "overdue" && !paid[t.id]).length,
  };

  const views = {
    dashboard: <DashboardView onRecord={onRecord} onRemind={onRemind} onToast={showToast} paid={paid} live={live} tweaks={tw} />,
    rent: <RentView onRecord={onRecord} onRemind={onRemind} onToast={showToast} paid={paid} live={live} />,
    properties: <PropertiesView onAdd={() => setAddProp(true)} onOpen={openProp} />,
    property: propDetail ? <PropertyDetailView property={propDetail} onBack={() => setView("properties")} onOpenTenant={setDrawer} /> : <PropertiesView onAdd={() => setAddProp(true)} onOpen={openProp} />,
    tenants: <TenantsView onSelect={setDrawer} onAdd={() => setAddTenant(true)} onToast={showToast} />,
    utilities: <UtilitiesView onToast={showToast} />,
    maintenance: <MaintenanceView onToast={showToast} />,
    reports: <ReportsView onToast={showToast} />,
    settings: <SettingsView />,
    lease: lease ? <LeaseDetailView tenant={lease} onBack={() => setView("tenants")} onRecord={onRecord} onRemind={onRemind} onToast={showToast} /> : <DashboardView onRecord={onRecord} onRemind={onRemind} onToast={showToast} />,
  };

  const navActive = view === "lease" ? "tenants" : view === "property" ? "properties" : view;


  return (
    <div style={{ display: "flex", background: "var(--bg-app)", minHeight: "100vh" }}>
      <Sidebar active={navActive} onNav={setView} onSettings={() => setView("settings")} settingsActive={view === "settings"} onLogout={() => setAuthed(false)} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar onAdd={() => onRecord(null)} />
        <main style={{ flex: 1, padding: "26px 28px 60px", maxWidth: 1240, width: "100%", margin: "0 auto" }}>
          {views[view] || views.dashboard}
        </main>
      </div>
      {payOpen && <RecordPaymentModal tenant={payTenant} onClose={() => setPayOpen(false)} onConfirm={onConfirm} />}
      {addProp && <AddPropertyModal onClose={() => setAddProp(false)} onConfirm={(n) => { setAddProp(false); showToast("Property added" + (n ? " \u2014 " + n : "") + "."); }} />}
      {addTenant && <AddTenantModal onClose={() => setAddTenant(false)} onConfirm={(n) => { setAddTenant(false); showToast("Tenant added" + (n ? " \u2014 " + n : "") + "."); }} />}
      {drawer && <TenantDrawer tenant={drawer} onClose={() => setDrawer(null)} onRecord={onRecord} onViewLease={openLease} />}
      <Toast toast={toast} />
      <TweaksPanel title="Tweaks">
        <TweakSection label="Lease expiry" />
        <TweakSlider label="Ending within" value={tw.leaseWindow} min={30} max={180} step={30} unit=" days" onChange={(v) => setTweak("leaseWindow", v)} />
        <TweakSection label="Receivables" />
        <TweakSelect label="Show" value={tw.receivablesScope} options={["Rental + utilities", "Rental only", "Utilities only"]} onChange={(v) => setTweak("receivablesScope", v)} />
        <TweakToggle label="Highlight urgent" value={tw.highlightUrgent} onChange={(v) => setTweak("highlightUrgent", v)} />
        <TweakToggle label="Show insights row" value={tw.showInsights} onChange={(v) => setTweak("showInsights", v)} />
      </TweaksPanel>
    </div>
  );
}

function ComingSoon({ label }) {
  return (
    <div>
      <PageHead title={label} subtitle="This area isn't part of the recreated kit." />
      <Card pad={48} style={{ textAlign: "center" }}>
        <div style={{ width: 52, height: 52, margin: "0 auto 14px", borderRadius: "var(--radius-lg)", background: "var(--navy-50)", color: "var(--navy-500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="chart-no-axes-column" size={26} />
        </div>
        <h3 style={{ margin: "0 0 6px", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 17, color: "var(--fg-1)" }}>{label} coming soon</h3>
        <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)" }}>This screen is intentionally left blank in the UI kit.</p>
      </Card>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
