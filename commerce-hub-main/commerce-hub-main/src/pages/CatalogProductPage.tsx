import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CatalogProductCard } from "@/components/site/CatalogProductCard";
import {
  getCatalogCategory,
  getCatalogProduct,
  getRelatedProducts,
} from "@/data/catalog";
import { getCatalogImage } from "@/data/catalogImages";
import { WHATSAPP_URL } from "@/lib/contact";

function enquiryUrl(productName: string) {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(`Hello, I would like to enquire about ${productName}.`)}`;
}

const CatalogProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getCatalogProduct(slug) : undefined;

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const category = getCatalogCategory(product.categoryId);
  const related = getRelatedProducts(product);

  return (
    <SiteLayout>
      <article className="site-wrap py-10 md:py-14">
        <nav className="text-sm text-muted-foreground mb-8 flex flex-wrap items-center gap-2">
          <Link to="/products" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Products
          </Link>
          {category && (
            <>
              <span aria-hidden="true">/</span>
              <Link to={`/products#${category.id}`} className="hover:text-primary transition-colors">
                {category.title.split(" (")[0]}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div className="rounded-3xl overflow-hidden border border-border/60 shadow-elegant bg-muted aspect-square lg:aspect-auto lg:min-h-[420px]">
            <img
              src={getCatalogImage(product.imageKey)}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">
              {category?.title ?? "Product"}
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-foreground mb-5">{product.name}</h1>
            <p className="text-muted-foreground leading-relaxed text-base mb-6">{product.description}</p>

            {product.highlights && product.highlights.length > 0 && (
              <ul className="mb-8 space-y-2">
                {product.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            )}

            <a
              href={enquiryUrl(product.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-3.5 min-h-[44px] text-sm font-semibold shadow-soft hover:opacity-95 transition-all"
            >
              Enquire via WhatsApp
            </a>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="font-serif text-xl mb-6">More in this category</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <CatalogProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </article>
    </SiteLayout>
  );
};

export default CatalogProductPage;

