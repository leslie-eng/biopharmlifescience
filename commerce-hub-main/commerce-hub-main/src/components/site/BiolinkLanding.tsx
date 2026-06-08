import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FACILITY_ASSESSMENT_BOOK_PATH } from "@/lib/facilityAssessment";
import {
  ArrowRight,
  ClipboardCheck,
  Eye,
  MessageCircle,
  PackageCheck,
  Truck,
} from "lucide-react";
import { AboutHeroIntro } from "@/components/site/AboutHeroIntro";
import { BrandLogo } from "@/components/site/BrandLogo";
import { ABOUT_PATH } from "@/lib/about";
import { HeroImageCarousel } from "@/components/site/HeroImageCarousel";
import {
  EMAIL,
  EMAIL_HREF,
  PHONE_DISPLAY,
  PHONE_HREF,
  scrollToSection,
  WHATSAPP_URL,
} from "@/lib/contact";

const ctaClass =
  "homepage-cta inline-flex w-full sm:w-auto items-center justify-center rounded-full px-8 py-3.5 min-h-[44px] text-sm font-semibold transition-all";

const ctaOutlineClass =
  "homepage-cta-outline inline-flex w-full sm:w-auto items-center justify-center rounded-full border-2 px-8 py-3.5 min-h-[44px] text-sm font-semibold transition-colors shrink-0";

const MODEL_STEPS = [
  {
    step: "01",
    title: "Visit",
    desc: "We tour your facility and map how supplies move through each department.",
    icon: Truck,
  },
  {
    step: "02",
    title: "Assess",
    desc: "Consumption patterns are analyzed to set accurate par levels and safety buffers.",
    icon: ClipboardCheck,
  },
  {
    step: "03",
    title: "Monitor",
    desc: "Stock levels are tracked continuously so shortages are caught before they happen.",
    icon: Eye,
  },
  {
    step: "04",
    title: "Confirm",
    desc: "You approve replenishment plans — transparent, predictable, no surprises.",
    icon: MessageCircle,
  },
  {
    step: "05",
    title: "Deliver",
    desc: "Certified consumables arrive on schedule. Your team stays focused on patients.",
    icon: PackageCheck,
  },
];

export const BiolinkLanding = () => {
  const { hash } = useLocation();

  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (id) requestAnimationFrame(() => scrollToSection(id));
  }, [hash]);

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      <h1 className="sr-only">Biolink Solutions EA — Premium medical consumables and managed supply for clinics</h1>

      <section className="relative bg-gradient-hero overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-secondary/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/3 left-1/4 h-40 w-40 rounded-full bg-destructive/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative site-wrap py-16 md:py-24 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.12] text-foreground mb-6">
                Never Run Out of Essential Supplies Again
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-10">
                Biolink proactively manages your essential consumables, monitoring usage, preventing stockouts
                and delivering before your shelves go empty.
              </p>
              <Link to={FACILITY_ASSESSMENT_BOOK_PATH} className={ctaClass}>
                Book Your Facility Assessment
              </Link>
            </div>

            <div className="order-1 lg:order-2 flex flex-col gap-4 lg:relative">
              <HeroImageCarousel />
              <div className="glass-panel-teal homepage-stat rounded-2xl px-5 py-4 max-w-full sm:max-w-[220px] lg:absolute lg:-bottom-4 lg:left-4 lg:max-w-[220px]">
                <p className="homepage-stat-value text-2xl font-serif leading-none">97%</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  Average fill rate across partner clinics
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="the-model" className="scroll-mt-20 py-20 md:py-28 bg-gradient-section border-y border-border/40">
        <div className="site-wrap">
          <div className="max-w-2xl mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">Dhibiti Model</p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl mb-4">
              Five steps to uninterrupted clinical supply
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Traditional procurement is reactive — ours is proactive. We analyze how your facility consumes
              essentials, then build a replenishment rhythm that eliminates emergency orders and expired overstock.
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible mb-12">
            {MODEL_STEPS.map((s, i) => (
              <div
                key={s.title}
                className="glass-panel-teal homepage-model-card rounded-2xl p-5 min-w-[200px] sm:min-w-[220px] lg:min-w-0 snap-start shrink-0 lg:shrink flex flex-col border"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="homepage-step text-xs font-semibold">{s.step}</span>
                  {i < MODEL_STEPS.length - 1 && (
                    <span className="hidden lg:block text-muted-foreground/40 text-lg" aria-hidden="true">
                      →
                    </span>
                  )}
                </div>
                <s.icon
                  className={`h-6 w-6 mb-3 ${i % 2 === 0 ? "homepage-icon-blue" : "homepage-icon-green"}`}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel-teal rounded-2xl p-6 sm:p-8 border border-border/40">
            <div className="max-w-lg">
              <p className="font-semibold text-foreground mb-1">Want the full picture?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                See core benefits, our three-pillar approach, and how to get started with a facility assessment.
              </p>
            </div>
            <Link
              to="/the-model"
              className={`${ctaOutlineClass} gap-2 px-7 py-3`}
            >
              Learn more about Dhibiti model <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>



      <section id="about" className="scroll-mt-20 py-20 md:py-28 bg-gradient-section">
        <div className="site-wrap">
          <div className="max-w-2xl mb-10 md:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">About us</p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-foreground">
              Who we are
            </h2>
          </div>

          <AboutHeroIntro variant="embedded" />

          <div className="mt-8 flex justify-center sm:justify-start">
            <Link
              to={ABOUT_PATH}
              className={`${ctaOutlineClass} gap-2`}
            >
              Read our full story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer id="contact" className="site-footer homepage-footer scroll-mt-20 border-t py-10">
        <div className="site-wrap flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-col items-start gap-2">
            <BrandLogo className="text-lg hover:opacity-90 transition-opacity" />
            <p className="text-xs text-secondary font-medium sm:pl-[2.75rem]">Clean · Safe · Reliable</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
            <a href={PHONE_HREF} className="hover:text-primary transition-colors min-h-[44px] inline-flex items-center">
              {PHONE_DISPLAY}
            </a>
            <span className="hidden sm:inline text-border">|</span>
            <a href={EMAIL_HREF} className="hover:text-primary transition-colors break-all min-h-[44px] inline-flex items-center">
              {EMAIL}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              WhatsApp
            </a>
          </div>
          <p className="text-xs text-muted-foreground sm:text-right">© 2025 Biolink Solutions East Africa Ltd</p>
        </div>
      </footer>
    </div>
  );
};
