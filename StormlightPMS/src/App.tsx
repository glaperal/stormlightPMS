import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { AppShell } from './components/AppShell';
import { BootGate } from './components/BootGate';
import { RequireRole } from './components/RequireRole';
import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { UpdatePasswordPage } from './pages/auth/UpdatePasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Route-level code splitting for everything heavier than the landing-pad pages.
// Auth screens + the dashboard are eager because they are the most common first
// paint and small enough not to bloat the entry chunk.
const PropertiesPage = lazy(() =>
  import('./pages/properties/PropertiesPage').then((m) => ({ default: m.PropertiesPage })),
);
const PropertyDetailPage = lazy(() =>
  import('./pages/properties/PropertyDetailPage').then((m) => ({ default: m.PropertyDetailPage })),
);
const UnitDetailPage = lazy(() =>
  import('./pages/units/UnitDetailPage').then((m) => ({ default: m.UnitDetailPage })),
);
const TenantsPage = lazy(() =>
  import('./pages/tenants/TenantsPage').then((m) => ({ default: m.TenantsPage })),
);
const TenantDetailPage = lazy(() =>
  import('./pages/tenants/TenantDetailPage').then((m) => ({ default: m.TenantDetailPage })),
);
const LeasesPage = lazy(() =>
  import('./pages/leases/LeasesPage').then((m) => ({ default: m.LeasesPage })),
);
const LeaseDetailPage = lazy(() =>
  import('./pages/leases/LeaseDetailPage').then((m) => ({ default: m.LeaseDetailPage })),
);
const LeaseNewPage = lazy(() =>
  import('./pages/leases/LeaseNewPage').then((m) => ({ default: m.LeaseNewPage })),
);
const PaymentsPage = lazy(() =>
  import('./pages/payments/PaymentsPage').then((m) => ({ default: m.PaymentsPage })),
);
const MaintenancePage = lazy(() =>
  import('./pages/maintenance/MaintenancePage').then((m) => ({ default: m.MaintenancePage })),
);
const NotificationsPage = lazy(() =>
  import('./pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const ReportsPage = lazy(() =>
  import('./pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const ReportRentRollPage = lazy(() =>
  import('./pages/reports/ReportRentRollPage').then((m) => ({ default: m.ReportRentRollPage })),
);
const ReportArrearsPage = lazy(() =>
  import('./pages/reports/ReportArrearsPage').then((m) => ({ default: m.ReportArrearsPage })),
);
const ReportCollectionPage = lazy(() =>
  import('./pages/reports/ReportCollectionPage').then((m) => ({ default: m.ReportCollectionPage })),
);
const ReportPropertyIncomePage = lazy(() =>
  import('./pages/reports/ReportPropertyIncomePage').then((m) => ({
    default: m.ReportPropertyIncomePage,
  })),
);
const OrganizationsPage = lazy(() =>
  import('./pages/admin/OrganizationsPage').then((m) => ({ default: m.OrganizationsPage })),
);
const UsersPage = lazy(() =>
  import('./pages/admin/UsersPage').then((m) => ({ default: m.UsersPage })),
);
const OrgSettingsPage = lazy(() =>
  import('./pages/admin/OrgSettingsPage').then((m) => ({ default: m.OrgSettingsPage })),
);
const AssignmentsPage = lazy(() =>
  import('./pages/admin/AssignmentsPage').then((m) => ({ default: m.AssignmentsPage })),
);
const ImportPage = lazy(() =>
  import('./pages/import/ImportPage').then((m) => ({ default: m.ImportPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function RouteFallback() {
  return (
    <div
      className="flex h-[40vh] items-center justify-center text-sm text-slate-500"
      role="status"
      aria-live="polite"
    >
      Loading…
    </div>
  );
}

export function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <BootGate>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />
            <Route path="/units/:unitId" element={<UnitDetailPage />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
            <Route path="/leases" element={<LeasesPage />} />
            <Route path="/leases/new" element={<LeaseNewPage />} />
            <Route path="/leases/:leaseId" element={<LeaseDetailPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/rent-roll" element={<ReportRentRollPage />} />
            <Route path="/reports/arrears" element={<ReportArrearsPage />} />
            <Route path="/reports/collection" element={<ReportCollectionPage />} />
            <Route path="/reports/property-income" element={<ReportPropertyIncomePage />} />
            <Route
              path="/admin/organizations"
              element={
                <RequireRole roles={['superadmin']}>
                  <OrganizationsPage />
                </RequireRole>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireRole roles={['superadmin', 'admin']}>
                  <UsersPage />
                </RequireRole>
              }
            />
            <Route
              path="/admin/assignments"
              element={
                <RequireRole roles={['admin']}>
                  <AssignmentsPage />
                </RequireRole>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RequireRole roles={['admin']}>
                  <OrgSettingsPage />
                </RequireRole>
              }
            />
            <Route
              path="/import"
              element={
                <RequireRole roles={['superadmin', 'admin']}>
                  <ImportPage />
                </RequireRole>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BootGate>
  );
}
