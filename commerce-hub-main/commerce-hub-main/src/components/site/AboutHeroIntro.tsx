import { cn } from "@/lib/utils";

export const ABOUT_STATS = [
  { number: "10+", label: "Years in healthcare" },
  { number: "2025", label: "Year founded" },
  { number: "SME", label: "Clinics we serve" },
] as const;

type AboutHeroIntroProps = {
  /** Full-bleed on About page; contained card on homepage */
  variant?: "page" | "embedded";
  /** Use h1 for the main headline (About page) */
  pageTitle?: boolean;
  className?: string;
};

export const AboutHeroIntro = ({ variant = "page", pageTitle = false, className }: AboutHeroIntroProps) => {
  const Headline = pageTitle ? "h1" : "h2";

  return (
  <div
    className={cn(
      "grid lg:grid-cols-2 min-h-0",
      variant === "page" && "lg:min-h-[calc(100vh-4rem)]",
      variant === "embedded" && "rounded-3xl overflow-hidden shadow-elegant border border-border/50",
      className,
    )}
  >
    <div className="relative overflow-hidden bg-primary text-primary-foreground gutter-wide-x py-12 lg:py-16 flex flex-col justify-center">
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-secondary/25"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-16 -left-10 h-40 w-40 rounded-full bg-destructive/15"
        aria-hidden="true"
      />
      <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.18em] text-secondary mb-5">
        About Biolink Solutions EA
      </p>
      <Headline className="relative z-10 font-serif text-2xl sm:text-3xl lg:text-[2.5rem] leading-[1.15] mb-5">
        Built by a nurse.
        <br />
        <em className="italic text-secondary">For the clinics</em>
        <br />
        nobody else serves.
      </Headline>
      <p className="relative z-10 text-base text-primary-foreground/70 max-w-md leading-relaxed">
        We are a managed medical supply company. We don&apos;t just deliver — we stay ahead, so your clinic
        never runs short.
      </p>
    </div>

    <div className="bg-card gutter-wide-x py-12 lg:py-16 flex flex-col justify-center">
      <span className="inline-flex items-center gap-2 w-fit rounded-full border border-success/30 bg-success/10 text-success px-3.5 py-1 text-xs font-medium tracking-wide mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        Founded June 2025 · Nairobi, Kenya
      </span>
      <p className="text-base text-foreground/85 leading-relaxed mb-4">
        Biolink Solutions EA was born from a simple but urgent observation: small and mid-sized private
        clinics in Kenya are underserved by their suppliers. The owner firefights daily. Supplies run out.
        Patient care suffers.
      </p>
      <p className="text-base text-foreground/85 leading-relaxed mb-8">
        We exist to change that — one managed supply relationship at a time.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {ABOUT_STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-muted/50 p-4 sm:p-5">
            <p className="font-serif text-xl sm:text-2xl font-bold text-primary leading-none mb-1">{s.number}</p>
            <p className="text-xs text-muted-foreground tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};
