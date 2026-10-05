import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import type { StorefrontProduct } from "@/types/api";
import { formatPrice } from "@/lib/storefront";

/** The product's photo, or a neutral placeholder when the POS has none. */
export const ProductImage = ({ product, className }: { product: StorefrontProduct; className?: string }) =>
  product.image_url ? (
    <img src={product.image_url} alt={product.name} className={className} loading="lazy" />
  ) : (
    <div className="h-full w-full flex items-center justify-center bg-muted" role="img" aria-label="No photo yet">
      <Package className="h-10 w-10 text-muted-foreground/40" />
    </div>
  );

export const CatalogProductCard = ({ product }: { product: StorefrontProduct }) => (
  <Link
    to={`/products/${product.slug}`}
    className="group flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-0.5"
  >
    <div className="aspect-[4/3] overflow-hidden bg-muted">
      <ProductImage
        product={product}
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="flex flex-col flex-1 p-5">
      {product.category && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-secondary mb-1.5">{product.category}</p>
      )}
      <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
        {product.name}
      </h3>
      {product.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">{product.description}</p>
      )}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{formatPrice(product)}</span>
        {!product.in_stock && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Out of stock
          </span>
        )}
      </div>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        View details <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </div>
  </Link>
);
