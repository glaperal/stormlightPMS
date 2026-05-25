# Hypothesis Queue → /autoresearch:fix

| Rank | ID | Hypothesis (fix-loop scope) | Confidence | Location |
|------|----|------------------------------|-----------|----------|
| 1 | H-01 | Wrapping `<App/>` in an ErrorBoundary will catch render errors without crashing the SPA | HIGH | `src/main.tsx`, `src/App.tsx` |
| 2 | H-02 | Route-level `React.lazy()` + Vite `manualChunks` will drop the main-chunk gzip below 100 KB | HIGH | `src/App.tsx`, `vite.config.ts` |
| 3 | H-03 | Extracting `LeaseDetailPage` modals/tables/hooks to siblings under `pages/leases/LeaseDetail/` will keep behaviour identical while shrinking each file under 250 LOC | HIGH | `src/pages/leases/LeaseDetailPage.tsx` |
| 4 | H-04 | Failing `run-daily-jobs` startup with 503 when `JOBS_SHARED_SECRET` is unset prevents anonymous fanout in production | HIGH | `supabase/functions/run-daily-jobs/index.ts` |
| 5 | H-05 | Adding `aria-labelledby`, focus trap, and focus restore to `Modal` plus `aria-invalid` + `aria-describedby` to `Field` will resolve top WCAG failures | HIGH | `src/components/ui/Modal.tsx`, `src/components/ui/Field.tsx` |
| 6 | H-06 | Replacing `<tr onClick>` in `MaintenancePage` with an explicit `<button>` makes the row keyboard-operable | HIGH | `src/pages/maintenance/MaintenancePage.tsx` |
| 7 | H-07 | A `useUnreadCount()` hook + sidebar badge surfaces notifications without a real-time channel | HIGH | `src/components/AppShell.tsx` |
| 8 | H-08 | Rendering a `<NotFoundPage>` instead of redirecting fixes stale-deep-link UX | HIGH | `src/App.tsx` |

(9–12 either need migrations or larger pattern changes — deferred from this 6-iter fix loop.)
