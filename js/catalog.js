/* catalog.js — data-driven product rendering: homepage lineup, industries grid,
   testimonials, hero quick-selector, category page, product detail, related
   products, and all form <select> option lists. products.json is the single
   source of truth; nothing here is hand-duplicated. */

import { getJSON, el, icon, escapeHtml, machineSchematic, prefersReducedMotion } from "./util.js";

const SPEC_LABELS = {
  load_capacity_lbs: ["Load Capacity", "lb"],
  machine_weight_lbs: ["Machine Weight", "lb"],
  g_force: ["G-Force", "G"],
  wash_dry_lbs: ["Wash / Dry", "lb"],
  drying_heat: ["Drying Heat", ""]
};

let _catalogPromise;
const catalog = () => (_catalogPromise ||= getJSON("/data/products.json"));

const TESTIMONIAL_INTERVAL_MS = 5000;
const FALLBACK_TESTIMONIALS = [
  {
    quote: "The controls were easy for our team to learn, and the machine keeps up with our busiest laundry days.",
    author: "Operations Manager",
    role: "Hotel laundry",
    industry: "hospitality",
    video: "",
    poster: ""
  },
  {
    quote: "We needed equipment that could run consistently without adding more complexity for our staff.",
    author: "Facilities Director",
    role: "Regional hospital",
    industry: "healthcare",
    video: "",
    poster: ""
  },
  {
    quote: "The build quality feels different. It is the kind of machine we expect to keep working hard for years.",
    author: "Plant Supervisor",
    role: "Industrial laundry",
    industry: "industrial",
    video: "",
    poster: ""
  },
  {
    quote: "When a machine is down, speed matters. Yamamoto helped us get the right replacement without slowing production.",
    author: "General Manager",
    role: "Commercial laundry",
    industry: "service",
    video: "",
    poster: ""
  }
];

function catName(data, slug) {
  return data.categories.find(c => c.slug === slug)?.name || slug;
}

/* Product cutout media: real transparent cutout <img> when available, with a
   graceful fallback to the CAD schematic if the image is missing/fails. */
function productMedia(p) {
  const name = `Yamamoto ${p.model}`;
  if (p.cutout) {
    return `<img class="pcut" src="${p.cutout}" alt="${escapeHtml(name)}" loading="lazy" decoding="async"
      onerror="this.style.display='none';this.nextElementSibling.hidden=false">
      <span class="pcut-fallback" hidden>${machineSchematic(p.model)}</span>`;
  }
  return machineSchematic(p.model);
}

function productCard(data, p, opts = {}) {
  return `
  <article class="product-card">
    <div class="product-card__media">${productMedia(p)}${opts.features ? cardFeatures(p) : ""}</div>
    <span class="product-card__cat">${escapeHtml(catName(data, p.category))}</span>
    <h3 class="product-card__model">${escapeHtml(p.model)}</h3>
    <span class="product-card__sub">${escapeHtml(p.subtitle || "")}</span>
    <a class="product-card__cta product-card__link" href="/products/detail.html?p=${p.slug}">
      View machine ${icon("arrow", 16)}
    </a>
  </article>`;
}

/* A broad category card for the homepage lineup — category name + image, with the
   blurb revealed on hover (no specific model or specs). Mirrors .product-card so it
   drops into the same lineup grid and hover treatment. */
function categoryCard(data, c) {
  const count = (data.products || []).filter(p => p.category === c.slug).length;
  const kicker = count ? `${count} machine${count > 1 ? "s" : ""}` : "Cleaning system";
  const img = c.nav_image
    ? `<img class="pcut" src="${escapeHtml(c.nav_image)}" alt="${escapeHtml(c.name)}" loading="lazy" decoding="async">`
    : "";
  const blurb = c.blurb
    ? `<div class="product-card__features"><p class="product-card__blurb">${escapeHtml(c.blurb)}</p></div>`
    : "";
  return `
  <article class="product-card">
    <div class="product-card__media">${img}${blurb}</div>
    <span class="product-card__cat">${escapeHtml(kicker)}</span>
    <h3 class="product-card__model">${escapeHtml(c.name)}</h3>
    <a class="product-card__cta product-card__link" href="/pages/products.html?cat=${encodeURIComponent(c.slug)}">
      Explore ${icon("arrow", 16)}
    </a>
  </article>`;
}

// Short spec labels for the narrow lineup hover panel (the detail pages use the
// fuller SPEC_LABELS). Keeps each row on one line.
const CARD_SPEC_LABELS = {
  load_capacity_lbs: ["Capacity", "lb"],
  machine_weight_lbs: ["Weight", "lb"],
  g_force: ["G-Force", "G"],
  wash_dry_lbs: ["Wash/Dry", "lb"],
  drying_heat: ["Heat", ""]
};

