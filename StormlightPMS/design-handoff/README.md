# Handoff: StormlightPMS — Lessor Web Dashboard

## Overview

StormlightPMS is a **property management system (PMS) for Filipino lessors** — landlords, condo owners, and small-portfolio property managers. The web dashboard lets a lessor collect rent, track tenants/units/leases, bill utilities, log maintenance, and read reports. Everything is built for Philippine realities: peso (₱) billing with tabular figures, GCash/Maya/Bank/Cash/PDC payment methods, barangay/city addresses, BIR-ready exports, VAT/non-VAT leases, and CUSA (common-area charges).

This bundle is the high-fidelity, interactive recreation of that dashboard. It is seeded with **real data from the "Vision Homes" operation** (a 3-floor commercial building in Las Piñas City, 15 units, 6 active leases, snapshot = April 2026). The numbers tie out arithmetically — keep them consistent if you reuse the seed.

The most recent work added a **commercial-lease terms system** (basic rent, CUSA, security deposit, advance rent applied to the last X months, rent-free/fit-out period, lease term, escalation clauses), a **lease timeline** visualization, **dashboard insight cards** (leases ending soon, receivables, escalations due, deposits held), and a **4-step Add-lease wizard**.

---

## About the Design Files

The files in `design_files/` are **design references created in HTML/React-via-Babel** — runnable prototypes that show the intended look, data model, and behavior. **They are not production code to copy directly.** They use in-browser Babel transpilation, global-scope component sharing, and inline styles — none of which you want in production.

Your task: **recreate these designs in the target codebase's environment**, using its established patterns and libraries. If there is no environment yet, pick an appropriate stack (the design maps most naturally to **React + TypeScript** with CSS variables or a CSS-in-JS/Tailwind setup, plus a charting approach for the simple bar/timeline visuals — all current charts are hand-built with divs, no chart library required).

To preview the reference: open `design_files/index.html` in a browser. It auto-fills the login; click **Sign in**. Toggle the **Tweaks** panel via the host toolbar (or it appears once signed in) to adjust the lease/receivables controls.

---

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, copy, and interactions are all specified. Recreate the UI pixel-faithfully using your codebase's libraries, then wire it to real data. All design tokens are in `design_files/colors_and_type.css` — port these verbatim.

---

## Tech & Architecture of the Reference (for orientation only)

- **React 18** (UMD) + **Babel standalone**, no build step. Each `<script type="text/babel">` file shares components by assigning them to `window` (e.g. `Object.assign(window, { Btn, Pill, ... })`). In production, use real modules/imports instead.
- **lucide** icon font for icons (`<Icon name="..."/>` wraps `data-lucide`). Use any icon library; names map 1:1 to lucide.
- **Google Fonts**: Spectral (display serif), Plus Jakarta Sans (UI sans), JetBrains Mono (numerals/money).
- **No router** — view state is a single `view` string in `App` (`app.jsx`). Replace with your router.
- **All data** is a synchronous in-memory module, `window.STORM` (`data.js`). In production this becomes your API/data layer. Every derived value (receivables, lease schedule, escalations, deposits) is a pure function there — they are good blueprints for backend/query logic.

### File map (`design_files/`)
| File | Contains |
|---|---|
| `index.html` | Page shell, font + token loading, script order, `#root` mount |
| `colors_and_type.css` | **All design tokens** (port verbatim) + semantic type classes |
| `data.js` | `window.STORM` — data model + every derived helper (lease terms, schedule, receivables, escalations, deposits) |
| `ui.jsx` | Primitive components: `Icon, Logo, Btn, Pill, Tag, Avatar, Card, StatCard, Field, Input, Select, Toggle, Segmented, Modal, Toast, PageHead, TimelineBar, TLLegend` |
| `shell.jsx` | `Sidebar`, `Topbar`, `LoginScreen` |
| `app.jsx` | `App` root — auth, view routing, modal/toast state, Tweaks wiring |
| `views1.jsx` | `DashboardView`, `RentView`, `SectionTitle` |
| `views2.jsx` | `PropertiesView`, `TenantsView`, `TenantDrawer`, `MaintenanceView`, `RecordPaymentModal` |
| `views3.jsx` | `ReportsView` (charts) |
| `property.jsx` | `PropertyDetailView` (floors → units grid) |
| `utilities.jsx` | `UtilitiesView` (electric + water billing) |
| `lease.jsx` | `LeaseDetailView`, `LeaseTimeline`, `TermGroup` |
| `forms.jsx` | `AddPropertyModal`, `AddTenantModal` (the 4-step Add-lease wizard) |
| `settings.jsx` | `SettingsView` (profile, billing, notifications) |
| `tweaks-panel.jsx` | Prototype-only tweak panel harness — **do not port**; it's a design-exploration tool |

