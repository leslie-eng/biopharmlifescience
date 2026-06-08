import { Target, Telescope } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { AnimateIn } from "@/components/site/AnimateIn";
import { cn } from "@/lib/utils";

const VALUES = [
  { label: "Proactive Supply", className: "border-secondary/40 text-secondary bg-secondary/5" },
  { label: "Zero Shortages", className: "border-destructive/40 text-destructive bg-destructive/5" },
  { label: "Reliable Delivery", className: "border-success/40 text-success bg-success/5" },
  { label: "Trusted Partnership", className: "border-primary/40 text-primary bg-primary/5" },
  { label: "Clinic-First", className: "border-secondary/40 text-secondary bg-secondary/5" },
] as const;

const TIMELINE = [
  { year: "10+ yrs", desc: "Clinical nursing, specializing in renal & dialysis care" },
  { year: "Early", desc: "Started Nina Medical Supplies — first close contact with clinic owners" },
  { year: "Turning point", desc: "Pain point confirmed: small clinics abandoned by suppliers" },
  { year: "June 2025", desc: "Biolink Solutions EA officially founded in Nairobi" },
] as const;

const CHAPTERS = [
  {
    num: "Chapter 01",
    title: "The Ward Teaches You Things No Classroom Can",
    paragraphs: [
      "For over ten years, I worked directly at the bedside. My time wasn't spent in comfortable, heavily resourced wards, but in the demanding, high-stakes reality of renal and dialysis care. When my patients depend on me two to four times a week, the margin for error is non-existent.",
      "Working in that environment taught me a truth that has never left me: when supplies run short, it isn't a minor logistical hitch. It means a patient misses their critical treatment session. It means a clinician has to compromise or improvise under extreme pressure. I saw firsthand what happens to a healthcare system forced to struggle with whatever is left on the shelf.",
      "That realization stayed with me, quietly growing into a drive to fix it.",
    ],
  },
  {
    num: "Chapter 02",
    title: "The Pattern Nobody Was Talking About",
    paragraphs: [
      "Throughout my decade of clinical work, I began noticing a stark pattern that rarely made it into corporate supplier reports. The massive public hospitals and the well-funded elite facilities had entire procurement departments, automated inventory trackers, and dedicated staff managing their supply chains.",
      "But the small and mid-sized private clinics? I saw the owners doing absolutely everything themselves. They were seeing patients in the morning, rushing to find vendors in the afternoon, and sorting out stock shortages late into the night. Their exhausting cycle of firefighting never ended.",
    ],
    quote:
      "I realized that no major supplier truly cared about small clinics—the ones that couldn't afford an independent procurement department. So, the owners were left to struggle alone, firefighting every single day.",
    paragraphsAfter: [
      "It wasn't that these clinics were poorly managed. It was simply that they were invisible to the broader supply chain. They were treated as too small to be a priority, yet they were entirely too important to our communities to be ignored.",
    ],
  },
  {
    num: "Chapter 03",
    title: "When the Idea Finally Had a Name",
    paragraphs: [
      "I didn't just wake up one morning with a fully formed business plan. The vision grew gradually from real, ground-level experience.",
      "When I first stepped into the supply space by starting Nina Medical Supplies, something fundamental shifted for me. I was no longer just observing the problem from inside the ward; I was interacting directly with clinic owners, operators, and managers. What I discovered on their side confirmed all of my instincts as a clinician.",
      "These medical facilities needed far more than a delivery truck dropping off boxes. They needed a partner who actually understood their clinical workflow, anticipated their inventory drop before it happened, and walked in the door before a shortage became an emergency.",
      "They needed a true partner, not just another vendor invoice.",
    ],
    quote:
      "The deeper I got into the medical supplies space, the clearer the gap became to me. And with that, the solution became undeniable.",
    paragraphsAfter: [
      "That clarity is what drove me to build Biolink Solutions EA. I wanted to create a managed supply model intentionally designed for underserved private clinics. We aren't a traditional distributor that drops stock off and disappears. We are a team that tracks, restocks, and keeps our clinics ahead of their needs.",
    ],
  },
  {
    num: "Chapter 04",
    title: "Why It Matters Beyond Business",
    paragraphs: [
      "For me, Biolink isn't just a commercial project. It is a direct, practical response to a healthcare gap that actively disrupts patient care every single day across Nairobi.",
      "When a clinic is perfectly stocked with gloves, syringes, masks, and diagnostics, healthcare delivery runs smoothly without interruption. That is the bottom line I care about. Beyond balancing supply chain analytics, my focus is on the very end of that chain: ensuring a patient safely receives the care they came for.",
      "That is what my years in nursing taught me, and it is exactly what Biolink is built to protect.",
    ],
  },
] as const;

