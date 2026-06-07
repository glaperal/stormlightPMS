/* StormlightPMS UI kit — AddPropertyModal + AddTenantModal */

function AddPropertyModal({ onClose, onConfirm }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("Apartment");
  const [brgy, setBrgy] = React.useState("");
  const [city, setCity] = React.useState("");
  const [province, setProvince] = React.useState("Metro Manila");
  const [units, setUnits] = React.useState("");
  const ready = name.trim() && city.trim();
  return (
    <Modal
      title="Add property"
      onClose={onClose}
      width={500}
      footer={<>
        <Btn kind="secondary" onClick={onClose}>Cancel</Btn>
        <Btn icon="check" disabled={!ready} onClick={() => onConfirm(name)}>Add property</Btn>
      </>}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Property name">
          <Input icon="building-2" placeholder="e.g. Vision Homes" value={name} onChange={setName} autoFocus />
        </Field>
        <Field label="Type">
          <Segmented value={type} onChange={setType} cols={3} options={["Apartment", "Condo units", "Studio", "House", "Residential building", "Commercial building", "Mixed-use building", "Standard factory building", "Warehouse", "Land lease", "Other"]} />
        </Field>
        <Field label="Barangay">
          <Input icon="map-pin" placeholder="e.g. Brgy. Poblacion" value={brgy} onChange={setBrgy} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="City / Municipality">
            <Input placeholder="e.g. Makati City" value={city} onChange={setCity} />
          </Field>
          <Field label="Province">
            <Select value={province} onChange={setProvince} options={["Metro Manila", "Cebu", "Rizal", "Cavite", "Laguna", "Pampanga", "Davao del Sur"]} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Number of units" hint="You can add unit details later.">
            <Input icon="layout-grid" placeholder="e.g. 12" value={units} onChange={setUnits} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function AddTenantModal({ onClose, onConfirm }) {
  const S = window.STORM;
  const [step, setStep] = React.useState(0);
  // Tenant & space
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [prop, setProp] = React.useState("vh");
  const [unit, setUnit] = React.useState("");
  const [area, setArea] = React.useState("");
  // Commercials & term
  const [basicRent, setBasicRent] = React.useState("");
  const [cusa, setCusa] = React.useState("");
  const [parking, setParking] = React.useState("");
  const [vat, setVat] = React.useState(true);
  const [start, setStart] = React.useState("01 Aug 2026");
  const [termMonths, setTermMonths] = React.useState(12);
  // Concessions & deposits
  const [rentFreeMo, setRentFreeMo] = React.useState(0);
  const [escalationPct, setEscalationPct] = React.useState(5);
  const [escalationOn, setEscalationOn] = React.useState("basic");
  const [depositMo, setDepositMo] = React.useState(2);
  const [advanceMo, setAdvanceMo] = React.useState(1);
  const [method, setMethod] = React.useState("GCash");

  const num = (v) => parseFloat(String(v).replace(/,/g, "")) || 0;
  const basic = num(basicRent), cusaN = num(cusa), parkingN = num(parking);
  const monthly = basic + cusaN + parkingN;
  const depositAmt = depositMo * basic, advanceAmt = advanceMo * basic;
  const parseStart = (s) => { const d = S.parseDate(s); return d && !isNaN(d.getTime()) ? d : null; };
  const sd = parseStart(start) || S.parseDate("01 Aug 2026");
  const ed = S.addMonths(sd, termMonths);
  const escNext = escalationPct > 0 ? S.fmtDate(S.addMonths(sd, 12)) : null;
  const preview = S.scheduleFrom({ startDate: sd, endDate: ed, rentFreeMonths: rentFreeMo, advanceMonths: advanceMo, escalationPct, escalationNext: escNext });

  const steps = ["Tenant & space", "Commercials & term", "Concessions & deposits", "Review"];
  const stepValid = [name.trim() && prop && unit.trim(), basic > 0 && !!parseStart(start), true, true];

  const MonthSeg = ({ value, set, opts }) => (
    <Segmented value={String(value)} onChange={(v) => set(parseInt(v, 10))} options={opts.map(String)} />
  );
  const GroupLabel = ({ children }) => (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--teal-700)" }}>{children}</div>
  );
  const SumRow = ({ k, v, mono }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}>
      <span style={{ color: "var(--fg-3)" }}>{k}</span>
      <span style={{ color: "var(--fg-1)", fontWeight: 600, textAlign: "right", fontFamily: mono ? "var(--font-mono)" : "inherit" }}>{v}</span>
    </div>
  );
  const totalBox = (label, amount) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--navy-50)", border: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-600)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: "var(--navy-600)" }}>{amount}</span>
    </div>
  );

  return (
    <Modal title="New lease" onClose={onClose} width={600}
      footer={<div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 600 }}>Step {step + 1} of {steps.length}</span>
        <div style={{ display: "flex", gap: 10 }}>
          {step === 0 ? <Btn kind="secondary" onClick={onClose}>Cancel</Btn> : <Btn kind="secondary" icon="arrow-left" onClick={() => setStep(step - 1)}>Back</Btn>}
          {step < 3
            ? <Btn icon="arrow-right" disabled={!stepValid[step]} onClick={() => setStep(step + 1)}>Continue</Btn>
            : <Btn icon="check" onClick={() => onConfirm(name)}>Add lease</Btn>}
        </div>
      </div>}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= step ? "var(--gold-500)" : "var(--bg-muted)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? "var(--fg-1)" : "var(--fg-3)" }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 286 }}>
        {step === 0 && (
          <React.Fragment>
            <Field label="Tenant / business name"><Input icon="user" placeholder="e.g. Maria Santos" value={name} onChange={setName} autoFocus /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Mobile number"><Input icon="phone" placeholder="0917 555 0143" value={phone} onChange={setPhone} /></Field>
              <Field label="Email (optional)"><Input icon="mail" placeholder="maria@email.com" value={email} onChange={setEmail} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }}>
              <Field label="Property"><Select value={prop} onChange={setProp} options={S.properties.map((p) => ({ value: p.id, label: p.name }))} /></Field>
              <Field label="Unit"><Input placeholder="e.g. 305" value={unit} onChange={setUnit} /></Field>
              <Field label="Floor area"><Input placeholder="m²" value={area} onChange={setArea} /></Field>
            </div>
          </React.Fragment>
        )}

        {step === 1 && (
          <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Basic rent / mo"><Input prefix="₱" placeholder="18,500" value={basicRent} onChange={setBasicRent} autoFocus /></Field>
              <Field label="CUSA / mo" hint="Common area charges."><Input prefix="₱" placeholder="1,450" value={cusa} onChange={setCusa} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Parking / mo (optional)"><Input prefix="₱" placeholder="0" value={parking} onChange={setParking} /></Field>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>VAT</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: 13, color: "var(--fg-2)" }}>VAT-inclusive</span>
                  <Toggle on={vat} onChange={setVat} />
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 14 }}>
              <Field label="Lease start"><Input icon="calendar" placeholder="01 Aug 2026" value={start} onChange={setStart} /></Field>
              <Field label="Term length"><Segmented value={String(termMonths)} onChange={(v) => setTermMonths(parseInt(v, 10))} options={[{ value: "6", label: "6 mo" }, { value: "12", label: "12 mo" }, { value: "24", label: "24 mo" }, { value: "36", label: "36 mo" }]} /></Field>
            </div>
            {totalBox("Total monthly billing", S.peso(monthly))}
          </React.Fragment>
        )}

        {step === 2 && (
          <React.Fragment>
            <GroupLabel>Concessions & escalation</GroupLabel>
            <Field label="Rent-free period (fit-out)" hint="Months at lease start with basic rent waived."><MonthSeg value={rentFreeMo} set={setRentFreeMo} opts={[0, 1, 2, 3]} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Annual escalation"><Segmented value={String(escalationPct)} onChange={(v) => setEscalationPct(parseInt(v, 10))} options={[{ value: "0", label: "None" }, { value: "3", label: "3%" }, { value: "5", label: "5%" }, { value: "10", label: "10%" }]} /></Field>
              <Field label="Escalation applies to"><Segmented value={escalationOn} onChange={setEscalationOn} options={[{ value: "basic", label: "Basic rent" }, { value: "basic+cusa", label: "Rent + CUSA" }]} /></Field>
            </div>
            <div style={{ height: 1, background: "var(--border-subtle)", margin: "2px 0" }} />
            <GroupLabel>Deposits & advances</GroupLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Security deposit (months)"><MonthSeg value={depositMo} set={setDepositMo} opts={[1, 2, 3]} /></Field>
              <Field label="Advance rent — last months"><MonthSeg value={advanceMo} set={setAdvanceMo} opts={[0, 1, 2, 3]} /></Field>
            </div>
            <Field label="Preferred payment method"><Segmented value={method} onChange={setMethod} options={["GCash", "Maya", "Bank", "Cash"]} /></Field>
            <div style={{ display: "flex", gap: 12, fontSize: 12.5, color: "var(--fg-2)" }}>
              <span style={{ flex: 1, padding: "9px 12px", borderRadius: "var(--radius-md)", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>Deposit held: <b style={{ fontFamily: "var(--font-mono)" }}>{S.peso(depositAmt)}</b></span>
              <span style={{ flex: 1, padding: "9px 12px", borderRadius: "var(--radius-md)", background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>Advance: <b style={{ fontFamily: "var(--font-mono)" }}>{S.peso(advanceAmt)}</b></span>
            </div>
          </React.Fragment>
        )}

        {step === 3 && (
          <React.Fragment>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <GroupLabel>Lease timeline preview</GroupLabel>
                <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{termMonths}-month term</span>
              </div>
              <TimelineBar schedule={preview} startLabel={S.fmtDate(sd)} endLabel={S.fmtDate(ed)} height={32} />
              <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap", fontSize: 11.5, color: "var(--fg-2)" }}>
                {rentFreeMo > 0 && <TLLegend c="var(--gold-200)" label={"Rent-free " + rentFreeMo + "mo"} />}
                <TLLegend c="var(--navy-500)" label="Billing" />
                {advanceMo > 0 && <TLLegend c="var(--teal-500)" label={"Advance " + advanceMo + "mo"} />}
                {escalationPct > 0 && <TLLegend c="var(--gold-600)" label={"Escalation +" + escalationPct + "%"} />}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 28px", marginTop: 4 }}>
              <SumRow k="Tenant" v={name || "—"} />
              <SumRow k="Unit" v={(unit || "—") + " · " + S.propName(prop)} />
              <SumRow k="Basic rent" v={S.peso(basic)} mono />
              <SumRow k="CUSA" v={cusaN ? S.peso(cusaN) : "—"} mono />
              <SumRow k="Rent-free" v={rentFreeMo ? rentFreeMo + " mo" : "None"} />
              <SumRow k="Escalation" v={escalationPct ? "+" + escalationPct + "%/yr" : "Fixed"} />
              <SumRow k={"Deposit (" + depositMo + " mo)"} v={S.peso(depositAmt)} mono />
              <SumRow k={"Advance (" + advanceMo + " mo)"} v={S.peso(advanceAmt)} mono />
            </div>
            {totalBox("Total monthly billing", S.peso(monthly))}
          </React.Fragment>
        )}
      </div>
    </Modal>
  );
}

Object.assign(window, { AddPropertyModal, AddTenantModal });
