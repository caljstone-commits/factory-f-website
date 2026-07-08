// Reads assets/dealers/ and regenerates partner cards in index.html — no dependencies.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const dealersDir = join(root, "assets/dealers");
const indexHtmlPath = join(root, "index.html");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const DEALER_LINKS = {
  "365 new": {
    href: "https://www.365motors.co.uk/",
    label: "365 Motors",
  },
  "phantom new": {
    href: "https://www.phantommotorcompany.co.uk/",
    label: "Phantom Motor Company",
  },
};

const labelFromFilename = (name) => {
  const base = extname(name)
    ? name.slice(0, -extname(name).length).replace(/\s+/g, " ").trim()
    : name;
  return DEALER_LINKS[base]?.label ?? base;
};

const hrefFromFilename = (name) => {
  const base = extname(name)
    ? name.slice(0, -extname(name).length).replace(/\s+/g, " ").trim()
    : name;
  return DEALER_LINKS[base]?.href ?? "#trust";
};

const entries = await readdir(dealersDir, { withFileTypes: true });
const files = entries
  .filter((e) => e.isFile() && IMAGE_EXTS.has(extname(e.name).toLowerCase()))
  .map((e) => e.name)
  .sort((a, b) => a.localeCompare(b, "en"));

const items = files.map((name) => {
  const src = `assets/dealers/${name}`;
  const label = labelFromFilename(name);
  const phantomClass = /phantom/i.test(name) ? " partner--phantom" : "";
  return `    <a class="partner reveal${phantomClass}" href="${hrefFromFilename(name)}" target="_blank" rel="noopener noreferrer" aria-label="${label}">
      <img src="${src}" alt="${label} logo" loading="lazy">
    </a>`;
});

const html = await readFile(indexHtmlPath, "utf8");
const openTag = '  <div class="trust__logos" id="dealerLogos">';
const closeSection = '  </div>\n\n  <p class="trust__support';
const start = html.indexOf(openTag);
const end = html.indexOf(closeSection, start);

if (start === -1 || end === -1) {
  console.error("Could not find dealer logos markers in index.html");
  process.exit(1);
}

const before = html.slice(0, start + openTag.length);
const after = html.slice(end);
const grid = items.length ? `\n${items.join("\n")}\n` : "\n    <!-- No images in assets/dealers/ -->\n";

await writeFile(indexHtmlPath, before + grid + after);

console.log(`Found ${files.length} logo${files.length === 1 ? "" : "s"} in assets/dealers/:`);
files.forEach((f) => console.log(`  - ${f}`));
console.log(files.length ? "index.html updated." : "index.html cleared (no logos found).");
