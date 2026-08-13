/**
 * Downloads catalog images from Wikimedia Commons (CC0 / Public Domain).
 * Run: node scripts/download-catalog-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "images", "catalog");

/** Local filename → Wikimedia Commons filename */
const IMAGES = {
  "syringe-2cc.jpg": "BD_3ml_syringe.jpg",
  "syringe-5cc.jpg": "Syringe_Needle_IV.jpg",
  "syringe-10cc.jpg": "Syringe_Needle_IV.jpg",
  "syringe-20cc.jpg": "Syringe_Needle_IV.jpg",
  "needle.jpg": "Syringe_Needle_IV.jpg",
  "iv-cannula.jpg": "IV_Catheters_(9).JPG",
  "iv-giving-set.jpg": "Intravenous_catheter.jpg",
  "dialysis-dialyzer.jpg": "Dialog-dialysis-machine-b-braun.jpg",
  "dialysis-catheter.jpg": "Dialysis_-_arm_-_01.jpg",
  "dialysis-concentrate.jpg": "Sodium_bicarbonate.jpg",
  "gloves-nitrile.png": "Disposable_nitrile_glove_with_transparent_background.png",
  "mask-surgical.jpg": "Surgical_face_mask.jpg",
  "dressing.jpg": "Adhesive_bandage.jpg",
  "cotton-wool.jpg": "Cotton_wool.jpg",
  "gauze.jpg": "Gauze.jpg",
  "surgical-blade.jpg": "Surgical_blade.jpg",
  "spirit.jpg": "Isopropyl_alcohol.jpg",
  "iodine.jpg": "Iodine_solution.jpg",
  "disinfectant.jpg": "Bleach.jpg",
  "biohazard-liner.jpg": "Biohazard_bag.jpg",
  "sharps.jpg": "Wall-mounted_sharps_container.JPG",
  "test-glucose.jpg": "Glucometer.jpg",
  "test-pregnancy.jpg": "Pregnancy_test.jpg",
  "test-rapid.jpg": "Rapid_test.jpg",
  "lab-slides.jpg": "Microscopy_slide.jpg",
  "lab-vacutainer.jpg": "Vacutainer_tubes.jpg",
  "lab-lancet.jpg": "Blood_lancet.jpg",
  "bp-digital.jpg": "Sphygmomanometer.jpg",
  "bp-analogue.jpg": "Blood_pressure_monitor.jpg",
  "thermometer.jpg": "Digital_thermometer.jpg",
  "oxygen-regulator.jpg": "Oxygen_cylinder.jpg",
  "autoclave.jpg": "Autoclave.jpg",
  "hero-clinic.jpg": "Hospital_ward.jpg",
  "linen.jpg": "Hospital_bed.jpg",
  "sanitary.jpg": "Toilet_paper_roll.jpg",
  "gallipot.jpg": "Measuring_cup.jpg",
  "equipment-default.jpg": "Hospital_equipment.jpg",
};

/** Category fallbacks when no exact Commons match exists */
const FALLBACKS = {
  "gloves-latex.png": "gloves-nitrile.png",
  "gloves-surgical.png": "gloves-nitrile.png",
  "mask-oxygen.jpg": "mask-surgical.jpg",
  "kidney-dish.jpg": "gallipot.jpg",
  "test-urinalysis.jpg": "test-glucose.jpg",
  "lab-specimen.jpg": "lab-vacutainer.jpg",
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

for (const [local, source] of Object.entries(FALLBACKS)) {
  const src = path.join(outDir, source);
  const dest = path.join(outDir, local);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`COPY ${local} <- ${source}`);
    ok++;
  }
}

console.log(`\nDone: ${ok} files ready, ${fail} download failures → ${outDir}`);
