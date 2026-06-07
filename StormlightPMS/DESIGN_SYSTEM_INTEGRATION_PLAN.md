<!-- /autoplan restore point: C:\Users\ADMIN\.gstack\projects\glaperal-stormlightPMS\main-autoplan-restore-20260607-111258.md -->
# StormlightPMS — Design System Integration Plan

| Field | Value |
|-------|-------|
| Product | StormlightPMS — lessor web dashboard (product line of Stormlight Inc.) |
| Document | Design System Integration Plan (autoplan-reviewed) |
| Date | 2026-06-07 |
| Owner | GVL |
| Build contract | `StormlightPMS_SRS_v0.2.md` (SRS wins on any disagreement) |
| Design source | `design-handoff/` (extracted from "StormlightPMS Design System.zip") |
| Status | **APPROVED** (GVL, 2026-06-07) — Gate 1: Split P1/P2; Gate 2: Keep SRS reference-only. Reviewed CEO + Design + Eng (subagent voices). |

---

## 1. Objective

Adopt the delivered Stormlight design system into the **existing, substantially-built** SPA, replacing the neutral placeholder styling that SRS assumption **A5** mandated until a brand kit arrived. The design handoff is that brand kit; this plan closes A5.

This is a **retrofit**, not a greenfield build. Every screen already exists (`src/pages/**`), all 14 migrations are applied, the stack is fixed (Vite + React + TS + Tailwind + React Router + TanStack Query + RHF/Zod + Supabase).

## 2. Premises (require GVL confirmation — see Gate 1)

- **P1.** Adopting the design system now is the right next move (vs. deferring polish to finish backend correctness first). *Review note: the CEO voice argued a vertical-slice-first approach is higher-leverage than a horizontal repaint; the scope shape is Gate 1.*
- **P2.** The design's **CUSA and parking are `charges`, not lease columns** — the `charge_type` enum already has `association_dues` and `parking`. The lease's `monthly_rent` is the **basic rent**; "Total monthly billing" = `monthly_rent` + active recurring CUSA/parking charges. We do **not** add basic-rent/CUSA columns to `leases`.
- **P3.** `units.floor_area_sqm` and `units.base_monthly_rent` already exist; rate/m² is **derived**, not stored on the lease.
- **P4.** `property_type` (`residential|commercial|mixed`) already exists and is the discriminator for showing/hiding the commercial-terms UI group. No new `lease_type` needed.
- **P5.** Advance rent and escalation are **reference-only** in the SRS (§4.8, FR-LEASE-3: "no automatic rent change occurs"). The design renders advance-covered tails and escalation projections as if live. **This is an SRS conflict** — resolution is Gate 2. Default: keep reference-only; treat the design's advance-covered/escalation visuals as **display annotations**, not money/dunning logic.

## 3. Data-model gap — corrected

Earlier framing ("only `monthly_rent` exists, add CUSA/parking columns") was wrong; it would **duplicate the charges model and fork the money write-path** (the integrity triggers operate per-`charge_type` and never read `monthly_rent`). Corrected gap:

| Design concept | Where it lives | Action |
|---|---|---|
| Basic rent | `leases.monthly_rent` | reuse (it IS basic rent) |
| **CUSA** | `charges` row, `charge_type='association_dues'` | reuse (recurring charge) |
| **Parking** | `charges` row, `charge_type='parking'` | reuse (recurring charge) |
| Floor area, rate/m² | `units.floor_area_sqm` + derive | reuse |
| Escalation rate + frequency | `leases.escalation_rate`, `escalation_frequency_months` | reuse |
| Security deposit / advance held | `leases.security_deposit_*`, `advance_*` | reuse |
| **VAT applicable** | — | **new** `leases.vat_applicable boolean default false` (+ define inclusive/exclusive — see R5) |
| **Rent-free / fit-out months** | — | **new** `leases.rent_free_months int default 0` |
| **Escalation applies to** (basic vs rent+CUSA) | — | **new** `leases.escalation_applies_to` enum default `basic` |
| Advance "applied to last N months" | `leases.advance_months` (semantics) | **no new column** — see Gate 2 |

