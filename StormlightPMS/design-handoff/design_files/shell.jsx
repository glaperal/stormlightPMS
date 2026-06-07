/* StormlightPMS UI kit — app shell: Sidebar, Topbar, LoginScreen. */

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { id: "properties", label: "Properties", icon: "building-2" },
  { id: "tenants", label: "Tenants", icon: "users" },
  { id: "rent", label: "Rent", icon: "receipt" },
  { id: "utilities", label: "Utilities", icon: "zap" },
  { id: "maintenance", label: "Maintenance", icon: "wrench" },
  { id: "reports", label: "Reports", icon: "chart-no-axes-column" },
];

function Sidebar({ active, onNav, onLogout, onSettings, settingsActive }) {
  return (
    <aside
      style={{
        width: 232,
        flex: "0 0 232px",
        background: "linear-gradient(180deg, var(--navy-600), var(--navy-800))",
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px 16px",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <div style={{ padding: "4px 8px 22px" }}>
        <Logo size={32} light />
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV.map((n) => {
          const on = active === n.id;
          return (
            <button
              key={n.id}
              onClick={() => onNav(n.id)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 12px",
                borderRadius: "var(--radius-md)",
                border: 0,
                cursor: "pointer",
                backgroundColor: on ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0)",
                color: on ? "#fff" : "var(--navy-200)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: on ? 600 : 500,
                textAlign: "left",
              }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.color = "var(--navy-200)"; }}
            >
              {on && (
                <span style={{ position: "absolute", left: -4, top: 9, bottom: 9, width: 3, borderRadius: 2, background: "var(--gold-400)" }} />
              )}
              <Icon name={n.icon} size={18} />
              {n.label}
            </button>
          );
        })}
      </nav>
      <button
        onClick={onSettings}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "9px 12px",
          borderRadius: "var(--radius-md)",
          border: 0,
          cursor: "pointer",
          backgroundColor: settingsActive ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0)",
          color: settingsActive ? "#fff" : "var(--navy-200)",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: settingsActive ? 600 : 500,
          textAlign: "left",
          marginBottom: 8,
        }}
        onMouseEnter={(e) => { if (!settingsActive) e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={(e) => { if (!settingsActive) e.currentTarget.style.color = "var(--navy-200)"; }}
      >
        {settingsActive && (
          <span style={{ position: "absolute", left: -4, top: 9, bottom: 9, width: 3, borderRadius: 2, background: "var(--gold-400)" }} />
        )}
        <Icon name="settings" size={18} />
        Settings
      </button>
      <button
        onClick={onLogout}
        title="Sign out"
        style={{
          marginTop: 12,
          padding: "11px 10px",
          borderRadius: "var(--radius-md)",
          background: "rgba(255,255,255,0.06)",
          border: 0,
          width: "100%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textAlign: "left",
        }}
      >
        <Avatar initials="OL" size={32} seed={1} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>Oli Laperal Jr.</div>
          <div style={{ fontSize: 11, color: "var(--navy-200)" }}>Vision Homes · 15 units</div>
        </div>
        <Icon name="log-out" size={16} color="var(--navy-200)" style={{ marginLeft: "auto" }} />
      </button>
    </aside>
  );
}

function Topbar({ onAdd, notifCount = 4 }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 28px",
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ flex: "0 1 360px" }}>
        <Input icon="search" placeholder="Search tenants, units, invoices…" />
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>
          <Icon name="calendar" size={16} color="var(--fg-3)" /> April 2026
        </span>
        <span style={{ position: "relative", display: "inline-flex" }}>
          <button aria-label={`Notifications${notifCount > 0 ? `, ${notifCount} unread` : ""}`} style={{ border: "1px solid var(--border)", background: "var(--bg-surface)", borderRadius: "var(--radius-md)", padding: 8, cursor: "pointer", color: "var(--fg-2)", display: "flex" }}>
            <Icon name="bell" size={18} />
          </button>
          {notifCount > 0 && (
            <span style={{ position: "absolute", top: -5, right: -5, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 9, background: "var(--danger-500)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg-surface)" }}>
              {notifCount}
            </span>
          )}
        </span>
        <Btn icon="plus" onClick={onAdd}>Record payment</Btn>
      </div>
    </header>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState("admin@visionhomes.ph");
  const [pw, setPw] = React.useState("••••••••••");
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-app)" }}>
      {/* Brand panel */}
      <div
        style={{
          flex: "1 1 46%",
          background: "linear-gradient(150deg, var(--navy-500), var(--navy-800))",
          color: "#fff",
          padding: "56px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* faint storm streaks */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.10 }} preserveAspectRatio="none">
          <defs>
            <pattern id="streaks" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
              <line x1="0" y1="0" x2="0" y2="60" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#streaks)" />
        </svg>
        <div style={{ position: "relative" }}>
          <Logo size={36} light />
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Steady light through<br />every storm.
          </div>
          <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.6, color: "var(--navy-100)", maxWidth: 420 }}>
            Collect rent, track every unit, and keep your tenants happy — one calm dashboard built for Filipino lessors.
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 26 }}>
            {[["9/15", "Units occupied"], ["85%", "Collected this month"], ["₱284k", "Monthly contracted"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 22, color: "var(--gold-400)" }}>{n}</div>
                <div style={{ fontSize: 12, color: "var(--navy-200)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", fontSize: 12, color: "var(--navy-200)" }}>© 2026 StormlightPMS · Las Piñas City</div>
      </div>

      {/* Form panel */}
      <div style={{ flex: "1 1 54%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 360, maxWidth: "100%" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, color: "var(--fg-1)", letterSpacing: "-0.02em" }}>
            Welcome back
          </h1>
          <p style={{ margin: "8px 0 28px", fontSize: 14, color: "var(--fg-2)" }}>Sign in to manage your properties.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); onLogin(); }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Field label="Email">
              <Input icon="mail" value={email} onChange={setEmail} />
            </Field>
            <Field label="Password">
              <Input icon="lock" type="password" value={pw} onChange={setPw} />
            </Field>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--fg-2)", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <a href="#" style={{ color: "var(--fg-link)", fontWeight: 600, textDecoration: "none" }}>Forgot password?</a>
            </div>
            <Btn type="submit" size="lg" full>Sign in</Btn>
          </form>
          <div style={{ marginTop: 22, textAlign: "center", fontSize: 13, color: "var(--fg-3)" }}>
            New to StormlightPMS? <a href="#" style={{ color: "var(--fg-link)", fontWeight: 600, textDecoration: "none" }}>Start free</a>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, LoginScreen, NAV });
