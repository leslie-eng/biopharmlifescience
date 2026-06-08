import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { DashboardNav } from "./DashboardNav";
import { DashboardAccessDenied } from "./DashboardAccessDenied";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardLayoutProps = {
  children?: ReactNode;
  preview?: boolean;
};

export const DashboardLayout = ({ children, preview = false }: DashboardLayoutProps) => {
  const { user, isStaff, loading } = useAuth();
  const location = useLocation();

  if (!preview) {
    if (loading) {
      return (
        <div className="p-8 space-y-3">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
    }
    if (!user) {
      return (
        <Navigate
          to="/staff"
          replace
          state={{ from: `${location.pathname}${location.search}` }}
        />
      );
    }
    if (!isStaff) return <DashboardAccessDenied />;
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-muted/30">
      <DashboardNav preview={preview} />
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden min-w-0">{children ?? <Outlet />}</main>
    </div>
  );
};
