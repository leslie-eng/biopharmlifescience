import type { CatalogImageKey } from "./catalogImages";

export type CatalogCategory = {
  id: string;
  slug: string;
  title: string;
  summary: string;
};

export type CatalogProduct = {
  slug: string;
  name: string;
  categoryId: string;
  description: string;
  highlights?: string[];
  imageKey: CatalogImageKey;
};

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "syringes-needles",
    slug: "syringes-needles",
    title: "Syringes and Needles (Injection & Infusion)",
    summary:
      "Syringes by volume (with or without needle) and IV access — for injection, infusion, and vascular procedures.",
  },
  {
    id: "renal-dialysis",
    slug: "renal-dialysis",
    title: "Renal and Dialysis Specialized Supplies",
    summary: "Hemodialysis consumables, vascular access catheters, concentrates, and water-treatment maintenance.",
  },
  {
    id: "ppe-apparel",
    slug: "ppe-apparel",
    title: "Personal Protective Equipment (PPE) & Apparel",
    summary: "Gloves, respiratory protection, oxygen delivery masks, and clinical linens.",
  },
  {
    id: "wound-care",
    slug: "wound-care",
    title: "Wound Care and Surgical Consumables",
    summary: "Dressings, cotton and gauze, surgical blades, instruments, and procedure kits.",
  },
  {
    id: "antiseptics-hygiene",
    slug: "antiseptics-hygiene",
    title: "Antiseptics, Disinfectants, and Hygiene",
    summary: "Surgical spirit, iodine, sodium hypochlorite, biohazard waste supplies, and sanitary rolls.",
  },
  {
    id: "diagnostics-lab",
    slug: "diagnostics-lab",
    title: "Diagnostics and Lab Supplies",
    summary: "Rapid test strips and kits, urinalysis, serology, and essential lab hardware.",
  },
  {
    id: "medical-equipment",
    slug: "medical-equipment",
    title: "Medical Equipment and Devices",
    summary: "Blood pressure monitors, cuffs, thermometers, oxygen regulators, and autoclaves.",
  },
];

