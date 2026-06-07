# StormlightPMS — Lessor Dashboard UI Kit

An interactive, high-fidelity recreation of the **StormlightPMS web dashboard** —
the app a Filipino lessor uses to run their rentals. Built on the shared design
tokens in `colors_and_type.css`; navy primary, **gold accent**, teal secondary.

> **Note on provenance:** there was no production codebase or Figma to mirror, so
> this kit *defines* the dashboard from the brand brief rather than recreating an
> existing one. Treat it as the reference implementation.

## Run it
Open `index.html`. It boots to the **login screen**; sign in (the form is prefilled — just
click **Sign in**) to enter the dashboard. It's a click-through prototype, not production code:

- **Sidebar** — Dashboard, Properties, Tenants, Rent, **Utilities**, Maintenance, Reports.
- **Properties** → click the **Vision Homes** card to open the building detail: **floors → units** grid (occupied units show tenant + status; vacant units are striped). Click an occupied unit to open its tenant.
- **Utilities** — electric & water billed separately (acct 407A); Send bill / Record per unit.
- **Record payment** (top bar, dashboard, or any due/overdue row) → opens the payment modal → confirm → row flips to **Paid**, receipt toast fires.
- **Send reminder** on overdue tenants → confirmation toast.
- **Tenants** → click a row to open the tenant detail drawer.
- **Tenants** → click a row to open the tenant detail drawer → **View full lease** opens the full lease page (terms, payment history, documents, notes).
- **Add property** / **Add tenant** — the primary buttons on Properties and Tenants open multi-field modals (peso amounts, barangay/city, GCash/Maya, lease term).
- **Settings** (sidebar footer) — Profile, Billing & plan (Stormlight Pro, usage meter, GCash method, invoice history), Notifications (grouped toggles).
- **Sign out** — the user card at the bottom of the sidebar returns to the **login screen**.

## Files

| File | What's inside |
|---|---|
| `index.html` | Entry point. Loads React 18 + Babel + Lucide, then the scripts below, mounts `<App/>`. |
| `data.js` | **Real Vision Homes data** — a 3-floor commercial building in Las Piñas (Arte Manila Salon, Grace Life Fellowship, Bright Discovery, GMMK, Smarter Minds, Dr. Chua) with actual per-sqm rates, association dues, parking, VAT status, and the 2023–2025 collection history. Modelled from the client's receipts + areas/rates workbooks. `window.STORM`. |
| `ui.jsx` | Primitives: `Icon`, `Logo`, `Btn`, `Pill`, `Tag`, `Avatar`, `Card`, `StatCard`, `Field`, `Input`, `Select`, `Toggle`, `Segmented`, `Modal`, `Toast`, `PageHead`. |
| `shell.jsx` | `Sidebar`, `Topbar`, `LoginScreen`. |
| `views1.jsx` | `DashboardView` (KPIs, collection-trend bar chart, activity feed, attention/due lists), `RentView` (rent-roll table with filter tabs). |
| `views2.jsx` | `PropertiesView` (building cards), `TenantsView` + `TenantDrawer`, `MaintenanceView`, `RecordPaymentModal`. |
| `property.jsx` | `PropertyDetailView` — a building's **floors → units** grid (the Property → Floor → Unit → Tenant hierarchy). |
| `utilities.jsx` | `UtilitiesView` — electric & water billing, separate from rent (account 407A). |
| `views3.jsx` | `ReportsView` — collection-rate trend, arrears aging buckets, income by property, BIR-ready export. |
| `forms.jsx` | `AddPropertyModal`, `AddTenantModal` — multi-field create flows. |
| `lease.jsx` | `LeaseDetailView` — full lease page: terms, payment history, documents, notes. |
| `settings.jsx` | `SettingsView` — Profile / Billing & plan / Notifications tabs. |
| `app.jsx` | `App` root — auth, routing, modal/drawer/toast state. |

## Conventions used here

- **Icons:** Lucide, 1.75 stroke, via the `<Icon name="…"/>` wrapper.
- **Money:** always `window.STORM.peso(n)` → `₱18,500.00`, rendered in JetBrains Mono with `tabular-nums`.
- **Components share scope** via `Object.assign(window, {…})` at the bottom of each
  babel file (each `<script type="text/babel">` is isolated, so globals are the bridge).
- **Accent = gold:** selected nav rail, focus rings, links, current-period chart bar,
  accent buttons (gold fill + navy text). Primary actions stay navy.

## Reuse
Lift any component into a new artifact by copying the JSX file + `colors_and_type.css`
+ `assets/`, or copy a single component's function. Keep the `window` export pattern
if you load it as a separate babel script.
