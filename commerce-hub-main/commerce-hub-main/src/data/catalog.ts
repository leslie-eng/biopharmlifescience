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
    "syringe-5cc-with-needle",
    "5cc Syringe with Needle",
    "syringes-needles",
    "A single-use 5ml syringe fitted with a fixed hypodermic needle, built for accurate low-to-mid volume injections. Clear barrel markings support precise dosing, while the smooth plunger action reduces medication wastage during administration. Individually sterile-packed for safe, ready-to-use clinical handling.",
    "syringe-5cc"
  ),
  product(
    "syringe-10cc-with-needle",
    "10cc Syringe with Needle",
    "syringes-needles",
    "A 10ml single-use syringe with an attached needle, designed for medium-volume injections and medication delivery. The graduated barrel allows precise dose measurement, and the sterile packaging ensures it's ready for immediate clinical use without added prep time.",
    "syringe-10cc"
  ),
  product(
    "syringe-20cc-without-needle",
    "20cc Syringe without Needle",
    "syringes-needles",
    "A 20ml syringe supplied without a needle, ideal for larger volume tasks such as flushing, aspiration, or connecting to existing lines and cannulas. Its wide barrel and clear graduations make it easy to draw and administer accurately in high-volume procedures.",
    "syringe-20cc"
  ),
  product(
    "infusion-cannula",
    "Infusion Cannula",
    "syringes-needles",
    "A sterile IV cannula designed for reliable peripheral vascular access. Its sharp, precision-ground needle allows smooth, low-trauma insertion, while the flexible catheter minimizes vein irritation during extended infusion therapy. A dependable choice for routine fluid and medication administration.",
    "iv-cannula"
  ),
  product(
    "burette-infusion-set",
    "Burette Infusion Set",
    "syringes-needles",
    "A calibrated burette infusion set built for controlled, measured fluid or medication delivery — particularly useful in pediatric and precision-dosing cases. The graduated chamber allows accurate volume monitoring, giving clinicians tighter control over infusion rates and total dosage.",
    "infusion-set-burette"
  ),
  product(
    "infusion-set",
    "Infusion Set",
    "syringes-needles",
    "A standard sterile infusion set for delivering IV fluids and medications at a controlled rate. Features a drip chamber for flow monitoring, a roller clamp for rate adjustment, and a puncture-ready spike for quick, secure connection to fluid bags.",
    "infusion-set-standard"
  ),
  product(
    "hypodermic-needles",
    "Hypodermic Needles",
    "syringes-needles",
    "Sterile, single-use hypodermic needles designed for smooth penetration and minimal patient discomfort. Available for use with standard syringes across injection, aspiration, and medication draw-up procedures — a reliable everyday essential for any clinical setting.",
    "needle"
  ),

  // 2. Renal and Dialysis
  product(
    "catheter-central-venous",
    "Central Venous Catheter",
    "renal-dialysis",
    "A sterile catheter inserted into a large central vein to provide vascular access for haemodialysis, medication administration, or fluid management. Designed for secure placement and reliable flow, supporting patients who need urgent or short-term access.",
    "catheter-central-venous"
  ),
  product(
    "fistula-needles-av",
    "Arteriovenous Fistula Needles",
    "renal-dialysis",
    "Specialised needles designed for cannulating an AV fistula during haemodialysis sessions. Sharp, precision-ground tips support smooth, low-trauma insertion, helping preserve fistula integrity over repeated use.",
    "fistula-needles-av"
  ),
  product(
    "catheter-hd-long-term",
    "Long-Term Haemodialysis Catheter",
    "renal-dialysis",
    "A tunnelled, cuffed catheter designed for extended vascular access in patients requiring ongoing dialysis over weeks to months. The cuff anchors the catheter under the skin, reducing infection risk and supporting stable long-term use.",
    "catheter-hd-long-term"
  ),
  product(
    "catheter-hd-acute",
    "Acute Haemodialysis Catheter",
    "renal-dialysis",
    "A non-tunnelled catheter designed for immediate, short-term vascular access in patients requiring urgent dialysis. Quick to insert and reliable for temporary use while long-term access is established.",
    "catheter-hd-acute"
  ),
  product(
    "hd-solution-acid-concentrate",
    "Haemodialysis Solution — Acid Concentrate",
    "renal-dialysis",
    "A concentrated acid solution used in the preparation of dialysate for haemodialysis treatment. Formulated for consistent, accurate dilution ratios to support safe and effective dialysis sessions.",
    "dialysis-concentrate"
  ),
  product(
    "hd-powder-sodium-bicarbonate",
    "Haemodialysis Powder — Sodium Bicarbonate",
    "renal-dialysis",
    "A sodium bicarbonate powder used to prepare bicarbonate concentrate for haemodialysis, helping correct metabolic acidosis in patients. Formulated for reliable dissolution and consistent dialysate composition.",
    "powder-hd-bicarbonate"
  ),
  product(
    "hd-filters-dialyzer",
    "Haemodialysis Filters (Dialyzer)",
    "renal-dialysis",
    "A hollow-fibre dialyzer used to filter waste products and excess fluid from the blood during haemodialysis. Designed for efficient clearance and biocompatibility across a range of patient needs.",
    "dialysis-dialyzer",
    ["Sizes 14H, 17H, 18H, 19, 20H, 21H"]
  ),
  product(
    "regeneration-salt-water-treatment",
    "Regeneration Salt (Water Treatment)",
    "renal-dialysis",
    "A purified sodium chloride salt used to regenerate water softening resin in dialysis water treatment systems. Supports consistent water quality, which is critical to safe dialysate preparation.",
    "regeneration-salt-new"
  ),

  // 3. PPE
  product(
    "face-shield",
    "Face Shield",
    "ppe-apparel",
    "A protective shield worn over the face to guard against splashes, sprays, and droplets during clinical procedures. Lightweight, adjustable headband ensures a secure, comfortable fit for extended wear.",
    "face-shield"
  ),
  product(
    "facemask",
    "Facemask",
    "ppe-apparel",
    "A disposable medical facemask providing a barrier against droplets and airborne particles. Soft, breathable material with an adjustable nose clip for a secure, comfortable fit throughout the shift.",
    "mask-surgical"
  ),
  product(
    "gloves-gynaecological",
    "Gynaecological Gloves",
    "ppe-apparel",
    "Extra-long sterile gloves designed for gynaecological and obstetric examinations, offering extended forearm coverage. Textured fingertips ensure a secure grip during procedures.",
    "gloves-gynaecological"
  ),
  product(
    "gloves-orthopaedic",
    "Orthopaedic Gloves",
    "ppe-apparel",
    "Heavy-duty sterile gloves designed for orthopaedic procedures, offering enhanced puncture resistance against sharp instruments and bone fragments. Reinforced material supports confident handling during high-risk procedures.",
    "gloves-orthopaedic"
  ),
  product(
    "gloves-sterile-surgical",
    "Sterile Surgical Gloves",
    "ppe-apparel",
    "Sterile, powder-free gloves designed for surgical procedures requiring a high level of dexterity and tactile sensitivity. Anatomically shaped for a snug, comfortable fit throughout long procedures.",
    "gloves-surgical"
  ),
  product(
    "gloves-nitrile",
    "Nitrile Gloves",
    "ppe-apparel",
    "Latex-free examination gloves offering strong puncture and chemical resistance for general clinical use. A reliable choice for staff with latex sensitivities, without compromising on grip or durability.",
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
    "gloves-latex",
    "Latex Gloves",
    "ppe-apparel",
    "Flexible, form-fitting examination gloves offering excellent tactile sensitivity and a comfortable stretch fit. A cost-effective, everyday choice for routine clinical procedures.",
    "gloves-latex"
  ),
  product(
    "apron-nylon",
    "Nylon Apron",
    "ppe-apparel",
    "A durable, fluid-resistant apron worn to protect clothing during procedures, cleaning, or patient care tasks. Lightweight and easy to wipe down between uses.",
    "apron-nylon"
  ),
  product(
    "shoe-cover",
    "Shoe Cover",
    "ppe-apparel",
    "Disposable protective covers worn over footwear to maintain hygiene standards in sterile or controlled clinical areas. Elasticated opening ensures a secure, snug fit.",
    "shoe-cover"
  ),
  product(
    "head-cap",
    "Head Cap",
    "ppe-apparel",
    "A lightweight, disposable head cap used to contain hair and maintain hygiene during procedures. Breathable material with an elasticated edge for a comfortable, secure fit.",
    "head-cap"
  ),
  product(
    "gown-disposable",
    "Disposable Gown",
    "ppe-apparel",
    "A single-use protective gown worn to shield clothing and skin from fluids and contamination during procedures or patient care. Lightweight, breathable material with secure back-tie fastening.",
    "gown-disposable"
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

  // 4. Wound Care and Surgical Consumables — Surgical Instruments
  product(
    "forceps-dunhill-artery",
    "Dunhill Artery Forceps",
    "wound-care",
    "A haemostatic forceps used to clamp blood vessels and control bleeding during surgical procedures. Serrated jaws provide a firm, secure grip, and a ratchet lock holds tension without constant hand pressure.",
    "forceps-dunhill-artery",
    ["Available in different sizes"]
  ),
  product(
    "blade-holder",
    "Blade Holder",
    "wound-care",
    "A surgical handle designed to securely hold disposable scalpel blades for precise cutting during procedures. Built for a stable, comfortable grip and easy blade attachment/removal.",
    "blade-holder",
    ["Available in different sizes"]
  ),
  product(
    "sims-uterine-sound",
    "Sims Uterine Sound",
    "wound-care",
    "A slender, curved instrument used to examine and measure the depth and direction of the uterine cavity. Smooth, rounded tip minimizes trauma during gynaecological examination.",
    "sims-uterine-sound",
    ["Available in different sizes"]
  ),
  product(
    "scissor-curved",
    "Curved Scissor",
    "wound-care",
    "A general-purpose surgical scissor with a curved blade for precise cutting of tissue or suture material in confined areas. Sharp, well-aligned blades ensure clean cuts with minimal tissue trauma.",
    "scissor-curved",
    ["Available in different sizes"]
  ),
  product(
    "forceps-dressing",
    "Dressing Forceps",
    "wound-care",
    "A non-locking forceps used to handle dressings, swabs, and tissue during wound care and minor procedures. Serrated tips grip securely without slipping.",
    "forceps-dressing",
    ["Available in different sizes"]
  ),
  product(
    "scissor-suture",
    "Suture Scissor",
    "wound-care",
    "A precision scissor designed for cutting sutures cleanly and accurately during and after procedures. Fine, sharp tips allow controlled, close-to-knot cutting.",
    "scissor-suture",
    ["Available in different sizes"]
  ),
  product(
    "scissor-metzenbaum",
    "Metzenbaum Tissue Scissor",
    "wound-care",
    "A fine-tipped scissor designed for delicate dissection and cutting of soft tissue with minimal trauma. Long, slender blades allow precise control in deeper surgical fields.",
    "scissor-metzenbaum",
    ["Available in different sizes"]
  ),
  product(
    "forceps-allis",
    "Allis Forceps",
    "wound-care",
    "A grasping forceps with interlocking teeth used to hold and manipulate tissue securely during surgery, without excessive crushing. Reliable ratchet lock maintains a firm grip throughout the procedure.",
    "forceps-allis",
    ["Available in different sizes"]
  ),
  product(
    "forceps-mosquito-curved",
    "Curved Mosquito Forceps",
    "wound-care",
    "A small, delicate haemostatic forceps with curved tips, used for clamping fine blood vessels and tissue in precision procedures. Fine jaws allow careful, controlled handling.",
    "forceps-mosquito-curved",
    ["Available in different sizes"]
  ),
  product(
    "forceps-mosquito-straight",
    "Straight Mosquito Forceps",
    "wound-care",
    "A small, delicate haemostatic forceps with straight tips, ideal for clamping fine vessels and tissue where a direct approach is needed. Precise jaw alignment ensures a secure, controlled grip.",
    "forceps-mosquito-straight",
    ["Available in different sizes"]
  ),
  product(
    "speculum-vaginal",
    "Vaginal Speculum",
    "wound-care",
    "An instrument used to gently dilate the vaginal walls for clear visualization during gynaecological examination and procedures. Smooth edges and a secure locking mechanism support both comfort and stability during use.",
    "speculum-vaginal",
    ["Available in different sizes"]
  ),
  product(
    "kidney-dish",
    "Kidney Dish",
    "wound-care",
    "A curved, kidney-shaped stainless steel tray used to hold instruments, swabs, or collect fluids during procedures. Durable, corrosion-resistant construction withstands repeated sterilization cycles.",
    "kidney-dish",
    ["Available in different sizes"]
  ),
  product(
    "gallipot",
    "Gallipot",
    "wound-care",
    "A small stainless steel bowl used to hold antiseptic solutions, swabs, or fluids during minor procedures and dressing changes. Sturdy, easy-to-clean construction supports repeated sterilization.",
    "gallipot",
    ["Available in different sizes"]
  ),
  product(
    "needle-holder",
    "Needle Holder",
    "wound-care",
    "A locking surgical instrument used to grip and control suture needles during wound closure. Textured jaws prevent needle slippage, while the ratchet lock secures a stable hold throughout suturing.",
    "needle-holder",
    ["Available in different sizes"]
  ),
  product(
    "scissor-umbilical-cord",
    "Umbilical Cord Scissor",
    "wound-care",
    "A specialised scissor designed for the safe, clean cutting of the umbilical cord after delivery. Blunt-tipped blades minimise risk to mother and newborn during the procedure.",
    "scissor-umbilical-cord",
    ["Available in different sizes"]
  ),

  // 4. Wound Care and Surgical Consumables — Surgical Consumables
  product(
    "surgical-blades",
    "Surgical Blades",
    "wound-care",
    "Sterile, single-use scalpel blades designed for precise, clean incisions during surgical procedures. Individually wrapped to maintain sterility, with a sharp cutting edge for reliable performance from first use.",
    "surgical-blade"
  ),
  product(
    "safety-box",
    "Safety Box",
    "wound-care",
    "A puncture-resistant sharps disposal container used to safely collect and dispose of used needles, blades, and other sharp instruments. Supports safe waste handling and reduces the risk of needle-stick injuries in clinic.",
    "sharps"
  ),
  product(
    "sanitary-medispread-hanaan-2ply-wc",
    "Medispread Hanaan 2-Ply Rolls",
    "wound-care",
    "Soft, absorbent 2-ply couch/bed rolls used to line examination beds and procedure surfaces for hygiene between patients. Easy-tear perforations allow quick, mess-free changeovers.",
    "sanitary"
  ),
  product(
    "gauze-roll-xray-detectable",
    "X-Ray Gauze Rolls",
    "wound-care",
    "X-ray detectable gauze rolls used for wound packing and dressing where retained material must be identifiable on imaging. Highly absorbent and safe for internal or deep wound use.",
    "gauze-xray",
    ["Available in different sizes"]
  ),
  product(
    "gauze-roll-plain",
    "Plain Gauze Rolls",
    "wound-care",
    "Absorbent, non-woven gauze rolls used for general wound dressing, cleaning, and padding. Soft and gentle on skin while providing reliable absorbency for everyday clinical use.",
    "gauze-plain",
    ["Available in different sizes"]
  ),
  product(
    "cotton-wool",
    "Cotton Wool",
    "wound-care",
    "Soft, absorbent cotton wool used for cleaning wounds, applying antiseptics, and general patient care. Highly absorbent and gentle on skin, suited for a wide range of clinical tasks.",
    "cotton-wool",
    ["Available in different sizes"]
  ),
  product(
    "towel-hd-green",
    "HD Green Towel",
    "wound-care",
    "A durable, heavy-duty green surgical towel used to create a sterile field and drape work areas during procedures. Highly absorbent and built to withstand repeated use and sterilization.",
    "towel-hd-green"
  ),
  product(
    "bin-liner-wc",
    "Bin Liner",
    "wound-care",
    "Durable waste bags used for the safe collection and disposal of clinical and general waste. Puncture-resistant material supports safe handling and hygienic disposal practices.",
    "biohazard-liner",
    ["Available in different sizes"]
  ),
  product(
    "dressing",
    "Dressing",
    "wound-care",
    "Sterile wound dressings used to cover, protect, and support healing of wounds and post-procedure sites. Designed for secure adhesion and reliable absorbency, keeping wounds clean and protected.",
    "dressing"
  ),
  product(
    "blood-lancets",
    "Blood Lancets",
    "wound-care",
    "Sterile, single-use lancets designed for quick, low-pain skin puncture during capillary blood sampling, such as glucose testing. Precision-engineered tip ensures a clean puncture with minimal discomfort.",
    "lab-lancet"
  ),
  product(
    "mask-oxygen-nonrebreather",
    "Non-Rebreather Oxygen Masks",
    "wound-care",
    "A high-concentration oxygen delivery mask fitted with a reservoir bag and one-way valves to minimize rebreathing of exhaled air. Designed for patients requiring high-flow oxygen therapy in emergency or critical care settings.",
    "mask-oxygen",
    ["Available in different sizes"]
  ),
  product(
    "mva-kit-set",
    "MVA Kit Set",
    "wound-care",
    "Manual vacuum aspiration kit set for uterine evacuation procedures per clinical protocol.",
    "dressing"
  ),

  // 5. Antiseptics, Disinfectants, and Hygiene
  product(
    "citric-acid-21",
    "Citric Acid 21%",
    "antiseptics-hygiene",
    "A concentrated descaling and disinfecting solution used mainly for cleaning and decalcifying dialysis machines and other medical equipment. Effective at breaking down mineral deposits while supporting routine equipment hygiene protocols.",
    "citric-acid-21",
    ["5-litre containers"]
  ),
  product(
    "iodine-10",
    "Iodine 10%",
    "antiseptics-hygiene",
    "A broad-spectrum antiseptic solution used for skin disinfection prior to injections, procedures, and wound care. Effective against a wide range of bacteria, fungi, and viruses, making it a clinic essential for infection control.",
    "iodine",
    ["500ml, 1L, and 5L sizes"]
  ),
  product(
    "spirit-surgical-70",
    "Surgical Spirit 70%",
    "antiseptics-hygiene",
    "A fast-acting antiseptic solution used for skin cleansing before injections and minor procedures, as well as general surface disinfection. Evaporates quickly, leaving a clean, sanitized surface without residue.",
    "spirit",
    ["500ml, 1L, and 5L sizes"]
  ),
  product(
    "sodium-hypochlorite",
    "Sodium Hypochlorite",
    "antiseptics-hygiene",
    "A powerful chlorine-based disinfectant used for surface decontamination, instrument soaking, and general infection control across clinical areas. Effective against a broad range of pathogens, supporting strict hygiene and biosafety standards.",
    "disinfectant",
    ["5-litre containers"]
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
    "bp-cuffs-omron",
    "Omron Blood Pressure Cuffs",
    "medical-equipment",
    "A replacement/spare cuff compatible with Omron BP monitors, designed for a snug, accurate fit. Available in neonate, paediatric, and adult sizes, covering the full range of patients from newborns to grown adults. Built with a reliable inflation bladder for consistent readings and a durable fabric that holds up to daily clinical use.",
    "bp-cuffs-omron",
    ["Neonate, paediatric, and adult sizes"]
  ),
  product(
    "bp-machine-analogue",
    "Analogue Blood Pressure Machine",
    "medical-equipment",
    "A manual aneroid sphygmomanometer for hands-on blood pressure measurement, paired with a stethoscope. Favoured for its durability, no dependency on batteries or calibration drift, and long-standing reliability in busy outpatient and ward settings.",
    "bp-analogue"
  ),
  product(
    "bp-machine-omron",
    "Omron Blood Pressure Machine",
    "medical-equipment",
    "A fully automatic digital BP monitor from Omron, delivering fast, accurate systolic/diastolic and pulse readings at the touch of a button. Ideal for routine vitals checks where speed and consistency matter, with minimal training needed for staff.",
    "bp-omron"
  ),
  product(
    "bp-machine-citizen-wrist",
    "Wrist Citizen Blood Pressure Machine",
    "medical-equipment",
    "A compact wrist-worn digital BP monitor from Citizen, suited for quick spot-checks and patients for whom an upper-arm cuff is impractical. Lightweight and portable, making it convenient for home-care visits or space-limited clinic setups.",
    "bp-citizen-wrist"
  ),
  product(
    "bp-machine-moratech-11",
    "Moratech Blood Pressure Monitor (Model 11)",
    "medical-equipment",
    "An automatic digital blood pressure monitor built for consistent, easy-to-read vitals checks. Features Type-C charging, dual memory storage of up to 90 readings, a date and time indicator, and a large, easy-to-read display. A practical, budget-friendly option for clinics needing dependable daily BP monitoring without added complexity.",
    "bp-moratech",
    ["Type-C charging", "Dual memory, up to 90 readings"]
  ),
  product(
    "bp-machine-fabia-upper-arm",
    "Fabia Upper Arm Blood Pressure Monitor",
    "medical-equipment",
    "An upper-arm automatic BP monitor offering accurate one-touch readings and a comfortable adjustable cuff. Features USB charging, dual memory storage of up to 120 readings, a large display, and intelligent voice broadcast of results. A solid choice for general outpatient vitals monitoring where consistent, repeatable results are needed.",
    "bp-fabia",
    ["USB charging", "Dual memory, up to 120 readings", "Voice broadcast"]
  ),
  product(
    "bp-machine-citizen",
    "Citizen Blood Pressure Machine",
    "medical-equipment",
    "An automatic upper-arm digital BP monitor from Citizen, delivering quick and accurate systolic/diastolic readings. Sturdy build and simple interface make it well suited for high-frequency use in clinic settings.",
    "bp-citizen"
  ),
  product(
    "glucostrips-oncall",
    "OnCall Glucostrips",
    "medical-equipment",
    "Compatible test strips for OnCall glucometers, designed for accurate blood glucose readings with a small sample size. Individually sealed for hygiene and shelf stability, supporting routine diabetic monitoring and screening in clinic.",
    "glucostrips-oncall"
  ),
  product(
    "glucometer-oncall-plus",
    "OnCall Plus Machine",
    "medical-equipment",
    "A reliable glucometer for quick, accurate blood glucose testing at the point of care. Simple one-step operation with fast results, making it well suited for both clinic screening and patient self-monitoring support.",
    "glucometer-oncall-plus"
  ),
  product(
    "glucometer-sinocare",
    "Sinocare Machine",
    "medical-equipment",
    "A digital blood glucose monitor offering fast, accurate readings with minimal blood sample volume. Straightforward to operate, making it a dependable option for routine diabetic monitoring in clinics and small hospitals.",
    "glucometer-sinocare"
  ),
  product(
    "glucostrips-sinocare",
    "Sinocare Glucostrips",
    "medical-equipment",
    "Compatible test strips for Sinocare glucometers, formulated for precise glucose readings with minimal sample waste. Individually foil-sealed to protect against moisture, ensuring reliable results test after test.",
    "glucostrips-sinocare"
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
  "infusion-set-burette": "Burette Infusion Sets",
  "infusion-set-standard": "Infusion Sets",
  "dialysis-dialyzer": "Haemodialysis Dialyzers",
  "dialysis-catheter": "Dialysis & Vascular Catheters",
  "dialysis-concentrate": "Dialysis Concentrates & Water Treatment",
  "catheter-central-venous": "Central Venous Catheters",
  "fistula-needles-av": "Arteriovenous Fistula Needles",
  "catheter-hd-long-term": "Long-Term Haemodialysis Catheters",
  "catheter-hd-acute": "Acute Haemodialysis Catheters",
  "powder-hd-bicarbonate": "Haemodialysis Bicarbonate Powder",
  "regeneration-salt-new": "Regeneration Salt (Water Treatment)",
  "gloves-latex": "Latex Examination Gloves",
  "gloves-nitrile": "Nitrile Gloves",
  "gloves-surgical": "Sterile Surgical Gloves",
  "gloves-gynaecological": "Gynaecological Gloves",
  "gloves-orthopaedic": "Orthopaedic Gloves",
  "mask-surgical": "Surgical Face Masks",
  "mask-oxygen": "Oxygen Delivery Masks",
  "face-shield": "Face Shields",
  "apron-nylon": "Nylon Aprons",
  "shoe-cover": "Shoe Covers",
  "head-cap": "Head Caps",
  "gown-disposable": "Disposable Gowns",
  linen: "Clinical Linen & Towels",
  dressing: "Adhesive Dressings & Procedure Kits",
  "cotton-wool": "Cotton Wool",
  gauze: "Gauze Rolls",
  "gauze-xray": "X-Ray Detectable Gauze Rolls",
  "gauze-plain": "Plain Gauze Rolls",
  "surgical-blade": "Surgical Blades",
  "kidney-dish": "Kidney Dishes",
  gallipot: "Gallipots",
  spirit: "Surgical Spirit 70%",
  iodine: "Iodine Solution",
  disinfectant: "Sodium Hypochlorite Disinfectant",
  "citric-acid-21": "Citric Acid 21%",
  "biohazard-liner": "Biohazard Bin Liners",
  sharps: "Sharps Disposal Containers",
  sanitary: "Sanitary Rolls",
  "towel-hd-green": "HD Green Towels",
  "forceps-dunhill-artery": "Dunhill Artery Forceps",
  "forceps-dressing": "Dressing Forceps",
  "forceps-allis": "Allis Forceps",
  "forceps-mosquito-curved": "Curved Mosquito Forceps",
  "forceps-mosquito-straight": "Straight Mosquito Forceps",
  "blade-holder": "Blade Holders",
  "sims-uterine-sound": "Sims Uterine Sounds",
  "scissor-curved": "Curved Scissors",
  "scissor-suture": "Suture Scissors",
  "scissor-metzenbaum": "Metzenbaum Tissue Scissors",
  "scissor-umbilical-cord": "Umbilical Cord Scissors",
  "speculum-vaginal": "Vaginal Specula",
  "needle-holder": "Needle Holders",
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
  "bp-omron": "Omron Blood Pressure Machines",
  "bp-citizen": "Citizen Blood Pressure Machines",
  "bp-citizen-wrist": "Wrist Citizen Blood Pressure Machines",
  "bp-moratech": "Moratech Blood Pressure Monitors",
  "bp-fabia": "Fabia Blood Pressure Monitors",
  "bp-cuffs-omron": "Omron Blood Pressure Cuffs",
  "glucostrips-oncall": "OnCall Glucostrips",
  "glucostrips-sinocare": "Sinocare Glucostrips",
  "glucometer-oncall-plus": "OnCall Plus Machines",
  "glucometer-sinocare": "Sinocare Machines",
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
