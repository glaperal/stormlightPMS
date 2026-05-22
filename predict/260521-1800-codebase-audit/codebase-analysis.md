---
commit_hash: 53d7bd39125121c1f435987ed01ff4cb05708b05
analyzed_at: 2026-05-21T18:00:00+08:00
scope: StormlightPMS/** except supabase/migrations/** (read for context but not modified per user policy)
files_analyzed: 56
loc_total: 8214 (5288 TS/TSX + 2926 SQL/Edge TS)
---

## Project shape

Vite + React 18 + TypeScript SPA over Supabase. Single bundle (no code-splitting). Auth via Supabase Auth + custom access-token hook. State: TanStack Query over `@supabase/supabase-js`. Forms: React Hook Form + Zod. Style: Tailwind. Edge Functions in Deno (`supabase/functions/`).

## SPA entry & shell

| File | Role | LOC | Notes |
|------|------|-----|-------|
| `src/main.tsx` | Bootstrap | 28 | QueryClient + BrowserRouter + AuthProvider |
| `src/App.tsx` | Route table | 109 | 27 routes, all eagerly imported |
| `src/components/AppShell.tsx` | Sidebar nav | 73 | Static nav array filtered by role |
| `src/components/BootGate.tsx` | Session + status gate | 70 | Queries `profiles` joined with `organizations` post-login |
| `src/components/RequireRole.tsx` | Role guard | 14 | Wraps `<Routes>` children |
| `src/lib/auth.tsx` | Auth context | 79 | Reads JWT app_metadata for `role`/`org_id` |
| `src/lib/supabase.ts` | Client singleton | 26 | Untyped (placeholder Database) |
| `src/lib/format.ts` | Currency + dates | 31 | All Manila TZ, `date-fns-tz` |
| `src/lib/csv.ts` | Papaparse wrapper | 34 | Client export + parse |
| `src/lib/functions.ts` | Edge fn invoke | 13 | Thin `supabase.functions.invoke` |
| `src/lib/addresses.ts` | PH address util | 14 | Format helper only |

## Pages (27 routes)

| Page | LOC | Mutations | Notes |
|------|-----|-----------|-------|
| `auth/LoginPage` | 76 | signIn | Surfaces `SUPABASE_CONFIGURED` banner |
| `auth/ResetPasswordPage` | 51 | resetPasswordForEmail | Standard flow |
| `auth/UpdatePasswordPage` | 44 | updateUser | Post-recovery |
| `dashboard/DashboardPage` | 51 | — | Reads RPC `rpt_dashboard()` |
| `properties/PropertiesPage` | 206 | insert | Inline modal `NewPropertyModal` |
| `properties/PropertyDetailPage` | 306 | update status, insert unit | Single-file with unit modal |
| `units/UnitDetailPage` | 180 | update unit_status | Manual `under_maintenance`/`unavailable`/`vacant` |
| `tenants/TenantsPage` | 209 | insert | Client-side text filter |
| `tenants/TenantDetailPage` | 170 | update status | Client-side guard "active-lease blocks archive" |
| `leases/LeasesPage` | 106 | — | Status filter |
| `leases/LeaseNewPage` | 206 | insert | Pulls vacant units + active tenants |
| `leases/LeaseDetailPage` | **1078** | activate, terminate, settle, void charge/payment, allocate | Outsized; contains 5 inline modal components, 2 inline tables |
| `payments/PaymentsPage` | 150 | — | Date+method filter, CSV export |
| `maintenance/MaintenancePage` | 364 | insert + update | Inline list + 2 modals |
| `notifications/NotificationsPage` | 105 | mark read | List + "mark all" |
| `admin/OrganizationsPage` | 144 | insert + suspend (Edge fn) | superAdmin only |
| `admin/UsersPage` | 209 | invite (Edge fn), toggle status (Edge fn) | superAdmin/admin |
| `admin/OrgSettingsPage` | 111 | update | Reminder windows, thresholds CSV |
| `admin/AssignmentsPage` | 156 | insert + delete | PM↔property pairs |
| `import/ImportPage` | 289 | invoke Edge fn `import-csv` | 4 entity templates inline |
| `reports/ReportsPage` | 23 | — | Hub of 4 report links |
| `reports/ReportRentRollPage` | 138 | — | View `v_rent_roll`, property filter |
| `reports/ReportArrearsPage` | 71 | — | RPC `rpt_arrears_aging()` |
| `reports/ReportCollectionPage` | 136 | — | RPC `rpt_collection_summary(from,to,prop)` |
| `reports/ReportPropertyIncomePage` | 92 | — | RPC `rpt_property_income(from,to)` |

## UI primitives

`PageHeader`, `StatusBadge`, `EmptyState`, `Modal`, `Field` — all in `src/components/ui/`. ~30 LOC each. `Modal` is uncontrolled focus, no a11y focus trap, no labelled-by linkage to title.

## Edge Functions (Deno)

| Function | Verifies JWT | Service-role used | Notes |
|----------|---------------|----------------------|-------|
| `_shared/auth.ts` | helper | Yes | `getCallerProfile`, `adminClient`, `corsHeaders` |
| `_shared/email.ts` | — | RESEND_API_KEY | Resend wrapper |
| `invite-user` | yes (verify_jwt=true) | yes | Validates caller is admin/superadmin, calls `inviteUserByEmail` |
| `set-org-suspended` | yes | yes | superadmin only; bans all users in org via `updateUserById` |
| `set-profile-status` | yes | yes | Admin can only toggle PM in own org |
| `send-email` | yes | RESEND only | Caller auth check, then Resend |
| `run-daily-jobs` | **no (verify_jwt=false)** | yes | Guarded by `JOBS_SHARED_SECRET` header; calls `run_scheduled_jobs()` RPC + emails |
| `import-csv` | yes | yes | Validates rows server-side, calls `do_csv_import` RPC |

## Database surface (SQL, read-only)

**Tables:** organizations, profiles, property_assignments, properties, units, tenants, leases, charges, payments, payment_allocations, deposit_deductions, maintenance_requests, documents, notifications, audit_log, org_settings (16).

**Helpers:** `app_role()`, `app_org()` (JWT-only), `app_pm_property_ids()` (SECURITY DEFINER → reads `property_assignments`).

**Trigger functions referenced:** `set_updated_at`, `handle_new_user`, `handle_new_organization`, `custom_access_token_hook`, `recompute_charge_status`, `payment_allocations_guard`, `payment_allocations_after_change`, `payments_status_after_change`, `charges_amount_guard`, `charges_void_guard`, `payments_void_cascade`, `apply_lease_unit_status`, `leases_activate_guard`, `guard_charge_status`, `guard_unit_status`, `audit_trigger`, `enforce_assignment_role`.

**RPCs called from client:** `rpt_dashboard`, `rpt_arrears_aging`, `rpt_collection_summary`, `rpt_property_income`, `finalize_lease_settlement`. **Called only from Edge:** `run_scheduled_jobs`, `do_csv_import`, `copy_charges`.

**Views read by client:** `v_lease_ledger`, `v_rent_roll`, `v_charge_balances`. **Read only by Edge fn:** `v_notifications_to_email`.

## Build & tooling

- `package.json`: react 18.3, react-router 6, tanstack-query 5, supabase-js 2.45, papaparse 5, react-hook-form 7, zod 3, tailwind 3.4, date-fns + date-fns-tz, clsx + tailwind-merge. No ESLint config beyond `"eslint": "^9.12.0"` in devDeps — `eslint .` runs but has no project config file.
- Production bundle: **679 KB JS / 187 KB gzip** (single chunk). Vite emits the >500KB warning on every build.
- `tsconfig.app.json` is strict (`strict: true`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`). `noEmit: true` so build runs Vite only.
- No tests for the SPA. Only pgTAP under `supabase/tests/`.
