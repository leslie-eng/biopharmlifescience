/**
 * Downloads catalog images from Wikimedia Commons (CC0 / Public Domain).
 * Run: node scripts/download-catalog-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "images", "catalog");

/** filename on Commons → local output name */
const IMAGES = {
  "syringe-2cc.jpg": "BD_3ml_syringe.jpg",
  "syringe-5cc.jpg": "Syringe_Needle_IV.jpg",
  "syringe-10cc.jpg": "Syringe_Needle_IV.jpg",
  "syringe-20cc.jpg": "Syringe_Needle_IV.jpg",
  "needle.jpg": "Syringe_Needle_IV.jpg",
  "iv-cannula.jpg": "IV_Catheters_(9).JPG",
  "iv-giving-set.jpg": "Intravenous_therapy_bag.jpg",
  "dialysis-dialyzer.jpg": "Dialog-dialysis-machine-b-braun.jpg",
  "dialysis-catheter.jpg": "Dialysis_-_arm_-_01.jpg",
  "dialysis-concentrate.jpg": "Sodium_bicarbonate.jpg",
  "gloves-latex.jpg": "Latex_gloves.jpg",
  "gloves-nitrile.png": "Disposable_nitrile_glove_with_transparent_background.png",
  "gloves-surgical.jpg": "Surgeons_wearing_surgical_gloves.jpg",
  "mask-surgical.jpg": "Surgical_mask_stacked.jpg",
  "mask-oxygen.jpg": "Nonrebreather_mask.jpg",
  "dressing.jpg": "Adhesive_bandage.jpg",
  "cotton-wool.jpg": "Cotton_wool.jpg",
  "gauze.jpg": "Gauze.jpg",
  "surgical-blade.jpg": "Scalpel_blade_10.jpg",
  "kidney-dish.jpg": "Kidney_dish.jpg",
  "spirit.jpg": "Isopropyl_alcohol.jpg",
  "iodine.jpg": "Povidone-iodine.jpg",
  "disinfectant.jpg": "Sodium_hypochlorite.jpg",
  "biohazard-liner.jpg": "Biohazard_bag.jpg",
  "sharps.jpg": "Wall-mounted_sharps_container.JPG",
  "test-glucose.jpg": "Blood_glucose_monitoring.jpg",
  "test-urinalysis.jpg": "Urinalysis_test_strip.jpg",
  "test-pregnancy.jpg": "Pregnancy_test.jpg",
  "test-rapid.jpg": "Rapid_diagnostic_test.jpg",
  "lab-slides.jpg": "Microscope_slides.jpg",
  "lab-vacutainer.jpg": "Vacutainer.jpg",
  "lab-lancet.jpg": "Lancet_(medicine).jpg",
  "lab-specimen.jpg": "Urine_sample_cup.jpg",
  "bp-digital.jpg": "Sphygmomanometer.jpg",
  "bp-analogue.jpg": "Aneroid_sphygmomanometer.jpg",
  "thermometer.jpg": "Clinical_thermometer.jpg",
  "oxygen-regulator.jpg": "Oxygen_tank_regulator.jpg",
  "autoclave.jpg": "Autoclave.jpg",
  "hero-clinic.jpg": "Hospital_room.jpg",
  "linen.jpg": "Hospital_bed_with_linens.jpg",
  "sanitary.jpg": "Paper_towel_roll.jpg",
  "gallipot.jpg": "Medicine_cup.jpg",
  "equipment-default.jpg": "Medical_equipment.jpg",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(localName, commonsName) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commonsName)}?width=900`;
  const dest = path.join(outDir, localName);
  const res = await fetch(url, {
    headers: { "User-Agent": "BiolinkCatalogImageDownloader/1.0 (educational; local dev)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw new Error(`too small (${buf.length} bytes)`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

fs.mkdirSync(outDir, { recursive: true });

let ok = 0;
let fail = 0;
for (const [local, commons] of Object.entries(IMAGES)) {
  try {
    const bytes = await download(local, commons);
    console.log(`OK  ${local} (${bytes} bytes) <- ${commons}`);
    ok++;
  } catch (err) {
    console.warn(`FAIL ${local} <- ${commons}: ${err.message}`);
    fail++;
  }
  await sleep(2500);
}

console.log(`\nDone: ${ok} ok, ${fail} failed → ${outDir}`);
