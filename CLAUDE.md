# StormlightPMS — repository guide

This repository holds **StormlightPMS**, a multi-tenant property-management SaaS for Filipino lessors (landlords), a product line of Stormlight Inc.

> **The application and its detailed engineering rules live in [`StormlightPMS/`](StormlightPMS/).**
> When you work on the app, read [`StormlightPMS/CLAUDE.md`](StormlightPMS/CLAUDE.md) first — it is the
> authoritative source for the stack, database rules, RLS conventions, dev commands, and current build state.
> Both this file and that one are loaded automatically when you work inside `StormlightPMS/`.

## Top-level layout

```
StormlightPMS/                 — the product: Vite + React + TS SPA on a Supabase backend
  src/                         — React app (pages, components, lib, hooks, styles)
  supabase/                    — migrations, pgTAP tests, Edge Functions, config.toml
  design-handoff/              — delivered Stormlight brand kit (JSX/CSS reference, not run at runtime)
  StormlightPMS_SRS_v0.2.md    — build contract (contents are now v0.3 — the file name is unchanged)
  StormlightPMS_Spec_Reconciliation.md
  DESIGN_SYSTEM_INTEGRATION_PLAN.md
  archive/StormlightPMS_v1.0_ARCHIVED.md
  CLAUDE.md                    — app-level engineering instructions (read this for any app work)
predict/                       — scratch workspace for an automated codebase-audit run (artifact stubs)
.claude/                       — launch.json (dev launcher) + settings.local.json (permissions)
```

## Where to start

- **App / feature / bug work** → `cd StormlightPMS` and follow `StormlightPMS/CLAUDE.md`.
- **What the product must do** → `StormlightPMS/StormlightPMS_SRS_v0.2.md` (the build contract; SRS wins over any other doc). Rationale and the v1.0↔v0.2 reconciliation are in `StormlightPMS/StormlightPMS_Spec_Reconciliation.md`.
- **Design / styling** → `StormlightPMS/DESIGN_SYSTEM_INTEGRATION_PLAN.md` and `StormlightPMS/src/styles/tokens.css`.

## The 30-second summary

- **Stack (fixed, do not substitute):** Vite + React + TypeScript SPA · React Router · TanStack Query over `@supabase/supabase-js` · React Hook Form + Zod · Tailwind. Backend is **Supabase only** (Postgres, Auth, Storage, Edge Functions/Deno, pg_cron, Vault). Static build hosted on Vercel. No Next.js, no SSR, no ORM.
- **Security is in the database.** Every operational table has `org_id` and `ENABLE` + `FORCE ROW LEVEL SECURITY`; authorization (`role`, `org_id`) is stamped into the JWT by a custom access-token hook and read from `auth.jwt()` — never `SELECT`ed from `profiles` inside a policy. Financial integrity (payment-allocation limits, status columns) lives in DB triggers, not the app. Client-side role checks are UX only.
- **Migrations are append-only.** Never edit an applied migration — write a new numbered one, regenerate types (`npm run gen:types`), and keep `supabase db reset` replaying cleanly. RLS changes are test-first (pgTAP in `supabase/tests/`).
- **Conventions:** business dates use `(now() AT TIME ZONE 'Asia/Manila')::date`; money is `numeric(14,2)` (never float), displayed as `₱` with comma thousands and two decimals; addresses follow the PH hierarchy (region → province → city/municipality → barangay → street); no `any` in committed TypeScript; SQL keywords lowercase.

## Working agreement

- All development for this task happens on branch `claude/claude-md-docs-ozom6v`. Commit with clear messages; push and open a draft PR when changes are complete.
- State which SRS requirement IDs a change implements. If the SRS is ambiguous or looks wrong, raise it before coding — do not guess.
- Keep diffs small enough to review — security tables and money triggers especially.
- Secrets (service-role key, Resend API key) live in Supabase Vault and are used only inside Edge Functions. The browser bundle holds only the anon/publishable key. Never commit a service-role key.
