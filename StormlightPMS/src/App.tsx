import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { AppShell } from './components/AppShell';
import { BootGate } from './components/BootGate';
import { RequireRole } from './components/RequireRole';
import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { UpdatePasswordPage } from './pages/auth/UpdatePasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PropertiesPage } from './pages/properties/PropertiesPage';
import { PropertyDetailPage } from './pages/properties/PropertyDetailPage';
import { UnitDetailPage } from './pages/units/UnitDetailPage';
import { TenantsPage } from './pages/tenants/TenantsPage';
import { TenantDetailPage } from './pages/tenants/TenantDetailPage';
import { LeasesPage } from './pages/leases/LeasesPage';
import { LeaseDetailPage } from './pages/leases/LeaseDetailPage';
import { LeaseNewPage } from './pages/leases/LeaseNewPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { MaintenancePage } from './pages/maintenance/MaintenancePage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ReportRentRollPage } from './pages/reports/ReportRentRollPage';
import { ReportArrearsPage } from './pages/reports/ReportArrearsPage';
import { ReportCollectionPage } from './pages/reports/ReportCollectionPage';
import { ReportPropertyIncomePage } from './pages/reports/ReportPropertyIncomePage';
import { OrganizationsPage } from './pages/admin/OrganizationsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { OrgSettingsPage } from './pages/admin/OrgSettingsPage';
import { AssignmentsPage } from './pages/admin/AssignmentsPage';
import { ImportPage } from './pages/import/ImportPage';

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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </BootGate>
  );
}