// Key specs shown on hover in the homepage lineup. Built from whatever spec
// fields a machine has, capped at three for a tidy panel.
function cardFeatures(p) {
  const rows = Object.entries(p.specs || {})
    .filter(([, v]) => v != null)
    .slice(0, 3)
    .map(([k, v]) => {
      const [label, unit] = CARD_SPEC_LABELS[k] || SPEC_LABELS[k] || [k, ""];
      const val = typeof v === "number" ? v.toLocaleString() : escapeHtml(String(v));
      return `<li class="product-card__feat"><span>${escapeHtml(label)}</span><span>${val}${unit ? " " + unit : ""}</span></li>`;
    }).join("");
  return rows ? `<ul class="product-card__features">${rows}</ul>` : "";
}

function specBlock(p, head = "Specifications") {
  const rows = Object.entries(p.specs || {})
    .filter(([, v]) => v != null)
    .map(([k, v]) => {
      const [label, unit] = SPEC_LABELS[k] || [k, ""];
      const val = typeof v === "number" ? v.toLocaleString() : escapeHtml(String(v));
      return `<div class="spec-row"><span class="spec-row__key">${label}</span>
        <span class="spec-row__val">${val} ${unit ? `<span class="unit">${unit}</span>` : ""}</span></div>`;
    }).join("");
  if (!rows) return "";
  return `<div class="spec-block"><div class="spec-block__head">${escapeHtml(head)}</div>${rows}</div>`;
}

/* --------------------------------------------------------- Homepage: lineup */
export async function initLineup() {
  const mount = document.querySelector("[data-lineup]");
  if (!mount) return;
  const data = await catalog();
  if (!data) return;
  // Broad category features (not specific machines): one card per product category.
  const cats = data.categories || [];
  mount.innerHTML = cats.map(c => categoryCard(data, c)).join("");
}

/* --------------------------------------------------- Homepage: featured machines (card stack)
   data-featured is a comma list of slugs; each becomes a spotlight card, stacked.
   The front card is interactive; clicking a peeking card (or a dot, or swiping)
   brings the next one forward. Copy is auto-built from each machine's name + specs. */
const FEAT_LABELS = {
  load_capacity_lbs: ["Load Capacity", "lb"],
  wash_dry_lbs: ["Wash / Dry", "lb"],
  g_force: ["Extract Force", "G"],
  drying_heat: ["Heating", ""],
  machine_weight_lbs: ["Machine Weight", "lb"]
};
const FEAT_STAT_ORDER = ["load_capacity_lbs", "wash_dry_lbs", "g_force", "drying_heat", "machine_weight_lbs"];

/* Generic, no-per-machine-writing blurb keyed off the category. */
function featuredLede(categorySlug) {
  const s = String(categorySlug || "");
  if (/dryer/.test(s)) return "Fast, even drying with efficient heat, designed to keep linen moving and energy costs down.";
  if (/combination|wash.*dry/.test(s)) return "Wash and dry in a single footprint, ideal where floor space is tight and uptime matters.";
  if (/folder|finishing/.test(s)) return "Finishing throughput that keeps pace with your busiest days, with simple, reliable operation.";
  if (/harmony/.test(s)) return "A gentler, solvent-free path to clean: modern wet-cleaning built for consistent, repeatable results.";
  return "High-G extraction pulls more water out, cutting drying time and energy cost, built to run hard, all day.";
}

function featuredStats(p) {
  const rank = (k) => (FEAT_STAT_ORDER.indexOf(k) + 1) || 99;
  return Object.entries(p.specs || {})
    .filter(([, v]) => v != null)
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .slice(0, 3)
    .map(([k, v]) => {
      const [label, unit] = FEAT_LABELS[k] || SPEC_LABELS[k] || [k, ""];
      // Numeric stats count up on scroll-in (motion.js [data-count]); strings render as-is.
      const valHtml = typeof v === "number" ? `<span data-count="${v}">0</span>` : escapeHtml(String(v));
      return `<div class="featured__stat">
        <span class="featured__stat-val">${valHtml}${unit ? `<span class="featured__stat-unit"> ${escapeHtml(unit)}</span>` : ""}</span>
        <span class="featured__stat-label">${escapeHtml(label)}</span>
      </div>`;
    }).join('<span class="featured__stat-div" aria-hidden="true"></span>');
}

