import { Outlet } from "react-router-dom";
import { Sidebar } from "@/app/layout/Sidebar";

export function AppShell() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
