import { Link, useLocation } from 'react-router-dom';

export function NotFoundPage() {
  const loc = useLocation();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card max-w-md w-full p-6 text-center" role="alert">
        <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          We couldn’t find <code className="rounded bg-slate-100 px-1">{loc.pathname}</code>. It may
          have been deleted, renamed, or the link is stale.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link to="/dashboard" className="btn-primary">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