export async function initFeatured() {
  const mount = document.querySelector("[data-featured]");
  if (!mount) return;
  const data = await catalog();
  if (!data) return;
  const slugs = (mount.dataset.featured || "").split(",").map(s => s.trim()).filter(Boolean);
  const products = slugs.map(s => data.products.find(x => x.slug === s)).filter(Boolean);
  if (!products.length) return;
  const n = products.length;

  const card = (p, i) => {
    const cat = (data.categories || []).find(c => c.slug === p.category);
    const tag = (cat?.name || "Featured").split(/[\s/]+/)[0];
    const front = i === 0;
    const off = front ? "" : ' tabindex="-1"';
    return `
    <article class="featcard" role="group" aria-roledescription="slide" aria-label="${escapeHtml(p.model)} — ${i + 1} of ${n}"${front ? "" : ' aria-hidden="true"'}>
      <div class="featured__inner">
        <div class="featured__copy">
          <div class="featured__eyebrow">
            <span class="overline">Featured machine</span>
            <span class="featured__rule" aria-hidden="true"></span>
            <span class="featured__tag">${escapeHtml(tag)}</span>
          </div>
          <h2 class="featured__title"${front ? ' id="featured-title"' : ""}>${escapeHtml(p.model)}</h2>
          <p class="featured__sub">${escapeHtml(cat?.name || "")}</p>
          <p class="featured__lede">${featuredLede(p.category)}</p>
          <div class="featured__stats">${featuredStats(p)}</div>
          <div class="featured__cta">
            <a class="btn btn--primary btn--lg" href="/products/detail.html?p=${encodeURIComponent(p.slug)}"${off}>View the ${escapeHtml(p.model)} ${icon("arrow", 16)}</a>
            <a class="btn btn--ghost btn--lg" href="/pages/quote.html"${off}>Request a quote</a>
          </div>
        </div>
        <div class="featured__media">
          <img class="featured__img" src="${escapeHtml(p.cutout || "")}" alt="${escapeHtml(p.model)}" loading="lazy" decoding="async">
        </div>
      </div>
    </article>`;
  };

  const nav = `
    <button class="featstack__arrow" type="button" data-prev aria-label="Previous machine"><span aria-hidden="true">&lsaquo;</span></button>
    <button class="featstack__arrow featstack__arrow--next" type="button" data-next aria-label="Next machine"><span aria-hidden="true">&rsaquo;</span></button>`;

  mount.innerHTML =
    `<div class="featstack__deck">${products.map(card).join("")}</div>` +
    `<div class="featstack__nav" role="group" aria-label="Featured machine controls">${nav}</div>`;

  const deck = mount.querySelector(".featstack__deck");
  const cards = [...deck.querySelectorAll(".featcard")];
  const VIS = Math.min(3, n);     // front card + up to two peeking behind it
  let active = 0;

  const layout = () => {
    cards.forEach((c, i) => {
      const d = (i - active + n) % n;
      const dd = Math.min(d, VIS - 1);
      const shown = d < VIS;
      c.style.transform = `translateY(${dd * 18}px) scale(${(1 - dd * 0.05).toFixed(3)})`;
      c.style.opacity = shown ? String(1 - dd * 0.28) : "0";
      c.style.zIndex = String(n - d);
      c.style.pointerEvents = shown ? "auto" : "none";
      const front = d === 0;
      c.setAttribute("aria-hidden", front ? "false" : "true");
      c.querySelectorAll("a").forEach(a => { a.tabIndex = front ? 0 : -1; });
    });
  };
  const setActive = (i) => { active = ((i % n) + n) % n; layout(); };

  // Equalise card heights, then give the deck room for the peeking cards below.
  const sizeDeck = () => {
    let max = 0;
    cards.forEach(c => { c.style.minHeight = ""; max = Math.max(max, c.offsetHeight); });
    cards.forEach(c => { c.style.minHeight = max + "px"; });
    deck.style.minHeight = (max + (VIS - 1) * 18 + 8) + "px";
  };

  // Click a peeking card to bring it forward; the front card's own links act normally.
  mount.addEventListener("click", (e) => {
    const arrow = e.target.closest(".featstack__arrow");
    if (arrow) { setActive(active + (arrow.hasAttribute("data-next") ? 1 : -1)); return; }
    const c = e.target.closest(".featcard");
    if (!c) return;
    const i = cards.indexOf(c);
    if (i === active) return;        // front card: let its buttons/links work
    e.preventDefault();              // behind card: just bring it forward
    setActive(i);
  });

  // Touch swipe: left → next, right → previous.
  let sx = null;
  deck.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener("touchend", (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) setActive(active + (dx < 0 ? 1 : -1));
    sx = null;
  }, { passive: true });

  let rz = null;
  window.addEventListener("resize", () => { window.clearTimeout(rz); rz = window.setTimeout(sizeDeck, 150); });

  layout();
  sizeDeck();
  // Images load lazily; re-measure once each arrives so heights stay correct.
  cards.forEach(c => { const img = c.querySelector("img"); if (img && !img.complete) img.addEventListener("load", sizeDeck, { once: true }); });
}

