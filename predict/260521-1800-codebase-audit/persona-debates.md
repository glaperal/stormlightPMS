# Persona analysis & debate — StormlightPMS audit

Commit `53d7bd3` · 5 personas · 2 debate rounds · default persona set.

Each finding is `<persona>-<n>` with file:line, severity, confidence, evidence, recommendation. Votes resolved in Phase 6 (consensus).

---

## Phase 4 — Independent Findings

### Architecture Reviewer (AR)

**AR-1 · LeaseDetailPage is 1,078 LOC and owns 7 inline components**
- `StormlightPMS/src/pages/leases/LeaseDetailPage.tsx:1-1078`
- Severity: **HIGH** · Confidence: HIGH
- Evidence: Single file declares the page + `ChargesTable`, `PaymentsTable`, `NewChargeModal`, `NewPaymentModal`, `AllocateModal`, `TerminateModal`, `SettleDepositModal`. 6 useQuery + 5+ useMutation hooks intermixed.
- Recommendation: Split into `pages/leases/LeaseDetail/{index.tsx,ChargesTable.tsx,PaymentsTable.tsx,modals/...}`. Hoist money-related logic into a `useLeaseLedger(leaseId)` hook in `src/hooks/`. Target <250 LOC per file.

**AR-2 · No code-splitting — 679 KB single chunk**
- `StormlightPMS/src/App.tsx:1-109` (eager imports for 27 routes); `StormlightPMS/vite.config.ts` (no manualChunks)
- Severity: HIGH · Confidence: HIGH
- Evidence: Vite build emits chunk-size warning. First-paint downloads all admin, reports, import code even for a PM whose role doesn't access them.
- Recommendation: Route-level `React.lazy()` on all `pages/**` except `auth/*` and `dashboard/*`; wrap in `<Suspense fallback={...}>` in `App.tsx`. Add `manualChunks` for `@supabase`, `@tanstack`, `react-router`, `date-fns` to share a vendor cache across deploys.

**AR-3 · Database.types.ts is a permissive placeholder; supabase client is untyped**
- `StormlightPMS/src/lib/database.types.ts:1-37`; `StormlightPMS/src/lib/supabase.ts:9-16`
- Severity: MEDIUM · Confidence: HIGH
- Evidence: `createClient` is called *without* `<Database>` because the placeholder collapses Insert/Update args to `never`. All `.from(...).insert(...)` calls fall back to `any`.
- Recommendation: Wire `supabase gen types typescript --local > src/lib/database.types.ts` into `npm run gen:types` (already a script) and call it in CI. Then re-add `createClient<Database>(...)` and remove `any`-leaning fallback. Until a local Supabase is set up, document the gen step in README.

**AR-4 · Inline modals everywhere — no shared form pattern**
- `StormlightPMS/src/pages/leases/LeaseDetailPage.tsx`, `tenants/TenantsPage.tsx:124-209`, `properties/PropertiesPage.tsx:104-205`, `properties/PropertyDetailPage.tsx:166-305`, `maintenance/MaintenancePage.tsx:165-364`
- Severity: MEDIUM · Confidence: HIGH
- Evidence: Each "New X" modal repeats the same RHF + Zod + invalidateQueries pattern with cosmetic variation; no shared `useEntityCreate` hook or `<FormModal>` primitive.
- Recommendation: Extract `<FormModal title submit cancel>{children}</FormModal>` plus `useCreateMutation({table, onCreated})` to halve modal code.

**AR-5 · Route table grows; no nested layout per area**
- `StormlightPMS/src/App.tsx:60-109`
- Severity: LOW · Confidence: HIGH
- Evidence: All 27 routes are siblings under `<AppShell>`. Reports / admin / import sections would benefit from nested routes.
- Recommendation: `react-router` v6 nested routes — `<Route path="reports" element={<ReportsLayout/>}>...children</Route>`. Cheap refactor; improves breadcrumbs and code-split granularity.

