import { useEffect, useState } from "react";
import { dashboardApi } from "@/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(210 75% 32%)", "hsl(145 55% 38%)", "hsl(4 75% 55%)", "hsl(38 92% 50%)", "hsl(280 60% 50%)"];

const Reports = () => {
  const [salesByDay, setSalesByDay] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const since = subDays(new Date(), 30).toISOString();
      const { orders, order_items: items } = await dashboardApi.reports(since);

      // sales by day
      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(startOfDay(subDays(new Date(), i)), "MMM dd");
        buckets[d] = 0;
      }
      (orders ?? []).filter(o => ["paid","processing","shipped","delivered"].includes(o.status)).forEach((o) => {
        const d = format(new Date(o.created_at), "MMM dd");
        if (d in buckets) buckets[d] += Number(o.total || 0);
      });
      setSalesByDay(Object.entries(buckets).map(([day, value]) => ({ day, value })));

      // top products
      const agg: Record<string, { revenue: number; qty: number }> = {};
      (items ?? []).forEach((i) => {
        agg[i.product_name] = agg[i.product_name] || { revenue: 0, qty: 0 };
        agg[i.product_name].revenue += Number(i.line_total || 0);
        agg[i.product_name].qty += i.quantity;
      });
      setTopProducts(Object.entries(agg).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

      // status
      const sb: Record<string, number> = {};
      (orders ?? []).forEach((o) => { sb[o.status] = (sb[o.status] || 0) + 1; });
      setStatusBreakdown(Object.entries(sb).map(([name, value]) => ({ name, value })));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Reports & Analytics</h1><p className="text-muted-foreground">Last 30 days of activity.</p></div>

      <Card>
        <CardHeader><CardTitle>Sales over time</CardTitle><CardDescription>Daily revenue from completed orders</CardDescription></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesByDay}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(210 75% 32%)" stopOpacity={0.4} /><stop offset="95%" stopColor="hsl(210 75% 32%)" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `KSh ${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))' }} />
              <Area type="monotone" dataKey="value" stroke="hsl(210 75% 32%)" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top products</CardTitle><CardDescription>By revenue</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: any) => `KSh ${Number(v).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(145 55% 38%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Order status</CardTitle><CardDescription>Distribution</CardDescription></CardHeader>
          <CardContent className="h-72">
            {statusBreakdown.length === 0 ? <p className="text-sm text-muted-foreground text-center mt-12">No data yet.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