/* --------------------------------------------------------- Homepage: industries */
export async function initIndustriesGrid() {
  const mount = document.querySelector("[data-industries]");
  if (!mount) return;
  const inds = await getJSON("/data/industries.json");
  if (!inds) return;
  mount.innerHTML = inds.map(i => `
    <article class="ind-card">
      <div class="ind-card__bg" style="background-image:url('${i.image}')"></div>
      <div class="ind-card__overlay"></div>
      <div class="ind-card__content">
        <span class="overline overline--fog">${escapeHtml(i.tagline || "")}</span>
        <h3>${escapeHtml(i.name)}</h3>
        <a class="arrow ind-card__link" href="/pages/industry.html?i=${i.slug}">Explore ${icon("arrow",14)}</a>
      </div>
    </article>`).join("");
}

/* --------------------------------------------------------- Homepage: industries (icon console) */
/* Thin line icons per sector (64x64 viewBox), in industries.json order. */
const IND_ICONS = [
  '<path d="M14 54V16c0-3 2-5 5-5h20c3 0 5 2 5 5v38"/><path d="M9 54h46"/><path d="M22 20h6M36 20h6M22 29h6M36 29h6M22 38h6M36 38h6"/><path d="M28 54V44h8v10"/>',
  '<path d="M12 38v-8M20 42V26M28 38v-8M36 34h-8"/><path d="M36 38v-8M44 42V26M52 38v-8"/><path d="M8 34h12M44 34h12"/>',
  '<path d="M14 54V18c0-3 2-5 5-5h26c3 0 5 2 5 5v36"/><path d="M9 54h46"/><path d="M32 22v18M23 31h18"/><path d="M22 54V43h8v11M34 54V43h8v11"/>',
  '<path d="M10 54V31l14 8V29l14 10V24l16 11v19"/><path d="M8 54h48"/><path d="M18 46h5M30 46h5M42 46h5"/><path d="M46 30V14h8v21"/>',
  '<path d="M33 54V18"/><path d="M33 28c-10 0-17-6-17-15 10 0 17 6 17 15Z"/><path d="M33 36c10 0 17-6 17-15-10 0-17 6-17 15Z"/><path d="M20 54h28"/><path d="M18 43c6 0 10 2 15 7 5-5 9-7 15-7"/>',
  '<path d="M32 20c0-4 3-7 7-7 3 0 6 2 6 5 0 5-7 6-13 11"/><path d="M32 29 10 47c-2 2-1 6 3 6h38c4 0 5-4 3-6L32 29Z"/><path d="M19 45h26"/>'
];
const IND_KEYWORDS = ["lodging", "fitness", "hygienic", "heavy soil", "sanitation", "garment"];
const IND_FALLBACK_IMG = "/img/people/hero-banner-poster.png";
const indSvg = (paths, size) =>
  `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths || ""}</svg>`;

export async function initIndustriesConsole() {
  const mount = document.querySelector("[data-industries-console]");
  if (!mount) return;
  const inds = await getJSON("/data/industries.json");
  if (!inds || !inds.length) return;
  const pad = (x) => String(x).padStart(2, "0");

  mount.innerHTML = inds.map((it, idx) => `
    <a class="ind-tile" href="/pages/industry.html?i=${encodeURIComponent(it.slug)}">
      <img class="ind-tile__photo" data-src="${escapeHtml(it.image || IND_FALLBACK_IMG)}" alt="" loading="lazy" decoding="async">
      <span class="ind-tile__scrim" aria-hidden="true"></span>
      <span class="ind-tile__icon">${indSvg(IND_ICONS[idx], 44)}</span>
      <span class="ind-tile__meta">
        <span class="ind-tile__idx">${pad(idx + 1)} / ${escapeHtml(IND_KEYWORDS[idx] || "")}</span>
        <span class="ind-tile__name">${escapeHtml(it.name)}</span>
        <span class="ind-tile__sub">${escapeHtml(it.tagline || "")}</span>
        <span class="ind-tile__desc"><span>${escapeHtml(it.body || "")}</span></span>
      </span>
    </a>`).join("");

  // Each tile's sector photo is revealed on hover. Falls back to the banner
  // poster until per-sector images exist at it.image.
  mount.querySelectorAll(".ind-tile__photo").forEach((img) => {
    img.addEventListener("error", () => { img.src = IND_FALLBACK_IMG; }, { once: true });
    img.src = img.dataset.src;
  });
}

