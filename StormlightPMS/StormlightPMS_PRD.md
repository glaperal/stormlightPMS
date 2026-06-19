# StormlightPMS — Product Requirements Document (PRD)

| Field | Value |
|-------|-------|
| Product | StormlightPMS — Stormlight Property Management System |
| Document | Product Requirements Document |
| Version | **0.4** — authored fresh to match SRS v0.4 (Supabase/SPA architecture; D6/CWT deferred) |
| Date | 2026-06-19 |
| Owner | GVL (Gerardo V. Laperal) |
| Operating entity | Stormlight Inc. (platform operator / superAdmin) |
| Companion document | `StormlightPMS_SRS.md` (v0.4 — the build contract; this PRD is the rationale) |
| Audience | GVL / stakeholders, and the implementing developer(s) for context |
| Status | Draft — pending sign-off |

> **Lineage note.** This PRD replaces the Knack-era "v4.0" PRD/SRS, which described a different architecture (Knack low-code, a Recurring-Charges billing engine, five roles, hospitality bookings). That document is retired. The problem statement, KPIs, and core workflows below are carried forward where still valid; the Knack architecture and its automated-billing hero feature are not. PRD and SRS now share a synchronized version line; **v1.0 is reserved for the first production-deployed release.**

---

## 1. Executive summary

StormlightPMS is a secure, multi-tenant web application that gives Filipino landlords and their property managers a single source of truth for a mixed-asset real-estate portfolio — replacing fragmented spreadsheets with one system for properties, units, tenants, leases, charges, payments, deposits, post-dated checks, utility sub-metering, maintenance, documents, and reporting.

Its core value is not flashy automation; it is **financial integrity you can trust**. Every peso of every payment is reconciled against a charge by database-enforced rules — allocations can never exceed what is owed, paid charges cannot be silently edited, and every financial mutation is written to an immutable audit log. On top of that integrity layer sit the day-to-day conveniences Philippine lessors actually need: a post-dated-check vault, utility sub-metering with common-area variance surfaced for review, automated rent-due and lease-expiry reminders, and a two-stage move-out settlement.

The product is built on Supabase (Postgres + RLS + Auth + Storage + Edge Functions) with a Vite/React single-page front end. Tenancy isolation and role-based access are enforced at the database row level, not in application code.

---

## 2. The problem

Filipino landlords managing more than a handful of units hit the same friction, and it compounds across a mixed portfolio:

| Pain point | What it looks like today |
|------------|--------------------------|
| **Fragmented records** | Tenants, leases, payments, and balances live across multiple spreadsheets and chat threads; no single place shows what a tenant owes right now. |
| **Reconciliation errors** | Manually matching payments to bills is slow and error-prone; partial and split payments are especially fragile in spreadsheets. |
| **No real-time financial picture** | Producing a rent roll, an arrears-aging report, or "who is overdue today" is a manual, after-the-fact exercise. |
| **Post-dated checks are managed on paper** | Commercial and many residential tenants pay by PDC; landlords track maturity dates in notebooks and miss deposits or chase stale checks. |
| **Utility apportionment is manual** | A single Meralco/Maynilad master bill must be split across sub-metered units every month, with common-area loss handled by hand. |
| **Move-out disputes** | Deposit refunds, deductions for damages/unpaid utilities, and shortfall billing are computed ad hoc, inviting disputes. |
| **No access control** | Spreadsheets can't restrict a property manager to only their assigned properties, or segregate one landlord's data from another's. |

StormlightPMS targets every one of these directly.

---

## 3. Scope

### 3.1 In scope (MVP — v0.4)

| Area | Capability |
|------|-----------|
| Multi-tenancy & access | One org per landlord; three roles (superAdmin / Admin / Property_Manager); database-enforced data isolation and per-property scoping for PMs |
| Portfolio | Properties (Philippine address structure), units with optional asset-class `specs`, tenants |
| Leases | Draft → active → renew / terminate / expire lifecycle; advance & deposit fields; escalation stored for reference |
| Money | Charges; payments with split/partial allocation; unapplied credit; void-and-reissue; a live per-lease ledger |
| Post-dated checks | A PDC vault with status lifecycle, bulk status updates, clear→payment, bounce→void, and a stale-check sweep |
| Utilities | Master utility bill + per-lease sub-meter readings; idempotent charge generation; common-area variance surfaced |
| Deposits | Two-stage move-out: vacate, then itemized-deduction settlement with refund or shortfall charge |
| Maintenance | A per-unit maintenance log |
| Documents | Private file storage attached to any record, served via signed URLs |
| Notifications | Rent-due, overdue, and lease-expiry reminders (in-app + email), idempotent |
| Reporting | Dashboard, rent roll, arrears aging, collection summary, per-property income, PDC maturity — all CSV-exportable |
| Data import | Scoped CSV import for the four structural entities |

