/* motion.js — scroll-triggered reveals, spec count-ups, self-drawing blueprint
   lines. Uses GSAP + ScrollTrigger when present; falls back to a plain
   IntersectionObserver otherwise. Fully disabled under prefers-reduced-motion.
   NEVER hijacks native scroll. */

import { prefersReducedMotion } from "./util.js";

export function initMotion() {
  const reduce = prefersReducedMotion() || document.body.classList.contains("a11y-nomotion");

  if (reduce) {
    // Show everything immediately — final state, no animation.
    document.querySelectorAll("[data-reveal]").forEach(n => n.classList.add("is-in"));
    document.querySelectorAll(".blueprint").forEach(n => n.classList.add("is-drawn"));
    document.querySelectorAll("[data-count]").forEach(n => { n.textContent = n.dataset.count; });
    return;
  }

  const gsap = window.gsap;
  const hasGsap = !!gsap && !!window.ScrollTrigger;
  if (hasGsap) {
    gsap.registerPlugin(window.ScrollTrigger);
    if (window.DrawSVGPlugin) gsap.registerPlugin(window.DrawSVGPlugin);
  }

  // Reveals (also covers blueprint draw + count-ups via the same observer)
  const reveal = (node) => {
    node.classList.add("is-in");
    if (node.matches(".blueprint")) node.classList.add("is-drawn");
    node.querySelectorAll?.(".blueprint").forEach(bp => bp.classList.add("is-drawn"));
    node.querySelectorAll?.("[data-count]").forEach(countUp);
    if (node.matches("[data-count]")) countUp(node);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

  document.querySelectorAll("[data-reveal], .blueprint, [data-count]").forEach(n => io.observe(n));

  if (hasGsap) {
    // GSAP owns the icon hover motion — tell CSS to stand down (it's the fallback).
    document.documentElement.classList.add("icons-gsap");
    setupIconHover(gsap);

    // Stagger rows into view with ScrollTrigger.batch — every item inside a
    // [data-stagger] container animates in, staggered, as it enters the viewport.
    const items = gsap.utils.toArray("[data-stagger] > *");
    if (items.length) {
      gsap.set(items, { autoAlpha: 0, y: 34 });
      window.ScrollTrigger.batch(items, {
        start: "top 88%",
        onEnter: (batch) => gsap.to(batch, {
          autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out",
          stagger: 0.09, overwrite: true, clearProps: "transform"
        })
      });
    }

    buildSectionFrames(gsap);
    window.ScrollTrigger.refresh();   // recalc after JS-injected content + new triggers

    // Gentle cutout parallax (transform only) — opt-in via [data-parallax]
    gsap.utils.toArray("[data-parallax]").forEach(node => {
      const amount = parseFloat(node.dataset.parallax) || 40;
      gsap.to(node, {
        y: amount, ease: "none",
        scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }
}

/* ---------------------------------------------------------------- Section frames
   enerblock-style: a thin technical line frame traces itself around each content
   section (top -> right -> bottom -> left) linked to scroll position via a
   scrubbed ScrollTrigger timeline. Red corner ticks fade in as it completes.
   Native scroll is never hijacked — scrub only maps progress to the scrollbar. */
function buildSectionFrames(gsap) {
  const ST = window.ScrollTrigger;
  const sections = document.querySelectorAll("main .section:not(.lineup):not([data-no-frame])");
  sections.forEach((sec) => {
    if (sec.querySelector(":scope > .section-frame")) return;
    const f = document.createElement("div");
    f.className = "section-frame";
    f.setAttribute("aria-hidden", "true");
    f.innerHTML =
      '<span class="sf-line sf-top"></span><span class="sf-line sf-right"></span>' +
      '<span class="sf-line sf-bottom"></span><span class="sf-line sf-left"></span>' +
      '<span class="sf-corner sf-tl"></span><span class="sf-corner sf-tr"></span>' +
      '<span class="sf-corner sf-bl"></span><span class="sf-corner sf-br"></span>';
    sec.prepend(f);
    const q = (s) => f.querySelector(s);
    // Triggered (not scrubbed) so the border draws itself in as the section
    // enters — just before the content reveals below it.
    gsap.timeline({
        scrollTrigger: { trigger: sec, start: "top 92%", toggleActions: "play none none none" }
      })
      .to(q(".sf-top"),    { scaleX: 1, duration: 0.18, ease: "power2.inOut" })
      .to(q(".sf-right"),  { scaleY: 1, duration: 0.18, ease: "power2.inOut" })
      .to(q(".sf-bottom"), { scaleX: 1, duration: 0.18, ease: "power2.inOut" })
      .to(q(".sf-left"),   { scaleY: 1, duration: 0.18, ease: "power2.inOut" })
      .to(f.querySelectorAll(".sf-corner"), { opacity: 1, duration: 0.25, stagger: 0.05 }, "-=0.08");
  });
  if (ST) ST.refresh();
}

/* ---------------------------------------------------------------- Icon motion
   Icons stay fully visible by default. On HOVER, DrawSVGPlugin re-traces the
   icon's path like a pen drawing it, then inks the fill back in (SVG+JS Kit mode).
   If the Kit is in Web Font mode (glyphs, no <path>), hover falls back to an
   elastic pop; with no GSAP at all, the CSS clip-wipe in components.css applies. */

function setupIconHover(gsap) {
  // Excluded by request: buttons (.btn), the trust-band selling points, and any
  // arrow/caret graphics (filtered below). Only genuinely "iconed" elements keep it.
  const SEL = ".nav-utility a, .footer__social a, .mega__card, .pd-docs a, .tech__play";
  const canDraw = !!window.DrawSVGPlugin;
  document.addEventListener("mouseover", (e) => {
    const host = e.target.closest(SEL);
    if (!host || host._iconHover) return;
    host._iconHover = true;                       // one trace per enter, not per child
    // SVG kit mode -> .svg-inline--fa (has <path>); Web Font mode -> our <i>.ic-fx
    host.querySelectorAll(".svg-inline--fa, .ic-fx").forEach((ic, i) => {
      if (ic.matches(".fa-arrow-right, .fa-chevron-down")) return;  // no draw on arrows/carets
      const paths = canDraw ? ic.querySelectorAll("path") : null;
      if (paths && paths.length) traceIcon(gsap, paths, i * 0.05);
      else gsap.fromTo(ic, { scale: 1.4, rotate: 14 },
        { scale: 1, rotate: 0, duration: 0.9, ease: "elastic.out(1, 0.5)",
          delay: i * 0.04, transformOrigin: "50% 50%", overwrite: "auto" });
    });
  });
  document.addEventListener("mouseout", (e) => {
    const host = e.target.closest(SEL);
    if (host && !host.contains(e.relatedTarget)) host._iconHover = false;
  });
}

/* Re-trace an SVG icon's path on hover: blank the fill, draw the outline on with
   DrawSVGPlugin, ink the fill back in, then clear all props to the resting icon. */
function traceIcon(gsap, paths, delay = 0) {
  gsap.killTweensOf(paths);
  gsap.timeline({ delay })
    // stroke-width set via attr (GSAP rounds a numeric strokeWidth to 1px);
    // kept hairline-thin to match the original fa-thin icon weight
    .set(paths, { fillOpacity: 0, stroke: "currentColor", drawSVG: "0%",
      attr: { "stroke-width": 0.75, "vector-effect": "non-scaling-stroke" } })
    .to(paths, { drawSVG: "100%", duration: 0.6, ease: "power1.inOut", stagger: 0.05 })
    .to(paths, { fillOpacity: 1, duration: 0.2 }, "-=0.08")
    .set(paths, { clearProps: "all" });
}

function countUp(node) {
  if (node.dataset.done) return;
  node.dataset.done = "1";
  const target = parseFloat(node.dataset.count);
  if (isNaN(target)) { node.textContent = node.dataset.count; return; }
  const dur = 1100, t0 = performance.now();
  const fmt = (n) => Math.round(n).toLocaleString();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = fmt(target * eased);
    if (p < 1) requestAnimationFrame(tick);
    else node.textContent = fmt(target);
  };
  requestAnimationFrame(tick);
}