function product(
  slug: string,
  name: string,
  categoryId: string,
  description: string,
  imageKey: CatalogImageKey,
  highlights?: string[]
): CatalogProduct {
  return { slug, name, categoryId, description, imageKey, highlights };
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  // 1. Syringes and Needles
  product(
    "syringe-2cc-akshar",
    "2cc Syringe — Akshar",
    "syringes-needles",
    "Single-use 2cc syringe from Akshar for precise low-volume injections and medication draws.",
    "syringe-2cc",
    ["2cc capacity", "Akshar brand"]
  ),
  product(
    "syringe-2cc-arcare",
    "2cc Syringe — Arcare",
    "syringes-needles",
    "Arcare 2cc syringe suitable for routine clinical injections with clear barrel markings.",
    "syringe-2cc"
  ),
  product(
    "syringe-2cc-biobase",
    "2cc Syringe — Biobase",
    "syringes-needles",
    "Biobase 2cc syringe for general ward and outpatient injection use.",
    "syringe-2cc"
  ),
  product(
    "syringe-5cc-finoject",
    "5cc Syringe — Finoject",
    "syringes-needles",
    "Finoject 5cc syringe for moderate-volume draws and IM/SC injections.",
    "syringe-5cc"
  ),
  product(
    "syringe-5cc-kings",
    "5cc Syringe — Kings",
    "syringes-needles",
    "Kings 5cc syringe — reliable for ward medication administration.",
    "syringe-5cc"
  ),
  product(
    "syringe-10cc-akshar",
    "10cc Syringe — Akshar",
    "syringes-needles",
    "Akshar 10cc syringe for larger-volume medication administration and irrigation.",
    "syringe-10cc"
  ),
  product(
    "syringe-10cc-kings",
    "10cc Syringe — Kings",
    "syringes-needles",
    "Kings 10cc syringe with smooth plunger action for clinical use.",
    "syringe-10cc"
  ),
  product(
    "syringe-20cc-finoject",
    "20cc Syringe — Finoject",
    "syringes-needles",
    "Finoject 20cc syringe for high-volume draws, wound irrigation, and procedure support.",
    "syringe-20cc"
  ),
  product(
    "needle-akshar-g21",
    "Akshar Needle — G21",
    "syringes-needles",
    "Sterile hypodermic needle, gauge 21, for IM injections and compatible syringe hubs.",
    "needle",
    ["Gauge 21"]
  ),
  product(
    "needle-akshar-g23",
    "Akshar Needle — G23",
    "syringes-needles",
    "Sterile hypodermic needle, gauge 23, for finer injections including subcutaneous routes.",
    "needle",
    ["Gauge 23"]
  ),
  product(
    "iv-cannula-g24",
    "IV Cannula — G24",
    "syringes-needles",
    "Peripheral IV cannula, gauge 24, for venous access in adult and paediatric patients where appropriate.",
    "iv-cannula",
    ["Gauge 24", "IV access"]
  ),
  product(
    "iv-giving-set-akshar",
    "Akshar IV Giving Set",
    "syringes-needles",
    "Complete IV administration set for gravity infusion with drip chamber and sterile fluid pathway.",
    "iv-giving-set"
  ),

  // 2. Renal and Dialysis
  product(
    "dialyzer-able-1-8",
    "Able Dialyzer — 1.8",
    "renal-dialysis",
    "Able haemodialysis dialyzer, surface area 1.8 m², for prescribed HD treatment protocols.",
    "dialysis-dialyzer",
    ["Surface area 1.8 m²"]
  ),
  product(
    "dialyzer-able-2-0",
    "Able Dialyzer — 2.0",
    "renal-dialysis",
    "Able haemodialysis dialyzer, surface area 2.0 m², for patients requiring higher clearance capacity.",
    "dialysis-dialyzer",
    ["Surface area 2.0 m²"]
  ),
  product(
    "dialyzer-oci-2-0",
    "Oci Dialyzer — 2.0",
    "renal-dialysis",
    "Oci dialyzer 2.0 m² for routine haemodialysis sessions in renal units.",
    "dialysis-dialyzer"
  ),
  product(
    "dialyzer-oci-2-1",
    "Oci Dialyzer — 2.1",
    "renal-dialysis",
    "Oci dialyzer 2.1 m² offering expanded membrane area for HD prescriptions.",
    "dialysis-dialyzer"
  ),
  product(
    "dialyzer-hemocure-1-4",
    "Hemocure Dialyzer — 1.4",
    "renal-dialysis",
    "Hemocure dialyzer 1.4 m² for patients on lower-surface-area dialysis prescriptions.",
    "dialysis-dialyzer"
  ),
  product(
    "catheter-amecath-temporary-hd",
    "Amecath Temporary HD Catheter",
    "renal-dialysis",
    "Temporary haemodialysis catheter for acute vascular access until permanent access matures.",
    "dialysis-catheter"
  ),
  product(
    "catheter-amecath-permanent-hd",
    "Amecath Permanent HD Catheter",
    "renal-dialysis",
    "Long-term tunneled catheter option for patients requiring durable HD vascular access.",
    "dialysis-catheter"
  ),
  product(
    "catheter-medicomp",
    "Medicomp Catheter",
    "renal-dialysis",
    "Medicomp vascular access catheter for dialysis and critical-care infusion pathways.",
    "dialysis-catheter"
  ),
  product(
    "catheter-harsoria-adult-cvc",
    "Harsoria Adult CVC",
    "renal-dialysis",
    "Central venous catheter for adult patients — supports dialysis and high-flow infusion needs.",
    "dialysis-catheter"
  ),
  product(
    "catheter-able-cvc",
    "Able CVC — Multiple Sizes",
    "renal-dialysis",
    "Able central venous catheters available in multiple French sizes for tailored vascular access.",
    "dialysis-catheter",
    ["Multiple sizes available"]
  ),
  product(
    "catheter-arrow-hd-tempcath",
    "Arrow HD Tempcath",
    "renal-dialysis",
    "Arrow temporary haemodialysis catheter for short-term renal replacement therapy access.",
    "dialysis-catheter"
  ),
  product(
    "concentrate-hemocure-sodium-bicarbonate",
    "Hemocure Sodium Bicarbonate Concentrate",
    "renal-dialysis",
    "Bicarbonate concentrate component for haemodialysis fluid preparation and acid-base balance in HD.",
    "dialysis-concentrate"
  ),
  product(
    "concentrate-puro-acid",
    "Puro Acid Concentrate",
    "renal-dialysis",
    "Acid concentrate for dialysis machine mixing — supports prescribed dialysate composition.",
    "dialysis-concentrate"
  ),
  product(
    "concentrate-aea-acid",
    "AEA Acid Concentrate",
    "renal-dialysis",
    "AEA-brand acid concentrate used in haemodialysis water and dialysate systems.",
    "dialysis-concentrate"
  ),
  product(
    "concentrate-citrosafe-21-5l",
    "Citrosafe 21 Citric Acid — 5L",
    "renal-dialysis",
    "5-litre citric acid solution (Citrosafe 21) for catheter lock and line maintenance protocols.",
    "dialysis-concentrate",
    ["5L container"]
  ),
  product(
    "regeneration-salt",
    "Regeneration Salt (Water Treatment)",
    "renal-dialysis",
    "Regeneration salt for dialysis water-treatment systems — maintains resin bed performance in RO units.",
    "dialysis-concentrate"
  ),

  // 3. PPE
  product(
    "gloves-latex-powdered-biobase",
    "Latex Powdered Gloves — Biobase",
    "ppe-apparel",
    "Biobase latex examination gloves with powder for general clinical and procedural use.",
    "gloves-latex"
  ),
  product(
    "gloves-nitrile",
    "Nitrile Gloves",
    "ppe-apparel",
    "Powder-free nitrile gloves offering chemical resistance and latex-free protection for staff.",
    "gloves-nitrile"
  ),
  product(
    "gloves-clean",
    "Clean Gloves",
    "ppe-apparel",
    "Clean-process gloves for environments requiring low particulate contamination.",
    "gloves-nitrile"
  ),
  product(
    "gloves-sterile-surgical-proto-7-5",
    "Sterile Surgical Gloves — Proto 7.5",
    "ppe-apparel",
    "Proto sterile surgical gloves, size 7.5, for aseptic procedures and operating theatre use.",
    "gloves-surgical",
    ["Size 7.5", "Sterile"]
  ),
  product(
    "mask-medimax-face",
    "Medimax Face Masks",
    "ppe-apparel",
    "Medimax surgical face masks for droplet protection in clinical and waiting-area settings.",
    "mask-surgical"
  ),
  product(
    "mask-webo-oxygen-nrm",
    "Webo Oxygen Mask (NRM)",
    "ppe-apparel",
    "Webo non-rebreather oxygen mask for controlled oxygen delivery to hypoxic patients.",
    "mask-oxygen",
    ["Non-rebreather (NRM)"]
  ),
  product(
    "linen-hd-green-towels",
    "HD Green Towels (O-Towels)",
    "ppe-apparel",
    "HD green clinical towels in assorted sizes including O-towel formats for dialysis and ward use.",
    "linen",
    ["Multiple sizes available"]
  ),

  // 4. Wound Care
  product(
    "dressing-medex-gripoderm-10x25",
    "Medex/Gripoderm Waterproof Dressing — 10×25 cm",
    "wound-care",
    "Waterproof adhesive dressing 10×25 cm for post-procedure sites and moisture-resistant wound coverage.",
    "dressing"
  ),
  product(
    "dressing-15x8",
    "Adhesive Dressing — 15×8 cm",
    "wound-care",
    "Sterile adhesive wound dressing 15×8 cm for medium surgical and traumatic wounds.",
    "dressing"
  ),
  product(
    "dressing-7x5",
    "Adhesive Dressing — 7×5 cm",
    "wound-care",
    "Compact sterile dressing 7×5 cm for small incisions, cannulation sites, and abrasions.",
    "dressing"
  ),
  product(
    "cotton-wool-mediwool-400g",
    "Cotton Wool — Mediwool 400g",
    "wound-care",
    "Mediwool absorbent cotton wool 400g roll for wound packing, cleansing, and padding.",
    "cotton-wool",
    ["400g"]
  ),
  product(
    "cotton-wool-mediwool-100g",
    "Cotton Wool — Mediwool 100g",
    "wound-care",
    "Mediwool cotton wool 100g for outpatient dressing changes and minor procedures.",
    "cotton-wool",
    ["100g"]
  ),
  product(
    "cotton-wool-mediwool-50g",
    "Cotton Wool — Mediwool 50g",
    "wound-care",
    "Mediwool cotton wool 50g pack for clinic trays and low-volume wound care.",
    "cotton-wool",
    ["50g"]
  ),
  product(
    "gauze-roll-plain",
    "Gauze Roll — Plain",
    "wound-care",
    "Plain woven gauze roll for wound dressing, bandaging, and absorbent layering.",
    "gauze"
  ),
  product(
    "gauze-roll-xray-detectable",
    "Gauze Roll — X-Ray Detectable",
    "wound-care",
    "X-ray detectable gauze roll for surgical packing — traceable on imaging if retained.",
    "gauze",
    ["X-ray detectable"]
  ),
  product(
    "surgical-blades-100s",
    "Surgical Blades (Box of 100)",
    "wound-care",
    "Sterile surgical blades supplied in boxes of 100 for minor surgery and suturing kits.",
    "surgical-blade"
  ),
  product(
    "kidney-dish-big",
    "Kidney Dish — Big",
    "wound-care",
    "Large stainless-style kidney dish for instruments, swabs, and procedure waste at bedside.",
    "kidney-dish"
  ),
  product(
    "kidney-dish-medium",
    "Kidney Dish — Medium",
    "wound-care",
    "Medium kidney dish for outpatient procedures and dressing trays.",
    "kidney-dish"
  ),
  product(
    "gallipot-small",
    "Gallipot — Small",
    "wound-care",
    "Small gallipot for antiseptic, lotion, and small-volume procedure solutions.",
    "gallipot"
  ),
  product(
    "gallipot-medium",
    "Gallipot — Medium",
    "wound-care",
    "Medium gallipot for ward dressing procedures and solution holding.",
    "gallipot"
  ),
  product(
    "gallipot-big",
    "Gallipot — Big",
    "wound-care",
    "Large gallipot for higher-volume antiseptic or irrigation fluid during procedures.",
    "gallipot"
  ),
  product(
    "mva-kit-set",
    "MVA Kit Set",
    "wound-care",
    "Manual vacuum aspiration kit set for uterine evacuation procedures per clinical protocol.",
    "dressing"
  ),

  // 5. Antiseptics
  product(
    "spirit-surgical-diarim",
    "Surgical Spirit 70% — Diarim",
    "antiseptics-hygiene",
    "Diarim surgical spirit 70% for skin antisepsis before injection and minor procedures. Available from 50ml to 5L.",
    "spirit",
    ["70% formulation", "50ml – 5L sizes"]
  ),
  product(
    "spirit-surgical-faholo",
    "Surgical Spirit 70% — Faholo",
    "antiseptics-hygiene",
    "Faholo surgical spirit 70% for facility-wide skin preparation and instrument cleaning support.",
    "spirit",
    ["70% formulation", "50ml – 5L sizes"]
  ),
  product(
    "iodine-diarim-10",
    "Diarim Iodine 10%",
    "antiseptics-hygiene",
    "Diarim 10% iodine solution for antiseptic skin preparation in clinical settings.",
    "iodine"
  ),
  product(
    "sodium-hypochlorite-faholo-5l",
    "Faholo Sodium Hypochlorite — 5L",
    "antiseptics-hygiene",
    "5-litre sodium hypochlorite for surface disinfection and facility hygiene protocols.",
    "disinfectant",
    ["5L container"]
  ),
  product(
    "bin-liner-biohazard-24x36",
    "Biohazard Bin Liner — 24×36",
    "antiseptics-hygiene",
    "Yellow biohazard waste liner 24×36 inches for infectious and clinical waste segregation.",
    "biohazard-liner"
  ),
  product(
    "bin-liner-biohazard-18x24",
    "Biohazard Bin Liner — 18×24",
    "antiseptics-hygiene",
    "Biohazard liner 18×24 inches for smaller clinical waste bins at point of care.",
    "biohazard-liner"
  ),
  product(
    "bin-liner-biohazard-30x36",
    "Biohazard Bin Liner — 30×36",
    "antiseptics-hygiene",
    "Large biohazard liner 30×36 inches for high-volume waste collection areas.",
    "biohazard-liner"
  ),
  product(
    "safety-box-sharps",
    "Safety Box — Sharps Disposal",
    "antiseptics-hygiene",
    "Puncture-resistant sharps container for safe needle and blade disposal per infection-control policy.",
    "sharps"
  ),
  product(
    "sanitary-medispread-hanaan-2ply",
    "Medispread Hanaan 2-Ply Rolls",
    "antiseptics-hygiene",
    "Hanaan 2-ply sanitary rolls for patient hygiene, surface wiping, and general clinic sanitation.",
    "sanitary"
  ),

  // 6. Diagnostics
  product(
    "strip-mission-hb",
    "Mission HB Test Strips",
    "diagnostics-lab",
    "Mission haemoglobin test strips for point-of-care anaemia screening.",
    "test-glucose"
  ),
  product(
    "strip-on-call-glucose",
    "On Call Glucose Test Strips",
    "diagnostics-lab",
    "On Call blood glucose strips for rapid capillary glucose monitoring.",
    "test-glucose"
  ),
  product(
    "strip-sinocare",
    "Sinocare Test Strips",
    "diagnostics-lab",
    "Sinocare-compatible test strips for glucose monitoring devices used in clinics.",
    "test-rapid"
  ),
  product(
    "urinalysis-bioway",
    "Urinalysis Strips — Bioway",
    "diagnostics-lab",
    "Bioway urinalysis reagent strips for multi-parameter urine screening.",
    "test-urinalysis"
  ),
  product(
    "urinalysis-evancare",
    "Urinalysis Strips — Evancare",
    "diagnostics-lab",
    "Evancare urinalysis strips for routine urine chemistry and screening panels.",
    "test-urinalysis"
  ),
  product(
    "test-pregnancy-hcg",
    "Pregnancy Test (HCG)",
    "diagnostics-lab",
    "Rapid HCG pregnancy test for qualitative detection in clinical and outreach settings.",
    "test-pregnancy"
  ),
  product(
    "test-hiv-determine",
    "HIV Rapid Test — Determine",
    "diagnostics-lab",
    "Determine HIV rapid diagnostic test for screening programmes and clinical triage.",
    "test-rapid"
  ),
  product(
    "test-h-pylori-boson",
    "H. Pylori Test — Boson",
    "diagnostics-lab",
    "Boson H. pylori rapid test for gastric infection screening.",
    "test-rapid"
  ),
  product(
    "test-h-pylori-accurate",
    "H. Pylori Test — Accurate",
    "diagnostics-lab",
    "Accurate-brand H. pylori rapid test kit for outpatient gastroenterology support.",
    "test-rapid"
  ),
  product(
    "test-syphilis",
    "Syphilis Rapid Test",
    "diagnostics-lab",
    "Rapid syphilis serology test for STI screening and antenatal programmes.",
    "test-rapid"
  ),
  product(
    "test-hcv",
    "HCV Rapid Test",
    "diagnostics-lab",
    "Hepatitis C rapid test for screening and referral pathways.",
    "test-rapid"
  ),
  product(
    "lab-microscope-slides",
    "Microscope Slides",
    "diagnostics-lab",
    "Glass microscope slides for laboratory microscopy and specimen examination.",
    "lab-slides"
  ),
  product(
    "lab-vacutainers",
    "Vacutainers",
    "diagnostics-lab",
    "Blood collection vacutainer tubes for phlebotomy and laboratory sample transport.",
    "lab-vacutainer"
  ),
  product(
    "lab-blood-lancets",
    "Blood Lancets",
    "diagnostics-lab",
    "Single-use blood lancets for capillary sampling in glucose and rapid-test workflows.",
    "lab-lancet"
  ),
  product(
    "lab-stool-urine-containers",
    "Stool & Urine Specimen Containers",
    "diagnostics-lab",
    "Sterile specimen containers for stool and urine sample collection and transport to lab.",
    "lab-specimen"
  ),

  // 7. Equipment
  product(
    "bp-machine-omron-m1",
    "BP Machine — Omron M1",
    "medical-equipment",
    "Omron M1 automatic upper-arm blood pressure monitor for accurate clinic vitals.",
    "bp-digital"
  ),
  product(
    "bp-machine-citizen",
    "BP Machine — Citizen",
    "medical-equipment",
    "Citizen digital blood pressure monitor for ward and outpatient vital-sign stations.",
    "bp-digital"
  ),
  product(
    "bp-machine-moratech",
    "BP Machine — Moratech",
    "medical-equipment",
    "Moratech BP device for routine hypertension screening in primary care.",
    "bp-digital"
  ),
  product(
    "bp-machine-fabia",
    "BP Machine — Fabia",
    "medical-equipment",
    "Fabia automatic blood pressure monitor for clinical and community health use.",
    "bp-digital"
  ),
  product(
    "bp-machine-analogue",
    "BP Machine — Analogue (Aneroid)",
    "medical-equipment",
    "Classic aneroid sphygmomanometer with cuff for manual blood pressure measurement.",
    "bp-analogue"
  ),
  product(
    "bp-cuffs",
    "Blood Pressure Cuffs",
    "medical-equipment",
    "Replacement and assorted-size BP cuffs compatible with facility monitors and aneroid sets.",
    "bp-digital",
    ["Multiple sizes available"]
  ),
  product(
    "thermometers",
    "Clinical Thermometers",
    "medical-equipment",
    "Digital and clinical thermometers for fever screening and inpatient temperature monitoring.",
    "thermometer"
  ),
  product(
    "oxygen-regulators",
    "Oxygen Regulators",
    "medical-equipment",
    "Medical oxygen cylinder regulators for controlled flow delivery to masks and tubing.",
    "oxygen-regulator"
  ),
  product(
    "autoclave-machines",
    "Autoclave Machines",
    "medical-equipment",
    "Steam autoclave units for instrument sterilisation per facility infection-control standards.",
    "autoclave"
  ),
];

