import { NavLink } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuth, hasRole } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { useUnreadCount } from '@/hooks/useUnreadCount';

interface NavItem {
  to: string;
  label: string;
  roles?: ('superadmin' | 'admin' | 'property_manager')[];
}

const nav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/properties', label: 'Properties' },
  { to: '/tenants', label: 'Tenants' },
  { to: '/leases', label: 'Leases' },
  { to: '/payments', label: 'Payments' },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/utilities', label: 'Utilities' },
  { to: '/pdc', label: 'PDC vault' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/reports', label: 'Reports' },
  { to: '/import', label: 'Import', roles: ['superadmin', 'admin'] },
  { to: '/admin/organizations', label: 'Organizations', roles: ['superadmin'] },
  { to: '/admin/users', label: 'Users', roles: ['superadmin', 'admin'] },
  { to: '/admin/assignments', label: 'Assignments', roles: ['admin'] },
  { to: '/admin/settings', label: 'Org settings', roles: ['admin'] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { claims, user, signOut } = useAuth();
  const unread = useUnreadCount();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-inverse text-on-dark flex flex-col">
        <div className="px-4 py-5 border-b border-inverse">
          <div className="text-lg font-semibold font-display">StormlightPMS</div>
          <div className="text-xs text-on-dark-2 mt-1 capitalize">
            {claims.role || 'no role'}
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-auto">
          {nav
            .filter((n) => !n.roles || hasRole(claims, ...n.roles))
            .map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded px-3 py-2 text-sm',
                    isActive ? 'bg-brand text-white' : 'text-on-dark hover:bg-inverse-2',
                  )
                }
              >
                <span>{n.label}</span>
                {n.to === '/notifications' && unread > 0 && (
                  <span
                    className="ml-2 inline-flex items-center justify-center rounded-full bg-danger px-2 text-xs font-semibold text-white"
                    aria-label={`${unread} unread notifications`}
                  >
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </NavLink>
            ))}
        </nav>
        <div className="p-3 border-t border-inverse text-xs text-on-dark-2">
          <div className="truncate">{user?.email}</div>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-2 w-full text-left text-on-dark hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 overflow-auto">{children}</main>
    </div>
  );
}
