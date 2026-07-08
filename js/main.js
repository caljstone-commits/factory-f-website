/* ═══════════════════════════════════════════════════════════════
   FACTORY FINISH — motion system
   Lenis smooth scroll + GSAP ScrollTrigger, scroll-scrubbed
   cinematic sequences, counters, carousel.
   ═══════════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ───────────── Logo transparency ─────────────
     The supplied logo artwork sits on a pure black plate. We keep every
     brand pixel exactly as supplied and only lift the black background
     to alpha so the mark can float over imagery. */

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
        // near-black plate → transparent, smooth ramp keeps edge anti-aliasing
        if (lum < 16) p[i + 3] = 0;
        else if (lum < 48) p[i + 3] = Math.round(((lum - 16) / 32) * 255);
      }
      cx.putImageData(d, 0, 0);
      // trim to the artwork's bounding box so the mark fills its layout size
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
      minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
      maxX = Math.min(cv.width - 1, maxX + pad); maxY = Math.min(cv.height - 1, maxY + pad);
      const out = document.createElement("canvas");
      out.width = maxX - minX + 1;
      out.height = maxY - minY + 1;
      out.getContext("2d").drawImage(cv, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
      const url = out.toDataURL("image/png");
      document.querySelectorAll(`img[src="${LOGO_SRC}"]:not(.loader__logo)`).forEach((el) => { el.src = url; });
    };
    img.src = LOGO_SRC;
  })();

  /* ───────────── Loader — real image preload drives the bar ───────────── */

  const loader = document.getElementById("loader");
  const loaderFill = document.getElementById("loaderFill");
  const loaderPct = document.getElementById("loaderPct");

  const criticalSrcs = [
    "assets/brand/factory-finish-logo.jpg",
    "assets/scenes/hero-master.jpg",
    "assets/van/van-front-head.png",
  ];

  let loadedCount = 0;
  let target = 0;
  let displayed = 0;
  let loaderDone = false;

  const finishLoader = () => {
    if (loaderDone) return;
    loaderDone = true;
    loader.classList.add("is-done");
    document.body.classList.add("is-ready");
    heroIntro();
    setTimeout(() => loader.classList.add("is-gone"), 1300);
  };

  // single monotonic loop, time-based so throttled tabs still finish
  let lastT = performance.now();
  const progressLoop = (now) => {
    const dt = Math.min(0.25, (now - lastT) / 1000);
    lastT = now;
    // ease toward target at a minimum of 55%/s so it can never stall
    displayed = Math.min(target, displayed + Math.max((target - displayed) * 4 * dt, 55 * dt));
    const pct = Math.round(displayed);
    loaderFill.style.width = pct + "%";
    loaderPct.textContent = pct + "%";
    if (pct >= 100) finishLoader();
    else requestAnimationFrame(progressLoop);
  };
  requestAnimationFrame(progressLoop);
  // safety heartbeat in case rAF is heavily throttled
  const beat = setInterval(() => {
    if (loaderDone) { clearInterval(beat); return; }
    progressLoop(performance.now());
  }, 120);

  const bump = () => {
    loadedCount++;
    target = Math.max(target, Math.round((loadedCount / criticalSrcs.length) * 100));
  };

  criticalSrcs.forEach((src) => {
    const img = new Image();
    img.onload = bump;
    img.onerror = bump;
    img.src = src;
  });

  // hard cap: never hold the visitor hostage
  setTimeout(() => { target = 100; }, 4500);

  /* ───────────── Smooth scroll (Lenis) ───────────── */

  let lenis = null;
  if (!prefersReduced && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.0 });
    lenis.on("scroll", () => hasGsap && ScrollTrigger.update());
    if (hasGsap) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // keep animation time flowing even if the browser throttles rAF
  if (hasGsap) {
    let lastTick = performance.now();
    gsap.ticker.add(() => { lastTick = performance.now(); });
    setInterval(() => {
      if (performance.now() - lastTick > 200) gsap.ticker.tick();
    }, 200);
  }

  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  // anchor links route through Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(el);
    });
  });

  /* ───────────── Nav state + mobile menu ───────────── */

  const nav = document.getElementById("nav");
  const hero = document.querySelector(".hero");

  const onScrollNav = () => {
    const scrollY = window.scrollY;
    nav.classList.toggle("is-scrolled", scrollY > 40);
    if (hero) {
      nav.classList.toggle("nav-visible", scrollY > hero.offsetHeight * 0.8);
    }
  };

  window.addEventListener("scroll", onScrollNav, { passive: true });
  window.addEventListener("resize", onScrollNav, { passive: true });
  onScrollNav();

  const burger = document.getElementById("burger");
  const mmenu = document.getElementById("mmenu");
  const closeMenu = () => {
    burger.classList.remove("is-open");
    mmenu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    mmenu.setAttribute("aria-hidden", "true");
  };
  burger.addEventListener("click", () => {
    const open = !mmenu.classList.contains("is-open");
    burger.classList.toggle("is-open", open);
    mmenu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    mmenu.setAttribute("aria-hidden", String(!open));
  });

  /* ───────────── Hero intro + parallax ───────────── */

  function heroIntro() {
    if (!hasGsap || prefersReduced) return;
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".hero__logo", { opacity: 0, y: 40, scale: 0.9, duration: 1.4 }, 0.15)
      .from(".hero__sub", { opacity: 0, y: 26, duration: 0.9 }, 0.75)
      .from(".hero__support", { opacity: 0, y: 22, duration: 0.9 }, 0.9)
      .from(".hero__ctas .btn", { opacity: 0, y: 24, duration: 0.8, stagger: 0.1 }, 1.05);
  }

  if (hasGsap && !prefersReduced) {
    // slow parallax drift of the hero plate as you scroll away
    gsap.to("#heroImg", {
      yPercent: 14, scale: 1.02, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__content", {
      yPercent: -18, opacity: 0.25, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true },
    });
  }

  /* ───────────── Hero particles — drifting purple embers ───────────── */

  const canvas = document.getElementById("particles");
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext("2d");
    let w, h, parts = [];
    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);
    const N = Math.min(46, Math.floor(window.innerWidth / 30));
    for (let i = 0; i < N; i++) {
      parts.push({
        x: Math.random(), y: Math.random(),
        r: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.00022,
        vy: -0.00012 - Math.random() * 0.00028,
        a: 0.08 + Math.random() * 0.4,
        tw: Math.random() * Math.PI * 2,
      });
    }
    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
    const tick = (t) => {
      requestAnimationFrame(tick);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02) p.x = 1.02; if (p.x > 1.02) p.x = -0.02;
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 + p.tw);
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 75, 255, ${p.a * twinkle})`;
        ctx.fill();
      }
    };
    requestAnimationFrame(tick);
  }

  /* ───────────── Generic reveals ───────────── */

  if (hasGsap && !prefersReduced) {
    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.1, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
        onComplete: () => el.classList.add("is-shown"),
      });
    });
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-shown"));
  }

  /* ───────────── Process rail fill ───────────── */

  const railFill = document.getElementById("railFill");
  if (railFill && hasGsap && !prefersReduced) {
    gsap.to(railFill, {
      height: "100%", ease: "none",
      scrollTrigger: { trigger: ".process", start: "top 60%", end: "bottom 70%", scrub: true },
    });
  }

  /* ───────────── Stats counters ───────────── */

  const counters = document.querySelectorAll(".stat__count");
  const runCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const dur = 2200;
    const t0 = performance.now();
    const fmt = (n) => n.toLocaleString("en-GB");
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        runCounter(e.target);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => counterObs.observe(c));

  /* ───────────── Services card tilt + cursor sheen ───────────── */

  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (finePointer && !prefersReduced) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      let raf = null;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        if (raf) return;
        raf = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(900px) rotateY(${(px - 0.5) * 6}deg) rotateX(${(0.5 - py) * 5}deg) translateY(-4px)`;
          raf = null;
        });
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
      });
    });
  }

  /* ───────────── CTA parallax plate ───────────── */

  const ctaMediaImg = document.querySelector(".cta__media img");
  if (hasGsap && !prefersReduced && ctaMediaImg) {
    gsap.fromTo(ctaMediaImg, { yPercent: -12, scale: 1.08 }, {
      yPercent: 6, scale: 1.0, ease: "none",
      scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
    });
  }

  /* ───────────── Testimonial carousel ───────────── */

  const slides = Array.from(document.querySelectorAll(".carousel__slide"));
  const track = document.getElementById("carouselTrack");
  const dotsWrap = document.getElementById("carouselDots");
  let slideIdx = 0;
  let autoTimer = null;
  let slideHeights = [];

  const measureSlideHeight = (slide) => {
    if (!track) return 0;
    const clone = slide.cloneNode(true);
    clone.classList.remove("is-active", "is-exit");
    clone.setAttribute("aria-hidden", "true");
    clone.style.cssText = [
      "position:absolute",
      "top:0",
      "left:0",
      "right:0",
      "width:100%",
      "visibility:hidden",
      "opacity:1",
      "transform:none",
      "pointer-events:none",
      "height:auto",
    ].join(";");
    track.appendChild(clone);
    const height = Math.ceil(clone.getBoundingClientRect().height);
    clone.remove();
    return height;
  };

  const recalcSlideHeights = () => {
    slideHeights = slides.map(measureSlideHeight);
  };

  const setTrackHeight = (idx) => {
    if (!track || !slideHeights.length) return;
    track.style.height = `${slideHeights[idx]}px`;
  };

  if (track && slides.length && dotsWrap) {
    slides.forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "carousel__dot" + (i === 0 ? " is-active" : "");
      d.setAttribute("aria-label", `Testimonial ${i + 1}`);
      d.addEventListener("click", () => goSlide(i, true));
      dotsWrap.appendChild(d);
    });
    const dots = Array.from(dotsWrap.children);

    const goSlide = (i, manual) => {
      if (i === slideIdx) return;
      const prev = slides[slideIdx];
      prev.classList.remove("is-active");
      prev.classList.add("is-exit");
      setTimeout(() => prev.classList.remove("is-exit"), 900);
      slideIdx = (i + slides.length) % slides.length;
      slides[slideIdx].classList.add("is-active");
      setTrackHeight(slideIdx);
      dots.forEach((d, k) => d.classList.toggle("is-active", k === slideIdx));
      if (manual) restartAuto();
    };

    const CAROUSEL_INTERVAL_MS = 9000;

    const restartAuto = () => {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => goSlide(slideIdx + 1), CAROUSEL_INTERVAL_MS);
    };

    recalcSlideHeights();
    setTrackHeight(slideIdx);
    restartAuto();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        recalcSlideHeights();
        setTrackHeight(slideIdx);
      }, 120);
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        recalcSlideHeights();
        setTrackHeight(slideIdx);
      });
    }

    document.getElementById("prevSlide")?.addEventListener("click", () => goSlide(slideIdx - 1, true));
    document.getElementById("nextSlide")?.addEventListener("click", () => goSlide(slideIdx + 1, true));
  }

  /* ───────────── Image fallbacks (generated scenes → local panels) ───────────── */

  const FALLBACKS = {
    "assets/scenes/hero-master.jpg": "assets/van/van-front34.png",
    "assets/scenes/night-run.jpg": "assets/van/van-aerial.png",
    "assets/scenes/lathe-macro.jpg": "assets/work/smart-repair.jpg",
    "assets/scenes/wheel-studio.jpg": "assets/g63/g63-wheel-macro.png",
  };
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      const key = img.getAttribute("src");
      if (FALLBACKS[key] && img.dataset.fbk !== "1") {
        img.dataset.fbk = "1";
        img.src = FALLBACKS[key];
      }
    }, { once: true });
  });
})();
