import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const redirectTo = `${window.location.origin}/update-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold text-fg-1">Reset password</h1>
        {sent ? (
          <p className="text-sm text-fg-2">If an account exists for {email}, a reset email has been sent.</p>
        ) : (
          <>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-sm text-danger-700">{error}</div>}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset email'}
            </button>
          </>
        )}
        <Link to="/login" className="text-sm text-fg-2 hover:text-fg-1">← Back to sign in</Link>
      </form>
    </div>
  );
}