---

## Screens / Views

### 1. Login (`shell.jsx` → `LoginScreen`)
- **Purpose**: Authenticate the lessor.
- **Layout**: Two-column split. **Left (≈48%)**: navy gradient panel (`linear-gradient(135deg, var(--navy-500), var(--navy-700))`) with the Stormlight logo (gold bolt + wordmark), a Spectral display headline ("Steady light through every storm."), a one-line subhead, and three inline stat figures (9/15 units, 85% collected, ₱284k contracted) in gold mono. **Right (≈52%)**: centered form, max-width ~380px — "Welcome back" (`.t-h1`), subtitle, Email field (prefilled `admin@visionhomes.ph`), Password field (prefilled dots), "Remember me" checkbox + "Forgot password?" gold link, full-width navy **Sign in** button, and a "New to StormlightPMS? Start free" line.
- **Behavior**: Any submit logs in (sets `authed = true`). No real validation.

### 2. App shell (`shell.jsx` → `Sidebar` + `Topbar`)
- **Sidebar** (fixed, 248px, `var(--bg-inverse)` navy, full height): logo at top; nav items (Dashboard, Properties, Tenants, Rent, Utilities, Maintenance, Reports); pinned to bottom — Settings, then a user card (avatar "OL", "Oli Laperal Jr." / "Vision Homes · 15 units") with a logout icon.
  - **Active nav item**: background `rgba(255,255,255,0.10)`, white text (weight 600), and a **gold left rail** (3px, `var(--gold-400)`, absolutely positioned). Inactive: `var(--navy-200)` text, weight 500. **Important**: apply the active background instantly (no CSS transition on it) — a transition here caused a stuck-highlight bug in the reference.
- **Topbar** (sticky, translucent white `rgba(255,255,255,0.82)` + `backdrop-filter: blur(10px)`, bottom border): left = search input ("Search tenants, units, invoices…"); right = "April 2026" date chip, a notification bell (with unread badge — give it an `aria-label`), and a primary **Record payment** button.

### 3. Dashboard (`views1.jsx` → `DashboardView`)
Greeting header ("Good morning, Oli" in Spectral) + subtitle, with **Export** (ghost) and **Record payment** (primary) actions.

- **KPI row** — 4 `StatCard`s: Collected · April (₱241,762.41, +85% of due), In arrears (₱25,574.07, 1 tenant), Occupancy (9/15, 60% leased), Contracted/mo (₱283,698.72, 6 leases). Each: icon chip (34px rounded, tinted bg), uppercase label, large mono value, trend badge.
- **Trend + Activity row** (1.55fr / 1fr): a 6-month **Collection trend** bar chart (last bar gold, others navy gradient; "due" shown as a light slate backing bar) + a **Recent activity** feed (icon-tagged events).
- **Insights row A** (1fr / 1fr) — *added feature*:
  - **Leases ending soon**: header "Next N days · count"; each row = avatar, name·unit, "Ends {date} · {floor}", a days-left `Pill` (red `overdue` ≤30d, gold `due` ≤60d, navy `occupied` otherwise), and a **Renew** button. Empty state with a check icon.
  - **Receivables**: header shows scope + tenant count and a large red total; rows = avatar, name·unit, a small "Rent ₱X · Util ₱Y" breakdown line (navy dot for rent, teal dot for util), and the per-tenant amount; footer "TOTAL OUTSTANDING" row on `var(--bg-subtle)`. Default total ₱59,751.33 across 3 tenants.
