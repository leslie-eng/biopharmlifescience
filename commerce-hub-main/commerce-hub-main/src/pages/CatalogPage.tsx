import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CatalogProductCard } from "@/components/site/CatalogProductCard";
import { CATALOG_CATEGORIES, getProductGroupsByCategory } from "@/data/catalog";

const CatalogPage = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [hash]);

  return (
    <SiteLayout>
      <div className="bg-gradient-section border-b border-border/60">
        <div className="site-wrap py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">Product catalog</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">Medical consumables &amp; equipment</h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Browse certified supplies by category. Each product line shares one image — open any item for brands, measurements, and specifications.
          </p>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Product categories">
            {CATALOG_CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="rounded-full border border-border bg-card px-4 py-2.5 min-h-[44px] inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
              >
                {cat.title.split(" (")[0]}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="site-wrap py-12 md:py-16 space-y-20">
        {CATALOG_CATEGORIES.map((category) => {
          const groups = getProductGroupsByCategory(category.id);
          return (
            <section key={category.id} id={category.id} className="scroll-mt-24">
              <div className="mb-8 max-w-3xl">
                <h2 className="font-serif text-xl sm:text-2xl text-foreground mb-2">{category.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{category.summary}</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {groups.map((group) => (
                  <CatalogProductCard key={group.slug} group={group} />
                ))}
              </div>
            </section>
          );
        })}
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