export type ProductVariant = {
  slug: string;
  label: string;
  brand?: string;
  measurement?: string;
  notes?: string[];
};

export type CatalogProductGroup = {
  slug: string;
  name: string;
  categoryId: string;
  description: string;
  imageKey: CatalogImageKey;
  variants: ProductVariant[];
};

const IMAGE_KEY_GROUP_NAMES: Record<CatalogImageKey, string> = {
  default: "Medical equipment",
  "syringe-2cc": "2cc Syringes",
  "syringe-5cc": "5cc Syringes",
  "syringe-10cc": "10cc Syringes",
  "syringe-20cc": "20cc Syringes",
  needle: "Hypodermic Needles",
  "iv-cannula": "IV Cannulas",
  "iv-giving-set": "IV Giving Sets",
  "dialysis-dialyzer": "Haemodialysis Dialyzers",
  "dialysis-catheter": "Dialysis & Vascular Catheters",
  "dialysis-concentrate": "Dialysis Concentrates & Water Treatment",
  "gloves-latex": "Latex Examination Gloves",
  "gloves-nitrile": "Nitrile Gloves",
  "gloves-surgical": "Sterile Surgical Gloves",
  "mask-surgical": "Surgical Face Masks",
  "mask-oxygen": "Oxygen Delivery Masks",
  linen: "Clinical Linen & Towels",
  dressing: "Adhesive Dressings & Procedure Kits",
  "cotton-wool": "Cotton Wool",
  gauze: "Gauze Rolls",
  "surgical-blade": "Surgical Blades",
  "kidney-dish": "Kidney Dishes",
  gallipot: "Gallipots",
  spirit: "Surgical Spirit 70%",
  iodine: "Iodine Solution",
  disinfectant: "Sodium Hypochlorite Disinfectant",
  "biohazard-liner": "Biohazard Bin Liners",
  sharps: "Sharps Disposal Containers",
  sanitary: "Sanitary Rolls",
  "test-glucose": "Glucose & HB Test Strips",
  "test-urinalysis": "Urinalysis Strips",
  "test-pregnancy": "Pregnancy Tests",
  "test-rapid": "Rapid Diagnostic Tests",
  "lab-slides": "Microscope Slides",
  "lab-vacutainer": "Vacutainer Tubes",
  "lab-lancet": "Blood Lancets",
  "lab-specimen": "Specimen Containers",
  "bp-digital": "Digital Blood Pressure Monitors",
  "bp-analogue": "Analogue BP Monitors",
  thermometer: "Clinical Thermometers",
  "oxygen-regulator": "Oxygen Regulators",
  autoclave: "Autoclave Machines",
  "hero-clinic": "Clinical environment",
};

