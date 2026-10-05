import { useEffect, useRef, useState } from "react";
import { productsApi, removeProductImage, uploadProductImage } from "@/services/products";
import type { Product } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImageOff, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const empty: Partial<Product> = { name: "", slug: "", category: "", description: "", price: 0, cost: 0, stock: 0, unit: "bag", is_active: true, is_published: true };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const Products = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product>>(empty);
  const [saving, setSaving] = useState(false);
  // The photo is uploaded after the product is saved: its bucket key includes the product id.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const resetImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
  };
  const closeDialog = () => { setOpen(false); setEditing(empty); resetImage(); };
  const shownImage = imagePreview ?? (removeImage ? null : editing.image_url ?? null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await productsApi.list({ staff: true });
      setProducts(data);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not load products");
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.name) { toast.error("Name required"); return; }
    const slug = (editing.slug || editing.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // image_url is a short-lived signed link and image_key is set by the upload: never send them back.
    const { image_url, image_key, ...fields } = editing;
    const payload = {
      ...fields,
      slug,
      price: Number(editing.price),
      cost: Number(editing.cost),
      stock: Number(editing.stock),
    };
    setSaving(true);
    try {
      const saved = editing.id ? await productsApi.update(editing.id, payload) : await productsApi.create(payload);
      try {
        if (imageFile) await uploadProductImage(saved.id, imageFile);
        else if (removeImage && editing.image_key) await removeProductImage(saved.id);
        toast.success(editing.id ? "Updated" : "Created");
      } catch (err: unknown) {
        toast.error(`Product saved, but the image was not: ${err instanceof Error ? err.message : "upload failed"}`);
      }
      closeDialog();
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await productsApi.delete(id);
      toast.success("Deleted");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const onImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // The server checks the file's bytes; this only saves a pointless upload.
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    resetImage();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your catalog and inventory.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { if (o) setOpen(true); else closeDialog(); }}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New product</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} product</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5"><Label>Name *</Label><Input required value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Category</Label><Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Fertilizer" /></div>
                <div className="space-y-1.5"><Label>Unit</Label><Input value={editing.unit ?? ""} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} placeholder="bag" /></div>
                <div className="space-y-1.5"><Label>Price (KSh)</Label><Input type="number" min="0" step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: +e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Cost (KSh)</Label><Input type="number" min="0" step="0.01" value={editing.cost ?? 0} onChange={(e) => setEditing({ ...editing, cost: +e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Stock</Label><Input type="number" min="0" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: +e.target.value })} /></div>
                <div className="space-y-1.5 flex items-end gap-3"><Label className="flex items-center gap-2"><Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /> Active</Label></div>
                <div className="col-span-2"><Label className="flex items-center gap-2"><Switch checked={editing.is_published ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} /> Show on website</Label></div>
                <div className="col-span-2 space-y-2">
                  <Label>Product image</Label>
                  <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, max 5 MB. Shown on the website.</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="shrink-0 h-28 w-36 rounded-md border bg-muted/40 flex items-center justify-center overflow-hidden">
                      {shownImage ? (
                        <img src={shownImage} alt="" className="max-h-28 max-w-[140px] object-contain" />
                      ) : (
                        <ImageOff className="h-6 w-6 text-muted-foreground" aria-label="No image" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={onImageFile}
                      />
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                        <Upload className="h-4 w-4" />
                        {shownImage ? "Replace image" : "Choose image"}
                      </Button>
                      {shownImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => { resetImage(); setRemoveImage(true); }}
                        >
                          Remove image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              </div>
              <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Saving…" : editing.id ? "Save" : "Create"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products. Create your first one.</TableCell></TableRow>
              ) : products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.category}</TableCell>
                  <TableCell>KSh {Number(p.price).toLocaleString()}</TableCell>
                  <TableCell>{p.stock <= 5 ? <Badge variant="destructive">{p.stock}</Badge> : p.stock}</TableCell>
                  <TableCell className="space-x-1">
                    {p.is_active ? <Badge className="bg-success text-success-foreground">Active</Badge> : <Badge variant="secondary">Hidden</Badge>}
                    {p.is_active && !p.is_published && <Badge variant="outline">Not on website</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