/* Title-case an industry slug for display: "hospitality" -> "Hospitality". */
function industryLabel(s) {
  return String(s || "").split(/[-_\s]+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/* Classify a testimonial's optional video so we know how to play it inline:
   a self-hosted file (.mp4/.webm path) plays in a <video>; a YouTube or Vimeo
   link (full URL, short link, or bare 11-char YouTube id) plays in an <iframe>. */
function videoSource(src) {
  if (!src) return null;
  const s = String(src).trim();
  const yt = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/) ||
             (/^[\w-]{11}$/.test(s) ? [null, s] : null);
  if (yt) return { kind: "embed", url: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&playsinline=1` };
  const vm = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "embed", url: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` };
  return { kind: "file", url: s };
}

/* --------------------------------------------------------- Homepage: testimonials (video / quote cards) */
export async function initTestimonials() {
  const mount = document.querySelector("[data-testimonials]");
  if (!mount) return;
  const items = await getJSON("/data/testimonials.json") || FALLBACK_TESTIMONIALS;
  if (!items || !items.length) return;

  const row = mount.querySelector("[data-trows]");      // the horizontal scroller
  const prevBtn = mount.querySelector("[data-tprev]");
  const nextBtn = mount.querySelector("[data-tnext]");
  if (!row) return;

  const n = items.length;
  const reduce = prefersReducedMotion();
  const loop = n > 1;                 // a lone quote can't loop
  let timer = null, isPaused = false, videoEngaged = false;

  // Seamless infinite loop: render THREE copies of the set and always keep the
  // centred card in the middle copy. After a step lands in an outer copy we hop —
  // instantly, with no animation — to the identical middle-copy card. The copies
  // are identical so the hop is invisible; every card always has neighbours (no end
  // gaps) and next/prev wrap forever. Cards still only fade at the masked edges.
  // A testimonial always shows quote + provider + industry. If it also has a video,
  // the card becomes a poster with a play button and the text overlays a gradient;
  // clicking play swaps the poster for an inline player (see the playback block below).
  const tcard = (t, real) => {
    const vs = videoSource(t.video);
    const ind = industryLabel(t.industry);
    const content = `
      <div class="tcard__content">
        ${ind ? `<span class="tcard__industry">${escapeHtml(ind)}</span>` : ""}
        ${vs ? "" : `<span class="tcard__mark" aria-hidden="true">&ldquo;</span>`}
        <p class="tcard__quote">${escapeHtml(t.quote)}</p>
        <p class="tcard__attr">
          <span class="tcard__name">${escapeHtml(t.author)}</span>
          <span class="tcard__sep" aria-hidden="true">//</span>
          <span class="tcard__role">${escapeHtml(t.role)}</span>
        </p>
      </div>`;
    if (!vs) {
      return `<article class="tcard" aria-roledescription="testimonial"${real ? "" : ' aria-hidden="true"'}>${content}</article>`;
    }
    const posterStyle = t.poster ? ` style="background-image:url('${encodeURI(t.poster)}')"` : "";
    return `
      <article class="tcard tcard--video" aria-roledescription="testimonial" data-tvideo="${escapeHtml(t.video)}"${t.poster ? ` data-tposter="${escapeHtml(t.poster)}"` : ""}${real ? "" : ' aria-hidden="true"'}>
        <div class="tcard__media"${posterStyle}></div>
        <button class="tcard__play" type="button" aria-label="Play video testimonial from ${escapeHtml(t.author)}"${real ? "" : ' tabindex="-1"'}>
          <i class="fa-thin fa-play" aria-hidden="true"></i>
        </button>
        ${content}
      </article>`;
  };
  const copies = loop ? 3 : 1;
  let html = "";
  for (let c = 0; c < copies; c++) html += items.map((t) => tcard(t, c === (loop ? 1 : 0))).join("");
  row.innerHTML = html;
  const cards = Array.from(row.querySelectorAll(".tcard"));   // copies × n
  let pos = loop ? n : 0;             // track index of the centred card (start: real card 0)

  const setActive = (p) => {
    pos = p;
    cards.forEach((c, k) => c.classList.toggle("is-active", k === p));
  };

  // Centre track index `p`. behavior "instant" forces a no-animation hop even though
  // the row's CSS scroll-behavior is smooth — that is what keeps the loop seamless.
  const centre = (p, smooth) => {
    const card = cards[p];
    const offset = card.getBoundingClientRect().left - row.getBoundingClientRect().left;
    const left = row.scrollLeft + offset - (row.clientWidth - card.clientWidth) / 2;
    row.scrollTo({ left, behavior: smooth && !reduce ? "smooth" : "instant" });
  };

  // Hop back into the middle copy if a move parked us in an outer one (invisible).
  const normalize = () => {
    if (!loop) return;
    let p = pos;
    if (p < n) p += n; else if (p >= 2 * n) p -= n;
    if (p !== pos) { setActive(p); centre(p, false); }
  };

  const go = (delta) => {
    if (!loop) return;
    resetVideos();               // a moving carousel never drags a playing video along
    normalize();                 // anchor in the middle copy, then step one card out
    setActive(pos + delta);
    centre(pos, true);           // the eased scroll the user sees; normalize() runs on settle
  };

  // After any scroll settles (native swipe included), mark whichever card is nearest
  // the window centre as active, then hop back into the middle copy.
  const nearest = () => {
    const mid = row.getBoundingClientRect().left + row.clientWidth / 2;
    let best = pos, bestD = Infinity;
    cards.forEach((c, k) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestD) { bestD = d; best = k; }
    });
    return best;
  };
  let settleTimer = null;
  row.addEventListener("scroll", () => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      const p = nearest();
      setActive(p);
      // If a free swipe left the card off-centre, ease it to centre (we don't use
      // CSS scroll-snap — it fights programmatic scrolling). Once centred, the loop
      // hop is safe to run.
      const r = cards[p].getBoundingClientRect();
      const off = (r.left + r.width / 2) - (row.getBoundingClientRect().left + row.clientWidth / 2);
      if (Math.abs(off) > 4) centre(p, true);
      else normalize();
    }, 110);
  }, { passive: true });

  const stop = () => { if (timer) { window.clearInterval(timer); timer = null; } };
  const start = () => {
    if (timer || isPaused || reduce || !loop || videoEngaged) return;
    timer = window.setInterval(() => go(1), TESTIMONIAL_INTERVAL_MS);
  };
  const pause = () => { isPaused = true; stop(); };
  const resume = () => { isPaused = false; start(); };

  prevBtn?.addEventListener("click", () => go(-1));
  nextBtn?.addEventListener("click", () => go(1));

  mount.addEventListener("mouseenter", pause);
  mount.addEventListener("mouseleave", resume);
  mount.addEventListener("focusin", pause);
  mount.addEventListener("focusout", (e) => { if (!mount.contains(e.relatedTarget)) resume(); });

  // ---- Inline video playback ------------------------------------------------
  // A video card shows its poster + play button; clicking swaps in a real <video>
  // (self-hosted) or <iframe> (YouTube/Vimeo) that plays inline with sound. Only
  // one plays at a time; playing holds the auto-advance, and navigating away (or
  // the clip ending) restores the poster so audio never runs off-screen.
  const resetVideos = () => {
    row.querySelectorAll(".tcard.is-playing").forEach((card) => {
      card.classList.remove("is-playing");
      const player = card.querySelector(".tcard__media video, .tcard__media iframe");
      if (player) player.remove();
    });
    videoEngaged = false;
  };
  const playVideo = (card) => {
    const vs = videoSource(card.getAttribute("data-tvideo"));
    if (!vs) return;
    resetVideos();
    const media = card.querySelector(".tcard__media");
    const poster = card.getAttribute("data-tposter");
    let player;
    if (vs.kind === "file") {
      player = document.createElement("video");
      player.src = vs.url;
      player.controls = true;
      player.autoplay = true;
      player.playsInline = true;
      if (poster) player.poster = poster;
      player.addEventListener("ended", resetVideos);
    } else {
      player = document.createElement("iframe");
      player.src = vs.url;
      player.title = "Video testimonial";
      player.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
      player.allowFullscreen = true;
    }
    player.className = "tcard__player";
    media.appendChild(player);
    card.classList.add("is-playing");
    videoEngaged = true;
    pause();
  };
  row.addEventListener("click", (e) => {
    const btn = e.target.closest(".tcard__play");
    if (!btn) return;
    const card = btn.closest(".tcard");
    if (card) playVideo(card);
  });

  // Re-centre the active card when the viewport changes size (no animation).
  let rzTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(rzTimer);
    rzTimer = window.setTimeout(() => centre(pos, false), 150);
  });

  setActive(pos);
  centre(pos, false);                 // position synchronously to avoid a load flash
  requestAnimationFrame(() => { centre(pos, false); start(); });
}