### 3.2 Out of scope / deferred

| Item | Disposition |
|------|-------------|
| **CWT / BIR Form 2307 tracking + escrow** (former D6) | **Deferred to v-next.** Withholding split, `pending_form_2307` escrow, Form 2307 upload, CWT-receivable report. Re-adding is a clean additive change. *Tracking* the withholding — not OR issuance. |
| **Automated / scheduled recurring billing** | Roadmap (v2). The MVP uses manual copy-forward of a previous period's charges. |
| **Automatic rent escalation** | Roadmap (v2). Escalation rate/frequency are stored for reference only; no automatic rent change. |
| **Tenant / guest self-service portal** | Roadmap (v2). |
| **Hospitality / short-term bookings + channel manager** (Airbnb/Booking.com) | Longer-term. No hospitality module or role in the MVP. |
| **Accounting integration** (e.g. Xero/QuickBooks) | Out — not planned. |
| **BIR official receipt / OR issuance and return filing** | Out (v3). |
| **Payment gateway, SMS/Viber, landlord self-sign-up & subscription billing, co-tenants, native mobile apps** | Out / later. |

---

## 4. Target users & roles

| Role | Who | Access |
|------|-----|--------|
| **superAdmin** | Stormlight Inc. (platform operator) | All organizations; provisions orgs and their first Admin; can suspend/reactivate orgs. Cross-org. |
| **Admin** | The landlord (org owner) | Full CRUD across their own org; invites and manages Property_Managers; assigns PMs to properties. |
| **Property_Manager (PM)** | Operational staff | Scoped to assigned properties only. Manages those leases, charges, payments, PDCs, utilities, and maintenance. Can read/create tenants org-wide (MVP simplification). |

Tenants are data records, not users — there is no tenant login in the MVP. There are no separate Hospitality or Maintenance Staff roles (maintenance assignment is a free-text field).

---

## 5. Core user workflows

### Workflow 1 — Portfolio command center (dashboard)
The first screen a manager sees. At-a-glance occupancy (occupied vs vacant), total outstanding arrears, and charges due in the next 7 days — all scoped to what the user is allowed to see. It funnels the user toward overdue accounts and maturing checks.

### Workflow 2 — Lease onboarding
Create a tenant and a lease against a vacant unit, capturing term, monthly rent, due day, advance, and deposit. The lease starts as `draft`; activating it marks the unit `occupied` and is the moment the unit's lifecycle becomes lease-driven. Escalation terms are recorded for reference (no automation in the MVP).

### Workflow 3 — Billing & the per-lease ledger
The manager raises charges on a lease (rent, utilities, dues, parking, penalty, other). For a new month, charges can be **copied forward** from a prior period in one action. The lease ledger always shows every charge, every payment and its allocation, the outstanding balance, and any unapplied credit.

### Workflow 4 — Payment reconciliation
Record a payment and allocate it across one or more outstanding charges on the same lease. The database guarantees a payment can never be over-allocated and a charge can never be over-paid; partial payments move a charge to `partially_paid`; any unallocated remainder becomes **unapplied credit** the manager can apply later. Corrections are made by void-and-reissue, never by silently editing a settled charge — and every step is audit-logged.

### Workflow 5 — Post-dated check vault
Record each PDC against its lease (number, bank, maturity date, amount). A PDC is a *promise* and does not touch the ledger while vaulted. Managers see the vault filtered by status, lease, bank, or maturity, and can update many checks at once. Marking a check **cleared** materializes a real payment to allocate; marking it **bounced** voids that payment and lets the manager raise a penalty. Checks aging past six months are swept to `stale` and surfaced for follow-up.

### Workflow 6 — Utility sub-metering
Enter the month's master utility bill for a property, then per-lease sub-meter readings. Before anything is billed, the system **previews** each lease's computed share and shows the common-area / system-loss variance for review — it is never silently distributed. One click generates one utility charge per lease; generation is idempotent, so a re-run never double-bills.

### Workflow 7 — Move-out settlement
A two-stage process. Stage 1 is vacate (terminate the lease, free the unit). Stage 2 is final settlement: it cannot begin until every non-deposit charge is paid or void. The manager records itemized deductions (unpaid utilities, damages); the system computes the refund (floored at ₱0) or posts a shortfall as a `move_out_balance` charge, and produces an exportable settlement summary. Advance rent is never refunded.