const productBySlug = new Map(CATALOG_PRODUCTS.map((p) => [p.slug, p]));
const categoryById = new Map(CATALOG_CATEGORIES.map((c) => [c.id, c]));

function groupSlug(categoryId: string, imageKey: CatalogImageKey): string {
  return `${categoryId}--${imageKey}`;
}

function parseVariant(product: CatalogProduct): ProductVariant {
  const dash = product.name.indexOf(" — ");
  const brand = dash >= 0 ? product.name.slice(dash + 3).trim() : undefined;
  const measurement =
    product.highlights?.find((h) => /(\d|×|gauge|size|m²|ml|cc|cm|g\b|l\b|french|fr\b)/i.test(h)) ??
    (dash >= 0 ? product.name.slice(0, dash).trim() : undefined);

  return {
    slug: product.slug,
    label: product.name,
    brand,
    measurement: brand ? measurement : product.name,
    notes: product.highlights,
  };
}

function buildGroupDescription(products: CatalogProduct[], name: string): string {
  if (products.length === 1) return products[0].description;
  const lead = products[0].description.replace(/\s*(from|by)\s+[\w\s]+$/i, "").trim();
  return `${lead} See available brands, measurements, and specifications below.`;
}

function buildProductGroup(categoryId: string, imageKey: CatalogImageKey, products: CatalogProduct[]): CatalogProductGroup {
  return {
    slug: groupSlug(categoryId, imageKey),
    name: IMAGE_KEY_GROUP_NAMES[imageKey] ?? products[0].name,
    categoryId,
    description: buildGroupDescription(products, IMAGE_KEY_GROUP_NAMES[imageKey]),
    imageKey,
    variants: products.map(parseVariant),
  };
}

