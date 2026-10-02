import { getCatalogImage } from "@/data/catalogImages";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0">
      <img src={getCatalogImage("hero-clinic")} alt="" className="h-full w-full object-cover" fetchPriority="high" />
      <div className="absolute inset-0 bg-gradient-hero" />
    </div>
    <div className="relative container py-24 md:py-36 text-white">
      <div className="max-w-2xl animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-widest border border-white/20">
          <ShieldCheck className="h-3.5 w-3.5" /> Clean. Safe. Reliable.
        </span>
        <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.05]">
          Certified medical<br />
          <span className="text-white/90">consumables, delivered.</span>
        </h1>
        <p className="mt-5 text-lg text-white/85 max-w-xl leading-relaxed">
          Gloves, masks, disinfectants and biohazard waste solutions for clinics
          and medical centers across East Africa. Order online, pay with M-Pesa.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow">
            <a href="#products">Shop supplies <ArrowRight className="h-4 w-4" /></a>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white">
            <a href="#about">Our managed supply model</a>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
