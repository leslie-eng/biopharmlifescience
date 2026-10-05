import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CatalogProductCard, ProductImage } from "@/components/site/CatalogProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/services/http";
import { storefrontApi } from "@/services/storefront";
import { enquiryUrl, formatPrice } from "@/lib/storefront";

const CatalogProductPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const product = useQuery({
    queryKey: ["storefront", "product", slug],
    queryFn: () => storefrontApi.get(slug),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
  const category = product.data?.category ?? "";
  const related = useQuery({
    queryKey: ["storefront", "products", { category, page: 1, related: true }],
    queryFn: () => storefrontApi.list({ category, pageSize: 5 }),
    enabled: Boolean(category),
    select: (page) => page.items.filter((p) => p.id !== product.data?.id).slice(0, 4),
  });

  const back = (
    <Link to="/products" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
      <ArrowLeft className="h-4 w-4" /> Products
    </Link>
  );

  if (product.isPending) {
    return (
      <SiteLayout>
        <div className="site-wrap py-10 md:py-14 grid lg:grid-cols-2 gap-10" aria-label="Loading product">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (product.isError) {
    const missing = product.error instanceof ApiError && product.error.status === 404;
    return (
      <SiteLayout>
        <div className="site-wrap py-20 text-center max-w-md mx-auto">
          <h1 className="font-serif text-2xl text-foreground mb-3">
            {missing ? "This product isn't available" : "We couldn't load this product"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {missing ? "It may have been renamed or removed from our catalog." : product.error.message}
          </p>
          <div className="flex justify-center gap-3">
            {!missing && <Button onClick={() => product.refetch()}>Try again</Button>}
            <Button asChild variant="outline">
              <Link to="/products">Browse all products</Link>
            </Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const item = product.data;
  return (
    <SiteLayout>
      <article className="site-wrap py-10 md:py-14">
        <nav className="text-sm text-muted-foreground mb-8 flex flex-wrap items-center gap-2">
          {back}
          {item.category && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                to={`/products?category=${encodeURIComponent(item.category)}`}
                className="hover:text-primary transition-colors"
              >
                {item.category}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-medium">{item.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div className="rounded-3xl overflow-hidden border border-border/60 shadow-elegant bg-muted aspect-square">
            <ProductImage product={item} className="h-full w-full object-cover" />
          </div>

          <div>
            {item.category && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">{item.category}</p>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-foreground mb-4">{item.name}</h1>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="text-xl font-semibold text-foreground">{formatPrice(item)}</span>
              <span
                className={
                  item.in_stock
                    ? "rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success"
                    : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                }
              >
                {item.in_stock ? "In stock" : "Out of stock"}
              </span>
            </div>
            {item.description && (
              <p className="text-muted-foreground leading-relaxed text-base mb-8 whitespace-pre-line">
                {item.description}
              </p>
            )}

            <a
              href={enquiryUrl(item.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-3.5 min-h-[44px] text-sm font-semibold shadow-soft hover:opacity-95 transition-all"
            >
              Enquire via WhatsApp
            </a>
          </div>
        </div>

        {(related.data?.length ?? 0) > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="font-serif text-xl mb-6">More in this category</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.data!.map((p) => (
                <CatalogProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </article>
    </SiteLayout>
  );
};

export default CatalogProductPage;