**AR-6 · No `src/hooks/` directory despite repeated query patterns**
- Repeated across `LeaseDetailPage`, `LeasesPage`, `LeaseNewPage`, `PropertiesPage`, etc.
- Severity: LOW · Confidence: MEDIUM
- Evidence: `useQuery({queryKey:['tenants'], queryFn: () => supabase.from('tenants').select(...)})` repeats verbatim in 4 files.
- Recommendation: Introduce `src/hooks/queries/{useTenants,useProperties,useLease,useLeaseLedger}.ts`. Smaller pages, single point of cache-key truth.

---

### Security Analyst (SA)

**SA-1 · run-daily-jobs runs with `verify_jwt = false`; only header secret guards it**
- `StormlightPMS/supabase/config.toml:50-51`; `StormlightPMS/supabase/functions/run-daily-jobs/index.ts:21-25`
- Severity: HIGH · Confidence: HIGH
- Evidence: `verify_jwt = false` exposes the function publicly. The handler checks `x-jobs-secret` against `JOBS_SHARED_SECRET` env, but the guard is conditional: `if (expected) { ... }`. **If `JOBS_SHARED_SECRET` is unset, the function accepts every request** — anyone can trigger the daily fanout (writing notifications, sending emails).
- Recommendation: Hard-fail when `JOBS_SHARED_SECRET` is unset: `if (!expected) return jsonResponse(503, {error:'misconfigured'})`. Document the secret as required in deploy notes / README. Optional: also validate `User-Agent` or rotate per-fire signed token.

**SA-2 · Tenant archive guard is client-only — FR-TEN-4 not enforced in DB**
- `StormlightPMS/src/pages/tenants/TenantDetailPage.tsx:62-78`; no DB constraint
- Severity: MEDIUM · Confidence: HIGH
- Evidence: The TS client checks `(leases.data ?? []).some(l => l.lease_status === 'active')` before flipping status to `archived`. A malicious authenticated admin can bypass via direct REST/SQL: `update tenants set status='archived' where id=…`. RLS allows the write (admin scope), there's no trigger.
- Recommendation: Add a `BEFORE UPDATE` trigger on `tenants` that rejects `status='archived'` when an active lease exists. Mirrors the FR-TEN-4 wording. Migration: `create function ... if NEW.status='archived' and EXISTS (active lease) raise exception ...`.

**SA-3 · Edge functions allow CORS from `*`**
- `StormlightPMS/supabase/functions/_shared/auth.ts:9-15`
- Severity: LOW · Confidence: HIGH
- Evidence: `'Access-Control-Allow-Origin': '*'`. Because every endpoint validates the JWT, this is mostly safe, but a stolen anon-key+token combo could be exfiltrated cross-origin.
- Recommendation: Replace `*` with `Deno.env.get('ALLOWED_ORIGIN') ?? 'https://app.stormlight.example'`. Configure per environment.

**SA-4 · `org_id` is set client-side on every insert and trusted to be the caller's**
- e.g. `StormlightPMS/src/pages/properties/PropertiesPage.tsx:158-163` (`org_id: orgId`), `tenants/TenantsPage.tsx:160-171`, `LeaseDetailPage.tsx:565,664,771,957`
- Severity: LOW · Confidence: HIGH
- Evidence: The client sources `org_id` from `claims.org_id`. RLS's `with check` enforces `org_id = (select app_org())`, so a tampered request is rejected. Defense-in-depth would put `org_id` on a DB default sourced from JWT.
- Recommendation: Replace per-table writes with a `set_org_id` BEFORE-INSERT trigger that overwrites `NEW.org_id := app_org()` when called by `authenticated`. Removes the column from client payloads entirely.