const AboutPage = () => (
  <SiteLayout>
    <section className="pt-[3.2rem] md:pt-[4.48rem] pb-20 md:pb-28 bg-card">
      <div className="site-wrap">
        <h1 className="sr-only">About Biolink Solutions EA</h1>
        <AnimateIn>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary mb-3">What drives us</p>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-foreground mb-10">Vision &amp; Mission</h2>
        </AnimateIn>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <AnimateIn delay={80}>
            <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground p-8 sm:p-10">
              <span
                className="pointer-events-none absolute -top-4 right-6 font-serif text-[5rem] font-bold leading-none opacity-[0.06] select-none"
                aria-hidden="true"
              >
                V
              </span>
              <div className="relative z-10 h-11 w-11 rounded-xl bg-primary-foreground/10 flex items-center justify-center mb-5">
                <Telescope className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <p className="relative z-10 text-xs uppercase tracking-[0.16em] text-primary-foreground/50 mb-3">
                Our Vision
              </p>
              <p className="relative z-10 font-serif text-lg leading-relaxed">
                A Kenya where every small clinic — no matter its size — has consistent access to the medical
                supplies it needs to deliver safe, dignified patient care.
              </p>
            </div>
          </AnimateIn>

          <AnimateIn delay={160}>
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/40 p-8 sm:p-10">
              <span
                className="pointer-events-none absolute -top-4 right-6 font-serif text-[5rem] font-bold leading-none text-primary opacity-[0.06] select-none"
                aria-hidden="true"
              >
                M
              </span>
              <div className="relative z-10 h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Target className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <p className="relative z-10 text-xs uppercase tracking-[0.16em] text-secondary mb-3">Our Mission</p>
              <p className="relative z-10 font-serif text-lg text-foreground leading-relaxed">
                To provide small and mid-sized private clinics with a proactive, managed supply model for
                consumables — so clinic owners can focus on patients, not procurement.
              </p>
            </div>
          </AnimateIn>
        </div>

        <AnimateIn delay={240}>
          <div className="flex flex-wrap gap-3">
            {VALUES.map((v) => (
              <span
                key={v.label}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border-[1.5px]",
                  v.className,
                )}
              >
                {v.label}
              </span>
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>

    {/* Origin story */}
    <section className="py-20 md:py-28 bg-gradient-section">
      <div className="site-wrap">
        <AnimateIn>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary mb-3">
            The story behind the company
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-foreground mb-12">
            How a Nurse Became a Founder
          </h2>
        </AnimateIn>

        <div className="grid lg:grid-cols-[minmax(240px,1fr)_2fr] gap-12 lg:gap-20 items-start">
          <AnimateIn className="lg:sticky lg:top-24">
            <div className="rounded-2xl bg-primary text-primary-foreground p-8 mb-6">
              <p className="font-serif text-xl leading-snug mb-2">Nickko Kimanthi</p>
              <p className="text-sm text-primary-foreground/65 leading-relaxed">
                Founder, Biolink Solutions EA
                <br />
                Registered Nurse · Dialysis Specialist
              </p>
            </div>
            <div className="space-y-0 border-l-2 border-border pl-5">
              {TIMELINE.map((item) => (
                <div key={item.year} className="relative py-3 first:pt-0 last:pb-0">
                  <span
                    className="absolute -left-[1.35rem] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-secondary"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold text-secondary mb-0.5">{item.year}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimateIn>

          <div className="space-y-12">
            {CHAPTERS.map((ch, i) => (
              <AnimateIn key={ch.num} delay={i * 60}>
                <article className="pb-12 border-b border-border/60 last:border-0 last:pb-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-destructive mb-2">
                    {ch.num}
                  </p>
                  <h3 className="font-serif text-xl text-foreground mb-4">{ch.title}</h3>
                  <div className="text-base text-foreground/80 leading-[1.85] space-y-4">
                    {ch.paragraphs.map((p) => (
                      <p key={p.slice(0, 40)}>{p}</p>
                    ))}
                    {"quote" in ch && ch.quote && (
                      <blockquote className="border-l-[3px] border-secondary bg-secondary/5 rounded-r-lg py-4 px-5 my-6">
                        <p className="font-serif text-lg italic text-primary leading-relaxed m-0">
                          &ldquo;{ch.quote}&rdquo;
                        </p>
                      </blockquote>
                    )}
                    {"paragraphsAfter" in ch &&
                      ch.paragraphsAfter?.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
                  </div>
                </article>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  </SiteLayout>
);

export default AboutPage;