/* --------------------------------------------------------- Category / products page */
export async function initCategoryPage() {
  const mount = document.querySelector("[data-catalog-grid]");
  if (!mount) return;
  const data = await catalog();
  if (!data) return;
  const chipsWrap = document.querySelector("[data-cat-filters]");
  const titleEl = document.querySelector("[data-cat-title]");
  const blurbEl = document.querySelector("[data-cat-blurb]");
  const params = new URLSearchParams(location.search);
  let active = params.get("cat") || "all";

  const render = () => {
    const list = active === "all" ? data.products : data.products.filter(p => p.category === active);
    mount.innerHTML = list.map(p => productCard(data, p)).join("") ||
      `<p class="lead" style="padding:2rem">No machines in this category yet.</p>`;
    if (titleEl) titleEl.textContent = active === "all" ? "All Machines" : catName(data, active);
    if (blurbEl) {
      const c = data.categories.find(c => c.slug === active);
      blurbEl.textContent = c?.blurb || "The complete Yamamoto lineup, engineered for the lowest cost of ownership.";
    }
    chipsWrap?.querySelectorAll("button").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.cat === active)));
    const url = new URL(location.href);
    if (active === "all") url.searchParams.delete("cat"); else url.searchParams.set("cat", active);
    history.replaceState(null, "", url);
  };

  if (chipsWrap) {
    chipsWrap.innerHTML =
      `<button class="chip" data-cat="all">All</button>` +
      data.categories.map(c => `<button class="chip" data-cat="${c.slug}">${escapeHtml(c.name)}</button>`).join("");
    chipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      active = btn.dataset.cat; render();
    });
  }
  render();
}