Net: **one additive migration, ~3 nullable/defaulted columns**, safe for existing residential leases. All commercial figures (CUSA, parking, total billing, rate/m²) are **derived from charges + units**, computed **server-side** (RPC), never as new lease columns.

## 4. Scope split (recommended — see Gate 1)

**P1 — Pure visual retrofit (no backend dependency).** Tokens, fonts, primitives, app shell, login screen, and screen restyles wired to **whatever queries already exist**. Ships independently; not blocked on any RPC.

**P2 — Data-backed design features (gated behind their owning backend phase, SRS §6.12 "reports are DB views/RPCs").** The four dashboard insight cards, advance-aware receivables, deposits-held, escalations-due, and the commercial-terms migration + RPCs + the add-lease wizard's new fields. These require new RPCs that **do not exist today** (`rpt_dashboard` returns only 4 scalars).

Rationale: a CSS pass must not be blocked on financial RPCs, and schema/RPC work needs the SRS test-first review ("keep diffs small, security tables especially"). Bundling them produces a pretty app with stubbed money math.

## 5. Workstreams

**A. Tokens → Tailwind theme (var()-only — single source).** Load `colors_and_type.css` verbatim; it is the **only** place a literal value appears. `tailwind.config.js theme.extend` references tokens via `var()` (`brand: 'var(--brand)'`, `'bg-app': 'var(--bg-app)'`, radii/shadows/spacing/fontSize/fontFamily likewise) — **zero literal values in the config**. Rule: **no `bg-foo/opacity` modifiers on token colors** (bare `var()` breaks Tailwind's alpha syntax); the documented design uses explicit `rgba()` so channel-tokens are unnecessary. Keep the `.t-*` type classes as authored (do not re-`@apply`).

**B. Fonts.** Spectral (display) / Plus Jakarta Sans (UI) / JetBrains Mono (money). **Self-host, subset to weights used** (decided — no render-blocking Google CDN). Include `font-feature-settings: "tnum" 1, "zero" 1` (slashed zero) on `.t-num`, not just `tabular-nums`.

**C. Primitives (per-component disposition — no duplicates).**

| Design primitive | Existing | Disposition |
|---|---|---|
| `Btn` (primary/accent/secondary/ghost/danger) | `.btn-*` classes | Rebuild as component; delete `.btn-*` |
| `Field`/`Input`/`Select` | `Field`, `.input` | Extend `Field`; build `Input`/`Select` wired to RHF |
| `Modal` | `Modal` | Extend (add 600px wizard variant + focus-trap check) |
| `Pill` (status) | `StatusBadge` | Rename/absorb `StatusBadge`→`Pill` — **one component, not both** |
| `Tag` (category) | — | New (≠ Pill; payment method / property type labels) |
| `EmptyState` | `EmptyState` | Reuse (feeds Workstream H) |
| `PageHead` | `PageHeader` | Extend (title+subtitle+action slot) |
| `StatCard`,`Avatar`,`Toggle`,`Segmented`,`Toast`,`TimelineBar`,`TLLegend`,`Card`,`Logo`,`Icon` | — | New |
| `BarChart`/`HBar` (shared) | — | New shared primitive (3 screens need div-bar charts) |
| Skeleton + ErrorCard | — | New shared primitives (Workstream H) |

`Segmented`/`Toggle` are **wizard-blocking** — build first. `Toast` needs an app-level provider/portal the current app lacks. Accessibility is non-negotiable per Workstream G.

**D. App shell + login.** Restyle `AppShell.tsx`: navy sidebar, **instant** gold active rail (no CSS transition — documented stuck-highlight bug), user card, logout; topbar with **`backdrop-filter: blur(10px)` translucent material** (not flat white), search, date chip, bell (keep `aria-label` + unread badge), Record payment. **Login screen** (two-column navy-gradient split, Spectral headline, gold mono stats) — **styling only, no auth-logic change**.

**E. Screen restyle (per-screen, wired to existing data in P1).** Each line: source `.jsx`, layout/grid spec, primitives, data source, states.

| Screen | Grid / layout spec | Notes |
|---|---|---|
| Dashboard | KPI row ×4; Trend/Activity **1.55fr/1fr**; insight rows **1fr/1fr** | insight cards = **P2** |
| Properties + detail | card list; floors→units grid (occupied/vacant cells → drawer) | |
| Tenants + drawer | table; right-side `TenantDrawer` (new pattern) | focus-trap |
| Lease detail | header banner; **timeline card (P2)**; 4 term groups; payment history/docs/notes | |
| Rent/Payments | filter tabs; table w/ method `Tag`, status `Pill` + billing-mode badge | |
| Utilities | 3 StatCards; per-unit table; Not-billed = **neutral `vacant` pill** | |
| Maintenance | 3-col kanban (static, priority dots) | |
| Reports | period tabs; `BarChart`/`HBar` (collection trend, arrears aging, income-by-floor) | |
| Settings | tabs (Profile/Billing/Notifications) | |

**F. New design features (P2).** (1) Commercial-terms migration (§3) + regen types + pgTAP. (2) Report RPCs (§6). (3) `TimelineBar` (full fidelity — see Workstream I). (4) Four insight cards. (5) 4-step add-lease wizard writing new fields (needs migration + regen first).

**G. Accessibility (DoD gate, not aspiration).** (1) Every token color pair passes AA — **audit gold combinations specifically**; mandate `--accent-fg` (navy-900) on gold fills; **forbid gold-400 as text on light** surfaces (use `--fg-link` gold-700 only). (2) All interactive primitives use the gold `--shadow-focus` ring and are keyboard-operable: `Segmented`=radiogroup (roving tabindex), `Toggle`=switch, `Modal`/`TenantDrawer`=focus-trapped + Esc + return focus, wizard manages focus between steps. (3) min 44px touch targets. (4) Status never color-only (keep dot **+ label**).

**H. States matrix (new — prototype had none).** Wiring TanStack Query inherits loading/error/empty/populated per surface; the prototype (synchronous in-memory `STORM`) defined almost none. For every screen define: loading (token `--bg-muted` skeletons, not spinners), error (inline ErrorCard + retry, danger tokens), empty (icon + line + CTA via `EmptyState`), and **zero-data chart variants**. Explicitly design the **new-org first-run dashboard** (one property, zero leases) — the whole "Vision Homes" design assumes a populated portfolio.

**I. Fidelity details (visual-diff gate vs `design-handoff/index.html`).** TimelineBar: three segment fills (rent-free **diagonal gold stripe** `repeating-linear-gradient(135deg,var(--gold-200) 0-7px,var(--gold-100) 7-14px)`; standard navy gradient; advance-covered teal gradient), `inset 0 0 0 1px rgba(255,255,255,.35)` edge, label hidden <14% width, escalation + today markers conditional. Topbar blur material. **Gold governance: 3 sanctioned uses only** (active nav rail, focus ring, accent CTA). Card hover lift (`translateY(-1px)` + `--shadow-md`), row tint to `--bg-subtle`.

## 6. Derived-logic placement (SRS §6.12)

| Helper | Placement | Why |
|---|---|---|
| `receivables` (advance-aware) | **DB RPC** | money aggregation + dunning; must match ledger |
| `depositsHeld` | **DB view/RPC** | portfolio money aggregation |
| `escalationsWithin` (peso deltas) | **DB RPC** | money math + Manila-date horizon; respect `escalation_frequency_months` (not hardcoded 12) |
| `leasesEndingWithin` | **DB RPC** | date horizon; avoids client TZ bug |
| `billingStatusOf`/`advanceCoversNow`/`rentFreeNow` | **DB (view field)** | drives badge AND dunning; must agree |
| `leaseSchedule`/`scheduleFrom` (segment %s, todayPct) | **client (presentational)** | pixel geometry only; "today" via `MANILA_TZ` helper, never raw `new Date()` |

## 7. Sequencing (DB before UI — CLAUDE.md)

1. **Migration A**: lease commercial columns (vat, rent_free_months, escalation_applies_to) + reconciliation/CHECK + regen `database.types.ts` + pgTAP.
2. **Migration B**: report RPCs (receivables, deposits-held, escalations-due, leases-ending, single-month collection KPI) + pgTAP. (Separate file — one logical change per migration.)
3. Tokens + fonts (A, B). 4. Primitives — now typeable against new types (C). 5. Shell + login (D). 6. Dashboard + insight cards (E, F). 7. Lease detail + TimelineBar (E, F). 8. Add-lease wizard (F). 9. Remaining screens (E). 10. Verification.

P1 workstreams (steps 3-5, 9 for non-data-backed screens) can proceed in parallel with backend steps 1-2; P2 features (6-8) gate on them.

## 8. Test plan (DoD enumerates these)

**pgTAP:** `supabase db reset` replays clean; existing RLS tests still green with new columns; every new RPC/view is `security invoker` with positive / cross-org / cross-PM-assignment cases; non-negativity CHECKs on new columns; enum domains reject garbage; legacy/residential lease (no new fields) inserts and behaves (cusa via 0 charges, escalation_applies_to=basic); allocation guard still green with CUSA/parking as separate charges; dashboard receivables total == sum of arrears-aging buckets (cross-RPC consistency); escalation delta = current_rent × rate at Manila-horizon boundary; depositsHeld excludes consumed advances and matches per-lease ledger. **Vitest:** `scheduleFrom` geometry (segments sum 100%, today hidden out-of-term, label hidden <14%), uses MANILA_TZ.

## 9. Risks & SRS conflicts

- **R1 (resolved).** Money-path safety: CUSA/parking stay charges → integrity triggers untouched.
- **R2 (resolved).** Token drift: var()-only, zero literals in Tailwind config.
- **R3.** Active-nav transition bug — apply active bg instantly.
- **R4.** Money display: JetBrains Mono + tnum + zero everywhere `₱` appears; align `format.ts`.
- **R5 (decision in §3/Gate).** VAT inclusive vs exclusive — a `vat_applicable` flag must flow into the "Total monthly billing" number and match the charge-entry convention, or receivables silently mismatch.
- **SRS-CONFLICT-1 (Gate 2).** Advance rent: SRS = "reference only, never refunded"; design = "covers last N months, excluded from receivables." Default resolution: keep reference-only; advance-covered tail is a **timeline annotation only**, not a receivables exclusion. Changing it edits a frozen SRS money rule.
- **SRS-CONFLICT-2.** Rent-free/advance "suppression" has **no backend mechanism** (charges are manually created; no auto-rent generator). Resolution: canonical truth stays "is there an unpaid charge row"; rent-free/advance are display labels. The receivables card must **not** silently exclude tenants who have real unpaid charges.

## 10. Out of scope / deferred

No Tweaks panel (prototype-only); its real concepts (lease-window horizon, receivables-scope) become **ephemeral client filter state**, not persisted `org_settings` (avoid scope creep). No chart library. No new roles/auth changes. No mobile-native. CSV import internals unchanged (restyle only). Full auto-charge/billing generation is **not** in scope (SRS keeps charges manual).

## 11. Definition of done

P1: tokens ported (var()-only) and consumed; fonts self-hosted; primitives match handoff (no duplicates); shell + login + in-scope screens visually faithful (visual-diff vs `design-handoff/index.html`) and wired to existing data; **states matrix** satisfied; **a11y gate** (AA contrast incl. gold, gold focus ring, keyboard-operable new components, 44px targets) passes; `npm run typecheck` + `lint` clean. P2 (when its phase runs): migration + RPCs + pgTAP green; `supabase db reset` clean; insight cards/timeline/wizard functional; commercial figures derived server-side.

---

## /autoplan Review — Dual Voices (subagent-only; Codex unavailable on this host)

### CEO consensus
| Dimension | Primary (me) | Subagent | Consensus |
|---|---|---|---|
| 1. Premises valid? | partly (§3 was wrong) | NO (§3 misdiagnosis) | **DISAGREE w/ draft → FIXED** |
| 2. Right problem now? | yes, with scope split | reframe to vertical-slice | **DISAGREE → Gate 1** |
| 3. Scope calibration | split P1/P2 | split P1/P2 | **CONFIRMED** |
| 4. Alternatives explored | added | demanded | **CONFIRMED** |
| 5. Market fit (commercial depth) | progressive disclosure | gold-plating risk | **CONFIRMED** |
| 6. 6-month trajectory | sound if split | sound if split | **CONFIRMED** |

### Design consensus
| Dimension | Primary | Subagent | Consensus |
|---|---|---|---|
| 1. Token strategy | var()-only | var()-only (drift if mirrored) | **CONFIRMED → FIXED** |
| 2. States (loading/empty/error) | missing | CRITICAL missing | **CONFIRMED → Workstream H** |
| 3. Primitive reconciliation | disposition table | disposition table | **CONFIRMED → Workstream C** |
| 4. Per-screen specificity | added table + login | login dropped, under-spec | **CONFIRMED → Workstream E** |
| 5. Fidelity (timeline/blur/gold) | gate added | will be lost | **CONFIRMED → Workstream I** |
| 6. Accessibility | gate added | gold contrast traps | **CONFIRMED → Workstream G** |

### Eng consensus
| Dimension | Primary | Subagent | Consensus |
|---|---|---|---|
| 1. Architecture (charges not columns) | corrected | corrected | **CONFIRMED → §3** |
| 2. Derived logic placement | per-helper table | per-helper (more server) | **CONFIRMED → §6** |
| 3. Error paths / edge cases | rent-free/advance labels | no suppression mechanism | **CONFIRMED → SRS-CONFLICT-2** |
| 4. Test coverage | enumerated | enumerated | **CONFIRMED → §8** |
| 5. Hidden complexity (cards=backend) | P2 split | cards/wizard = backend | **CONFIRMED → §4** |
| 6. Sequencing (DB before UI, ≥2 migrations) | re-sequenced | re-sequenced | **CONFIRMED → §7** |

### Cross-phase themes (flagged by 2+ phases independently — high-confidence)
- **The prototype's derived/auto-billing model ≠ the shipped manual-charge SRS model.** Surfaced by CEO (finding 2: absorbs Money/Reports phases) and Eng (3a/3b: no suppression, advance reference-only). Root cause of most findings. → §4 split + SRS-CONFLICT-1/2.
- **Schema work masquerading as styling.** CEO (finding 5) + Eng (finding 5). → P2 gating + §3 correction.

## Decision Audit Trail

| # | Phase | Decision | Class | Principle | Rationale |
|---|---|---|---|---|---|
| 1 | CEO | Correct §3: CUSA/parking are charges, not new columns | Mechanical | P4 DRY | charge_type enum already has them; columns would fork money path |
| 2 | CEO | Split scope into P1 visual / P2 data-backed | Taste | P3 pragmatic | CSS pass shouldn't block on RPCs; surfaced at Gate 1 |
| 3 | CEO | Commercial fields optional, progressive disclosure (gate on property_type) | Mechanical | P1 completeness | residential users shouldn't see CUSA/rate-m² |
| 4 | Design | Token rule = var()-only, zero literals in Tailwind | Mechanical | P5 explicit | one source; mirroring IS the drift |
| 5 | Design | Add States matrix (Workstream H) | Mechanical | P1 completeness | real-data app inherits 4 states/surface |
| 6 | Design | Per-component disposition table; rename StatusBadge→Pill | Mechanical | P4 DRY | avoid StatusBadge+Pill duplication |
| 7 | Design | Add Login screen as explicit line item | Mechanical | P1 completeness | brand-defining screen was dropped |
| 8 | Design | Self-host fonts, subset weights | Taste | P5 explicit | 3 families heavy; "decide later" ships as CDN |
| 9 | Design | A11y as DoD gate (gold contrast, focus ring, keyboard) | Mechanical | P1 completeness | gold-on-light fails AA |
| 10 | Eng | Additive migration (~3 cols), defaults safe for residential | Mechanical | P2 boil-lakes | only approach compatible w/ applied migrations |
| 11 | Eng | monthly_rent stays source of truth (= basic rent) | Mechanical | P5 explicit | rent_roll/import reference it; can't edit applied SQL |
| 12 | Eng | Receivables/deposits/escalations/ending = DB RPCs | Mechanical | P1 completeness | SRS §6.12; money correctness |
| 13 | Eng | ≥2 migrations (columns / RPCs); regen types between | Mechanical | P5 explicit | one logical change per migration |
| 14 | Eng | Tweaks concepts = ephemeral client state, not org_settings | Taste | P3 pragmatic | avoid scope creep; surfaced |
| 15 | Eng+CEO | Advance reference-only; design visuals = annotations | **User Challenge** | — | SRS money-rule conflict → Gate 2 (GVL decides) |
