import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/contact";
import { Skeleton } from "@/components/ui/skeleton";
import { RestockDialog } from "./RestockDialog";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  price: number;
  stock: number;
  unit: string | null;
  image_url: string | null;
}

export const ProductGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);

  useEffect(() => {
    productsApi
      .list({ active: true })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="products" className="scroll-mt-20 site-wrap py-20">
      <div className="max-w-2xl mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary">Our catalog</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-bold">Infection control essentials</h2>
        <p className="mt-3 text-muted-foreground">Certified medical consumables trusted by clinics across East Africa — contact us to order.</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-80 rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No products yet — operators can add them after signing in at the staff portal.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const outOfStock = p.stock <= 0;
            return (
              <Card key={p.id} className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
                <div className="aspect-square overflow-hidden bg-muted relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="h-full w-full bg-gradient-soft flex items-center justify-center text-muted-foreground text-sm">No image</div>
                  )}
                  {p.category && (
                    <Badge className="absolute top-3 left-3 bg-background/95 text-foreground hover:bg-background">
                      {p.category}
                    </Badge>
                  )}
                  {outOfStock && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm py-1 px-3">Out of stock</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg leading-snug">{p.name}</h3>
                  {p.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-primary">KSh {p.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per {p.unit || "unit"}</p>
                    </div>
                    {outOfStock ? (
                      <Button size="sm" variant="outline" onClick={() => setRestockProduct(p)} className="gap-1.5">
                        <Bell className="h-4 w-4" /> Notify me
                      </Button>
                    ) : (
                      <Button size="sm" asChild>
                        <a
                          href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Hello, I would like to enquire about ${p.name}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Enquire
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RestockDialog product={restockProduct} onClose={() => setRestockProduct(null)} />
    </section>
  );
};