- **Insights row B** (1fr / 1fr) — *added feature*:
  - **Escalations due**: like "Leases ending soon" but for rent escalations — row shows "Effective {date} · on basic rent / rent + CUSA", a gold **+5%** badge, and the monthly peso delta in green (e.g. +₱1,316.58).
  - **Deposits & advances held**: header with portfolio total (₱1,134,261.78) and "Held in trust across 6 leases"; a horizontal **stacked split bar** (navy = deposits, teal = advances); two figures below (Security deposits ₱691,038.20, Advance rent ₱443,223.58 — each with a colored dot); a muted "Refundable at move-out, less any deductions." note with a shield icon.
- **Bottom row** (1fr / 1fr): **Needs attention** (overdue tenants with Remind) + **Due this week** (due/partial tenants with Record).

All four insight cards and both KPI/escalation deltas are driven by **Tweaks** (see below).

### 4. Properties (`views2.jsx` → `PropertiesView`) + Property detail (`property.jsx`)
- **List**: header "1 property · 15 units in Las Piñas City" + **Add property** button. One property card (Vision Homes): icon tile, name, address, type tag ("Commercial building") + floors tag, an occupancy progress bar (9/15, 60%), and a footer with Monthly (₱283,698.72) and Vacant (6 units). Card lifts on hover; click opens detail.
- **Detail**: Back link, then **floors → units** grid. Each floor is a row of unit cells; occupied cells show the tenant initials/avatar + rent, vacant cells are muted "Vacant". Clicking an occupied unit opens the **TenantDrawer**.

### 5. Tenants (`views2.jsx` → `TenantsView` + `TenantDrawer`) + Lease detail (`lease.jsx`)
- **List**: table (Tenant, Unit, Lease since, Phone, Monthly) with **Import** + **Add tenant** actions. Row click → `TenantDrawer` (right-side panel) with tenant summary, **Record payment**, and **View full lease**.
- **Lease detail** (`LeaseDetailView`) — *substantially expanded*:
  - **Header card**: navy gradient banner with avatar, name (Spectral 24px), location line, and **Record payment** (accent/gold) + **Send reminder** (secondary) buttons. Below: a 4-cell strip — Monthly rent, Status (Pill), Lease ends, Deposit held.
  - **Lease timeline card** (*new* — see "Lease timeline" section): a billing-mode chip + "{N}-month term", the horizontal timeline bar, start/end labels, and a legend.
  - **Lease terms card** (*regrouped*): four labeled groups —
    - **Commercials**: Floor area, Rate/m², **Basic rent**, **CUSA (common area)**, Parking, VAT.
    - **Term**: Lease start, Lease end, **Term length** (months), Tenant since.
    - **Deposits & advances**: **Security deposit (N mo)**, **Advance rent (N mo)**, Advance applied to ("Last N mo" or "Consumed"), Payment method.
    - **Concessions & escalation**: **Rent-free period** ("N mo (to {date})" or "None"), **Escalation** ("+N%/yr on basic rent" or "rent + CUSA", or "Fixed (none)"), **Next escalation** (date, only if applicable).
    - Footer: **Total monthly billing** highlighted box.
  - **Payment history** table, **Documents** list, **Notes** card (right column).

### 6. Rent collection (`views1.jsx` → `RentView`)
- Header with collected/due subtitle, **Send reminders** + **Record payment**. Filter tabs (All/Overdue/Due/Paid) + a **Filter** ghost button. Table: Unit/Tenant, Property, Rent, Method (Tag), Status (Pill + optional **rent-free / advance-covered** billing-mode badge), and a contextual action (Remind/Record/"Receipt sent").

