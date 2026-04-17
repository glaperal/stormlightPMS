# Stormlight PMS

A cloud-based, multi-tenant administrative portal for Philippine real estate portfolios:
properties, tenants, leases, ledgers, payments, and maintenance — all scoped by
landlord organization with strict Row Level Security.

## Stack

- React + Vite + TypeScript (SPA)
- Tailwind CSS (shadcn-style primitives)
- TanStack Query for data fetching/caching
- React Hook Form + Zod for validated forms
- Recharts for dashboards
- Supabase (Postgres + Auth) as the backend — RLS, triggers, and
  `pg_cron` drive automated monthly billing

## Quick start

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env.local
# then fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Start local Supabase (Docker)
supabase start
supabase db reset        # runs migrations + seed.sql (Vision Homes data)

# 4. Run the app
npm run dev              # http://localhost:5173
```

## Project layout

```
supabase/
  migrations/            # 0001 schema, 0002 RLS, 0003 triggers, 0004 billing
  seed.sql               # Vision Homes Inc. demo data
src/
  app/                   # router, providers, layout
  components/            # DataTable, SideSheet, FormField, UI primitives
  features/
    auth/                # AuthProvider, ProtectedRoute, RoleGate
    dashboard/           # KPI + rent-collected chart
    properties/          # list, detail, unit management
    tenants/
    leases/
    financials/          # ledgers + payment recording
    maintenance/         # stub
  lib/                   # supabase client, currency, query client
  schemas/               # Zod schemas (lease, tenant, payment, property, unit)
  types/database.ts      # hand-written DB types (re-gen via `supabase gen types`)
```

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — typecheck + production build
- `npm test` — Vitest (unit + component tests)
- `npm run lint` — ESLint

## Database

All rows are scoped to a `landlord_groups.id`. The helper functions
`auth_group_ids()`, `auth_has_role()`, and `auth_is_super_admin()` gate every
policy. Key automations:

- `trg_lease_sync_unit` — flipping a lease to Active marks its unit Occupied.
- `trg_payment_recompute_ledger` — payments automatically update ledger status
  to `Unpaid` / `Partial` / `Cleared`.
- `generate_monthly_ledgers()` — creates Rent / VAT / Dues rows for every
  Active lease; scheduled via `pg_cron` at 00:00 on the 1st of each month.

## Demo data

`seed.sql` provisions **Vision Homes Inc.** with Vision Building 1
(15 commercial rooms + 6 parking slots), current tenants (Arte Manila,
GMMK Enterprise, Grace Life Fellowship, Bright Discovery, Smarter Minds,
Dr. Chua), and three years of historical ledgers + payments so the
dashboard charts show realistic rent-collection trends.
