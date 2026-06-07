import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { SUPABASE_CONFIGURED } from '@/lib/supabase';
import { Logo } from '@/components/ui/Logo';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn(email, password);
    setBusy(false);
    if (res.error) setError(res.error);
    else navigate('/dashboard', { replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[48fr_52fr]">
      {/* Brand panel — navy gradient (hidden on small screens) */}
      <aside
        className="relative hidden flex-col justify-between p-12 text-white lg:flex"
        style={{ background: 'linear-gradient(135deg, var(--navy-500), var(--navy-700))' }}
      >
        <Logo tone="light" size={34} />
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Steady light through every storm.
          </h2>
          <p className="mt-4 text-lg text-navy-200">
            Collect rent, track leases, and read your numbers, built for Filipino lessors.
          </p>
          <div className="mt-10 flex gap-8 font-mono text-sm text-accent">
            <div>
              <div className="text-2xl">9/15</div>
              <div className="mt-1 text-2xs uppercase tracking-wide text-navy-200">units leased</div>
            </div>
            <div>
              <div className="text-2xl">85%</div>
              <div className="mt-1 text-2xs uppercase tracking-wide text-navy-200">collected</div>
            </div>
            <div>
              <div className="text-2xl">₱284k</div>
              <div className="mt-1 text-2xs uppercase tracking-wide text-navy-200">contracted/mo</div>
            </div>
          </div>
        </div>
        <p className="text-2xs text-navy-200">StormlightPMS, a product of Stormlight Inc.</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-[380px] space-y-5">
          <div className="lg:hidden">
            <Logo size={32} />
          </div>
          <div>
            <h1 className="font-display text-h1 font-semibold text-fg-1">Welcome back</h1>
            <p className="mt-1 text-sm text-fg-2">Sign in to manage your properties.</p>
          </div>

          {!SUPABASE_CONFIGURED && (
            <div className="rounded-md border border-warning-100 bg-warning-50 p-3 text-xs text-warning-700">
              Supabase env vars are not configured yet. Copy <code>.env.example</code> to{' '}
              <code>.env.local</code>, fill in your project URL and anon key, then restart the dev
              server. The UI renders without them, but sign-in and data calls will fail until set.
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-fg-2">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-strong text-brand focus:ring-accent"
              />
              Remember me
            </label>
            <Link to="/reset-password" className="font-medium text-fg-link hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="rounded-md border border-danger-100 bg-danger-50 p-3 text-sm text-danger-700">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-fg-3">
            New to StormlightPMS? Accounts are invite-only, contact your administrator.
          </p>
        </form>
      </main>
    </div>
  );
}