**SA-5 · Storage object-path enforcement assumes folder[1] == org_id; client must always prefix**
- `StormlightPMS/supabase/migrations/20260521091100_storage.sql:25-37`
- Severity: MEDIUM · Confidence: MEDIUM
- Evidence: Policies require `(storage.foldername(name))[1] = (select app_org())::text`. There is currently no upload UI exercising this. When the upload feature lands (FR-DOC-1, FR-PAY-5), client code MUST prefix `{bucket}/{org_id}/{entity_id}/{filename}`. A future regression that omits the prefix will silently fail with 403 and look like a bug.
- Recommendation: Centralise upload in `src/lib/storage.ts` with `uploadPrivate({bucket, entityId, file})` that constructs the path and surfaces explicit errors.

**SA-6 · Profile / org ban relies on JWT expiry (default 1h) for revocation**
- `StormlightPMS/supabase/config.toml:21` (`jwt_expiry = 3600`); `StormlightPMS/supabase/functions/set-org-suspended/index.ts:32-55`
- Severity: LOW · Confidence: HIGH
- Evidence: SRS §5.8 says Auth-ban is authoritative. But an already-issued JWT remains valid for up to one hour after a user is banned — they can keep reading data until the token expires (BootGate covers reload, but not in-tab usage). Documented limitation, but worth a UI-level periodic re-check.
- Recommendation: Add a 5-min interval in `AuthProvider` that calls `supabase.auth.getUser()` and signs out on any failure, OR call `auth.refreshSession()` on a long interval and let the access-token hook re-check `profile_status` (it already refuses claims for inactive profiles).

---

### Performance Engineer (PE)

**PE-1 · 679 KB single chunk on every page**
- `StormlightPMS/vite.config.ts`; build output
- Severity: HIGH · Confidence: HIGH
- Evidence: `vite build` warns. Reports/admin/import pages load even for a PM that hits `/dashboard`.
- Recommendation: Mirror AR-2 — route-level `lazy()` + `manualChunks` for vendor split. Expect main chunk to drop ~40-50% gzip.

**PE-2 · `LeaseDetailPage` cascades 6 queries; allocations waits on payments**
- `StormlightPMS/src/pages/leases/LeaseDetailPage.tsx:112-160`
- Severity: MEDIUM · Confidence: HIGH
- Evidence: `allocations` has `enabled: !!payments.data`. Round-trip count on first paint: lease → charges + payments + ledger (parallel) → allocations (sequential). Two waterfalls.
- Recommendation: Fold allocations into the payments query via Postgres JOIN, OR materialise ledger + allocations in a single RPC `get_lease_full(p_lease_id)` returning a JSON tree. Cuts to a single round-trip.

**PE-3 · BootGate re-queries `profiles` post-login despite JWT already carrying status**
- `StormlightPMS/src/components/BootGate.tsx:18-44`
- Severity: MEDIUM · Confidence: HIGH
- Evidence: `app_metadata.profile_status` is already on the JWT (via `custom_access_token_hook`). The BootGate query duplicates that check and adds a round-trip on every full-page load.
- Recommendation: For non-superadmin, read `profile_status` and `org_status` from `claims` first; only query DB when a stale claim is suspected (e.g. refresh on tab focus). Note: org_status is not currently on JWT — add it to the hook output, then this becomes free.

**PE-4 · Sequential `updateUserById` in set-org-suspended**
- `StormlightPMS/supabase/functions/set-org-suspended/index.ts:46-55`
- Severity: LOW · Confidence: HIGH
- Evidence: `for (const p of profs) { await admin.auth.admin.updateUserById(...) }`. For an org with 50 users, that's 50 round-trips.
- Recommendation: `await Promise.all(profs.map(p => admin.auth.admin.updateUserById(p.id, {ban_duration})))`. Cuts wall-time by ~50×.

**PE-5 · `v_lease_ledger` recomputes lateral subqueries per lease**
- `StormlightPMS/supabase/migrations/20260521091300_reports.sql:23-60`
- Severity: LOW · Confidence: MEDIUM
- Evidence: Three CTEs (`payments_total`, `allocated_total`, `charge_total`) each group over the full table. For per-lease lookups it's fine; for rent-roll-wide reads it's an O(N) scan.
- Recommendation: Acceptable at MVP scale (≤2 000 leases / SRS NFR-2). Document; revisit when latency >250 ms.

