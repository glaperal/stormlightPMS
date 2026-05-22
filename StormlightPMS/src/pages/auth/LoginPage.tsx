import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { SUPABASE_CONFIGURED } from '@/lib/supabase';

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">StormlightPMS</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
        </div>
        {!SUPABASE_CONFIGURED && (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            Supabase env vars are not configured yet. Copy <code>.env.example</code> to{' '}
            <code>.env.local</code>, fill in your project URL and anon key, then restart the dev
            server. The UI renders without them, but sign-in and data calls will fail until they
            are set.
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
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
          <label className="label" htmlFor="password">Password</label>
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
        {error && <div className="text-sm text-red-700">{error}</div>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="text-right text-sm">
          <Link to="/reset-password" className="text-slate-600 hover:text-slate-900">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
