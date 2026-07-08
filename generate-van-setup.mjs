// Reads assets/van-setup/ and regenerates the showcase grid in index.html — no dependencies.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const setupDir = join(root, "assets/van-setup");
const indexHtmlPath = join(root, "index.html");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const entries = await readdir(setupDir, { withFileTypes: true });
const files = entries
  .filter((e) => e.isFile() && IMAGE_EXTS.has(extname(e.name).toLowerCase()))
  .map((e) => e.name)
  .sort((a, b) => a.localeCompare(b, "en"));

const items = files.map((name, i) => {
  const n = i + 1;
  const src = `assets/van-setup/${name}`;
  return `    <button type="button" class="setup__item reveal" data-full="${src}" aria-label="View set up image ${n}">
      <img src="${src}" alt="Factory Finish mobile workshop set up ${n}" loading="lazy">
    </button>`;
});

const html = await readFile(indexHtmlPath, "utf8");
const openTag = '  <div class="setup__grid" id="setupGrid">';
const closeSection = "  </div>\n</section>";
const start = html.indexOf(openTag);
const end = html.indexOf(closeSection, start);

if (start === -1 || end === -1) {
  console.error("Could not find setup grid markers in index.html");
  process.exit(1);
}

const before = html.slice(0, start + openTag.length);
const after = html.slice(end);
const grid = items.length ? `\n${items.join("\n")}\n` : "\n    <!-- No images in assets/van-setup/ -->\n";

await writeFile(indexHtmlPath, before + grid + after);

console.log(`Found ${files.length} image${files.length === 1 ? "" : "s"} in assets/van-setup/:`);
files.forEach((f) => console.log(`  - ${f}`));
console.log(files.length ? "index.html updated." : "index.html cleared (no images found).");