**PE-6 · No pagination on list pages (200-500 row limits)**
- `StormlightPMS/src/pages/payments/PaymentsPage.tsx:44`, `properties/PropertiesPage.tsx:48`, `tenants/TenantsPage.tsx:42`, `notifications/NotificationsPage.tsx:23`
- Severity: LOW · Confidence: HIGH
- Evidence: Hardcoded `.limit(200)` / `.limit(500)`. SRS NFR-1 requires pagination at 25 rows.
- Recommendation: Add a cursor (`payment_date < lastSeen`) or page-number pagination. Use TQ `keepPreviousData: true`.

---

### Reliability Engineer (RE)

**RE-1 · No global error boundary**
- `StormlightPMS/src/main.tsx:13-26`, `App.tsx`
- Severity: HIGH · Confidence: HIGH
- Evidence: An uncaught render error anywhere in any page crashes the whole tree to a white screen. No `componentDidCatch` boundary.
- Recommendation: Add `src/components/ErrorBoundary.tsx` wrapping `<App/>` inside `BrowserRouter`. Surface "Something went wrong" + "Reload" button + send error to console (later: telemetry).

**RE-2 · `audit_trigger` writes NULL `profile_id` when fired from `run_scheduled_jobs` (SECURITY DEFINER, no JWT)**
- `StormlightPMS/supabase/migrations/20260521090900_triggers_unit_status_and_guards.sql:165-201`
- Severity: MEDIUM · Confidence: HIGH
- Evidence: `audit_trigger` reads `auth.uid()`. When the scheduled job marks leases `expired` (`UPDATE leases SET lease_status='expired' …` inside `run_scheduled_jobs`), `auth.uid()` is NULL → audit row has no actor and no signal that the system did it.
- Recommendation: Use `coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)` and either reserve a system UUID or store actor type. Simpler: add a `actor text` column to `audit_log` ('user' / 'system') populated from `current_setting('request.jwt.claims', true)` presence.

**RE-3 · Modal a11y gaps: no `aria-labelledby`, no focus trap, no focus restore**
- `StormlightPMS/src/components/ui/Modal.tsx:1-43`
- Severity: MEDIUM · Confidence: HIGH
- Evidence: `<div role="dialog" aria-modal="true">` but the title has no `id` linked via `aria-labelledby`. Focus is not trapped (Tab leaks to background). Escape closes but focus is not restored to the trigger button.
- Recommendation: Add `aria-labelledby={titleId}`, set `tabIndex={-1}` on the wrapper, capture focus on open, return on close. Use a hook `useFocusTrap()` or pull in `@headlessui/react` Dialog.

**RE-4 · Form field errors not announced — `aria-describedby` not wired**
- `StormlightPMS/src/components/ui/Field.tsx:1-25`
- Severity: MEDIUM · Confidence: HIGH
- Evidence: Error `<p>` is rendered as a sibling but the input has no `aria-describedby={errorId}` and no `aria-invalid`. Screen readers won't announce validation errors.
- Recommendation: Refactor `Field` to accept the input as a render prop (or `cloneElement`) so it can attach `aria-invalid` and `aria-describedby` automatically when `error` is set.

**RE-5 · No 404 page — unknown routes silently redirect**
- `StormlightPMS/src/App.tsx:106-107`
- Severity: LOW · Confidence: HIGH
- Evidence: `<Route path="*" element={<Navigate to="/dashboard" replace />}/>`. Typos and stale links produce no signal.
- Recommendation: Render `<NotFoundPage>` that shows the attempted URL and a "back" link.

