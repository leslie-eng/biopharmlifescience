import { NavLink, Link, useNavigate } from "react-router-dom";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type NavItem = { title: string; url: string; end?: boolean };

const NAV_ITEMS: NavItem[] = [
  { title: "Overview", url: "/dashboard/overview", end: true },
  { title: "Products", url: "/dashboard/products" },
  { title: "POS", url: "/dashboard/pos" },
  { title: "Orders", url: "/dashboard/orders" },
  { title: "Clients", url: "/dashboard/clients" },
  { title: "Finances", url: "/dashboard/finances" },
  { title: "Reports", url: "/dashboard/reports" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

type DashboardNavProps = {
  preview?: boolean;
};

export const DashboardNav = ({ preview = false }: DashboardNavProps) => {
  const { signOut, user } = useAuth();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6 min-w-0">
        <Link to="/dashboard/overview" className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-md bg-gradient-brand flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="font-display font-bold text-primary text-sm">Biopharmlifescience EA</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin</p>
          </div>
        </Link>

        <nav
          className="flex flex-1 items-center gap-0.5 min-w-0 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Dashboard"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.url} to={item.url} end={item.end ?? false} className={navLinkClass}>
              {item.title}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0 border-l border-border pl-3 ml-1">
          {!preview && user?.email && (
            <span className="hidden xl:inline max-w-[180px] truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          )}
          {preview ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/">Storefront</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <Link to="/staff/change-password">
                  <KeyRound className="h-4 w-4" />
                  <span className="hidden sm:inline">Password</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={async () => {
                  await signOut();
                  nav("/");
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