### 7. Utilities (`utilities.jsx`), Maintenance (`views2.jsx`), Reports (`views3.jsx`), Settings (`settings.jsx`)
- **Utilities**: electric + water billed separately (account 407A). 3 StatCards + a per-unit charges table with Send bill / Record actions and a Paid/Billed/Not-billed Pill (Not-billed uses the **neutral** `vacant` pill, not red). Header: **Import readings**, **Send all bills**.
- **Maintenance**: 3-column kanban (Open / In progress / Resolved) of work-order tickets with priority dots. Header: **New work order**.
- **Reports**: period tabs (This month/Quarter/Year) + **Export for BIR**. 4 StatCards, a 6-month collection-rate bar chart, an **arrears aging** bar list, and an **income by floor** horizontal bar chart.
- **Settings**: tabs (Profile / Billing & plan / Notifications). Profile fields, plan/usage meter + invoice history, grouped notification toggles.

---

## The Lease Timeline (key new component — `ui.jsx` → `TimelineBar`, used by `lease.jsx` and `forms.jsx`)

A horizontal bar representing the full lease term (left = start, right = end) that renders every commercial-lease element at a glance. It is purely presentational and takes a `schedule` object (see `STORM.leaseSchedule` / `STORM.scheduleFrom`).

**Segments** (absolutely positioned by % of the term, each ~40px tall):
- **Rent-free** (fit-out): gold **diagonal-stripe** fill — `repeating-linear-gradient(135deg, var(--gold-200) 0–7px, var(--gold-100) 7–14px)`, text `var(--gold-800)`.
- **Standard billing**: navy gradient `linear-gradient(180deg, var(--navy-400), var(--navy-600))`, white text with subtle text-shadow.
- **Advance-covered** (last N months, prepaid): teal gradient `linear-gradient(180deg, var(--teal-400), var(--teal-600))`, white text.
- Each segment: `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.35)`; outer corners rounded 7px; label hidden when the segment is <14% wide.

**Markers** (overlaid):
- **Escalation**: a gold pill label ("+5%", or "+5% renewal" if it lands at term end) above a 2px gold vertical tick. Only shown when an escalation actually falls within the term window.
- **Today**: an 11px red dot (`var(--danger-500)`) with a white border, above a 2px red vertical line. Only shown when "today" is within the term.

**Below the bar**: start date (left) and end date (right) in `var(--fg-3)`, then a wrap-flex **legend** listing only the segments/markers actually present (Rent-free, Billing period, Advance-covered, Escalation, Today).

---

## The Add-lease Wizard (`forms.jsx` → `AddTenantModal`)

A 4-step modal (600px wide) inside the standard `Modal`. Top: a 4-segment **progress stepper** (each segment a 4px bar — gold if `index <= step`, muted otherwise — with a label below). Footer: "Step N of 4" on the left; **Cancel/Back** + **Continue/Add lease** on the right. **Continue is disabled until the step is valid.**

- **Step 1 — Tenant & space**: Tenant/business name, Mobile, Email, Property (select), Unit, Floor area. *Valid when name + property + unit are filled.*
- **Step 2 — Commercials & term**: Basic rent/mo (₱), CUSA/mo (₱), Parking/mo (₱, optional), VAT toggle, Lease start (date text), Term length (Segmented: 6/12/24/36 mo). Live "Total monthly billing" box. *Valid when basic rent > 0 and start parses.*
- **Step 3 — Concessions & deposits**: Rent-free period (Segmented 0–3 mo), Annual escalation (Segmented None/3%/5%/10%), Escalation applies to (Basic rent / Rent + CUSA), Security deposit (Segmented 1–3 mo), Advance rent — last months (Segmented 0–3 mo), Payment method (GCash/Maya/Bank/Cash). Two info chips show computed **Deposit held** and **Advance** amounts.
- **Step 4 — Review**: a **live timeline preview** (`TimelineBar` fed by the entered values) + a two-column summary (Tenant, Unit, Basic rent, CUSA, Rent-free, Escalation, Deposit (N mo), Advance (N mo)) + the Total monthly billing box. **Add lease** closes the modal and fires a confirmation toast.

