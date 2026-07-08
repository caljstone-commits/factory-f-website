# Factory Finish — Cinematic Scroll Website

Premium one-page scroll experience for Factory Finish (mobile alloy wheel
refurbishment & diamond cutting, North West UK). Pure static HTML/CSS/JS —
no build step, no node_modules.

## Run locally

```bash
node serve.mjs        # serves the site at http://127.0.0.1:4173
```

Any static server works (`npx serve`, VS Code/Cursor Live Server, etc.).
`serve.mjs` is a zero-dependency Node server that sends `Cache-Control: no-store`
so edits always show on refresh.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | All 7 sections: hero, process, stats, services, wheel configurator, trust/partners, final CTA + footer |
| `css/style.css` | Full design system. Brand purple `#9301EE` (sampled from the logo — do not change) |
| `js/main.js` | Loader, Lenis smooth scroll + GSAP ScrollTrigger animations, stat counters, card tilt, configurator, testimonial carousel |
| `assets/brand/` | **Exact client-supplied logos — never recreate or restyle these** |
| `assets/van/`, `assets/g63/` | Panels cropped from client-supplied photography |
| `assets/scenes/` | AI-generated cinematics (hero, night run, lathe macro, configurator wheel) |
| `assets/work/` | Real job photo |

GSAP 3.12 + ScrollTrigger and Lenis 1.1 load from jsdelivr CDN (see bottom of
`index.html`), so an internet connection is needed for the animations.

## Important implementation notes

- **Logo handling:** `assets/brand/factory-finish-logo.jpg` sits on a black
  plate. At runtime `js/main.js` chroma-keys the black to transparency and
  trims the margins on a canvas, then swaps every logo `<img>` to that data
  URL. The brand pixels are never altered — keep it that way.
- **Configurator finishes** are CSS `filter` presets on the wheel render plus a
  `mix-blend-mode: color` tint layer for custom colours (see `FINISHES` in
  `js/main.js`).
- **Partner logos** (365 Motors, Phantom Motor Company) must stay in identical
  fixed-size glass containers per the client brief.
- Asset links are versioned (`?v=3`) — bump when shipping CSS/JS changes to
  defeat stale caches.

## Outstanding / deferred

- Instagram button in the final CTA points to instagram.com — needs the real
  handle.
- Cinematic video clips (Arrival / Transformation / Reveal / Night Run) were
  specced for Seedance 2.0 on Higgsfield (~36 credits per 8s clip, ~144 total)
  but deferred — account had 10 credits. The section image plates are designed
  to be swapped for `<video>` elements when the clips are generated. Reference
  images (van, G63, logo) are already uploaded to the Higgsfield media library.

## Contact details in use

- info@factoryfinish.co.uk · 07740 011033 · WhatsApp wa.me/447740011033