/* --------------------------------------------------------- Product detail page */
export async function initProductDetail() {
  const mount = document.querySelector("[data-product-detail]");
  if (!mount) return;
  const data = await catalog();
  if (!data) return;
  const slug = new URLSearchParams(location.search).get("p");
  const p = data.products.find(x => x.slug === slug) || data.products[0];
  if (!p) { mount.innerHTML = `<p class="lead">Machine not found.</p>`; return; }

  document.title = `${p.model} — Yamamoto North America`;
  const catSlug = p.category, cName = catName(data, catSlug);
  const related = data.products.filter(x => x.category === catSlug && x.slug !== p.slug).slice(0, 4);

  mount.innerHTML = `
    <div class="breadcrumb">
      <a href="/">Home</a><span class="sep">/</span>
      <a href="/pages/products.html?cat=${catSlug}">${escapeHtml(cName)}</a><span class="sep">/</span>
      <span>${escapeHtml(p.model)}</span>
    </div>
    <div class="pd-hero">
      <div class="pd-hero__media"><div class="blueprint"></div>${productMedia(p)}</div>
      <div>
        <span class="overline">${escapeHtml(cName)}</span>
        <h1 style="margin:.5rem 0">${escapeHtml(p.model)}</h1>
        <p class="lead">${escapeHtml(p.subtitle || "")}, built for the lowest total cost of ownership, with full U.S.-based technical support.</p>
        <div class="pd-actions">
          <a class="btn btn--primary btn--lg" href="/pages/quote.html?model=${p.slug}">Request a Quote ${icon("arrow",16)}</a>
          <a class="btn btn--ghost btn--lg" href="/pages/dealer-locator.html">Find a Distributor</a>
        </div>
      </div>
    </div>

    <div class="pd-layout section--tight">
      <div class="stack-lg">
        <div>
          <span class="overline">Overview</span>
          <h2 style="font-size:var(--fs-xl);margin:.5rem 0">Engineered to run, built to last</h2>
          <p class="measure" style="color:var(--color-fog-2)">
            The ${escapeHtml(p.model)} is part of the ${escapeHtml(cName)} range. Full descriptions,
            dimensions, utility requirements and downloadable documents are sourced per machine from the
            manufacturer. Drop them into this template's data file.
          </p>
        </div>
        <div>
          <span class="overline">Documents</span>
          <div class="pd-docs" style="margin-top:.75rem">
            <a href="#">${icon("file",18)} <span>${escapeHtml(p.model)} Spec Sheet (PDF)</span> ${icon("download",18)}</a>
            <a href="#">${icon("file",18)} <span>Installation &amp; Operation Manual</span> ${icon("download",18)}</a>
            <a href="#">${icon("file",18)} <span>Architect / Engineer Resources (ARCAT)</span> ${icon("arrow",18)}</a>
          </div>
          <p class="hint" style="margin-top:.5rem;color:var(--color-fog);font-family:var(--font-mono);font-size:var(--fs-xs)">Document links are placeholders. Wire to real files.</p>
        </div>
      </div>
      <aside class="stack">
        ${specBlock(p, `${p.model} Technical Data`)}
        <a class="btn btn--primary btn--block" href="/pages/quote.html?model=${p.slug}">Get a Quote on the ${escapeHtml(p.model)}</a>
        <a class="btn btn--ghost btn--block btn--call" href="tel:+18662040519">${icon("phone",16)} 866-204-0519</a>
      </aside>
    </div>

    ${related.length ? `
    <div class="section--tight">
      <div class="sec-head" style="padding-inline:0"><span class="overline">Related</span>
        <h2 class="sec-head__title" style="font-size:var(--fs-xl)">More ${escapeHtml(cName)}</h2></div>
      <div class="card-grid" data-stagger>${related.map(r => productCard(data, r)).join("")}</div>
    </div>` : ""}
  `;
}

