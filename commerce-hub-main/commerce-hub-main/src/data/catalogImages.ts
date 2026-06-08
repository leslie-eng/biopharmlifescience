export type CatalogImageKey =
  | "default"
  | "syringe-2cc"
  | "syringe-5cc"
  | "syringe-10cc"
  | "syringe-20cc"
  | "needle"
  | "iv-cannula"
  | "iv-giving-set"
  | "dialysis-dialyzer"
  | "dialysis-catheter"
  | "dialysis-concentrate"
  | "gloves-latex"
  | "gloves-nitrile"
  | "gloves-surgical"
  | "mask-surgical"
  | "mask-oxygen"
  | "linen"
  | "dressing"
  | "cotton-wool"
  | "gauze"
  | "surgical-blade"
  | "kidney-dish"
  | "gallipot"
  | "spirit"
  | "iodine"
  | "disinfectant"
  | "biohazard-liner"
  | "sharps"
  | "sanitary"
  | "test-glucose"
  | "test-urinalysis"
  | "test-pregnancy"
  | "test-rapid"
  | "lab-slides"
  | "lab-vacutainer"
  | "lab-lancet"
  | "lab-specimen"
  | "bp-digital"
  | "bp-analogue"
  | "thermometer"
  | "oxygen-regulator"
  | "autoclave"
  | "hero-clinic";

/** Local catalog photos — sourced from Wikimedia Commons (CC0 / Public Domain). */
export const catalogImages: Record<CatalogImageKey, string> = {
  default: "/images/catalog/equipment-default.jpg",
  "syringe-2cc": "/images/catalog/syringe-2cc.jpg",
  "syringe-5cc": "/images/catalog/syringe-5cc.jpg",
  "syringe-10cc": "/images/catalog/syringe-10cc.jpg",
  "syringe-20cc": "/images/catalog/syringe-20cc.jpg",
  needle: "/images/catalog/needle.jpg",
  "iv-cannula": "/images/catalog/iv-cannula.jpg",
  "iv-giving-set": "/images/catalog/iv-giving-set.jpg",
  "dialysis-dialyzer": "/images/catalog/dialysis-dialyzer.jpg",
  "dialysis-catheter": "/images/catalog/dialysis-catheter.jpg",
  "dialysis-concentrate": "/images/catalog/dialysis-concentrate.jpg",
  "gloves-latex": "/images/catalog/gloves-latex.png",
  "gloves-nitrile": "/images/catalog/gloves-nitrile.png",
  "gloves-surgical": "/images/catalog/gloves-surgical.png",
  "mask-surgical": "/images/catalog/mask-surgical.jpg",
  "mask-oxygen": "/images/catalog/mask-oxygen.jpg",
  linen: "/images/catalog/linen.jpg",
  dressing: "/images/catalog/dressing.jpg",
  "cotton-wool": "/images/catalog/cotton-wool.jpg",
  gauze: "/images/catalog/gauze.jpg",
  "surgical-blade": "/images/catalog/surgical-blade.jpg",
  "kidney-dish": "/images/catalog/kidney-dish.jpg",
  gallipot: "/images/catalog/gallipot.jpg",
  spirit: "/images/catalog/spirit.jpg",
  iodine: "/images/catalog/iodine.jpg",
  disinfectant: "/images/catalog/disinfectant.jpg",
  "biohazard-liner": "/images/catalog/biohazard-liner.jpg",
  sharps: "/images/catalog/sharps.jpg",
  sanitary: "/images/catalog/sanitary.jpg",
  "test-glucose": "/images/catalog/test-glucose.jpg",
  "test-urinalysis": "/images/catalog/test-urinalysis.jpg",
  "test-pregnancy": "/images/catalog/test-pregnancy.jpg",
  "test-rapid": "/images/catalog/test-rapid.jpg",
  "lab-slides": "/images/catalog/lab-slides.jpg",
  "lab-vacutainer": "/images/catalog/lab-vacutainer.jpg",
  "lab-lancet": "/images/catalog/lab-lancet.jpg",
  "lab-specimen": "/images/catalog/lab-specimen.jpg",
  "bp-digital": "/images/catalog/bp-digital.jpg",
  "bp-analogue": "/images/catalog/bp-analogue.jpg",
  thermometer: "/images/catalog/thermometer.jpg",
  "oxygen-regulator": "/images/catalog/oxygen-regulator.jpg",
  autoclave: "/images/catalog/autoclave.jpg",
  "hero-clinic": "/images/catalog/hero-clinic.jpg",
};

export function getCatalogImage(key: CatalogImageKey = "default"): string {
  return catalogImages[key] ?? catalogImages.default;
}