**Derived math** (mirror in production):
- `deposit = depositMonths × basicRent`, `advance = advanceMonths × basicRent`.
- `end = start + termMonths`; `escalationNext = start + 12 months` (first anniversary) when escalation > 0.
- Preview schedule built from `{ startDate, endDate, rentFreeMonths, advanceMonths, escalationPct, escalationNext }`.

---

## Interactions & Behavior

- **Auth**: submit → `authed=true`; sidebar user-card logout → `authed=false`.
- **Navigation**: sidebar sets the `view` string; "lease" and "property" are sub-views that remember the selected entity. Active nav highlight must be **instant** (no transition).
- **Record payment** (`RecordPaymentModal`): pick an unpaid tenant (or pre-selected), edit amount, date, and **payment method** (PDC / BankTransfer / Cash / Other — segmented, PDC default). **Confirm payment** is disabled until a tenant is chosen; on confirm it marks the tenant paid (updates live KPIs + receivables), closes, and toasts "Payment recorded. Receipt sent to {first name}."
- **Reminders**: Remind/Send reminders → toast ("Reminder sent to {name}." / "Reminders sent to N tenants.").
- **Add property / Add tenant(lease)**: open their modals; confirm closes + toasts.
- **Toasts**: single bottom-center toast, auto-dismiss after 2.8s, fade/slide-up entrance. Header/secondary actions that aren't fully wired (Export, Import, Filter, New work order, Export for BIR, Import readings, Send all bills) each fire a short confirming toast — in production, wire these to real actions.
- **Hover**: cards lift (`translateY(-1px)` + `--shadow-md`); table rows tint to `--bg-subtle`; buttons darken per kind.
- **Charts/timeline**: static (no entrance animation required); all built with divs + percentage widths.

---

## State Management (reference shape)

In `App` (`app.jsx`):
- `authed` (bool), `view` (string route), `paid` (map of `tenantId → true` for payments recorded this session), modal flags (`payOpen`, `addProp`, `addTenant`, `drawer`, `lease`, `propDetail`), `payTenant`, `toast`, and the **Tweaks** object `t`.
- **Live derived values** recompute from `paid`: collected, collection rate, arrears, arrears count (`live` object passed to Dashboard/Rent). Receivables and KPIs update when a payment is recorded.

In production: replace `paid`-in-memory with server mutations; replace `STORM` getters with queries. The pure helpers in `data.js` (below) are the spec for that logic.

### Key derived helpers in `data.js` (port the logic, not the code)
- `leaseFor(tenant)` → structured lease: `basicRent, cusa, parking, vat, area, rate, start/end, termMonths, deposit{+months}, advance{+months, appliesTo:"last", consumed}, rentFreeMonths/Start/End, escalationPct/On/Next`.
- `leaseSchedule(tenant)` / `scheduleFrom(opts)` → timeline `{ segments[], markers[], todayPct, todayIn }`.
- `leasesEndingWithin(days)`, `escalationsWithin(days)` → sorted upcoming events (with peso deltas for escalations).
- `receivables(paidMap)` → `{ rows[], totalRental, totalUtility, total }`. **Advance-aware**: a tenant in their advance-covered tail is NOT dunned (excluded from rental receivable).
- `depositsHeld()` → `{ rows[], totalDeposit, totalAdvance, total }` (excludes consumed advances).
- `advanceCoversNow(t)`, `rentFreeNow(t)`, `billingStatusOf(t)` → current billing mode (`normal` / `rentfree` / `advance`) → drives status badges.
- Snapshot reference date is `asOf = 07 Apr 2026`; dates parse from "DD Mon YYYY" strings.

---

## Tweaks (prototype-only — do NOT ship the panel)

The reference exposes design controls via `tweaks-panel.jsx`. These are **not** product features — they're for exploring the new dashboard cards. The values they drive *are* real product concepts you should expose appropriately (settings, filters) in production:
- **Lease window** (slider, 30–180 days, default 90): horizon for "Leases ending soon" and "Escalations due".
- **Receivables scope** (Rental + utilities / Rental only / Utilities only).
- **Highlight urgent** (toggle): red emphasis on leases ≤30 days.
- **Show insights row** (toggle): show/hide the four insight cards.

---

