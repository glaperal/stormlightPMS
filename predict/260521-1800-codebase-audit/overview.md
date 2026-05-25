# Predict Analysis — StormlightPMS codebase audit

**Date:** 2026-05-21 18:00 +08:00
**Scope:** `StormlightPMS/**` except `supabase/migrations/**` (56 files, 8 214 LOC)
**Personas:** 5 — Architecture Reviewer, Security Analyst, Performance Engineer, Reliability Engineer, Devil's Advocate
**Debate Rounds:** 2 (round 1 + round 2 revisions)
**Commit Hash:** 53d7bd39125121c1f435987ed01ff4cb05708b05
**Anti-Herd Status:** ✅ PASSED (flip_rate=0.06, entropy≈0.71)

## Summary

- **Total findings:** 31 (30 independent + 1 added in debate)
  - Confirmed (≥3/5): 21 · Probable: 7 · Minority: 3
- **Severity breakdown:** Critical 0 · High 5 · Medium 14 · Low 12
- **predict_score:** `21*15 + 7*8 + 3*3 + (5/5)*20 + (2/2)*10 + 1*5 = 415`

## Top 12 findings — in scope for the fix loop

| # | Title | Severity | Consensus | Loc |
|---|-------|---|---|---|
| 1 | No global error boundary | HIGH | 4/5 | `src/main.tsx`, `src/App.tsx` |
| 2 | No code-splitting; 679 KB single chunk | HIGH | 5/5 | `src/App.tsx`, `vite.config.ts` |
| 3 | `LeaseDetailPage.tsx` 1 078 LOC | HIGH | 4/5 | `src/pages/leases/LeaseDetailPage.tsx` |
| 4 | `run-daily-jobs` fails open without `JOBS_SHARED_SECRET` | HIGH | 4/5 | `supabase/functions/run-daily-jobs/index.ts` |
| 5 | Modal a11y (no labelled-by / focus trap / restore) | MED | 4/5 | `src/components/ui/Modal.tsx` |
| 6 | Form errors not announced (a11y) | MED | 4/5 | `src/components/ui/Field.tsx` |
| 7 | Maintenance row not keyboard-accessible | MED | 3/5 | `src/pages/maintenance/MaintenancePage.tsx` |
| 8 | Sidebar lacks unread-notifications badge | LOW | 4/5 | `src/components/AppShell.tsx` |
| 9 | Tenant archive guard is client-only (FR-TEN-4) | MED | 3/5 | *(needs migration — out of scope)* |
| 10 | CSV import: no FK preview / no commit confirmation | MED | 3/5 | `src/pages/import/ImportPage.tsx` |
| 11 | No 404 page; stale deep-links hide | MED | 4/5 | `src/App.tsx` |
| 12 | `BootGate` redundant round-trip on every page load | MED | 3/5 | `src/components/BootGate.tsx` |

## Out-of-scope (acknowledged): 19 findings

See `findings.md#below-the-cut`.

## Files in this report

- [findings.md](./findings.md) — ranked findings
- [persona-debates.md](./persona-debates.md) — independent analysis + debate transcript
- [codebase-analysis.md](./codebase-analysis.md) · [dependency-map.md](./dependency-map.md) · [component-clusters.md](./component-clusters.md) — knowledge files
- [predict-results.tsv](./predict-results.tsv) — per-persona per-round log
- [handoff.json](./handoff.json) — machine-readable handoff for the fix loop
- [fix-results.tsv](./fix-results.tsv) — per-iteration fix-loop log

## Fix-loop result (10-iteration budget; used 6 fix iterations)

| Iter | Hypothesis | Result | Headline metric |
|------|-----------|--------|------------------|
| 0 | — | baseline | entry: 679 757 B raw / 186 574 B gz · 1 chunk |
| 1 | H-01 ErrorBoundary + H-08 NotFoundPage | KEEP | +0.5% gz; safety net added |
| 2 | H-02 route lazy + vendor manualChunks | KEEP | **entry: 41 314 B raw / 13 443 B gz · 28 chunks (−93% gz)** |
| 3 | H-05 Modal + Field a11y | KEEP | WCAG 2.1.1 / 2.4.3 fixed |
| 4 | H-06 maintenance keyboard + H-07 unread badge | KEEP | +0.2 KB gz for two features |
| 5 | H-04 run-daily-jobs hard-fail | KEEP | closes anonymous-fanout risk |
| 6 | H-03 LeaseDetailPage split (1 078 → 283 LOC orchestrator + 9 siblings, largest 173 LOC) | KEEP | refactor; no bundle delta |

All 6 fixes kept. Zero crashes, zero reverts. `typecheck` + `vite build` green on every iteration.

**Composite score:** predict_score 415 + fix_kept × 25 = **415 + 150 = 565**.

## Out of this run

Migrations are excluded from scope, so 4 confirmed findings (SA-2 tenant-archive trigger, SA-4 server-side `org_id`, RE-2 audit actor, partial PE-2 ledger fold) were documented in `findings.md` but not applied. AR-3 (regenerate `database.types.ts`) requires a linked Supabase project — left documented.
