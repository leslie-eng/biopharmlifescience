import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, stockInterestApi } from "@/lib/api";
import { toast } from "sonner";
import { z } from "zod";
import type { Product } from "./ProductGrid";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});

export const RestockDialog = ({ product, onClose }: { product: Product | null; onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const parsed = schema.safeParse({ email });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      await stockInterestApi.create({ product_id: product.id, email: parsed.data.email });
    } catch (e: unknown) {
      setSubmitting(false);
      if (e instanceof ApiError && e.status === 409) {
        toast.success("We'll email you when it's back in stock.");
        setEmail("");
        onClose();
        return;
      }
      toast.error("Could not save. Try again.");
      return;
    }
    setSubmitting(false);
    toast.success("We'll email you when it's back in stock.");
    setEmail("");
    onClose();
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get notified</DialogTitle>
          <DialogDescription>
            We'll email you as soon as <strong>{product?.name}</strong> is back in stock.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="restock-email">Your email</Label>
            <Input id="restock-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Notify me"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