/* --------------------------------------------------------- Single industry page */
export async function initIndustryPage() {
  const mount = document.querySelector("[data-industry]");
  if (!mount) return;
  const inds = await getJSON("/data/industries.json");
  if (!inds) return;
  const slug = new URLSearchParams(location.search).get("i");
  const ind = inds.find(x => x.slug === slug) || inds[0];
  document.title = `${ind.name} — Yamamoto North America`;
  mount.innerHTML = `
    <div class="breadcrumb">
      <a href="/">Home</a><span class="sep">/</span>
      <a href="/pages/industries.html">Industries</a><span class="sep">/</span>
      <span>${escapeHtml(ind.name)}</span>
    </div>
    <span class="overline">${escapeHtml(ind.tagline || "Industries Served")}</span>
    <h1 style="margin:.5rem 0 1rem">${escapeHtml(ind.name)}</h1>
    <div class="textmedia" style="margin-top:2rem">
      <div class="prose">
        <p class="lead">${escapeHtml(ind.body || "")}</p>
        <p>Yamamoto machines are matched to the demands of ${escapeHtml(ind.name.toLowerCase())} laundry, built for the lowest total cost of ownership, with full U.S.-based technical support. Detailed copy for this page is sourced from the live industry pages.</p>
        <div class="pd-actions">
          <a class="btn btn--primary" href="/pages/quote.html">Request a Quote ${icon("arrow",16)}</a>
          <a class="btn btn--ghost" href="/pages/products.html">Browse Machines</a>
        </div>
      </div>
      <div class="textmedia__media"><div class="blueprint"></div>${machineSchematic(ind.name)}</div>
    </div>`;
}

/* --------------------------------------------------------- Dealer locator */
export async function initDealerLocator() {
  const mount = document.querySelector("[data-dealers]");
  if (!mount) return;
  const dealers = (await getJSON("/data/dealers.json")) || [];
  const regions = [
    ["all", "All Regions"], ["usa", "USA & Territories"],
    ["canada", "Canada"], ["caribbean", "Caribbean"]
  ];
  const filterWrap = document.querySelector("[data-dealer-region]");
  let region = "all";

  const render = () => {
    const list = region === "all" ? dealers : dealers.filter(d => d.region === region);
    mount.innerHTML = list.map(d => `
      <div class="dealer-item">
        <h4>${escapeHtml(d.name)}</h4>
        <p>${escapeHtml(d.address || "")}</p>
        <p><a href="tel:${escapeHtml((d.phone || "").replace(/[^0-9]/g, ""))}">${icon("phone",14)} ${escapeHtml(d.phone || "")}</a></p>
      </div>`).join("") || `<div class="dealer-item"><p>No distributors listed for this region yet.</p></div>`;
  };
  if (filterWrap) {
    filterWrap.innerHTML = regions.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
    filterWrap.addEventListener("change", (e) => { region = e.target.value; render(); });
  }
  render();
}

/* --------------------------------------------------------- Form option lists */
export async function populateFormOptions() {
  const modelSelects = document.querySelectorAll("[data-options=models]");
  const indSelects = document.querySelectorAll("[data-options=industries]");
  if (!modelSelects.length && !indSelects.length) return;

  if (modelSelects.length) {
    const data = await catalog();
    if (data) {
      const opts = data.categories.map(c => {
        const inCat = data.products.filter(p => p.category === c.slug);
        if (!inCat.length) return `<option value="${c.slug}">${escapeHtml(c.name)} (range)</option>`;
        return `<optgroup label="${escapeHtml(c.name)}">` +
          inCat.map(p => `<option value="${p.slug}">${escapeHtml(p.model)}, ${escapeHtml(p.subtitle || "")}</option>`).join("") +
          `</optgroup>`;
      }).join("");
      modelSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select a machine…</option>` + opts;
        // Pre-fill from ?model= (model selection only — never personal data in URLs)
        const pre = new URLSearchParams(location.search).get("model");
        if (pre && sel.querySelector(`option[value="${CSS.escape(pre)}"]`)) sel.value = pre;
      });
    }
  }
  if (indSelects.length) {
    const inds = await getJSON("/data/industries.json");
    if (inds) {
      const opts = inds.map(i => `<option value="${i.slug}">${escapeHtml(i.name)}</option>`).join("");
      indSelects.forEach(sel => { sel.innerHTML = `<option value="">Select industry…</option>` + opts; });
    }
  }
}
