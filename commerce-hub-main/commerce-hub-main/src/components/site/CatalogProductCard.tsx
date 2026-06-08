import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { CatalogProduct } from "@/data/catalog";
import { getCatalogImage } from "@/data/catalogImages";

export const CatalogProductCard = ({ product }: { product: CatalogProduct }) => (
  <Link
    to={`/products/${product.slug}`}
    className="group flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-0.5"
  >
    <div className="aspect-[4/3] overflow-hidden bg-muted">
      <img
        src={getCatalogImage(product.imageKey)}
        alt={product.name}
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
    </div>
    <div className="flex flex-col flex-1 p-5">
      <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
        {product.name}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">{product.description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        View details <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </div>
  </Link>
);
