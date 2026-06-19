# StormlightPMS — Claude Code instructions

**StormlightPMS** is a multi-tenant property-management SaaS for Filipino lessors (landlords). It is a product line of Stormlight Inc. The app is **substantially built** — every screen exists under `src/pages/**`, 14 SQL migrations are applied, and the design system is being retrofitted onto the placeholder UI. This is no longer a greenfield scaffold; most work now is feature extension, fixes, and the v0.3 Philippine-specific features.

**The build contract is `StormlightPMS_SRS_v0.2.md`** (the file name is unchanged but its contents are now **v0.3** — see its header and changelog §0a). Read the relevant section before any task. If a request conflicts with the SRS, stop and flag the conflict — do not silently pick a side. Rationale and the v1.0↔v0.2 reconciliation live in `StormlightPMS_Spec_Reconciliation.md`; the SRS wins on any disagreement. The archived "v1.0" combined PRD/SRS (conceptually older — the version numbers were inverted) is kept for provenance at `archive/StormlightPMS_v1.0_ARCHIVED.md`.

### Current state vs. spec

- **Built (v0.2 baseline):** auth + provisioning, properties/units/tenants/leases CRUD, the normalized money model (charges/payments/allocations/deposits), maintenance, documents, notifications, scheduled jobs, reports, CSV import, and full RLS. The 14 migrations are all dated `20260521…` (v0.2 era).
- **Specced but NOT yet built (v0.3, decisions D5–D8):** PDC (Post-Dated Check) Digital Vault (§6.14), BIR Form 2307 / 5% CWT withholding + `pending_form_2307` escrow state (§6.15), utility sub-metering (§6.16), and optional polymorphic unit `specs` JSONB (§4.6). These modify the charge-status and allocation triggers — read SRS §9.4 and the reconciliation report §5 before touching money triggers. When implementing them, write **new** migrations; do not edit the applied `20260521…` files.

## Stack — fixed, do not substitute

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React + TypeScript, single-page app |
| Routing | React Router |
| Server state | TanStack Query over `@supabase/supabase-js` |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS |
| Backend | Supabase only — Postgres, Auth, Storage, Edge Functions (Deno), pg_cron, pg_net, Vault |
| Hosting | Static build on Vercel |

No Next.js. No SSR. No VPS or self-hosted services. No ORM — use the Supabase client and SQL migrations directly.

## Repo layout (this directory is the app root)

```
src/
  main.tsx                    — entry; mounts providers (see below)
  App.tsx                     — auth gate + React Router routes (lazy-loaded)
  components/                 — AppShell, BootGate, RequireRole, ErrorBoundary, ui/*
  hooks/                      — shared hooks (e.g. useUnreadCount)
  lib/
    supabase.ts               — singleton Supabase client
    auth.tsx                  — AuthProvider, useAuth, hasRole; reads JWT app_metadata claims
    functions.ts              — invokeFunction() wrapper for Edge Functions
    database.types.ts         — generated types; never hand-edit (currently a permissive placeholder)
    format.ts, csv.ts, addresses.ts, cn.ts
  pages/                      — one folder per feature area; route components
  styles/                     — tokens.css (design system), index.css
supabase/
  migrations/                 — 14 numbered SQL migrations (never edit an applied one)
  tests/                      — pgTAP RLS + trigger tests
  functions/                  — Deno Edge Functions (+ _shared/)
  config.toml                 — local stack + per-function verify_jwt + access-token hook
design-handoff/               — delivered brand kit (JSX/CSS reference; not imported at runtime)
StormlightPMS_SRS_v0.2.md     — build contract (contents are v0.3)
StormlightPMS_Spec_Reconciliation.md, DESIGN_SYSTEM_INTEGRATION_PLAN.md
archive/StormlightPMS_v1.0_ARCHIVED.md
```

## App architecture (frontend)

