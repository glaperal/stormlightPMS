import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/types/database";

interface AuthMembership {
  role: AppRole;
  groupId: string;
}

interface AuthValue {
  session: Session | null;
  loading: boolean;
  memberships: AuthMembership[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string) => void;
  role: AppRole | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<AuthMembership[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!session) {
      setMemberships([]);
      setActiveGroupId(null);
      return;
    }
    void (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role,group_id")
        .eq("user_id", session.user.id);
      if (error) {
        console.error("Failed to load memberships", error);
        setMemberships([]);
        return;
      }
      const next = (data ?? []).map((r) => ({
        role: r.role as AppRole,
        groupId: r.group_id as string,
      }));
      setMemberships(next);
      setActiveGroupId((cur) => cur ?? next[0]?.groupId ?? null);
    })();
  }, [session]);

  const role = useMemo<AppRole | null>(() => {
    if (!activeGroupId) return memberships[0]?.role ?? null;
    return memberships.find((m) => m.groupId === activeGroupId)?.role ?? null;
  }, [memberships, activeGroupId]);

  const value: AuthValue = {
    session,
    loading,
    memberships,
    activeGroupId,
    setActiveGroupId,
    role,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