**RE-6 · No optimistic UX / no loading skeletons**
- Across list pages
- Severity: LOW · Confidence: HIGH
- Evidence: Every list shows `"Loading…"` text. Slow connections see a blank table for seconds.
- Recommendation: A shared `<TableSkeleton rows={5} cols={N}/>` + react-query's `placeholderData` for snappier transitions.

---

### Devil's Advocate (DA)

**DA-1 · "Audit + refactor" without a usability owner will optimise for code, not users**
- Non-code: SRS §11.1 A5 (branding undefined); PRD usability assumptions
- Severity: HIGH · Confidence: MEDIUM
- Evidence: There is no real user (a landlord, a PM) being tested against. Refactors that "feel cleaner" can regress real flows (e.g. record-payment-in-under-2-min per NFR-7). The team is mid-MVP — premature polish is expensive.
- Recommendation: Before any refactor, time the four critical flows on the current build: (1) login → record payment, (2) login → create lease, (3) login → settle deposit, (4) login → run rent-roll. Save baseline. Any change that regresses any of the four >10% is reverted regardless of "code cleanliness."

**DA-2 · The whole product hinges on a custom access-token hook that is not exercised in this repo**
- `StormlightPMS/supabase/migrations/20260521090400_access_token_hook.sql:1-52`; `supabase/config.toml:27-29`
- Severity: HIGH · Confidence: MEDIUM
- Evidence: The hook is critical (claims wrong → wrong RLS scoping → cross-org leakage). It is enabled in `config.toml` but no pgTAP test validates that the hook actually mints the claims the SPA expects. If a Supabase upgrade changes the hook contract, the app silently loses access.
- Recommendation: Add a Deno test for `custom_access_token_hook` that calls it directly with a constructed event JSONB and asserts `app_metadata.role / org_id / profile_status`. Run in CI.

**DA-3 · CSV import has no dry-run preview — irreversible at the user's risk**
- `StormlightPMS/src/pages/import/ImportPage.tsx:127-156`; `supabase/functions/import-csv/index.ts:51-67`
- Severity: MEDIUM · Confidence: HIGH
- Evidence: After validation passes, clicking "Import" commits the whole file. There is no "what will I create" preview beyond the parsed-CSV table. Users will paste the wrong file at least once.
- Recommendation: Surface FK lookups in the preview (`property_id` → property name; `tenant_id` → tenant name). Highlight rows where the FK doesn't resolve. Add an explicit confirmation modal showing "X properties / Y units will be created. Continue?".

**DA-4 · Maintenance rows are clickable `<tr>` — keyboard users locked out**
- `StormlightPMS/src/pages/maintenance/MaintenancePage.tsx:139-155`
- Severity: MEDIUM · Confidence: HIGH
- Evidence: `<tr ... onClick={() => setEditing(true)}>` — `tr` is not focusable, no Enter/Space handler. WCAG 2.1.1 fail.
- Recommendation: Add a trailing column with a `<button>Edit</button>` instead of row-click; or wrap each row in `tabIndex={0}` with keyboard handler.

**DA-5 · No telemetry, no error logging, no usage signal**
- `StormlightPMS/src/**` — searched: no Sentry, no PostHog, no plausible.
- Severity: MEDIUM · Confidence: HIGH
- Evidence: When a real landlord hits a bug, the team finds out by being emailed.
- Recommendation: One-line PostHog or Sentry init in `main.tsx`. Defer if privacy review pending, but flag the gap.

**DA-6 · Sidebar shows no unread notification count**
- `StormlightPMS/src/components/AppShell.tsx:25-43`
- Severity: LOW · Confidence: HIGH
- Evidence: `Notifications` nav item is text-only. The notifications page exists; the badge does not.
- Recommendation: Add a `useUnreadCount()` hook backed by a TQ query polling every 60 s; render a small `{count > 0 && <span class="badge">…</span>}` next to the nav label.

---

## Phase 5 — Debate (2 rounds)

### Round 1

