import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CatalogProductCard } from "@/components/site/CatalogProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { storefrontApi } from "@/services/storefront";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

const chipClass = (active: boolean) =>
  cn(
    "rounded-full border px-4 py-2.5 min-h-[44px] inline-flex items-center text-xs font-medium transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/30",
  );

/** Products, categories and prices all come from the POS through the public API. */
const CatalogPage = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const update = (changes: Record<string, string | number | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "" || (key === "page" && value === 1)) next.delete(key);
      else next.set(key, String(value));
    }
    setParams(next);
  };

  const categories = useQuery({ queryKey: ["storefront", "categories"], queryFn: storefrontApi.categories });
  const products = useQuery({
    queryKey: ["storefront", "products", { q, category, page }],
    queryFn: () => storefrontApi.list({ q, category, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const pages = products.data ? Math.max(1, Math.ceil(products.data.total / PAGE_SIZE)) : 1;
  const filtered = Boolean(q || category);

  return (
    <SiteLayout>
      <div className="bg-gradient-section border-b border-border/60">
        <div className="site-wrap py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">Product catalog</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">Medical consumables &amp; equipment</h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Browse certified supplies by category, or search for what you need. Open any item for details and to
            enquire.
          </p>

          <form
            role="search"
            className="mt-8 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: search.trim(), page: 1 });
            }}
          >
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="min-h-[44px] bg-card"
            />
            <Button type="submit" className="min-h-[44px] gap-2">
              <Search className="h-4 w-4" /> Search
            </Button>
          </form>

          {(categories.data?.length ?? 0) > 0 && (
            <nav className="mt-6 flex flex-wrap gap-2" aria-label="Product categories">
              <button type="button" className={chipClass(!category)} onClick={() => update({ category: null, page: 1 })}>
                All
              </button>
              {categories.data!.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={chipClass(category.toLowerCase() === c.name.toLowerCase())}
                  onClick={() => update({ category: c.name, page: 1 })}
                >
                  {c.name}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>

      <div className="site-wrap py-12 md:py-16" aria-live="polite">
        {products.isPending ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Loading products">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.isError ? (
          <div className="mx-auto max-w-md text-center py-16">
            <h2 className="font-serif text-xl text-foreground mb-2">We couldn't load the catalog</h2>
            <p className="text-sm text-muted-foreground mb-6">{products.error.message}</p>
            <Button onClick={() => products.refetch()}>Try again</Button>
          </div>
        ) : products.data.items.length === 0 ? (
          <div className="mx-auto max-w-md text-center py-16">
            <h2 className="font-serif text-xl text-foreground mb-2">
              {filtered ? "No products match your search" : "Products are on their way"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {filtered ? "Try another search or category." : "Our catalog is being updated. Please check back soon."}
            </p>
            {filtered && (
              <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>
                Show all products
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {products.data.total} {products.data.total === 1 ? "product" : "products"}
              {category && ` in ${category}`}
              {q && ` matching “${q}”`}
            </p>
            <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3 gap-5", products.isPlaceholderData && "opacity-60")}>
              {products.data.items.map((product) => (
                <CatalogProductCard key={product.id} product={product} />
              ))}
            </div>
            {pages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pages">
                <Button variant="outline" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pages}
                </span>
                <Button variant="outline" disabled={page >= pages} onClick={() => update({ page: page + 1 })}>
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </div>

      <div className="site-wrap pb-16">
        <p className="text-sm text-muted-foreground text-center">
          Need a product not listed?{" "}
          <Link to="/#contact" className="text-primary font-medium hover:underline">
            Contact us
          </Link>{" "}
          for sourcing support.
        </p>
      </div>
    </SiteLayout>
  );
};

export default CatalogPage;
