import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "dist");
const dest = path.join(root, "server", "public");

if (!fs.existsSync(src)) {
  console.error("Run npm run build first (dist/ not found).");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} → ${dest}`);