**AR challenge → SA-3 (CORS `*`)** — disagree. JWT validation makes this LOW risk; bumping to MEDIUM by reflex is overreach. Stand by LOW.

**SA challenge → AR-3 (placeholder types)** — agree, escalate. Untyped client conceals query mistakes that show up as runtime 400s — degrades reliability too. Promote AR-3 to **HIGH**.

**PE challenge → AR-1 (1078 LOC file)** — partial dissent. File size alone isn't a defect; the *coupling* is. Reframe AR-1 to specifically call out the 7 inline components and the resulting re-render fan-out, not raw LOC. Severity holds at HIGH.

**RE challenge → DA-2 (no hook test)** — confirm and elevate. Without coverage, a Supabase version bump silently breaks production. RE adds: the same applies to `handle_new_user` and `payment_allocations_guard`. Promote DA-2 to **HIGH** confidence.

**DA challenge → SA-1 (jobs-secret guard)** — confirm. Concedes "with conditions": worse if Supabase env vars are loaded from a `.env` file that omits `JOBS_SHARED_SECRET` during dev — and someone deploys that config to prod. Recommend fail-loud at startup.

**RE challenge → PE-3 (BootGate query)** — partial disagree. The duplicate query is also defence-in-depth against stale JWTs (a banned user with a 50-min-old token would still be allowed if we trusted claims alone). Recommend: keep the check but skip it if the JWT was minted <60 s ago.

**DA challenge → RE-5 (no 404)** — concede with caveat. Low severity, but it interacts with deep-linked email reminders (notifications include lease URLs) — a deleted/voided lease's URL today silently lands on dashboard, hiding data loss. Bump severity from LOW to **MEDIUM**.

**Devil's Advocate non-code finding (mandatory):** `DA-7` — **Branding & visual identity undefined (SRS A5)**. The PRD calls for a brand kit; today we ship neutral Tailwind. The first paying landlord sees a "developer tool" aesthetic that hurts trust. Severity MEDIUM, confidence HIGH, location `StormlightPMS/CLAUDE.md:82`. Recommendation: pin GVL on a brand-kit decision before any further UI work.

### Round 2

**AR revised AR-2 (code-splitting)** — adds `vendor` split is critical because the user re-deploys frequently during MVP; without vendor split, every user re-downloads React + Supabase on every push. Keep severity HIGH.

**SA revised SA-1** — accepts DA's "fail-loud" framing; updates recommendation to require startup assertion AND a daily health-check ping that confirms the secret is set.

**PE revised PE-2** — withdraws the "one RPC" recommendation as overkill for MVP. Replaces with: change `allocations` queryFn to fire in parallel with payments using a separate `from('payment_allocations').select('...').eq('lease_id', leaseId)` — needs a `lease_id` column added to `payment_allocations` (currently joins via `payment_id`). Minor migration. Keep MEDIUM. **NOTE:** Adding `lease_id` is a migration, which the user excluded from scope. Drop the migration suggestion; alternative is to denormalise on the client by fetching once on payments invalidate. Keep MEDIUM but mark fix-out-of-scope.

**RE revised RE-2** — confirms after debate: audit gap is real and writable without DB migration (could be done in functions, but underlying fix needs a column → out of scope). Lower to **LOW** severity since the scheduled-job actor is system, and the audit row still proves "something happened on date X."

**DA challenges majority "AR-2 is critical"** — counter: maybe the 679 KB is fine. PMs use the app from a desk on Manila broadband. Devil's Advocate concedes after Round 1 framing on re-deploy cost. Keeps as MEDIUM in DA's own ranking, but won't dispute the majority HIGH.

**Anti-herd check.** Out of 36 findings (30 + DA-7 + 5 revised from debate), only 2 had ≥80% same-direction flips in Round 1 (AR-3 and DA-2). Flip rate = 2/36 = 0.06 (well below 0.8). Entropy across severity buckets ≈ 0.71. **GROUPTHINK WARNING NOT TRIGGERED.**
