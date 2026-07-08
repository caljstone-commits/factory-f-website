/* Factory Finish — gallery page (nav + lightbox) */

(() => {
  "use strict";

  const LOGO_SRC = "assets/brand/factory-finish-logo.jpg";
  (() => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      const cx = cv.getContext("2d");
      cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, cv.width, cv.height);
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const lum = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
        if (lum < 16) p[i + 3] = 0;
        else if (lum < 48) p[i + 3] = Math.round(((lum - 16) / 32) * 255);
      }
      cx.putImageData(d, 0, 0);
      let minX = cv.width, minY = cv.height, maxX = 0, maxY = 0;
      for (let y = 0; y < cv.height; y++) {
        for (let x = 0; x < cv.width; x++) {
          if (p[(y * cv.width + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      const pad = 6;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(cv.width - 1, maxX + pad);
      maxY = Math.min(cv.height - 1, maxY + pad);
      const out = document.createElement("canvas");
      out.width = maxX - minX + 1;
      out.height = maxY - minY + 1;
      out.getContext("2d").drawImage(cv, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
      const url = out.toDataURL("image/png");
      document.querySelectorAll(`img[src="${LOGO_SRC}"]`).forEach((el) => { el.src = url; });
    };
    img.src = LOGO_SRC;
  })();

  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const mmenu = document.getElementById("mmenu");

  const onScrollNav = () => nav?.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  const closeMenu = () => {
    burger?.classList.remove("is-open");
    mmenu?.classList.remove("is-open");
    burger?.setAttribute("aria-expanded", "false");
    mmenu?.setAttribute("aria-hidden", "true");
  };

  burger?.addEventListener("click", () => {
    const open = !mmenu.classList.contains("is-open");
    burger.classList.toggle("is-open", open);
    mmenu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    mmenu.setAttribute("aria-hidden", String(!open));
  });

  mmenu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
})();
