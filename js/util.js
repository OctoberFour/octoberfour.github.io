/* util.js — shared helpers: JSON fetch (cached), DOM build, inline SVG icons.
   All asset/data paths are root-absolute ("/data/..."), so pages in any
   subdirectory resolve correctly when served from the site root. */

const _cache = new Map();

/** Fetch + cache JSON from a root-absolute path. Returns null on failure
 *  so callers can degrade gracefully (progressive enhancement). */
export async function getJSON(path) {
  if (_cache.has(path)) return _cache.get(path);
  try {
    const res = await fetch(path, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`${res.status} ${path}`);
    const data = await res.json();
    _cache.set(path, data);
    return data;
  } catch (err) {
    console.warn("[yamamoto] data fetch failed:", path, err.message);
    return null;
  }
}

/** Tiny element builder. el("a.btn.btn--primary", {href:"/x"}, "Label") */
export function el(spec, attrs = {}, children = []) {
  const [tag, ...classes] = spec.split(".");
  const node = document.createElement(tag || "div");
  if (classes.length) node.className = classes.join(" ");
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

export function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ----------------------------------------------------------------- Icons
   Font Awesome (Kit 0a6d31be35). Semantic name -> FA classes. The kit script
   (loaded in each page's <head>) swaps these <i> tags for inline SVGs and
   converts any we inject later via its MutationObserver. The `ic-fx` class is
   ours (FA preserves it) and is the hook for hover animations in CSS. */
const FA = {
  arrow:    "fa-thin fa-arrow-right",
  caret:    "fa-thin fa-chevron-down",
  phone:    "fa-thin fa-phone",
  truck:    "fa-thin fa-truck-fast",
  chart:    "fa-thin fa-chart-line",
  dial:     "fa-thin fa-gauge-high",
  wrench:   "fa-thin fa-screwdriver-wrench",
  search:   "fa-thin fa-magnifying-glass",
  play:     "fa-thin fa-play",
  file:     "fa-thin fa-file-lines",
  download: "fa-thin fa-download",
  check:    "fa-thin fa-circle-check",
  mappin:   "fa-thin fa-location-dot",
  lock:     "fa-thin fa-lock",
  access:   "fa-thin fa-universal-access",
  contrast: "fa-thin fa-circle-half-stroke",
  text:     "fa-thin fa-font",
  facebook: "fa-brands fa-facebook-f",
  youtube:  "fa-brands fa-youtube",
  google:   "fa-brands fa-google",
  x:        "fa-brands fa-x-twitter"
};

/** icon(name, size) -> Font Awesome <i> tag string. Size sets font-size (px). */
export function icon(name, size = 20) {
  const cls = FA[name] || "fa-thin fa-circle-question";
  return `<i class="${cls} ic-fx" style="font-size:${size}px" aria-hidden="true"></i>`;
}

/** Schematic washer/dryer line-art placeholder (the CAD motif), used wherever
 *  real product cutout photography isn't available yet. Clearly diagrammatic —
 *  not a fake photo. accent=true draws the door ring in brand red. */
export function machineSchematic(label = "", accent = true) {
  return `
  <svg viewBox="0 0 200 220" width="100%" role="img" aria-label="${escapeHtml(label || "Machine schematic")}"
       fill="none" stroke="currentColor" stroke-width="1.4" style="color:var(--color-line-light)">
    <rect x="28" y="14" width="144" height="192" />
    <line x1="28" y1="48" x2="172" y2="48" />
    <rect x="40" y="24" width="40" height="12" stroke="var(--color-line-light)"/>
    <circle cx="150" cy="36" r="5"/>
    <circle cx="100" cy="130" r="62" stroke="${accent ? "var(--color-red)" : "currentColor"}"/>
    <circle cx="100" cy="130" r="48" />
    <circle cx="100" cy="130" r="6" />
    <line x1="14" y1="130" x2="2" y2="130"/><line x1="8" y1="130" x2="8" y2="206" stroke-dasharray="3 3"/>
    <text x="100" y="200" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11"
          fill="var(--color-fog)" stroke="none" letter-spacing="1">${escapeHtml(label)}</text>
  </svg>`;
}
