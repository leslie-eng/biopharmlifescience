import { useEffect, useMemo, useState } from "react";
import { ordersApi, productsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Minus, Plus, ScanBarcode, Trash2 } from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string | null;
  category: string | null;
};

type PosLine = { product: ProductRow; quantity: number };

type PaymentMethod = "cash" | "mpesa" | "bank" | "other";

const Pos = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<PosLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await productsApi.list({ active: true });
      setProducts(
        data
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            unit: p.unit,
            category: p.category,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not load products");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + Number(l.product.price) * l.quantity, 0),
    [lines]
  );

  const addProduct = (p: ProductRow) => {
    if (p.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    setLines((prev) => {
      const i = prev.findIndex((l) => l.product.id === p.id);
      if (i >= 0) {
        const next = [...prev];
        const nextQty = next[i].quantity + 1;
        if (nextQty > p.stock) {
          toast.error(`Only ${p.stock} in stock`);
          return prev;
        }
        next[i] = { ...next[i], quantity: nextQty };
        return next;
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const setQty = (productId: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => {
          if (l.product.id !== productId) return l;
          if (qty <= 0) return null;
          if (qty > l.product.stock) {
            toast.error(`Max ${l.product.stock} for ${l.product.name}`);
            return l;
          }
          return { ...l, quantity: qty };
        })
        .filter(Boolean) as PosLine[]
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const completeSale = async () => {
    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        order: {
          customer_name: customerName.trim() || "Walk-in customer",
          customer_phone: customerPhone.trim() || null,
          customer_email: null,
          notes: notes.trim() ? `POS — ${notes.trim()}` : "POS sale",
          subtotal,
          total: subtotal,
          status: "paid",
          payment_method: paymentMethod,
        },
        items: lines.map((l) => ({
          product_id: l.product.id,
          product_name: l.product.name,
          unit_price: Number(l.product.price),
          quantity: l.quantity,
          line_total: Number(l.product.price) * l.quantity,
        })),
      });

      toast.success(`Sale complete — ${order.order_number}`);
      setLines([]);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      setPaymentMethod("cash");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Sale failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanBarcode className="h-7 w-7 text-primary" />
          Point of sale
        </h1>
        <p className="text-muted-foreground">
          Ring up walk-in sales; orders are marked paid and inventory is reduced.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 min-h-[calc(100vh-12rem)]">
        <Card className="lg:col-span-3 flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Catalog</CardTitle>
            <CardDescription>Active items with stock. Tap to add to ticket.</CardDescription>
            <Input
              placeholder="Search name or category…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0 px-6 pb-6">
            <ScrollArea className="h-[480px] lg:h-[calc(100vh-16rem)] pr-4">
              {loading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading products…</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No matching products.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      disabled={p.stock <= 0}
                      className="text-left rounded-lg border border-border bg-card p-3 hover:bg-accent/40 hover:border-primary/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-sm leading-snug">{p.name}</span>
                        <Badge variant={p.stock <= 5 ? "destructive" : "secondary"} className="shrink-0">
                          {p.stock} {p.unit || "pcs"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.category ?? "—"} · KSh {Number(p.price).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ticket</CardTitle>
            <CardDescription>Adjust quantities, then complete sale.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 min-h-0 gap-4">
            <ScrollArea className="flex-1 min-h-[200px] max-h-[280px] pr-3">
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No items yet — choose products on the left.
                </p>
              ) : (
                <ul className="space-y-3">
                  {lines.map(({ product: p, quantity }) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          KSh {Number(p.price).toLocaleString()} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => setQty(p.id, quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => setQty(p.id, quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeLine(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right text-sm font-semibold shrink-0 w-24">
                        KSh {(Number(p.price) * quantity).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Customer name</Label>
                <Input
                  placeholder="Walk-in if empty"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone (optional)</Label>
                <Input placeholder="07…" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Input
                  placeholder="Receipt ref, discount note…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-baseline text-lg font-bold mt-auto pt-2">
              <span>Total</span>
              <span>KSh {subtotal.toLocaleString()}</span>
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={submitting || lines.length === 0}
              onClick={() => void completeSale()}
            >
              {submitting ? "Saving…" : "Complete sale"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pos;
