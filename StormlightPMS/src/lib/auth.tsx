// This is the auth context module: the AuthProvider component is colocated with
// its useAuth hook and the hasRole helper by design. Splitting them across files
// to satisfy react-refresh would fragment 15 import sites for a dev-only HMR nicety.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Role = 'superadmin' | 'admin' | 'property_manager';

export interface AppClaims {
  role: Role | '';
  org_id: string | null;
  profile_status: 'active' | 'inactive' | '';
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  claims: AppClaims;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readClaims(session: Session | null): AppClaims {
  if (!session) return { role: '', org_id: null, profile_status: '' };
  const meta = ((session.user.app_metadata ?? {}) as Record<string, unknown>) || {};
  return {
    role: (meta.role as Role | undefined) ?? '',
    org_id: (meta.org_id as string | undefined) ?? null,
    profile_status: (meta.profile_status as 'active' | 'inactive' | undefined) ?? '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      claims: readClaims(session),
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { error: error.message } : {};
      },
      async signOut() {
        await supabase.auth.signOut();
      },
      async refreshSession() {
        const { data } = await supabase.auth.refreshSession();
        setSession(data.session);
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function hasRole(claims: AppClaims, ...roles: Role[]): boolean {
  return claims.role !== '' && roles.includes(claims.role as Role);
}
