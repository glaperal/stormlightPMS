import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import type { AppRole } from "@/types/database";

interface RoleGateProps {
  allow: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { role } = useAuth();
  if (!role || !allow.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
