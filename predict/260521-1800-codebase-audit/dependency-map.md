---
commit_hash: 53d7bd39125121c1f435987ed01ff4cb05708b05
---

## Import / data-flow graph (selected high-traffic edges)

| Edge | From | To | Notes |
|------|------|----|-------|
| auth | `main.tsx` | `lib/auth.tsx` → `lib/supabase.ts` | Single Supabase client singleton imported app-wide |
| router | `App.tsx` | every `pages/**` | 27 eager imports — no `lazy()` / no `React.lazy` boundaries |
| boot-gate | `BootGate.tsx` | `from('profiles').select('status, organizations(status)').eq('id', user.id)` | One sequential round-trip after auth, blocks render |
| dashboard | `DashboardPage` | `rpc('rpt_dashboard')` | One call, RPC returns a single row |
| lease-detail | `LeaseDetailPage` | 6 queries (lease, charges, payments, allocations, ledger) | Allocations query depends on payments query (sequential — `enabled: !!payments.data`) |
| payments-list | `PaymentsPage` | `from('payments').select('..., leases(tenants(full_name), units(unit_label, properties(name))))` | 4-level nested join, no pagination cursor |
| reports | `Report*Page` | view or RPC | Property filter passed as nullable UUID |
| edge invoke | `lib/functions.ts` | `supabase.functions.invoke(name, body)` | All admin actions go through here |

## Money write paths (server-side authority)

```
Client UI (LeaseDetailPage)
   ↓ insert/update via supabase client
   ↓
RLS policy check (charges_admin / payments_pm / payment_allocations_admin etc.)
   ↓
BEFORE trigger
   - trg_charges_amount_guard      (amount-vs-allocated)
   - trg_charges_void_guard        (no void with active allocations)
   - trg_payments_void_cascade     (delete allocations on void)
   - trg_payment_allocations_guard (FOR UPDATE row lock + cap checks)
   - trg_leases_activate_guard     (no activate against under_maintenance)
   ↓
INSERT / UPDATE row
   ↓
AFTER trigger
   - trg_payment_allocations_after_change → recompute_charge_status(charge_id)
   - trg_payments_status_after_change     → recompute_charge_status for each touched charge
   - trg_leases_unit_status               → flips units.unit_status
   - trg_audit_*                          → audit_log INSERT (SECURITY DEFINER)
```

## RLS evaluation hot paths

- Every operational table has 3 policies (`*_superadmin`, `*_admin`, `*_pm`). PM policies on `leases`, `charges`, `payments`, `payment_allocations`, `deposit_deductions`, `maintenance_requests` use a correlated `exists (...)` against `units` joined to `app_pm_property_ids()`. The helper is SECURITY DEFINER so it bypasses RLS but every row check triggers a subquery — the `(SELECT app_pm_property_ids())` wrapper is correct, but PM-heavy orgs with thousands of charges will still pay the join per query.

## Edge Function dependency

```
pg_cron daily 22:00 UTC
  → net.http_post(jobs_url) [pg_net]
  → /functions/v1/run-daily-jobs
  → run_scheduled_jobs() RPC   (writes notifications)
  → SELECT * FROM v_notifications_to_email
  → for each: Resend.send()
  → UPDATE notifications SET email_sent_at = now()
```

## Auth & session flow

```
supabase.auth.signInWithPassword
  → Supabase Auth mints JWT
  → custom_access_token_hook reads profiles row
  → app_metadata = { role, org_id, profile_status }
  → onAuthStateChange fires
  → AuthProvider state updated → claims reflect new values
  → App.tsx routes; BootGate re-queries profile + org status
  → if either != 'active' → signOut + "access unavailable" screen
```

## Risk-flagged data flows

| Source | Sink | Risk |
|--------|------|------|
| `req.params.id` (Edge) | Supabase admin client | Some endpoints do not validate the target's `org_id` against caller (e.g. `set-org-suspended` IS superadmin-gated; `set-profile-status` checks `target.org_id === caller.org_id` — OK). Verify each. |
| Client `notes`, `description` text fields | DB → CSV export → user download | No XSS sink in MVP since CSV is downloaded, not rendered. UI renders these via `{value}` (React-escaped). Safe today, but `dangerouslySetInnerHTML` is never used. |
| `org_id` user-supplied on insert | Tables | RLS `with check` filters non-own-org inserts, but the client always passes `claims.org_id` — defense-in-depth at DB layer is sound. |
| `proof_url` text on `payments` | Rendered as link in UI? | Currently not surfaced in the UI; field exists but no display path. Future link rendering needs `target=_blank rel=noopener`. |
| `payment_allocations` UPSERT from `LeaseDetailPage.AllocateModal` | DB | UPSERT uses `onConflict: 'payment_id,charge_id'` — correct because of UNIQUE constraint. |