---

## 6. Product principles

1. **Integrity at the database, not the app.** Allocation caps, status derivation, unit-status transitions, and audit logging are enforced by Postgres triggers with row locking. The UI may pre-validate for convenience, but the database is the authority.
2. **Isolation by row, verified by test.** Every operational table is org-scoped with forced RLS; cross-org and cross-assignment access is proven impossible by an automated test suite that runs on every migration.
3. **Money is never destroyed.** Charges and payments are voided, never deleted; leases expire or terminate; PDCs move through their lifecycle. Nothing financial is hard-deleted.
4. **Manila time, Philippine peso.** All "today/overdue/due-soon" logic is computed in `Asia/Manila`; all money is PHP.
5. **Honest scope.** The MVP does what the spec says and no more; deferred features (CWT, automated billing) are named, not implied.

---

## 7. Reporting & analytics

| Report | Purpose |
|--------|---------|
| Dashboard | Occupancy, outstanding arrears, charges due in 7 days |
| Rent roll | Every active lease with property, unit, tenant, monthly rent, current balance |
| Arrears aging | Outstanding balances bucketed current / 1–30 / 31–60 / 61–90 / 90+ days |
| Collection summary | Total charged vs collected for a date range, optionally per property |
| Per-property income | Payments received per property for a date range |
| PDC maturity | Vaulted/deposited checks by maturity, highlighting those due within 7 days and any stale checks |

All reports respect the caller's role scope, are computed server-side (DB views / `SECURITY INVOKER` RPCs), and export to CSV.

---

## 8. Design & brand

StormlightPMS ships with a finalized design system (see SRS §7.1): a navy brand (`#0B3D6B`), gold accent (`#F2C14E`), and teal secondary (`#1B9AAA`) over a slate neutral scale, typeset in Spectral (display), Plus Jakarta Sans (UI), and JetBrains Mono (numerics). The token set is the single source of truth for the UI build. The only outstanding brand asset is the **logo**, pending from GVL; until then a wordmark stands in.

---

## 9. Roadmap

| Horizon | Items |
|---------|-------|
| **v-next** | CWT / BIR Form 2307 tracking + escrow (former D6) |
| **v2** | Automated/scheduled recurring billing; automatic rent escalation; tenant self-service portal; tighter PM tenant scoping; forced re-login on role change |
| **Longer-term** | Hospitality / short-term bookings; channel manager (Airbnb/Booking.com); auto-generated SOA/invoices; SMS/Viber notifications |
| **v3 / out** | BIR OR issuance & return filing; payment gateway; landlord self-sign-up & subscription billing; native mobile apps |
| **Not planned** | Accounting integration (Xero/QuickBooks) |

---

## 10. Assumptions & dependencies

- A transactional email provider (Resend recommended) is available for reminder emails; its key and the Supabase service-role key live in Supabase Vault, never in the browser.
- GVL's own portfolio is the first production tenant and is loaded via CSV import + a one-off seed for historical charges/payments.
- Supabase and Vercel managed infrastructure meet the 99.5% availability target.
- The logo asset will be supplied before production cutover.

---

## 11. Success criteria

The product is successful at MVP when the SRS §10 Definition of Done is met — in business terms:

1. GVL runs his entire portfolio in StormlightPMS daily, off spreadsheets.
2. Any tenant's current balance, payment history, and deposit position is correct and visible in one place.
3. Rent roll, arrears aging, and collection reports are produced on demand, not reconstructed.
4. The PDC vault and utility sub-metering replace the paper/manual processes they target.
5. A property manager sees only their assigned properties, and no user can ever see another landlord's data — proven by the test suite.

---

## 12. Open questions / decisions log

| Ref | Status |
|-----|--------|
| Architecture (Supabase/SPA vs Knack) | **Decided** — Supabase/Postgres + Vite/React SPA |
| CWT / Form 2307 (D6) | **Deferred** to v-next |
| Document structure | **Two aligned docs** — this PRD + the SRS, synchronized at v0.4 |
| Branding (A5) | Colors/fonts/tokens **closed**; logo **pending** |
| Reporting scope (A2) | As scoped in §7; revisit only on GVL's direction |
| Open engineering recommendations | See SRS §12 (OR-1 … OR-10) — **decisions recorded**: OR-1/2/3/4/6 ACCEPT; OR-5 tighten documents RLS to PM scope; OR-7 soft UI warning; OR-8 document in PDC UI; OR-9 wordmark until logo; OR-10 add maintenance-status-change notification |
