import { NavLink } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  Users,
  FileSignature,
  Wallet,
  Wrench,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/cn";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/leases", label: "Leases", icon: FileSignature },
  { to: "/financials", label: "Financials", icon: Wallet },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
];

export function Sidebar() {
  const { session, role, signOut } = useAuth();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Stormlight</div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Property OS
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "size-4",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3">
        <div
          className="mb-2 flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2"
          title={session?.user.email ?? ""}
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {(session?.user.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium">
              {session?.user.email ?? "Not signed in"}
            </div>
            {role ? (
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {role.replace("_", " ")}
              </div>
            ) : null}
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => void signOut()}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
