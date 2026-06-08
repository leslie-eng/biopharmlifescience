import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Overview from "@/pages/dashboard/Overview";

function showHomeDashboardPreview(): boolean {
  if (import.meta.env.DEV) return true;
  return import.meta.env.VITE_SHOW_HOME_DASHBOARD === "true";
}

/** Dashboard chrome + Overview on the storefront for local UI work. */
export const HomeDashboardPreview = () => {
  if (!showHomeDashboardPreview()) return null;

  return (
    <section id="dashboard-build" className="border-t-2 border-primary/25 bg-muted/20 scroll-mt-16">
      <div className="container pt-6 pb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Dashboard preview</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Auth is skipped here only in development (or when{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_SHOW_HOME_DASHBOARD=true</code>
          ). Top nav links open the real routes under{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/dashboard</code>.
        </p>
      </div>
      <div className="min-h-[70vh] border-y border-border">
        <DashboardLayout preview>
          <Overview />
        </DashboardLayout>
      </div>
    </section>
  );
};
