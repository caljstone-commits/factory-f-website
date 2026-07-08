/* Finish configurator — plain JS image selector */

(() => {
  "use strict";

  const preview = document.getElementById("configPreview");
  const swatches = document.querySelectorAll(".configurator__swatch");
  if (!preview || !swatches.length) return;

  const FINISHES = {
    "gloss-black": {
      name: "Gloss Black",
      images: [
        "assets/colour-config/black-1.png",
        "assets/colour-config/black-2.png",
      ],
    },
    "silver-gloss": {
      name: "Silver Gloss",
      images: [
        "assets/colour-config/silver-1.png",
        "assets/colour-config/silver-2.png",
      ],
    },
    "imola-bronze": {
      name: "Imola Bronze",
      images: [
        "assets/colour-config/imola-1.png",
        "assets/colour-config/imola-2.png",
      ],
    },
    "shadow-chrome": {
      name: "Shadow Chrome",
      images: [
        "assets/colour-config/shadow-chrome-1.png",
        "assets/colour-config/shadow-chrome-2.png",
      ],
    },
  };

  const imgs = preview.querySelectorAll("img");

  const showFinish = (key) => {
    const finish = FINISHES[key];
    if (!finish) return;

    finish.images.forEach((src, i) => {
      if (!imgs[i]) return;
      imgs[i].src = src;
      imgs[i].alt = `${finish.name} alloy wheel — view ${i + 1}`;
    });
  };

  swatches.forEach((btn) => {
    btn.addEventListener("click", () => {
      swatches.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      showFinish(btn.dataset.finish);
    });
  });

  showFinish("gloss-black");
})();
