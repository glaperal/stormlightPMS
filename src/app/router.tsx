import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/app/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { PropertiesPage } from "@/features/properties/PropertiesPage";
import { PropertyDetailPage } from "@/features/properties/PropertyDetailPage";
import { TenantsPage } from "@/features/tenants/TenantsPage";
import { LeasesPage } from "@/features/leases/LeasesPage";
import { FinancialsPage } from "@/features/financials/FinancialsPage";
import { MaintenancePage } from "@/features/maintenance/MaintenancePage";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/properties", element: <PropertiesPage /> },
          { path: "/properties/:id", element: <PropertyDetailPage /> },
          { path: "/tenants", element: <TenantsPage /> },
          { path: "/leases", element: <LeasesPage /> },
          { path: "/financials", element: <FinancialsPage /> },
          { path: "/maintenance", element: <MaintenancePage /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
