/* StormlightPMS UI kit — PropertyDetailView: a building's floors → units. */

function UnitCell({ unit, tenant, onOpen }) {
  const S = window.STORM;
  const vacant = !tenant;
  return (
    <div
      onClick={() => tenant && onOpen(tenant)}
      className={tenant ? "storm-lift" : ""}
      style={{
        border: "1px solid " + (vacant ? "var(--border)" : "var(--border)"),
        borderRadius: "var(--radius-md)",
        background: vacant ? "repeating-linear-gradient(135deg, var(--bg-subtle), var(--bg-subtle) 8px, var(--slate-50) 8px, var(--slate-50) 16px)" : "var(--bg-surface)",
        padding: "12px 14px",
        cursor: tenant ? "pointer" : "default",
        boxShadow: vacant ? "none" : "var(--shadow-xs)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 96,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, color: "var(--fg-1)" }}>{unit.room}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{unit.area} m²</span>
      </div>
      {tenant ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <Avatar initials={tenant.initials} size={26} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1.25 }}>{tenant.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)" }}>{S.peso(tenant.rent).replace(".00", "")}</span>
            {tenant.status === "overdue" ? <Pill status="overdue" dot={false}>Overdue</Pill> : tenant.status === "due" ? <Pill status="due" dot={false}>Due</Pill> : <Pill status="paid" dot={false}>Paid</Pill>}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--fg-3)" }}><Icon name="door-open" size={14} />Vacant</span>
        </div>
      )}
    </div>
  );
}

function PropertyDetailView({ property, onBack, onOpenTenant }) {
  const S = window.STORM;
  const st = S.statsOf(property.id);
  const floors = S.floorsOf(property.id);
  return (
    <div>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: 0, background: "transparent", cursor: "pointer", color: "var(--fg-2)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 16 }}>
        <Icon name="arrow-left" size={16} />Back to properties
      </button>

      <Card pad={0} style={{ overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "22px 24px", background: "linear-gradient(135deg, var(--navy-500), var(--navy-700))", color: "#fff", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, flex: "0 0 auto", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="building-2" size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, letterSpacing: "-0.01em" }}>{property.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--navy-100)", marginTop: 3 }}>
              <Icon name="map-pin" size={14} />{property.addr}, {property.brgy}, {property.city}
            </div>
          </div>
          <Btn kind="secondary" icon="plus">Add unit</Btn>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {[
            ["Units", st.units + " across " + st.floors + " floors"],
            ["Occupied", st.occupied + " / " + st.units],
            ["Vacant", st.vacant + " units"],
            ["Monthly", S.peso(st.monthly).replace(".00", "")],
          ].map(([k, v], i) => (
            <div key={k} style={{ flex: "1 1 150px", padding: "14px 24px", borderRight: i < 3 ? "1px solid var(--border-subtle)" : "none", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
              <div style={{ marginTop: 5, fontFamily: k === "Monthly" ? "var(--font-mono)" : "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--fg-1)" }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {floors.map((f) => (
          <div key={f.name}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--fg-1)" }}>{f.name} Floor</h3>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", background: "var(--bg-muted)", borderRadius: "var(--radius-full)", padding: "1px 9px" }}>{f.occupied}/{f.count} occupied</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--fg-2)" }}>{S.peso(f.monthly).replace(".00", "")}/mo</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {f.units.map((u) => (
                <UnitCell key={u.id} unit={u} tenant={S.tenantById(u.tenantId)} onOpen={onOpenTenant} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PropertyDetailView });
