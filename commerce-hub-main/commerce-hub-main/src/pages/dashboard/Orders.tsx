import { useEffect, useState } from "react";
import { ordersApi, type Order, type OrderItem } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUSES = ["pending","paid","processing","shipped","delivered","cancelled","refunded"] as const;
const statusColor: Record<string, string> = {
  pending: "bg-warning/20 text-warning-foreground border-warning/40",
  paid: "bg-success/20 text-success border-success/40",
  processing: "bg-primary/20 text-primary border-primary/40",
  shipped: "bg-secondary/20 text-secondary border-secondary/40",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive/15 text-destructive border-destructive/40",
  refunded: "bg-muted text-muted-foreground",
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [viewing, setViewing] = useState<Order | null>(null);

  const load = async () => {
    const data = await ordersApi.list();
    setOrders(data);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      toast.success("Status updated");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const view = async (o: Order) => {
    setViewing(o);
    const data = await ordersApi.items(o.id);
    setItems(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Track and update customer orders.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders yet.</TableCell></TableRow>
              ) : orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                  <TableCell><div className="font-medium text-sm">{o.customer_name}</div><div className="text-xs text-muted-foreground">{o.customer_phone}</div></TableCell>
                  <TableCell className="font-semibold">KSh {Number(o.total).toLocaleString()}</TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(o.created_at), "dd MMM, HH:mm")}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => view(o)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Order {viewing?.order_number}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Customer:</span> {viewing.customer_name}</div>
                <div><span className="text-muted-foreground">Phone:</span> {viewing.customer_phone}</div>
                <div><span className="text-muted-foreground">Email:</span> {viewing.customer_email || "—"}</div>
                <div><span className="text-muted-foreground">Payment:</span> {viewing.payment_method}</div>
              </div>
              {viewing.notes && <p className="rounded bg-muted p-2 text-xs">{viewing.notes}</p>}
              <div className="border-t pt-3">
                <p className="font-semibold mb-2">Items</p>
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between py-1.5 border-b last:border-0">
                    <span>{i.product_name} × {i.quantity}</span>
                    <span>KSh {Number(i.line_total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-base pt-2"><span>Total</span><span>KSh {Number(viewing.total).toLocaleString()}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
