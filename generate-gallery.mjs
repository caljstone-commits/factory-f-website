// Reads assets/gallery/ and regenerates the grid in gallery.html — no dependencies.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const galleryDir = join(root, "assets/gallery");
const galleryHtmlPath = join(root, "gallery.html");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const entries = await readdir(galleryDir, { withFileTypes: true });
const files = entries
  .filter((e) => e.isFile() && IMAGE_EXTS.has(extname(e.name).toLowerCase()))
  .map((e) => e.name)
  .sort((a, b) => a.localeCompare(b, "en"));

const items = files.map((name, i) => {
  const n = i + 1;
  const src = `assets/gallery/${name}`;
  return `    <button type="button" class="gallery-item" data-full="${src}" aria-label="View image ${n}">
      <img src="${src}" alt="Wheel restoration work ${n}" loading="lazy">
    </button>`;
});

const html = await readFile(galleryHtmlPath, "utf8");
const openTag = '  <div class="gallery-grid" id="galleryGrid">';
const closeSection = "  </div>\n</main>";
const start = html.indexOf(openTag);
const end = html.indexOf(closeSection, start);

if (start === -1 || end === -1) {
  console.error("Could not find gallery grid markers in gallery.html");
  process.exit(1);
}

const before = html.slice(0, start + openTag.length);
const after = html.slice(end);
const grid = items.length ? `\n${items.join("\n")}\n` : "\n    <!-- No images in assets/gallery/ -->\n";

await writeFile(galleryHtmlPath, before + grid + after);

console.log(`Found ${files.length} image${files.length === 1 ? "" : "s"} in assets/gallery/:`);
files.forEach((f) => console.log(`  - ${f}`));
console.log(files.length ? "gallery.html updated." : "gallery.html cleared (no images found).");
