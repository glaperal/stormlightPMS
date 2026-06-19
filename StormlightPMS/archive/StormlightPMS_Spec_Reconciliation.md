# StormlightPMS — Spec Reconciliation: v1.0 PRD/SRS ↔ SRS v0.2

| Field | Value |
|-------|-------|
| Document | Reconciliation report — resolves the two divergent StormlightPMS specs |
| Date | 2026-06-07 |
| Owner | GVL (Gerardo V. Laperal) |
| Inputs | "v1.0" combined PRD/SRS (provided in chat) · `StormlightPMS_SRS_v0.2.md` (repo build contract) · the built codebase |
| Outcome | SRS bumped to **v0.3**, absorbing three Philippine-specific features + optional JSONB inventory |
| Status | Decisions frozen; SRS edits applied in the same change |

---

## 1. Why this document exists

Two specifications for StormlightPMS were in circulation and they disagree **structurally**, not just in wording:

- **"v1.0" PRD/SRS** — a combined PRD + SRS + implementation plan. Its entire competitive thesis ("unlike Buildium/AppFolio") rests on three Philippine-specific features: **PDC (Post-Dated Check) Digital Vault**, **BIR Form 2307 / 5% Creditable Withholding Tax (CWT)**, and **utility sub-metering**. It proposes a `landlord_id` tenancy model, a single `financial_ledger` table, and a polymorphic `units.specs` JSONB inventory rendered by schema-driven forms.
- **SRS v0.2** (`StormlightPMS_SRS_v0.2.md`) — the declared build contract. A mature multi-tenant SaaS: `org_id` + three roles (superAdmin / Admin / Property_Manager) + a custom access-token hook; a **normalized** money model (`charges` / `payments` / `payment_allocations` / `deposit_deductions`); forced RLS on every table; an audit log; notifications; and scheduled jobs. It **explicitly defers or drops all three** of v1.0's signature PH features (§11.2).

### 1.1 The version numbers are inverted
"v1.0" is the **conceptually older** document; **v0.2 is the newer, implemented contract.** The codebase confirms this — see §2. To end the confusion, **v0.3 is hereby the single forward source of truth**; the "v1.0" document is archived for provenance at `StormlightPMS/archive/StormlightPMS_v1.0_ARCHIVED.md`.

### 1.2 GVL decisions driving this reconciliation
1. **v1.0 reflects new intent** — pull its PH-specific features back into scope.
2. Deliverable = **this report + applied SRS edits.**
3. **Pull all three PH features into MVP scope.**
4. **Inventory:** add an *optional, additive* `units.specs` JSONB + a per-asset-class field registry (keep the existing fixed columns).
5. **Escalation:** stays **reference-only** for the MVP; automatic compounding escalation remains a v2 roadmap item.

---

## 2. Source-of-truth determination — facts on the ground

The codebase is the tie-breaker, and it is built **entirely against v0.2**:

- **14 migrations**, **16 tables** matching v0.2 exactly (`organizations`, `profiles`, `property_assignments`, `properties`, `units`, `tenants`, `leases`, `charges`, `payments`, `payment_allocations`, `deposit_deductions`, `maintenance_requests`, `documents`, `notifications`, `audit_log`, `org_settings`).
- The custom access-token hook, `app_role()/app_org()/app_pm_property_ids()` helpers, forced RLS, the financial integrity triggers, scheduled-job RPCs, and report views are all present.
- A full React SPA (Vite + React Router + TanStack Query + RHF + Zod + Tailwind) covering every v0.2 module.
- **None** of v1.0's signature features exist in code: no PDC vault, no BIR 2307 / CWT, no sub-metering, no polymorphic JSONB inventory, no `financial_ledger` table.

**Conclusion:** v0.2's architecture is the foundation and is not up for renegotiation. v1.0 contributes **feature intent**, which is re-homed onto v0.2's superior structure rather than adopting v1.0's flat schema.

> **Guiding principle for every "Adopt" verdict below:** re-home the v1.0 *capability* onto v0.2's normalized model. A PDC is a *promise* (its own table), realized into a `payment` when it clears. CWT is a *split* of an existing charge, not a new ledger. A utility bill is an *input* that *generates* ordinary `charges`.

---

## 3. Full divergence map

