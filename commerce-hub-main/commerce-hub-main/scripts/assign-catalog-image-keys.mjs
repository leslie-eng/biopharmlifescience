import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, "..", "src", "data", "catalog.ts");
let src = fs.readFileSync(catalogPath, "utf8");

const slugToKey = (slug) => {
  if (slug.startsWith("syringe-2cc")) return "syringe-2cc";
  if (slug.startsWith("syringe-5cc")) return "syringe-5cc";
  if (slug.startsWith("syringe-10cc")) return "syringe-10cc";
  if (slug.startsWith("syringe-20cc")) return "syringe-20cc";
  if (slug.startsWith("needle-")) return "needle";
  if (slug.startsWith("iv-cannula")) return "iv-cannula";
  if (slug.startsWith("iv-giving-set")) return "iv-giving-set";
  if (slug.startsWith("dialyzer-")) return "dialysis-dialyzer";
  if (slug.startsWith("catheter-")) return "dialysis-catheter";
  if (slug.startsWith("concentrate-") || slug === "regeneration-salt") return "dialysis-concentrate";
  if (slug.startsWith("gloves-latex")) return "gloves-latex";
  if (slug === "gloves-nitrile") return "gloves-nitrile";
  if (slug === "gloves-clean") return "gloves-nitrile";
  if (slug.startsWith("gloves-sterile")) return "gloves-surgical";
  if (slug.startsWith("mask-medimax")) return "mask-surgical";
  if (slug.startsWith("mask-webo")) return "mask-oxygen";
  if (slug.startsWith("linen-")) return "linen";
  if (slug.startsWith("dressing-")) return "dressing";
  if (slug.startsWith("cotton-wool")) return "cotton-wool";
  if (slug.startsWith("gauze-roll")) return "gauze";
  if (slug.startsWith("surgical-blades")) return "surgical-blade";
  if (slug.startsWith("kidney-dish")) return "kidney-dish";
  if (slug.startsWith("gallipot")) return "gallipot";
  if (slug === "mva-kit-set") return "dressing";
  if (slug.startsWith("spirit-")) return "spirit";
  if (slug.startsWith("iodine-")) return "iodine";
  if (slug.startsWith("sodium-hypochlorite")) return "disinfectant";
  if (slug.startsWith("bin-liner-biohazard")) return "biohazard-liner";
  if (slug === "safety-box-sharps") return "sharps";
  if (slug.startsWith("sanitary-")) return "sanitary";
  if (slug.includes("glucose") || slug === "strip-mission-hb") return "test-glucose";
  if (slug.startsWith("urinalysis-")) return "test-urinalysis";
  if (slug === "test-pregnancy-hcg") return "test-pregnancy";
  if (slug.startsWith("test-") || slug.startsWith("strip-")) return "test-rapid";
  if (slug === "lab-microscope-slides") return "lab-slides";
  if (slug === "lab-vacutainers") return "lab-vacutainer";
  if (slug === "lab-blood-lancets") return "lab-lancet";
  if (slug === "lab-stool-urine-containers") return "lab-specimen";
  if (slug === "bp-machine-analogue") return "bp-analogue";
  if (slug.startsWith("bp-machine-") || slug === "bp-cuffs") return "bp-digital";
  if (slug === "thermometers") return "thermometer";
  if (slug === "oxygen-regulators") return "oxygen-regulator";
  if (slug === "autoclave-machines") return "autoclave";
  return "default";
};

const pattern =
  /product\(\s*"([^"]+)",\s*"[^"]*",\s*"[^"]*",\s*"[^"]*",\s*"([^"]+)"/g;

src = src.replace(pattern, (match, slug, _oldKey) => {
  const key = slugToKey(slug);
  return match.replace(`"${_oldKey}"`, `"${key}"`);
});

fs.writeFileSync(catalogPath, src);
console.log("Updated catalog image keys.");
