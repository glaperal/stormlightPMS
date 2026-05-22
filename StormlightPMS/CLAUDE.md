# StormlightPMS — Claude Code build instructions

You are building **StormlightPMS**, a multi-tenant property-management SaaS for Filipino landlords. StormlightPMS is a product line of Stormlight Inc.

**The build contract is `StormlightPMS_SRS_v0.2.md`.** Read it before any task. If a request conflicts with the SRS, stop and flag the conflict — do not silently pick a side. The PRD (`StormlightPMS_PRD.md`) is rationale only; the SRS wins on any disagreement.

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

## Repo layout

```
/supabase/migrations   — numbered SQL migrations
/supabase/tests        — pgTAP RLS + trigger tests
/supabase/functions    — Edge Functions
/src                   — React app
/src/lib/database.types.ts — generated; never hand-edit
StormlightPMS_SRS_v0.2.md, StormlightPMS_PRD.md, CLAUDE.md
```

## Build order — one phase per session, do not skip ahead

0. Decisions + scaffold (done: D1–D4 frozen in the SRS changelog)
1. Database foundation — enums, tables, indexes, `set_updated_at`, helper functions, access-token hook
2. RLS — policies + pgTAP tests, table by table
3. Auth + provisioning — invite flow, `handle_new_user`, suspend/deactivate ban, Edge Functions
4. Core CRUD UI + design system — properties, units, tenants, leases
5. Money — charges, payments, allocations, lease ledger, deposit settlement
6. Maintenance, documents (Storage), notifications
7. Scheduled jobs + reports (DB views/RPCs) + CSV export
8. CSV import, hardening, DoD verification

The database and RLS (phases 1–3) come before any UI. Do not retrofit security.

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

For each table in phase 2, write the pgTAP test alongside the policy: a positive case, a cross-org negative case, and a cross-assignment negative case for PMs. A table is not done until `supabase test db` is green. CI runs the suite on every migration.

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
- Branding (colors, logo, fonts) is not yet defined (SRS A5). Use neutral placeholder styling until GVL provides a brand kit; do not invent a final visual identity.
