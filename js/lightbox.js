/* Shared lightbox — gallery, setup grid, brake calipers */

(() => {
  "use strict";

  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxBackdrop = document.getElementById("lightboxBackdrop");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  const lightboxFigure = lightbox.querySelector(".lightbox__figure");

  let lastFocus = null;
  let slides = [];
  let currentIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 48;

  const getGroupItems = (item) => {
    const grid = item.closest(".gallery-grid, .setup__grid");
    if (!grid) return [item];
    return [...grid.querySelectorAll(".gallery-item, .setup__item")];
  };

  const updateNav = () => {
    const show = slides.length > 1;
    lightboxPrev?.toggleAttribute("hidden", !show);
    lightboxNext?.toggleAttribute("hidden", !show);
  };

  const showSlide = (index) => {
    if (!slides.length) return;
    currentIndex = (index + slides.length) % slides.length;
    const item = slides[currentIndex];
    const img = item.querySelector("img");
    lightboxImg.src = item.dataset.full || img?.src || "";
    lightboxImg.alt = img?.alt || "Image";
    updateNav();
  };

  const openLightbox = (item) => {
    slides = getGroupItems(item);
    const idx = slides.indexOf(item);
    lastFocus = document.activeElement;
    showSlide(idx >= 0 ? idx : 0);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    lightboxClose?.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    lightboxImg.src = "";
    slides = [];
    currentIndex = 0;
    updateNav();
    lastFocus?.focus();
  };

  const goNext = () => showSlide(currentIndex + 1);
  const goPrev = () => showSlide(currentIndex - 1);

  document.querySelectorAll(".gallery-item, .setup__item").forEach((item) => {
    item.addEventListener("click", () => openLightbox(item));
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxBackdrop?.addEventListener("click", closeLightbox);
  lightboxPrev?.addEventListener("click", (e) => {
    e.stopPropagation();
    goPrev();
  });
  lightboxNext?.addEventListener("click", (e) => {
    e.stopPropagation();
    goNext();
  });

  lightboxFigure?.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = lightboxFigure.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.2) goPrev();
    else if (x > rect.width * 0.8) goNext();
  });

  lightbox.addEventListener(
    "touchstart",
    (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      touchStartX = e.touches[0].screenX;
      touchStartY = e.touches[0].screenY;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    (e) => {
      if (!lightbox.classList.contains("is-open") || slides.length < 2) return;
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    { passive: true }
  );

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") goNext();
    else if (e.key === "ArrowLeft") goPrev();
  });

  updateNav();
})();
