import { useEffect, useState } from "react";
import { clientsApi, type Client } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const empty: Partial<Client> = { full_name: "", email: "", phone: "", address: "", notes: "", notify_on_restock: true };

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Client>>(empty);

  const load = async () => {
    const data = await clientsApi.list();
    setClients(data);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.full_name) { toast.error("Name required"); return; }
    try {
      if (editing.id) await clientsApi.update(editing.id, editing);
      else await clientsApi.create(editing);
      toast.success("Saved");
      setOpen(false);
      setEditing(empty);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    try {
      await clientsApi.delete(id);
      toast.success("Deleted");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><h1 className="text-2xl font-bold">Clients</h1><p className="text-muted-foreground">Customer database.</p></div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(empty); }}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New client</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} client</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5"><Label>Full name *</Label><Input required value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Address</Label><Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
              <DialogFooter><Button type="submit">{editing.id ? "Save" : "Create"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No clients yet.</TableCell></TableRow>
            ) : clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.address}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default Clients;