| # | Area | v1.0 | v0.2 (built) | **Resolution** |
|---|------|------|--------------|----------------|
| D-1 | Tenancy / multi-tenancy | `landlord_id` claim in JWT | `org_id` + 3 roles + access-token hook + forced RLS | **Keep v0.2.** `landlord_id` ≡ `org_id` (old name). v1.0's single-claim model has no role scoping; v0.2 is strictly superior. |
| D-2 | Money model | one `financial_ledger` table (invoices + PDCs + tax mixed) | `charges` / `payments` / `payment_allocations` / `deposit_deductions` | **Keep v0.2.** v1.0's PDC + CWT fields are re-homed (D-3, D-4). |
| D-3 | **PDC Digital Vault** | core (FR-2.1): check #, bank, maturity, status *Vaulted/Deposited/Cleared/Bounced/Stale* | absent — only `payment_method = check` | **Adopt → new `post_dated_checks` table** + `pdc_status` enum + clear→payment flow + stale sweep job. |
| D-4 | **BIR Form 2307 / 5% CWT** | core (FR-3.1/3.2): 5% CWT on commercial; ledger held "Uncleared" until 2307 received | out of scope (§11.2) | **Adopt → CWT split on charges** (`cwt_amount`/`net_payable`) + **escrow gate** (`pending_form_2307` charge status). **Highest-risk change — see §5.** |
| D-5 | **Utility sub-metering** | core (FR-2.2): master bill + sub-meter readings → auto-append to invoice | manual `utility_*` charges only | **Adopt → `utility_bills` + `utility_meter_readings`** + a generation RPC that emits ordinary `charges`. |
| D-6 | Inventory model | polymorphic `units.specs` JSONB + schema-driven dynamic forms | fixed unit columns (floor, bedrooms, sqm) | **Merge.** Add **optional** `units.specs jsonb` + per-`property_type` field registry. Additive; fixed columns unchanged. |
| D-7 | Rent escalation | automatic multi-year compounding | stored rate/frequency, **reference-only** | **Keep v0.2 reference-only.** Auto-escalation → v2 roadmap. |
| D-8 | UI framework | Shadcn UI + `react-jsonschema-form` | Tailwind + RHF + Zod | **Keep v0.2.** A small Zod-driven dynamic field renderer covers D-6 without adding `react-jsonschema-form`. |
| D-9 | Asset taxonomy | Residential / Commercial / Warehouse / Raw Land | `property_type`: residential / commercial / mixed | **Keep v0.2 enum;** warehouse/raw-land nuance is expressed through D-6 `specs`, not new enum values (MVP). |
| D-10 | Tenant-facing portal | none (Phase 1 internal only) | deferred to v2 | **No conflict.** |
| D-11 | PRD document | v1.0 *is* a combined PRD+SRS | SRS + CLAUDE.md both reference a `StormlightPMS_PRD.md` that **does not exist in the repo** | **Gap.** Recommend extracting v1.0 Part 1 into the missing PRD as a follow-on (see §7). |

---

## 4. Integration designs (the three adopted PH features)

These are summaries; the authoritative spec text lands in SRS v0.3 (§4, §6, §9). All new tables carry `org_id`, standard `created_at/created_by/updated_at`, forced RLS, and audit coverage where financial.

### 4.1 PDC Digital Vault (D-3)
- **New enum** `pdc_status`: `vaulted, deposited, cleared, bounced, stale`.
- **New table** `post_dated_checks`: `lease_id, check_number, issuing_bank, check_date` (maturity), `amount`, `status`, `deposited_date`, `cleared_date`, `bounced_reason`, `linked_payment_id` (nullable), `notes`.
- **Lifecycle:** a PDC is a *promise*, not money. It does **not** affect the lease ledger while `vaulted`/`deposited`. On **`cleared`**, the system creates a `payments` row (`payment_method = check`) linked via `linked_payment_id`; allocation to charges then proceeds through the normal payment path. On **`bounced`**, no payment exists (or the created one is voided) and a penalty charge may be raised manually.
- **Vault UI:** filtered list with **bulk status update** (select N checks → mark Deposited/Cleared/Bounced), the v1.0 ergonomic the Collection Officer needs.
- **New job JOB-5:** daily sweep marks `vaulted` checks whose `check_date` is > 6 months old (PH check staleness) as `stale` and notifies.

