import { useCallback, useEffect, useState } from "react";
import { getCatalogImage } from "@/data/catalogImages";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    src: getCatalogImage("gloves-nitrile"),
    alt: "Nitrile examination gloves for infection control",
  },
  {
    src: getCatalogImage("mask-surgical"),
    alt: "Surgical face masks for droplet protection in clinics",
  },
  {
    src: getCatalogImage("biohazard-liner"),
    alt: "Biohazard waste liners for safe clinical disposal",
  },
] as const;

const AUTOPLAY_MS = 5500;

export const HeroImageCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return;
    setActiveIndex(carouselApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  useEffect(() => {
    if (!api) return;
    const timer = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [api]);

  return (
    <div className="relative mx-auto w-full max-w-[72%] h-[362px] rounded-2xl overflow-hidden shadow-elegant bg-muted">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="h-full w-full"
        aria-label="Featured clinic and supply imagery"
      >
        <CarouselContent className="-ml-0 h-full [&>div]:h-full">
          {HERO_SLIDES.map((slide, index) => (
            <CarouselItem key={slide.alt} className="pl-0 basis-full h-full">
              <div className="flex h-full w-full items-center justify-center overflow-hidden bg-muted/50">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="max-h-full max-w-full object-contain scale-[1.2]"
                  fetchPriority={index === 0 ? "high" : undefined}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          variant="secondary"
          className="left-2 top-1/2 -translate-y-1/2 z-10 h-6 w-6 border-0 bg-background/80 backdrop-blur-sm shadow-soft hover:bg-background disabled:opacity-40"
        />
        <CarouselNext
          variant="secondary"
          className="right-2 top-1/2 -translate-y-1/2 z-10 h-6 w-6 border-0 bg-background/80 backdrop-blur-sm shadow-soft hover:bg-background disabled:opacity-40"
        />

        <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-2 px-4">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === activeIndex ? "w-6 bg-primary" : "w-2 bg-background/70 hover:bg-background",
              )}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
