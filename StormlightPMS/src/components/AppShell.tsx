import { NavLink, Link } from 'react-router-dom';
import { type ReactNode } from 'react';
import { format } from 'date-fns';
import { useAuth, hasRole } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Logo } from '@/components/ui/Logo';

interface NavItem {
  to: string;
  label: string;
  roles?: ('superadmin' | 'admin' | 'property_manager')[];
}

const primaryNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/properties', label: 'Properties' },
  { to: '/tenants', label: 'Tenants' },
  { to: '/leases', label: 'Leases' },
  { to: '/payments', label: 'Payments' },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/reports', label: 'Reports' },
  { to: '/import', label: 'Import', roles: ['superadmin', 'admin'] },
  { to: '/admin/organizations', label: 'Organizations', roles: ['superadmin'] },
  { to: '/admin/users', label: 'Users', roles: ['superadmin', 'admin'] },
  { to: '/admin/assignments', label: 'Assignments', roles: ['admin'] },
];

function initialsFromEmail(email?: string | null): string {
  if (!email) return '··';
  const name = email.split('@')[0];
  const parts = name.split(/[.\-_]/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return chars.toUpperCase();
}

// Active-nav background must apply INSTANTLY — no CSS transition on it (a transition
// here caused a stuck-highlight bug in the design reference). See plan R3.
function navItemClass({ isActive }: { isActive: boolean }) {
  return cn(
    'relative flex items-center justify-between rounded-md px-3 py-2 text-sm',
    isActive
      ? 'bg-white/10 font-semibold text-white'
      : 'font-medium text-navy-200 hover:bg-white/5 hover:text-white',
  );
}

function GoldRail({ show }: { show: boolean }) {
  if (!show) return null;
  return <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gold-400" />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { claims, user, signOut } = useAuth();
  const unread = useUnreadCount();
  const nav = primaryNav.filter((n) => !n.roles || hasRole(claims, ...n.roles));
  const showSettings = hasRole(claims, 'admin');

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — navy, full height, fixed width */}
      <aside className="w-[248px] shrink-0 bg-inverse text-on-dark flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-inverse">
          <Link to="/dashboard" aria-label="StormlightPMS home">
            <Logo tone="light" size={30} />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-auto">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={navItemClass}>
              {({ isActive }) => (
                <>
                  <GoldRail show={isActive} />
                  <span>{n.label}</span>
                  {n.to === '/notifications' && unread > 0 && (
                    <span
                      className="ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-2xs font-semibold text-white"
                      aria-label={`${unread} unread notifications`}
                    >
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-inverse space-y-1">
          {showSettings && (
            <NavLink to="/admin/settings" className={navItemClass}>
              {({ isActive }) => (
                <>
                  <GoldRail show={isActive} />
                  <span>Org settings</span>
                </>
              )}
            </NavLink>
          )}
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {initialsFromEmail(user?.email)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{user?.email ?? 'Signed in'}</div>
              <div className="truncate text-2xs capitalize text-navy-200">{claims.role || 'no role'}</div>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              aria-label="Sign out"
              className="shrink-0 rounded p-1 text-navy-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {/* log-out glyph */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Right column — topbar + content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-white/80 px-6 backdrop-blur-[10px]">
          <div className="relative max-w-sm flex-1">
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search tenants, units, invoices…"
              aria-label="Search"
              className="w-full rounded-md border border-subtle bg-subtle py-1.5 pl-9 pr-3 text-sm text-fg-1 placeholder:text-fg-3 focus:border-focus focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-muted px-3 py-1 text-sm font-medium text-fg-2 sm:inline">
              {format(new Date(), 'MMMM yyyy')}
            </span>
            <Link
              to="/notifications"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              className="relative rounded-md p-2 text-fg-2 hover:bg-subtle hover:text-fg-1 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unread > 0 && (
                <span aria-hidden className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
              )}
            </Link>
            <Link to="/payments" className="btn-primary">
              Record payment
            </Link>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
