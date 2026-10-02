import {
  BarChart3,
  ClipboardList,
  Package,
  ShieldCheck,
  Stethoscope,
  Truck,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/site/SiteLayout";
import { AnimateIn } from "@/components/site/AnimateIn";
import { FACILITY_ASSESSMENT_BOOK_PATH } from "@/lib/facilityAssessment";

const HOW_IT_WORKS = [
  {
    title: "Initial Audit",
    desc: "We analyze your monthly consumption rates for essentials like gloves, masks, and disinfectants.",
    icon: ClipboardList,
  },
  {
    title: "Customized Buffering",
    desc: 'We establish "Par Levels" (minimum and maximum stock) tailored to your specific department needs.',
    icon: BarChart3,
  },
  {
    title: "Automated Replenishment",
    desc: "Before you run out, our system triggers a delivery. You no longer need to place manual, last-minute emergency orders.",
    icon: Truck,
  },
];

const BENEFITS = [
  {
    feature: "Eliminate Stockouts",
    benefit: "Ensure critical supplies are always on hand for every procedure.",
  },
  {
    feature: "Reduced Waste",
    benefit: "Prevent over-ordering and the expiration of sterile consumables.",
  },
  {
    feature: "Cost Predictability",
    benefit: "Standardized pricing and predictable monthly billing help stabilize your budget.",
  },
  {
    feature: "Clinical Focus",
    benefit: "Frees your nursing and administrative staff from counting boxes and chasing orders.",
  },
];

const PILLARS = [
  {
    roman: "I",
    title: "Supply Continuity",
    desc: 'We leverage our robust logistics network to ensure that global supply chain fluctuations never affect your local facility. We maintain the "buffer" so you don\'t have to.',
    icon: Package,
  },
  {
    roman: "II",
    title: "Quality Assurance",
    desc: "Every item managed under this model meets strict regulatory standards. From high-filtration masks to medical-grade disinfectants, quality is never compromised for volume.",
    icon: ShieldCheck,
  },
  {
    roman: "III",
    title: "Data-Driven Insights",
    desc: "Receive monthly reports on your consumption patterns. We help you identify areas where you can optimize usage and reduce unnecessary costs.",
    icon: BarChart3,
  },
];

const GET_STARTED = [
  {
    step: "01",
    title: "Consultation",
    desc: "We visit your facility to understand your volume.",
  },
  {
    step: "02",
    title: "Proposal",
    desc: "We provide a flat-rate or consumption-based managed plan.",
  },
  {
    step: "03",
    title: "Implementation",
    desc: "We set up your storage logic and start the first cycle.",
  },
];

const ctaClass =
  "inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-3.5 min-h-[44px] text-sm font-semibold shadow-soft hover:opacity-95 transition-all hover:shadow-glow";

const TheModelPage = () => (
  <SiteLayout>
    {/* Hero */}
    <section className="relative bg-gradient-hero overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--secondary)/0.12),transparent_55%)]" aria-hidden="true" />
      <div className="relative site-wrap py-16 md:py-24">
        <AnimateIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-4">Managed Supply Services</p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.12] max-w-3xl mb-6">
            Your Inventory, <span className="text-primary">Our Priority</span>
          </h1>
        </AnimateIn>
        <AnimateIn delay={120}>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-4">
            A Managed Supply Model shifts the burden of inventory management from clinical staff to your supplier —
            delivering reliability, cost control, and zero-stockout peace of mind.
          </p>
        </AnimateIn>
        <AnimateIn delay={220}>
          <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
            <span className="font-medium text-foreground">Traditional procurement is reactive.</span> Our Managed Supply
            Model is proactive. We don&apos;t just deliver products; we manage your stock levels so you can focus
            entirely on patient care.
          </p>
        </AnimateIn>
      </div>
    </section>

    {/* How it works */}
    <section className="py-20 md:py-28">
      <div className="site-wrap">
        <AnimateIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">How it works</p>
          <h2 className="font-serif text-2xl sm:text-3xl mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl leading-relaxed mb-12">
            We integrate with your facility&apos;s workflow to ensure essential medical consumables are always available
            without overstocking.
          </p>
        </AnimateIn>

        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <AnimateIn key={item.title} delay={i * 100}>
              <div className="glass-panel-teal rounded-2xl p-7 h-full border border-border/40 hover:shadow-elegant transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <item.icon className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>

    {/* Benefits */}
    <section className="py-20 md:py-28 bg-gradient-section">
      <div className="site-wrap">
        <AnimateIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">Benefits</p>
          <h2 className="font-serif text-2xl sm:text-3xl mb-10">Core Benefits to Your Facility</h2>
        </AnimateIn>

        <AnimateIn delay={80}>
          <div className="rounded-2xl border border-border/60 overflow-hidden shadow-soft bg-card">
            <div className="hidden sm:grid sm:grid-cols-2 bg-primary/5 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="px-6 py-4">Feature</div>
              <div className="px-6 py-4">Benefit</div>
            </div>
            {BENEFITS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid sm:grid-cols-2 gap-1 sm:gap-0 border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40 ${
                  i % 2 === 0 ? "bg-card" : "bg-muted/20"
                }`}
              >
                <div className="px-6 py-5 font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-secondary shrink-0 sm:hidden" aria-hidden="true" />
                  {row.feature}
                </div>
                <div className="px-6 pb-5 sm:py-5 text-sm text-muted-foreground leading-relaxed">
                  <span className="sm:hidden text-xs font-semibold uppercase text-secondary block mb-1">Benefit</span>
                  {row.benefit}
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>

    {/* Three pillars */}
    <section className="py-20 md:py-28">
      <div className="site-wrap">
        <AnimateIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">Our approach</p>
          <h2 className="font-serif text-2xl sm:text-3xl mb-12">Our Three-Pillar Approach</h2>
        </AnimateIn>

        <div className="space-y-6">
          {PILLARS.map((pillar, i) => (
            <AnimateIn key={pillar.title} delay={i * 120}>
              <div className="flex flex-col sm:flex-row gap-6 glass-panel-teal rounded-2xl p-7 sm:p-8">
                <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 shrink-0">
                  <span className="font-serif text-3xl text-primary/80">{pillar.roman}</span>
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <pillar.icon className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">{pillar.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>

    {/* Get started */}
    <section className="py-20 md:py-28 bg-gradient-section">
      <div className="site-wrap">
        <AnimateIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-3">Next steps</p>
          <h2 className="font-serif text-2xl sm:text-3xl mb-3">Get Started</h2>
          <p className="text-muted-foreground mb-12 max-w-xl">
            Ready to modernize your supply chain?
          </p>
        </AnimateIn>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {GET_STARTED.map((step, i) => (
            <AnimateIn key={step.title} delay={i * 100}>
              <div className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-soft h-full">
                <span className="text-xs font-semibold text-secondary">{step.step}</span>
                <h3 className="font-semibold text-lg mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < GET_STARTED.length - 1 && (
                  <span
                    className="hidden md:block absolute top-1/2 -right-3 text-muted-foreground/30 text-xl"
                    aria-hidden="true"
                  >
                    →
                  </span>
                )}
              </div>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn delay={200}>
          <div className="glass-panel-teal rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg mb-1">Start with a facility assessment</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We visit your clinic, map your consumption, and design a managed plan built around your workflow.
                </p>
              </div>
            </div>
            <Link
              to={FACILITY_ASSESSMENT_BOOK_PATH}
              className={`${ctaClass} shrink-0 text-center`}
            >
              Book Your Facility Assessment
            </Link>
          </div>
        </AnimateIn>
      </div>
    </section>
  </SiteLayout>
);

export default TheModelPage;



