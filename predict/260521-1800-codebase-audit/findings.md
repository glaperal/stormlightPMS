# StormlightPMS — Consolidated findings (post-debate)

Commit `53d7bd3`. Priority score = `severity_weight*0.4 + confidence_boost*0.2 + consensus_ratio*0.4` (CRIT=4 HIGH=3 MED=2 LOW=1; HIGH=1.0 MED=0.6 LOW=0.3). Sorted by priority desc.

## Top 12 (in-scope for fix loop)

### 1 · No global error boundary — white-screen on any render error · 4/5 confirm · HIGH · score 2.40
`src/main.tsx`, `src/App.tsx`. Add `src/components/ErrorBoundary.tsx`, wrap `<App/>`. Show fallback + "Reload" button. → RE-1

### 2 · No code-splitting; 679 KB single chunk · 5/5 confirm · HIGH · score 2.40
`src/App.tsx`, `vite.config.ts`. Route-level `React.lazy()` for every `pages/**` except `auth/*` and `dashboard/*`. Add `manualChunks` for vendor split (`react`, `@supabase`, `@tanstack`, `react-router`, `date-fns`). → AR-2 / PE-1

### 3 · `LeaseDetailPage.tsx` is 1,078 LOC; 7 inline modals/tables coupled · 4/5 confirm · HIGH · score 2.36
`src/pages/leases/LeaseDetailPage.tsx`. Split into `pages/leases/LeaseDetail/{index, ChargesTable, PaymentsTable, hooks/useLeaseLedger, modals/*}`. Target <250 LOC per file. → AR-1

### 4 · `run-daily-jobs` fails open when `JOBS_SHARED_SECRET` is unset · 4/5 confirm · HIGH · score 2.36
`supabase/functions/run-daily-jobs/index.ts:21-25`, `supabase/config.toml:50-51`. Hard-fail when secret is unset. Document as required env. → SA-1

### 5 · No `aria-labelledby`, focus trap, focus restore on `Modal` · 4/5 confirm · MEDIUM · score 1.96
`src/components/ui/Modal.tsx`. Add `aria-labelledby`, lock focus while open, restore to opener on close. WCAG 2.1.1 + 2.4.3. → RE-3

### 6 · Form errors not announced (no `aria-describedby` / `aria-invalid`) · 4/5 confirm · MEDIUM · score 1.96
`src/components/ui/Field.tsx`. Refactor `Field` to wire `aria-invalid` + `aria-describedby` when error is set. → RE-4

### 7 · Maintenance row click not keyboard-accessible · 3/5 confirm · MEDIUM · score 1.80
`src/pages/maintenance/MaintenancePage.tsx:139-155`. Replace `<tr onClick>` with explicit "Edit" button in a trailing cell. → DA-4

### 8 · Sidebar lacks unread notifications badge · 4/5 confirm · LOW · score 1.36
`src/components/AppShell.tsx`. Add `useUnreadCount()` hook + small badge next to "Notifications" nav item. → DA-6

### 9 · Tenant archive guard is client-only (FR-TEN-4 not enforced in DB) · 3/5 confirm · MEDIUM · OUT-OF-SCOPE (migration)
`src/pages/tenants/TenantDetailPage.tsx`. Real fix requires a DB trigger but `supabase/migrations/**` is excluded. **Mitigation in-scope:** also call a server-side check before flipping status (use an Edge fn or trust DB on next phase). Documented; not fixed this run. → SA-2

### 10 · CSV import has no FK preview / no commit confirmation · 3/5 confirm · MEDIUM · score 1.60
`src/pages/import/ImportPage.tsx:127-156`. Resolve `property_id` → property name in preview; highlight unresolved FKs; add confirmation modal. → DA-3

### 11 · No 404 page; deep-linked stale lease URLs silently land on dashboard · 4/5 confirm · MEDIUM (post-debate bump) · score 1.84
`src/App.tsx:106-107`. Add `NotFoundPage` showing attempted URL + "back" link. → RE-5

### 12 · `BootGate` round-trips redundantly on every page load · 3/5 confirm · MEDIUM · score 1.60
`src/components/BootGate.tsx:18-44`. Skip DB query when JWT was minted <60 s ago (use `session.user.created_at` proxy). Acceptable: keep the check but conditional. → PE-3

## Below the cut (acknowledged, not in this fix loop)

- AR-3 (types regen): requires `supabase login` + local stack. Documented in README — script `npm run gen:types` exists.
- AR-4, AR-5, AR-6 (DRY refactors): batch later; not user-visible.
- SA-3 (CORS): LOW, JWT-protected. Defer.
- SA-4 (org_id from JWT trigger): requires migration.
- SA-5 (storage upload helper): no upload UI exists yet.
- SA-6 (banned-user latency): 1 h JWT, acceptable.
- PE-4 (parallel ban): nice-to-have for orgs >50 users.
- PE-5 (lateral subqueries): OK at MVP scale.
- PE-6 (pagination): NFR-1 requires 25-row pagination; deferred to a separate pagination pass — touches every list page.
- RE-2 (system audit actor): needs `audit_log` column — migration.
- RE-6 (skeletons): defer; not user-blocking.
- DA-1 (usability owner / flow baselines): operational, not code.
- DA-2 (no hook test): great idea; needs Supabase CLI in CI.
- DA-5 (telemetry): pending privacy decision.
- DA-7 (branding): blocked on GVL.
