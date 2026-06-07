/* StormlightPMS UI kit — data modelled on the REAL Vision Homes operation.
   Source: VHI Receipts + "Vision Homes — Areas & Rates as per contract" (Apr 2026).

   HIERARCHY:  Property (building) → Floors → Units → Tenant
   Vision Homes is one commercial building; the model supports many properties,
   each with one or more floors, each floor with units, each unit a tenant or vacant.
   Current snapshot = April 2026. */
window.STORM = (function () {
  const peso = (n) =>
    "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pesoK = (n) => "₱" + Number(n).toLocaleString("en-PH");

  // ---- Properties (buildings) ----
  const properties = [
    {
      id: "vh",
      name: "Vision Homes",
      kind: "Commercial building",
      addr: "Block 15, Lot 1 & 2, J.B. Tan Ave / Estanislao St.",
      brgy: "BF Resort Village, Talon Dos",
      city: "Las Piñas City",
      floors: ["Ground", "Second", "Third"],
    },
  ];

  // ---- Tenants (current contracts, Apr 2026). rent = rental + dues + parking ----
  // util = monthly electric + water (billed separately, account 407A on the receipts).
  const tenants = [
    {
      id: "t-arte", name: "Arte Manila Salon", initials: "AM", prop: "vh", floor: "Ground", room: "101–103",
      area: 236, rate: "Packaged", vat: false,
      rental: 138506, dues: 0, parking: 0, rent: 138506,
      elec: 17480.25, water: 1920.5,
      status: "paid", method: "Bank", since: "Aug 2024", overdueDays: 0,
      phone: "+63 2 8816 3737", term: { start: "01 Aug 2025", end: "31 Jul 2026" },
      note: "Packaged rate covers rooms 101–103 + 2 assigned parking.",
    },
    {
      id: "t-gmmk", name: "GMMK Enterprise Inc.", initials: "GM", prop: "vh", floor: "Ground", room: "105",
      area: 47.87, rate: "₱450.00/sqm", vat: true,
      rental: 24126.48, dues: 1447.59, parking: 0, rent: 25574.07,
      elec: 3881.79, water: 612.4,
      status: "overdue", method: "Bank", since: "Dec 2024", overdueDays: 9,
      phone: "+63 2 8816 3737", term: { start: "01 Dec 2024", end: "30 Apr 2026" },
      note: "On a 5-month extension ending 30 Apr 2026.",
    },
    {
      id: "t-grace", name: "Grace Life Fellowship", initials: "GL", prop: "vh", floor: "Second", room: "201 & 203",
      area: 82.46, rate: "₱496.13/sqm", vat: true,
      rental: 45818.62, dues: 2678.23, parking: 0, rent: 48496.85,
      elec: 7960.0, water: 1185.25,
      status: "paid", method: "Bank", since: "Aug 2023", overdueDays: 0,
      phone: "+63 2 8816 3737", term: { start: "01 Aug 2025", end: "31 Jul 2026" },
      note: "Also occupies 203 (no rental fee).",
    },
    {
      id: "t-bright", name: "Bright Discovery Child Development", initials: "BD", prop: "vh", floor: "Second", room: "202",
      area: 60.28, rate: "₱441.00/sqm", vat: false,
      rental: 26331.6, dues: 1748.12, parking: 6615, rent: 34694.72,
      elec: 8814.54, water: 1102.0,
      status: "paid", method: "Bank", since: "Apr 2023", overdueDays: 0,
      phone: "+63 2 8816 3737", term: { start: "01 Jul 2025", end: "30 Jun 2026" },
      note: "Non-VAT. 2 paid parking @ ₱3,307.50 each.",
    },
    {
      id: "t-smart", name: "Smarter Minds", initials: "SM", prop: "vh", floor: "Third", room: "304",
      area: 47.52, rate: "₱350.00/sqm", vat: true,
      rental: 18627.84, dues: 1437, parking: 0, rent: 20064.84,
      elec: 2480.0, water: 410.75,
      status: "paid", method: "GCash", since: "Dec 2024", overdueDays: 0,
      phone: "+63 2 8816 3737", term: { start: "08 Dec 2024", end: "07 Dec 2026" },
      note: "2-year contract at a fixed rate.",
    },
    {
      id: "t-chua", name: "Dr. Chua Dental Clinic", initials: "DC", prop: "vh", floor: "Third", room: "305",
      area: 41.86, rate: "₱325.00/sqm", vat: true,
      rental: 15237.04, dues: 1125.2, parking: 0, rent: 16362.24,
      elec: 2805.79, water: 598.5,
      status: "due", method: "Maya", since: "Aug 2023", overdueDays: 0,
      phone: "+63 2 8816 3737", term: { start: "01 Aug 2025", end: "31 Jul 2026" },
      note: "",
    },
  ];
  tenants.forEach((t) => { t.unit = t.room; t.util = Math.round((t.elec + t.water) * 100) / 100; });

  // ---- Units (the building's rooms). tenantId = null means vacant. ----
  const units = [
    { id: "u101", prop: "vh", floor: "Ground", room: "101", area: 71.19, tenantId: "t-arte" },
    { id: "u102", prop: "vh", floor: "Ground", room: "102", area: 79.63, tenantId: "t-arte" },
    { id: "u103", prop: "vh", floor: "Ground", room: "103", area: 85.54, tenantId: "t-arte" },
    { id: "u104", prop: "vh", floor: "Ground", room: "104", area: 47.52, tenantId: null },
    { id: "u105", prop: "vh", floor: "Ground", room: "105", area: 47.87, tenantId: "t-gmmk" },
    { id: "u201", prop: "vh", floor: "Second", room: "201", area: 82.46, tenantId: "t-grace" },
    { id: "u202", prop: "vh", floor: "Second", room: "202", area: 60.28, tenantId: "t-bright" },
    { id: "u203", prop: "vh", floor: "Second", room: "203", area: 59.01, tenantId: "t-grace" },
    { id: "u204", prop: "vh", floor: "Second", room: "204", area: 47.52, tenantId: null },
    { id: "u205", prop: "vh", floor: "Second", room: "205", area: 41.86, tenantId: null },
    { id: "u301", prop: "vh", floor: "Third", room: "301", area: 83.59, tenantId: null },
    { id: "u302", prop: "vh", floor: "Third", room: "302", area: 60.28, tenantId: null },
    { id: "u303", prop: "vh", floor: "Third", room: "303", area: 59.01, tenantId: null },
    { id: "u304", prop: "vh", floor: "Third", room: "304", area: 47.52, tenantId: "t-smart" },
    { id: "u305", prop: "vh", floor: "Third", room: "305", area: 41.86, tenantId: "t-chua" },
  ];

  // ---- Lookups & derived helpers ----
  const tenantById = (id) => tenants.find((t) => t.id === id) || null;
  const propById = (id) => properties.find((p) => p.id === id) || {};
  const propName = (id) => (propById(id).name) || "";
  const propAddr = (id) => { const p = propById(id); return (p.brgy || "") + ", " + (p.city || ""); };
  const floorName = (t) => (t.floor ? t.floor + " Floor" : "");
  const unitsOf = (propId) => units.filter((u) => u.prop === propId);
  const tenantsOf = (propId) => tenants.filter((t) => t.prop === propId);

  // Floor breakdown for a property: [{ name, units[], occupied, count, monthly }]
  const floorsOf = (propId) => {
    const p = propById(propId);
    return (p.floors || []).map((fname) => {
      const fUnits = units.filter((u) => u.prop === propId && u.floor === fname);
      const occupied = fUnits.filter((u) => u.tenantId).length;
      const fTenants = tenants.filter((t) => t.prop === propId && t.floor === fname);
      const monthly = fTenants.reduce((a, t) => a + t.rent, 0);
      return { name: fname, units: fUnits, occupied, count: fUnits.length, monthly };
    });
  };

  // Property roll-up stats
  const statsOf = (propId) => {
    const u = unitsOf(propId);
    const occupied = u.filter((x) => x.tenantId).length;
    const monthly = tenantsOf(propId).reduce((a, t) => a + t.rent, 0);
    return { units: u.length, occupied, vacant: u.length - occupied, monthly, floors: (propById(propId).floors || []).length };
  };

  // ---- Maintenance tickets ----
  const tickets = [
    { id: "wo-061", title: "Aircon not cooling — main hall", unit: "201", floor: "Second", tenant: "Grace Life Fellowship", priority: "high", status: "in_progress", age: "1d ago" },
    { id: "wo-060", title: "Leaking faucet in comfort room", unit: "305", floor: "Third", tenant: "Dr. Chua Dental Clinic", priority: "medium", status: "open", age: "3h ago" },
    { id: "wo-059", title: "Parking gate remote not working", unit: "202", floor: "Second", tenant: "Bright Discovery Child Development", priority: "low", status: "open", age: "2d ago" },
    { id: "wo-058", title: "Mount exterior signage", unit: "105", floor: "Ground", tenant: "GMMK Enterprise Inc.", priority: "low", status: "in_progress", age: "4d ago" },
    { id: "wo-057", title: "Repaint vacant unit before turnover", unit: "301", floor: "Third", tenant: "Vacant", priority: "low", status: "resolved", age: "1w ago" },
  ];

  const activity = [
    { who: "Grace Life Fellowship", what: "paid ₱48,496.85 via bank transfer", when: "10:24 AM", kind: "payment" },
    { who: "Bright Discovery", what: "paid ₱34,694.72 via bank transfer", when: "Yesterday", kind: "payment" },
    { who: "GMMK Enterprise", what: "reminder sent — overdue 9 days", when: "Yesterday", kind: "reminder" },
    { who: "Smarter Minds", what: "paid ₱20,064.84 via GCash", when: "Mon", kind: "payment" },
    { who: "Dr. Chua", what: "lease renewed to 31 Jul 2026", when: "02 Apr", kind: "lease" },
  ];

  // 6-month collection trend ending Apr 2026 (₱ thousands). Monthly contracted ≈ ₱284k.
  const trend = [
    { m: "Nov", collected: 270, due: 284 },
    { m: "Dec", collected: 284, due: 284 },
    { m: "Jan", collected: 281, due: 284 },
    { m: "Feb", collected: 277, due: 284 },
    { m: "Mar", collected: 284, due: 284 },
    { m: "Apr", collected: 242, due: 284 },
  ];

  // Real year-end collection totals from the receipts ledger.
  const annual = [
    { year: "2023", amount: 1839753.98 },
    { year: "2024", amount: 5275377.8 },
    { year: "2025", amount: 3860311.49 },
  ];

  const utilTotal = tenants.reduce((a, t) => a + t.util, 0);
  const utilPeriod = "16 Mar – 15 Apr 2026";

  // collected = rent actually received (PAID tenants only). Due (Dr. Chua) and
  // overdue (GMMK) are still outstanding, so they are NOT in collected.
  const totals = {
    collected: 241762.41,
    due: 283698.72,
    rate: 85,
    units: 15,
    occupied: 9,
    vacant: 6,
    arrears: 25574.07,
    monthly: 283698.72,
    utilTotal,
  };

  // ---- Lease expiry & receivables (snapshot reference: 07 Apr 2026) ----
  const asOf = new Date(2026, 3, 7);
  const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const parseDate = (s) => { const [d, m, y] = s.split(" "); return new Date(+y, MONTHS[m], +d); };
  const daysUntil = (s) => Math.round((parseDate(s) - asOf) / 86400000);

  // Tenants whose lease ends within `days` of the snapshot, soonest first.
  const leasesEndingWithin = (days) =>
    tenants
      .map((t) => ({ t, end: t.term.end, days: daysUntil(t.term.end) }))
      .filter((x) => x.days >= 0 && x.days <= days)
      .sort((a, b) => a.days - b.days);

  // Utility billing snapshot (mirrors the Utilities view seed): paid = settled,
  // billed = sent but unpaid, pending = not yet billed. Anything not paid is owed.
  const utilBilling = { "t-arte": "paid", "t-gmmk": "pending", "t-grace": "paid", "t-bright": "billed", "t-smart": "paid", "t-chua": "billed" };

  // Outstanding receivables per tenant — rental + utilities. paidMap = App's live
  // rental-paid map (optional) so recording a payment removes it from the list.
  const receivables = (paidMap = {}) => {
    const rows = tenants
      .map((t) => {
        const rental = !paidMap[t.id] && !advanceCoversNow(t) && (t.status === "overdue" || t.status === "due" || t.status === "partial") ? t.rent : 0;
        const utility = utilBilling[t.id] !== "paid" ? t.util : 0;
        return { t, rental, utility, total: rental + utility };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
    const totalRental = rows.reduce((a, r) => a + r.rental, 0);
    const totalUtility = rows.reduce((a, r) => a + r.utility, 0);
    return { rows, totalRental, totalUtility, total: totalRental + totalUtility };
  };

  // ============================================================
  //  LEASE TERMS — structured commercial-lease terms per tenant.
  //  Amounts (deposit/advance) derive from months × basic rent.
  //  depositMo / advanceMo = # months; rentFreeMo = fit-out months
  //  at lease start; escalationPct = annual %, escalationNext = the
  //  date the next step takes effect (renewal or anniversary).
  // ============================================================
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (d) => String(d.getDate()).padStart(2, "0") + " " + MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
  const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
  const monthsBetween = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());

  const LEASE_TERMS = {
    "t-arte":   { depositMo: 3, advanceMo: 2, rentFreeMo: 1, escalationPct: 5, escalationOn: "basic",      escalationNext: "01 Aug 2026" },
    "t-gmmk":   { depositMo: 2, advanceMo: 1, rentFreeMo: 0, escalationPct: 5, escalationOn: "basic",      escalationNext: null, advanceConsumed: true },
    "t-grace":  { depositMo: 2, advanceMo: 1, rentFreeMo: 0, escalationPct: 4, escalationOn: "basic+cusa", escalationNext: "01 Aug 2026" },
    "t-bright": { depositMo: 2, advanceMo: 2, rentFreeMo: 1, escalationPct: 5, escalationOn: "basic",      escalationNext: "01 Jul 2026" },
    "t-smart":  { depositMo: 2, advanceMo: 2, rentFreeMo: 1, escalationPct: 0, escalationOn: "basic",      escalationNext: null },
    "t-chua":   { depositMo: 3, advanceMo: 2, rentFreeMo: 0, escalationPct: 5, escalationOn: "basic",      escalationNext: "01 Aug 2026" },
  };
  const termsOf = (t) => LEASE_TERMS[t.id] || { depositMo: 2, advanceMo: 1, rentFreeMo: 0, escalationPct: 0, escalationOn: "basic", escalationNext: null };

  const leaseFor = (t) => {
    const lt = termsOf(t);
    const startDate = parseDate(t.term.start);
    const endDate = parseDate(t.term.end);
    const termMonths = Math.max(1, Math.round((endDate - startDate) / (30.4375 * 86400000)));
    const r2 = (n) => Math.round(n * 100) / 100;
    return {
      start: t.term.start, end: t.term.end, startDate, endDate, termMonths,
      basicRent: t.rental, cusa: t.dues, parking: t.parking, vat: t.vat, area: t.area, rate: t.rate,
      deposit: r2(lt.depositMo * t.rental), depositMonths: lt.depositMo,
      advance: r2(lt.advanceMo * t.rental), advanceMonths: lt.advanceMo, advanceAppliesTo: "last", advanceConsumed: !!lt.advanceConsumed,
      rentFreeMonths: lt.rentFreeMo, rentFreeStart: t.term.start, rentFreeEnd: fmtDate(addMonths(startDate, lt.rentFreeMo)),
      escalationPct: lt.escalationPct, escalationOn: lt.escalationOn, escalationNext: lt.escalationNext,
      rental: t.rental, dues: t.dues,
    };
  };

  // Whether the snapshot month is inside the lease's advance-covered tail.
  const advanceCoversNow = (t) => {
    const L = leaseFor(t);
    if (!L.advanceMonths || L.advanceConsumed) return false;
    const advStart = addMonths(L.endDate, -L.advanceMonths);
    return asOf >= advStart && asOf <= L.endDate;
  };

  // Whether the snapshot month is inside the lease's rent-free window.
  const rentFreeNow = (t) => {
    const L = leaseFor(t);
    if (!L.rentFreeMonths) return false;
    return asOf >= L.startDate && asOf < addMonths(L.startDate, L.rentFreeMonths);
  };

  // Current billing mode for a tenant at the snapshot date. During rent-free the
  // monthly invoice waives basic rent; during the advance tail it's prepaid, so
  // neither should be dunned as a receivable.
  const billingStatusOf = (t) => {
    if (rentFreeNow(t)) return { mode: "rentfree", label: "Rent-free", color: "var(--gold-700)", bg: "var(--gold-100)", border: "var(--gold-300)" };
    if (advanceCoversNow(t)) return { mode: "advance", label: "Advance-covered", color: "var(--teal-700)", bg: "var(--teal-50)", border: "var(--teal-200)" };
    return { mode: "normal", label: "Standard billing", color: "var(--fg-2)", bg: "var(--bg-muted)", border: "var(--border)" };
  };

  // Timeline segments + markers from raw lease parameters (reusable by the
  // lease detail AND the add-lease wizard preview).
  const scheduleFrom = ({ startDate, endDate, rentFreeMonths = 0, advanceMonths = 0, advanceConsumed = false, escalationPct = 0, escalationNext = null }) => {
    const start = startDate, end = endDate;
    const total = (end - start) || 1;
    const pct = (d) => Math.max(0, Math.min(100, ((d - start) / total) * 100));
    const segments = [];
    let cursor = start;
    if (rentFreeMonths > 0) {
      const rfEnd = addMonths(start, rentFreeMonths);
      segments.push({ kind: "rentFree", fromPct: pct(start), toPct: pct(rfEnd), label: rentFreeMonths + "-mo rent-free" });
      cursor = rfEnd;
    }
    const advStart = (advanceMonths > 0 && !advanceConsumed) ? addMonths(end, -advanceMonths) : end;
    segments.push({ kind: "standard", fromPct: pct(cursor), toPct: pct(advStart), label: "Billing" });
    if (advanceMonths > 0 && !advanceConsumed) {
      segments.push({ kind: "advance", fromPct: pct(advStart), toPct: pct(end), label: advanceMonths + "-mo advance" });
    }
    const markers = [];
    if (escalationNext && escalationPct > 0) {
      const ed = (typeof escalationNext === "string") ? parseDate(escalationNext) : escalationNext;
      if (ed >= start && (ed - end) <= 62 * 86400000) {
        markers.push({ kind: "escalation", date: fmtDate(ed), pct: pct(ed), atRenewal: ed >= end, label: "+" + escalationPct + "%" });
      }
    }
    const todayIn = asOf >= start && asOf <= end;
    return { segments, markers, todayPct: pct(asOf), todayIn };
  };

  // Timeline segments + markers for the lease-term bar.
  const leaseSchedule = (t) => {
    const L = leaseFor(t);
    const r = scheduleFrom({ startDate: L.startDate, endDate: L.endDate, rentFreeMonths: L.rentFreeMonths, advanceMonths: L.advanceMonths, advanceConsumed: L.advanceConsumed, escalationPct: L.escalationPct, escalationNext: L.escalationNext });
    return { start: L.start, end: L.end, termMonths: L.termMonths, ...r };
  };

  // Upcoming escalation events within `days` of the snapshot.
  const escalationsWithin = (days) =>
    tenants
      .map((t) => { const L = leaseFor(t); return { t, next: L.escalationNext, pct: L.escalationPct, on: L.escalationOn, basic: L.basicRent }; })
      .filter((x) => x.next && x.pct > 0)
      .map((x) => ({ ...x, days: daysUntil(x.next), delta: Math.round(x.basic * x.pct) / 100 }))
      .filter((x) => x.days >= 0 && x.days <= days)
      .sort((a, b) => a.days - b.days);

  // Portfolio deposits & advances currently held (the lessor's liability).
  const depositsHeld = () => {
    const rows = tenants.map((t) => {
      const L = leaseFor(t);
      const advance = L.advanceConsumed ? 0 : L.advance;
      return { t, deposit: L.deposit, depositMonths: L.depositMonths, advance, advanceMonths: L.advanceConsumed ? 0 : L.advanceMonths };
    });
    const totalDeposit = rows.reduce((a, r) => a + r.deposit, 0);
    const totalAdvance = rows.reduce((a, r) => a + r.advance, 0);
    return { rows, totalDeposit, totalAdvance, total: totalDeposit + totalAdvance };
  };

  const paymentHistory = (t) => {
    const months = ["Mar 2026", "Feb 2026", "Jan 2026", "Dec 2025", "Nov 2025", "Oct 2025"];
    return months.map((m, i) => ({
      ref: "OR-00" + (309 - i * 11), period: m,
      date: (i === 0 ? "03" : "02") + " " + m, amount: t.rent, method: t.method, status: "paid",
    }));
  };

  const documents = [
    { name: "Lease contract.pdf", size: "262 KB", kind: "contract", date: "01 Aug 2025" },
    { name: "BIR 2303 registration.pdf", size: "188 KB", kind: "clearance", date: "01 Aug 2025" },
    { name: "Official receipt — Mar.pdf", size: "92 KB", kind: "receipt", date: "03 Mar 2026" },
    { name: "Business permit.jpg", size: "1.1 MB", kind: "id", date: "12 Jan 2026" },
  ];

  const billing = {
    plan: "Stormlight Pro", price: 1490, cycle: "month", unitsUsed: 15, unitsCap: 50,
    method: { type: "GCash", detail: "0917 ••• 0143" }, nextDate: "01 May 2026",
    history: [
      { ref: "INV-2026-04", date: "01 Apr 2026", amount: 1490, status: "paid" },
      { ref: "INV-2026-03", date: "01 Mar 2026", amount: 1490, status: "paid" },
      { ref: "INV-2026-02", date: "01 Feb 2026", amount: 1490, status: "paid" },
      { ref: "INV-2026-01", date: "01 Jan 2026", amount: 1490, status: "paid" },
    ],
  };

  const owner = {
    name: "Oli Laperal Jr.", email: "admin@visionhomes.ph", phone: "+63 2 8816 3737",
    business: "Vision Homes", tin: "284-991-002-000", initials: "OL",
  };

  return {
    peso, pesoK, properties, units, tenants, tickets, activity, trend, annual, totals,
    tenantById, propById, propName, propAddr, floorName, unitsOf, tenantsOf, floorsOf, statsOf,
    leaseFor, paymentHistory, documents, billing, owner, utilPeriod,
    asOf, daysUntil, leasesEndingWithin, utilBilling, receivables,
    leaseSchedule, scheduleFrom, escalationsWithin, depositsHeld, advanceCoversNow, rentFreeNow, billingStatusOf, parseDate, fmtDate, addMonths, monthsBetween,
  };
})();
