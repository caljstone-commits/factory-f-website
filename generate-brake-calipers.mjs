// Reads assets/brakes/ and regenerates the grid in brake-calipers.html — no dependencies.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const brakesDir = join(root, "assets/brakes");
const htmlPath = join(root, "brake-calipers.html");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const entries = await readdir(brakesDir, { withFileTypes: true });
const files = entries
  .filter((e) => e.isFile() && IMAGE_EXTS.has(extname(e.name).toLowerCase()))
  .map((e) => e.name)
  .sort((a, b) => a.localeCompare(b, "en"));

const items = files.map((name, i) => {
  const n = i + 1;
  const src = `assets/brakes/${name}`;
  return `    <button type="button" class="gallery-item reveal" data-full="${src}" aria-label="View brake caliper image ${n}">
      <img src="${src}" alt="Brake caliper customisation work ${n}" loading="lazy">
    </button>`;
});

const html = await readFile(htmlPath, "utf8");
const openTag = '  <div class="gallery-grid" id="brakesGrid">';
const closeSection = '  </div>\n\n  <div class="service-page__cta">';
const start = html.indexOf(openTag);
const end = html.indexOf(closeSection, start);

if (start === -1 || end === -1) {
  console.error("Could not find brakes grid markers in brake-calipers.html");
  process.exit(1);
}

const before = html.slice(0, start + openTag.length);
const after = html.slice(end);
const grid = items.length ? `\n${items.join("\n")}\n` : "\n    <!-- No images in assets/brakes/ -->\n";

await writeFile(htmlPath, before + grid + after);

console.log(`Found ${files.length} image${files.length === 1 ? "" : "s"} in assets/brakes/:`);
files.forEach((f) => console.log(`  - ${f}`));
console.log(files.length ? "brake-calipers.html updated." : "brake-calipers.html cleared (no images found).");
