import { useEffect, useState } from "react";
import { expensesApi, ordersApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const empty = { category: "Operations", description: "", amount: 0, occurred_on: new Date().toISOString().slice(0, 10) };

const Finances = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const [ex, orders] = await Promise.all([expensesApi.list(), ordersApi.list()]);
    setExpenses(ex);
    setRevenue(
      orders
        .filter((o) => ["paid", "processing", "shipped", "delivered"].includes(o.status))
        .reduce((s, o) => s + Number(o.total || 0), 0)
    );
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) { toast.error("Amount must be > 0"); return; }
    try {
      await expensesApi.create({ ...form, amount: Number(form.amount) });
      toast.success("Expense added");
      setOpen(false);
      setForm(empty);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await expensesApi.delete(id);
    load();
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const profit = revenue - totalExpenses;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Finances</h1><p className="text-muted-foreground">Revenue, expenses and profit.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: TrendingUp, label: "Revenue", value: revenue, accent: "bg-success/15 text-success" },
          { icon: TrendingDown, label: "Expenses", value: totalExpenses, accent: "bg-destructive/15 text-destructive" },
          { icon: Wallet, label: "Net profit", value: profit, accent: "bg-primary/15 text-primary" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-5 flex items-start justify-between">
            <div><p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p><p className="mt-1.5 text-2xl font-bold">KSh {s.value.toLocaleString()}</p></div>
            <div className={`h-10 w-10 rounded-md flex items-center justify-center ${s.accent}`}><s.icon className="h-5 w-5" /></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expenses</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Add expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New expense</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Amount (KSh)</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} /></div>
              </div>
              <DialogFooter><Button type="submit">Add</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No expenses recorded.</TableCell></TableRow>
            ) : expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-sm">{format(new Date(e.occurred_on), "dd MMM yyyy")}</TableCell>
                <TableCell><span className="px-2 py-0.5 text-xs rounded bg-muted">{e.category}</span></TableCell>
                <TableCell className="text-muted-foreground">{e.description}</TableCell>
                <TableCell className="text-right font-medium">KSh {Number(e.amount).toLocaleString()}</TableCell>
                <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => remove(e.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default Finances;
