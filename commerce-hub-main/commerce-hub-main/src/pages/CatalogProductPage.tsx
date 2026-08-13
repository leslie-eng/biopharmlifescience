import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CatalogProductCard } from "@/components/site/CatalogProductCard";
import {
  getCatalogCategory,
  getCatalogProduct,
  getCatalogProductGroup,
  getRelatedGroups,
} from "@/data/catalog";
import { getCatalogImage } from "@/data/catalogImages";
import { WHATSAPP_URL } from "@/lib/contact";

function enquiryUrl(productName: string) {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(`Hello, I would like to enquire about ${productName}.`)}`;
}

const CatalogProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const group = slug ? getCatalogProductGroup(slug) : undefined;
  const legacyProduct = slug ? getCatalogProduct(slug) : undefined;
  const highlightedVariant = legacyProduct?.slug;

  if (!group) {
    return <Navigate to="/products" replace />;
  }

  const category = getCatalogCategory(group.categoryId);
  const related = getRelatedGroups(group);

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
          <span className="text-foreground font-medium">{group.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div className="rounded-3xl overflow-hidden border border-border/60 shadow-elegant bg-muted aspect-square lg:aspect-auto lg:min-h-[420px]">
            <img
              src={getCatalogImage(group.imageKey)}
              alt={group.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">
              {category?.title ?? "Product"}
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-foreground mb-5">{group.name}</h1>
            <p className="text-muted-foreground leading-relaxed text-base mb-8">{group.description}</p>

            <a
              href={enquiryUrl(group.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-3.5 min-h-[44px] text-sm font-semibold shadow-soft hover:opacity-95 transition-all"
            >
              Enquire via WhatsApp
            </a>
          </div>
        </div>

        <section className="mt-12 rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-soft">
          <h2 className="font-serif text-xl text-foreground mb-2">More details</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Brands, measurements, and specifications available in this product line.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Brand</th>
                  <th className="py-3 pr-4 font-medium">Measurement / size</th>
                  <th className="py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {group.variants.map((variant) => (
                  <tr
                    key={variant.slug}
                    id={variant.slug}
                    className={`border-b border-border/60 last:border-0 ${
                      highlightedVariant === variant.slug ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="py-3 pr-4 align-top font-medium text-foreground">
                      {variant.brand ?? variant.label}
                    </td>
                    <td className="py-3 pr-4 align-top text-foreground">
                      {variant.brand ? (variant.measurement ?? "—") : "—"}
                    </td>
                    <td className="py-3 align-top text-muted-foreground">
                      {variant.notes?.length ? variant.notes.join(" · ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="font-serif text-xl mb-6">More in this category</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((g) => (
                <CatalogProductCard key={g.slug} group={g} />
              ))}
            </div>
          </section>
        )}
      </article>
    </SiteLayout>
  );
};

export default CatalogProductPage;
