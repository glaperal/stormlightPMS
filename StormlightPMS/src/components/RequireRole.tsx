import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuth, hasRole, type Role } from '@/lib/auth';

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { claims } = useAuth();
  if (!hasRole(claims, ...roles)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
