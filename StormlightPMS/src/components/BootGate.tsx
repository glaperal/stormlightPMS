import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface OrgStatus {
  org_status: 'active' | 'suspended' | null;
  profile_status: 'active' | 'inactive' | null;
}

export function BootGate({ children }: { children: ReactNode }) {
  const { user, claims, signOut } = useAuth();
  const [status, setStatus] = useState<OrgStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!user) return;
      // superadmin has no org row to check
      if (claims.role === 'superadmin') {
        if (mounted) setStatus({ org_status: 'active', profile_status: 'active' });
        return;
      }
      const { data, error: err } = await supabase
        .from('profiles')
        .select('status, organizations(status)')
        .eq('id', user.id)
        .maybeSingle();
      if (!mounted) return;
      if (err) {
        setError(err.message);
        return;
      }
      const profileStatus = (data as { status?: 'active' | 'inactive' } | null)?.status ?? null;
      const orgStatus =
        ((data as { organizations?: { status?: 'active' | 'suspended' } } | null)?.organizations
          ?.status ?? null);
      setStatus({ profile_status: profileStatus, org_status: orgStatus });
    }
    run();
    return () => {
      mounted = false;
    };
  }, [user, claims.role]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!status) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  if (status.profile_status !== 'active' || status.org_status !== 'active') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="card p-6 max-w-md text-center">
          <h1 className="text-lg font-semibold text-slate-900">Access unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account or organization is not active. Please contact your administrator.
          </p>
          <button type="button" className="btn-secondary mt-4" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