## Design Tokens

Port `design_files/colors_and_type.css` **verbatim** (it's the single source of truth). Summary:

**Fonts**: Display serif = **Spectral**; UI sans = **Plus Jakarta Sans**; mono (money/figures) = **JetBrains Mono**. Money always uses `font-variant-numeric: tabular-nums`.

**Core palette** (raw scales 50→900): Navy (`--navy-500 #0B3D6B` base, the "storm"), Teal (`--teal-500 #1B9AAA` base, the "light"), Gold (`--gold-400 #F2C14E` base, the "bolt" — use sparingly), Slate cool neutrals (`#FFFFFF`→`#131820`). Status: Success `#1F9D64`, Warning `#D98324`, Danger `#D8453C` (each with -50/-100/-600/-700 variants).

**Semantic tokens** (use these, not raw scales): `--brand`=navy-500, `--accent`=gold-400 (`--accent-fg`=navy-900 for text on gold), `--secondary`=teal-500. Surfaces: `--bg-app` #F4F7FB, `--bg-surface` #FFF, `--bg-subtle`, `--bg-muted`, `--bg-inverse` navy-700 (sidebar). Text: `--fg-1` slate-900, `--fg-2` slate-600, `--fg-3` slate-400, `--fg-link` gold-700. Borders: `--border-subtle/–/-strong`, `--border-focus` gold-500. Status bg/fg pairs for pills.

**Radii**: xs 4 / sm 6 / md 8 / lg 12 (default card) / xl 16 / 2xl 24 / full 9999.

**Shadows** (navy-tinted, never pure black): xs→xl plus `--shadow-focus` (gold ring `0 0 0 3px rgba(224,169,47,0.34)`) and `--shadow-focus-danger`.

**Spacing** (4px base): 0,4,8,12,16,20,24,32,40,48,64,80 (`--space-1`…`--space-20`).

**Type scale**: display 56 / h1 40 / h2 30 / h3 24 / h4 19 / lg 18 / base 15 / sm 13 / xs 12 / 2xs 11. Line-heights tight 1.12 / snug 1.3 / normal 1.5 / relaxed 1.65. Weights 400/500/600/700. Tracking tight −0.02em → caps 0.08em. Semantic classes: `.t-display .t-h1 .t-h2 .t-h3 .t-h4 .t-body .t-body-strong .t-sm .t-overline .t-num .tnum`.

> Note: the reference UI often uses literal px values (13.5, 12.5, etc.) inline rather than the scale tokens. Prefer the **tokens** when you rebuild; treat the inline pixel values as the source of truth for exact sizing where they differ.

---

## Assets

- `design_files/assets/logo-mark.svg` — primary logo: navy gradient rounded tile + gold lightning bolt.
- `design_files/assets/logo-bolt.svg` — monochrome bolt (uses `currentColor`) for favicons/inline use.
- Icons: **lucide** (loaded from CDN in the reference). Names used include: `wallet, triangle-alert, building-2, file-text, bell, plus, arrow-left, arrow-right, check, circle-check, file-check, user, user-plus, user-check, phone, mail, map-pin, calendar, search, filter, upload, download, send, pencil, shield-check, receipt, droplet, zap, percent, trending-up, chart-no-axes-column, id-card, layout-grid, x`. Map to your icon library 1:1.
- Fonts: Google Fonts (Spectral, Plus Jakarta Sans, JetBrains Mono) — self-host in production if preferred.

---

## Files in this bundle

- `design_files/index.html` — open this to run the reference (click Sign in).
- `design_files/colors_and_type.css` — **port verbatim**.
- `design_files/*.jsx`, `design_files/data.js` — component + data references (see file map above).
- `design_files/assets/` — logos.
- `design_files/tweaks-panel.jsx` — prototype harness, **do not port**.

Build order suggestion: (1) tokens + primitives (`ui.jsx`), (2) shell + routing, (3) data layer from `data.js` helpers, (4) Dashboard + insight cards, (5) Lease detail + `TimelineBar`, (6) Add-lease wizard, (7) remaining views.