- **Provider stack** (`main.tsx`): `ErrorBoundary` → `QueryClientProvider` → `BrowserRouter` → `AuthProvider` → `App`. TanStack Query defaults: `staleTime: 30s`, `refetchOnWindowFocus: false`, `retry: 1`.
- **Auth gating** (`App.tsx`): no session → only `/login`, `/reset-password`, `/update-password`. With a session → `BootGate` → `AppShell` → lazy-loaded routes inside `<Suspense>`. Auth screens and the dashboard are eager; everything else is route-split.
- **Roles** are `superadmin | admin | property_manager`, read from JWT `app_metadata` (`role`, `org_id`, `profile_status`) via `useAuth()` — never fetched from the DB on the client. Guard routes with `<RequireRole roles={[…]}>` and nav links with `hasRole(claims, …)`. Server-side, RLS is the real boundary; client guards are UX only.
- **Edge Functions** are called through `invokeFunction(name, payload)` in `src/lib/functions.ts`, not `supabase.functions.invoke` directly.
- **Path alias:** `@/` → `src/` (configured in `vite.config.ts` and `tsconfig`). Vendor chunks are manually split in `vite.config.ts`; keep any chunk under the 300 KB warning limit.

## Dev workflow & commands

Run all `npm` scripts from this directory (`StormlightPMS/`). Copy `.env.example` → `.env.local` and set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (the app boots without them but all data calls fail).

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | `tsc -b` typecheck **then** `vite build` |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint 9 flat config (`eslint.config.js`) |
| `npm run gen:types` | regenerate `src/lib/database.types.ts` from the local DB |
| `supabase start` / `supabase db reset` | local Postgres stack; reset replays every migration |
| `supabase test db` | run the pgTAP suite in `supabase/tests/` |

Before committing: `npm run lint` and `npm run typecheck` (or `npm run build`) must be clean. Backend hosting is a static build on Vercel; the database/auth/storage/functions are all Supabase.

## Database rules — non-negotiable

- One migration file per logical change, timestamp-numbered. **Never edit a migration that has been applied** — write a new one.
- After every migration: run `supabase gen types typescript` and commit the result.
- `supabase db reset` must replay all migrations cleanly. If it doesn't, the migration is wrong.
- Every operational table: `org_id` column, `ENABLE` **and** `FORCE ROW LEVEL SECURITY`, no policy for the `anon` role.
- Helper functions are named `app_role()`, `app_org()`, `app_pm_property_ids()`. Never name anything `current_role` (reserved Postgres function).
- `app_role()` / `app_org()` read JWT claims only — never `SELECT` from `profiles` inside a policy or helper (recursion).
- RLS policies wrap helper calls as `(SELECT app_org())` so they evaluate once per query.
- Index every `org_id` and every foreign-key column.
- Trigger-maintained columns (`charge_status`, `payment_status`, `unit_status`, `updated_at`) are never written by the client.
- Money columns are `numeric(14,2)`. Never use float for currency.
- Financial integrity (payment allocation limits) lives in DB triggers with `SELECT ... FOR UPDATE` row locking — never in the app layer.
- Never hard-delete `leases`, `charges`, `payments`, `payment_allocations`, `deposit_deductions`, `audit_log` — void or archive (SRS §4.21).

## RLS is test-first

For each table, write the pgTAP test alongside the policy: a positive case, a cross-org negative case, and a cross-assignment negative case for PMs. A table is not done until `supabase test db` is green. CI runs the suite on every migration. New tables (e.g. the v0.3 PDC/CWT/sub-metering work) follow the same rule.

## Conventions

- **Timezone:** every "today/overdue/due-soon" computation is `(now() AT TIME ZONE 'Asia/Manila')::date`. Never bare `current_date` or `now()` for business dates. Manila is UTC+8, no DST.
- **Currency:** display as `₱` with comma thousands and two decimals.
- **Addresses:** Philippine hierarchy — region → province → city/municipality → barangay → street.
- TypeScript everywhere; no `any` in committed code. SQL keywords lowercase.

## Secrets

Service-role key and the Resend API key live in Supabase Vault and are used only inside Edge Functions. The browser bundle holds only the anon/publishable key. Never put a service-role key in `/src` or in any committed file.

## Working agreement

- Keep diffs small enough to review — security tables especially.
- State which SRS requirement IDs a change implements.
- If something in the SRS is ambiguous or looks wrong, raise it before coding — do not guess.
- **Branding is now defined.** The Stormlight brand kit was delivered (deep navy + teal + warm gold; Spectral / Plus Jakarta Sans / JetBrains Mono) and lives in `src/styles/tokens.css`; `design-handoff/` is the source reference and `DESIGN_SYSTEM_INTEGRATION_PLAN.md` tracks the retrofit (closing SRS assumption A5). Style screens via the design tokens, not ad-hoc colors. Do not invent new brand colors.
