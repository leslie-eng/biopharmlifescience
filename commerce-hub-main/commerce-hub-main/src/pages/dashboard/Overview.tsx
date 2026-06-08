import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi } from "@/lib/api";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  LayoutDashboard,
  Package,
  ScanBarcode,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

type Stats = {
  revenue: number;
  orders: number;
  clients: number;
  products: number;
  lowStock: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  total: number;
  status: string;
  created_at: string;
};

const QUICK_LINKS: { title: string; description: string; to: string; icon: LucideIcon }[] = [
  { title: "Products", description: "Catalog & inventory", to: "/dashboard/products", icon: Package },
  { title: "POS", description: "Walk-in sales", to: "/dashboard/pos", icon: ScanBarcode },
  { title: "Orders", description: "Fulfillment", to: "/dashboard/orders", icon: ShoppingBag },
  { title: "Clients", description: "Facilities & contacts", to: "/dashboard/clients", icon: Users },
  { title: "Finances", description: "Expenses & margin", to: "/dashboard/finances", icon: Wallet },
  { title: "Reports", description: "Analytics", to: "/dashboard/reports", icon: BarChart3 },
];

type StatLinkCardProps = {
  to: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  accent: string;
};

const StatLinkCard = ({
  to,
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: StatLinkCardProps) => (
  <Link to={to} className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <Card className="h-full transition-colors hover:border-primary/35 hover:bg-accent/25">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
            {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open <ArrowRight className="h-3 w-3" />
            </p>
          </div>
          <div className={`h-10 w-10 shrink-0 rounded-md flex items-center justify-center ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const Overview = () => {
  const [stats, setStats] = useState<Stats>({
    revenue: 0,
    orders: 0,
    clients: 0,
    products: 0,
    lowStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { stats, recentOrders } = await dashboardApi.overview();
      setStats(stats);
      setRecentOrders(recentOrders as OrderRow[]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not load dashboard data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-primary" />
            Overview
          </h1>
          <p className="text-muted-foreground">Snapshot of today — jump into any area below.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick access
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ title, description, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                    Go <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Key metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[120px] rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatLinkCard
                to="/dashboard/finances"
                icon={TrendingUp}
                label="Revenue (paid)"
                value={`KSh ${stats.revenue.toLocaleString()}`}
                accent="bg-success/15 text-success"
              />
              <StatLinkCard
                to="/dashboard/orders"
                icon={ShoppingBag}
                label="Orders"
                value={stats.orders}
                accent="bg-primary/15 text-primary"
              />
              <StatLinkCard
                to="/dashboard/clients"
                icon={Users}
                label="Clients"
                value={stats.clients}
                accent="bg-secondary/15 text-secondary"
              />
              <StatLinkCard
                to="/dashboard/products"
                icon={Package}
                label="Products"
                value={stats.products}
                hint={stats.lowStock > 0 ? `${stats.lowStock} low stock` : "All stocked"}
                accent="bg-warning/15 text-warning"
              />
            </>
          )}
        </div>
      </div>

      {!loading && stats.lowStock > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm">
              <strong>{stats.lowStock} product(s)</strong> running low on stock.{" "}
              <Link to="/dashboard/products" className="underline font-medium">
                Manage inventory →
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest activity</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link to="/dashboard/orders">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No orders yet.{" "}
              <Link to="/dashboard/pos" className="underline font-medium text-foreground">
                Open POS
              </Link>{" "}
              or check the storefront checkout.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-2 first:pt-0"
                >
                  <div>
                    <p className="font-medium text-sm font-mono">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_name ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(o.created_at), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">KSh {Number(o.total).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground capitalize">{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
