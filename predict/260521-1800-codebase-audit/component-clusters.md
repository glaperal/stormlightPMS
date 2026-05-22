---
commit_hash: 53d7bd39125121c1f435987ed01ff4cb05708b05
---

## Cluster map

| Cluster | Files | Key entities | Risk areas |
|---------|-------|--------------|------------|
| **Auth & session** | `src/lib/auth.tsx`, `src/components/BootGate.tsx`, `src/components/RequireRole.tsx`, `src/pages/auth/*` | `useAuth`, `AppClaims`, `BootGate` | Stale role/org claims on JWT until refresh; BootGate query duplicates RLS check; no a11y on login form |
| **App shell** | `src/components/AppShell.tsx`, `src/App.tsx` | `nav` array, route table | All 27 routes eagerly bundled (679 KB single chunk); nav is hardcoded with no active-indicator a11y label |
| **Properties / units** | `src/pages/properties/*`, `src/pages/units/UnitDetailPage.tsx` | `NewPropertyModal`, `NewUnitModal`, status toggle mutation | Trigger `guard_unit_status` rejects 'unavailable' via UI? Yes — but UI does not surface why. PM can mutate unit status without being scoped to it on the unit-status mutation path? Yes, via property-scoped RLS on units. |
| **Leases (the giant)** | `src/pages/leases/LeaseDetailPage.tsx` (1078 LOC) | `NewChargeModal`, `NewPaymentModal`, `AllocateModal`, `TerminateModal`, `SettleDepositModal`, `ChargesTable`, `PaymentsTable` | Single file owns 7 modals + 2 tables + 6 queries; refactor target #1. `recorded_by` is set to `auth.getUser().data.user.id` from client — DB also enforces, but the client-side `await` adds latency. Ledger query has no refetch on mutation other than `invalidateQueries` (relies on TQ defaults — OK). |
| **Money model (DB authority)** | `supabase/migrations/2026..._triggers_money.sql`, `..._triggers_unit_status_and_guards.sql`, `..._jobs_rpcs.sql`, `..._reports.sql` | `recompute_charge_status`, `payment_allocations_guard`, `apply_lease_unit_status`, `finalize_lease_settlement` | Carefully built. `audit_trigger` uses `auth.uid()` which can be NULL inside SECURITY DEFINER fired from `run_scheduled_jobs` → audit rows with NULL `profile_id`. Not wrong; flag for awareness. |
| **Edge Functions** | `supabase/functions/**` | `invite-user`, `set-org-suspended`, `set-profile-status`, `import-csv`, `run-daily-jobs`, `send-email` | `set-org-suspended` iterates users and calls `updateUserById` serially — N round-trips; OK for MVP scale. CORS allow `*` — fine because JWT-protected, but tightening to known origins is a hardening win. `run-daily-jobs` reads `JOBS_SHARED_SECRET` from env; if unset, anyone with the URL fires the job. |
| **Reports / dashboard** | `src/pages/reports/*`, `src/pages/dashboard/DashboardPage.tsx`, `supabase/migrations/..._reports.sql` | `v_rent_roll`, `v_charge_balances`, `v_lease_ledger`, `rpt_dashboard`, `rpt_arrears_aging`, `rpt_collection_summary`, `rpt_property_income` | Views are unindexed (no materialization). For small portfolios (50 properties / 2000 leases) fine. At scale, `v_lease_ledger` recomputes lateral subqueries per row. |
| **Maintenance** | `src/pages/maintenance/MaintenancePage.tsx` | `NewRequestModal`, `EditRequestModal` | Row-click opens edit modal but row is a `<tr>` with `onClick` — not keyboard-accessible. |
| **Notifications** | `src/pages/notifications/NotificationsPage.tsx` | mark-read + mark-all-read | No real-time channel; user must refresh. Acceptable for MVP. Unread badge missing in sidebar. |
| **Forms** | RHF + Zod across all "New …" modals | `*Schema` per page | Patterns are inconsistent — some forms refetch parent query manually, some rely on `invalidateQueries`. |
| **Storage** | `supabase/migrations/..._storage.sql` policies | buckets `documents`, `payment-proofs`, `property-photos` | No UI yet uploads. Policies are correct (org-prefixed path). |
| **CSV import / export** | `src/lib/csv.ts`, `src/pages/import/ImportPage.tsx`, `supabase/functions/import-csv/index.ts` | Papaparse parse/unparse, `do_csv_import` RPC | Server validates required cols + numbers; commits one giant `INSERT…SELECT FROM jsonb_array_elements`. Failure mode is "everything or nothing" — good for FR-IMP-2. No deduplication. |

## Severity-relevant invariants (must not break)

1. PM-RLS scoping: a PM may NEVER read or write across properties not in `app_pm_property_ids()` (pgTAP test exists).
2. `org_id` isolation: every row write must carry the caller's `org_id`; client must pass it; RLS `with check` enforces.
3. `payment_allocations` cap: `SUM(amount_applied) ≤ payment.amount` AND `≤ charge.amount` (DB-only).
4. Lease activation: blocked when unit is `under_maintenance` or `unavailable` (DB enforces).
5. Audit: every create/update/delete/void on leases/charges/payments/allocations/deductions writes an `audit_log` row. No client-visible UPDATE/DELETE policies on `audit_log`.
6. Money: numeric(14,2), never float. Confirmed in migrations.
7. Manila TZ for "today/overdue/due-soon". Confirmed.

## Cross-cutting concerns (per-file shape vs. cluster shape)

- **No code-splitting** — every page is in the initial bundle (679 KB JS). Reports pages are unlikely to be opened on first visit; route-level `lazy()` would split them.
- **Modal a11y** — `Modal` lacks `aria-labelledby`/`aria-describedby`, focus trap, and Escape handler also dismisses without focus restore.
- **Form a11y** — `Field` correctly pairs `htmlFor`/`id`, but error messages are rendered as bare `<p>` — no `aria-describedby` wiring to the input. Screen readers won't announce them.
- **Loading skeletons** — every list page shows "Loading…" text. No skeleton/spinner consistency.
- **Empty states** — `EmptyState` is consistent. Good.
- **Currency / date formatting** — single source `lib/format.ts`. Good.
- **Error toasts** — there is none. Errors render inline as red text per page; pattern is consistent but ad-hoc.
- **No global error boundary** — a thrown error in any page crashes the app.
- **No 404 page** — unknown routes redirect to `/dashboard`, which is harmless but hides typos.