const catalogGroups: CatalogProductGroup[] = (() => {
  const buckets = new Map<string, CatalogProduct[]>();
  for (const product of CATALOG_PRODUCTS) {
    const key = `${product.categoryId}::${product.imageKey}`;
    const list = buckets.get(key) ?? [];
    list.push(product);
    buckets.set(key, list);
  }
  return [...buckets.entries()].map(([key, products]) => {
    const [categoryId, imageKey] = key.split("::") as [string, CatalogImageKey];
    return buildProductGroup(categoryId, imageKey, products);
  });
})();

const groupBySlug = new Map(catalogGroups.map((g) => [g.slug, g]));
const groupByProductSlug = new Map(
  CATALOG_PRODUCTS.map((p) => [p.slug, groupBySlug.get(groupSlug(p.categoryId, p.imageKey))!]),
);

export function getCatalogProduct(slug: string): CatalogProduct | undefined {
  return productBySlug.get(slug);
}

export function getCatalogCategory(id: string): CatalogCategory | undefined {
  return categoryById.get(id);
}

export function getProductsByCategory(categoryId: string): CatalogProduct[] {
  return CATALOG_PRODUCTS.filter((p) => p.categoryId === categoryId);
}

export function getProductGroupsByCategory(categoryId: string): CatalogProductGroup[] {
  return catalogGroups.filter((g) => g.categoryId === categoryId);
}

export function getCatalogProductGroup(slug: string): CatalogProductGroup | undefined {
  return groupBySlug.get(slug) ?? groupByProductSlug.get(slug);
}

export function getGroupForProduct(product: CatalogProduct): CatalogProductGroup {
  return groupBySlug.get(groupSlug(product.categoryId, product.imageKey))!;
}

export function getRelatedGroups(group: CatalogProductGroup, limit = 4): CatalogProductGroup[] {
  return catalogGroups
    .filter((g) => g.categoryId === group.categoryId && g.slug !== group.slug)
    .slice(0, limit);
}

/** @deprecated Use getRelatedGroups — kept for any legacy callers. */
export function getRelatedProducts(product: CatalogProduct, limit = 4): CatalogProduct[] {
  return CATALOG_PRODUCTS.filter((p) => p.categoryId === product.categoryId && p.slug !== product.slug).slice(
    0,
    limit
  );
}