### 4.2 BIR Form 2307 / 5% CWT (D-4) — see risk note §5
- **New enums:** `form_2307_status` (`not_required, pending, received`); **`charge_status` gains `pending_form_2307`** (v1.0's "Uncleared"/escrow state).
- **`leases` +** `is_cwt_applicable boolean`, `withholding_tax_rate numeric(5,2)` (5.00 for commercial).
- **`charges` +** `cwt_rate`, `cwt_amount`, `net_payable` (= `amount − cwt_amount`, trigger-maintained), `form_2307_status`, `form_2307_url`, `form_2307_received_date`.
- **Semantics:** the tenant pays **`net_payable`** in cash; the `cwt_amount` is settled by the tenant remitting it to the BIR and handing over **Form 2307**. A charge is therefore **`paid`** only when allocations cover `net_payable` **and** (`cwt_amount = 0` **or** `form_2307_status = received`). If cash is in but the 2307 is missing → **`pending_form_2307`** (the escrow gate). New **CWT-receivable report** lists outstanding 2307s.

### 4.3 Utility sub-metering (D-5)
- **New enums:** `utility_type` (`electricity, water`); `utility_allocation_method` (`by_submeter, equal_split, by_floor_area`).
- **New table** `utility_bills`: `property_id, utility_type, billing_period, provider, total_amount, total_consumption`, `bill_date`, `due_date`, `allocation_method`.
- **New table** `utility_meter_readings`: `utility_bill_id, lease_id, previous_reading, current_reading, consumption` (= current − previous), `computed_share`, `generated_charge_id` (nullable).
- **Generation RPC** `generate_utility_charges(bill_id)`: computes each lease's share per `allocation_method`, creates `charges` (type `utility_electricity`/`utility_water`) for the period, and links `generated_charge_id`. **Idempotent** — re-running for a bill already generated is a no-op. Surfaces the **common-area / system-loss variance** (master total − Σ shares) for landlord review rather than silently distributing it.

---

## 5. Risk callouts

**The BIR/CWT change (D-4) is the only high-risk item.** It modifies code that is already built **and covered by pgTAP tests** (`supabase/migrations/20260521090800_triggers_money.sql`, `supabase/tests/20_payment_allocation_guard.sql`):

1. **`recompute_charge_status`** must settle against **`net_payable`** (not `amount`) and add the `pending_form_2307` branch. It must also re-run when `form_2307_status` changes.
2. **`payment_allocations_guard`** per-charge cap must change from `amount` to **`net_payable`** — otherwise a CWT charge can never reach `paid` (the tenant legitimately under-pays by the CWT portion) yet over-allocation protection would be wrong.
3. **`charges_amount_guard`** must keep `net_payable` consistent when `amount` or `cwt_rate` changes, and still never allow `net_payable` below the allocated total.
4. **`FR-DEP-1`** (move-out gate) must treat `pending_form_2307` as **not** fully settled — it should block final deposit settlement, same as `unpaid`/`partially_paid`.

These are spec changes here; in the build phase they require **new migrations** (never edit applied ones — CLAUDE.md rule), regenerated `database.types.ts`, and **new negative pgTAP cases** (cash-in-but-2307-missing must NOT mark a charge `paid`; allocation cap respects `net_payable`).

Lower-risk: D-3 and D-5 are **additive** (new tables/jobs, no change to existing triggers). D-6 is additive (one nullable JSONB column + an app-side registry).

---

## 6. Downstream build impact (not done in this change)

This reconciliation produces **specs only.** Implementation follows the CLAUDE.md build phases and will need, roughly:

- **New migrations** (timestamped, additive): enums; `post_dated_checks`; `utility_bills` + `utility_meter_readings`; `leases`/`charges`/`units` column adds; **rewritten** money triggers (D-4); `generate_utility_charges` RPC; JOB-5; RLS policies for the three new tables; CWT-receivable report view.
- **Regenerate** `src/lib/database.types.ts` after each migration.
- **New pgTAP tests** for the three new tables' RLS, the CWT escrow gate, the net_payable allocation cap, and utility-generation idempotency.
- **UI:** PDC Vault module (with bulk actions), CWT fields on lease/charge forms + Form-2307 upload, sub-metering module, optional asset-class `specs` fields on the unit form.

---

## 7. Noted gaps & follow-ons

- **Missing PRD.** `StormlightPMS_PRD.md` is referenced by the SRS (§1.1, §1.4) and CLAUDE.md but is absent from the repo. Recommend creating it from v1.0 Part 1 (Executive Summary, personas, epics) reconciled to v0.3 scope. Left as a follow-on unless GVL wants it now.
- **CLAUDE.md build-contract pointer.** It names `StormlightPMS_SRS_v0.2.md`. This change bumps the in-document version to **v0.3** but keeps the filename, so the pointer stays valid. If the file is later renamed to `_v0.3.md`, update CLAUDE.md in the same commit.
- **Scope boundary clarified in v0.3 §11.2:** **CWT tracking + Form 2307 escrow is IN**; issuing official BIR receipts / ORs remains **OUT** (v3).
