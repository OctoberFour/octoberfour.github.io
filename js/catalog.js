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
    industry: "hospitality"
  },
  {
    quote: "We needed equipment that could run consistently without adding more complexity for our staff.",
    author: "Facilities Director",
    role: "Regional hospital",
    industry: "healthcare"
  },
  {
    quote: "The build quality feels different. It is the kind of machine we expect to keep working hard for years.",
    author: "Plant Supervisor",
    role: "Industrial laundry",
    industry: "industrial"
  },
  {
    quote: "When a machine is down, speed matters. Yamamoto helped us get the right replacement without slowing production.",
    author: "General Manager",
    role: "Commercial laundry",
    industry: "service"
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
  // One representative machine per category-ish + the flagships
  const picks = ["wun-30", "wun-100", "wun-275", "vug-750", "wud-80", "fut10bt"];
  const list = picks.map(s => data.products.find(p => p.slug === s)).filter(Boolean);
  mount.innerHTML = list.map(p => productCard(data, p, { features: true })).join("");
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

/* --------------------------------------------------------- Homepage: testimonials (light cards) */
export async function initTestimonials() {
  const mount = document.querySelector("[data-testimonials]");
  if (!mount) return;
  const items = await getJSON("/data/testimonials.json") || FALLBACK_TESTIMONIALS;
  if (!items || !items.length) return;

  const row = mount.querySelector("[data-trows]");
  const countEl = mount.querySelector("[data-tcount]");
  const prevBtn = mount.querySelector("[data-tprev]");
  const nextBtn = mount.querySelector("[data-tnext]");
  if (!row) return;

  const n = items.length;
  let i = 0;
  let timer = null;
  let isPaused = false;

  const card = (t, active) => `
    <article class="tcard${active ? " is-active" : ""}" aria-roledescription="testimonial"${active ? "" : ' aria-hidden="true"'}>
      <span class="tcard__mark" aria-hidden="true">&ldquo;</span>
      <p class="tcard__quote">${escapeHtml(t.quote)}</p>
      <p class="tcard__attr">
        <span class="tcard__name">${escapeHtml(t.author)}</span>
        <span class="tcard__sep" aria-hidden="true">//</span>
        <span class="tcard__role">${escapeHtml(t.role)}</span>
      </p>
    </article>`;

  // A three-card window centred on the active testimonial (CSS shows only the
  // active card on mobile). The active card is always the middle one.
  const windowIdxs = () =>
    n <= 2 ? items.map((_, idx) => idx) : [(i - 1 + n) % n, i, (i + 1) % n];
  const paint = () => {
    row.innerHTML = windowIdxs().map((idx) => card(items[idx], idx === i)).join("");
    if (countEl) countEl.textContent =
      `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
  };

  const show = (next) => {
    const ni = (next + n) % n;
    if (ni === i) return;
    if (prefersReducedMotion()) { i = ni; paint(); return; }
    row.classList.add("is-fading");
    window.setTimeout(() => {
      i = ni;
      paint();
      row.classList.remove("is-fading");
    }, 200);
  };

  const stop = () => { if (timer) { window.clearInterval(timer); timer = null; } };
  const start = () => {
    if (timer || isPaused || prefersReducedMotion() || n < 2) return;
    timer = window.setInterval(() => show(i + 1), TESTIMONIAL_INTERVAL_MS);
  };
  const pause = () => { isPaused = true; stop(); };
  const resume = () => { isPaused = false; start(); };

  if (prevBtn) prevBtn.addEventListener("click", () => show(i - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => show(i + 1));

  // Touch/pen swipe — the card follows your finger; release past a threshold to
  // change quote, otherwise it springs back to centre. Mouse users keep the
  // arrows, so the desktop is unaffected.
  let dragId = null, x0 = 0, y0 = 0, dragging = false;
  const resist = (dx) => {                  // 1:1 up to 100px, then rubber-band
    const max = 100;
    return Math.abs(dx) <= max ? dx : Math.sign(dx) * (max + (Math.abs(dx) - max) * 0.2);
  };
  const settle = () => { row.classList.remove("is-dragging"); row.style.transform = ""; };

  row.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    dragId = e.pointerId; x0 = e.clientX; y0 = e.clientY; dragging = false;
  });
  row.addEventListener("pointermove", (e) => {
    if (e.pointerId !== dragId) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (!dragging) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;            // wait for intent
      if (Math.abs(dy) >= Math.abs(dx)) { dragId = null; return; } // vertical → let the page scroll
      dragging = true;
      try { row.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      pause();
      row.classList.add("is-dragging");
    }
    row.style.transform = `translateX(${resist(dx)}px)`;
  });
  row.addEventListener("pointerup", (e) => {
    if (e.pointerId !== dragId) return;
    const dx = e.clientX - x0;
    dragId = null;
    if (!dragging) return;
    dragging = false;
    settle();
    if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
    resume();
  });
  row.addEventListener("pointercancel", (e) => {
    if (e.pointerId !== dragId) return;
    dragId = null;
    if (dragging) { dragging = false; settle(); resume(); }
  });

  mount.addEventListener("mouseenter", pause);
  mount.addEventListener("mouseleave", resume);
  mount.addEventListener("focusin", pause);
  mount.addEventListener("focusout", (e) => {
    if (!mount.contains(e.relatedTarget)) resume();
  });

  paint();
  start();
}

/* --------------------------------------------------------- Hero quick-selector */
export async function initHeroSelector() {
  const form = document.querySelector("[data-hero-selector]");
  if (!form) return;
  const data = await catalog();
  if (!data) return;
  const typeSel = form.querySelector("[name=type]");
  const capSel = form.querySelector("[name=capacity]");

  typeSel.innerHTML = `<option value="">Select type…</option>` +
    data.categories.map(c => `<option value="${c.slug}">${escapeHtml(c.name)}</option>`).join("");

  const fillCaps = () => {
    const cat = typeSel.value;
    const inCat = data.products.filter(p => p.category === cat);
    capSel.disabled = !cat;
    capSel.innerHTML = cat
      ? `<option value="">Any capacity…</option>` +
        inCat.map(p => `<option value="${p.slug}">${escapeHtml(p.model)} — ${escapeHtml(p.subtitle || "")}</option>`).join("")
      : `<option value="">Select type first…</option>`;
  };
  typeSel.addEventListener("change", fillCaps);
  fillCaps();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const slug = capSel.value, cat = typeSel.value;
    if (slug) location.href = `/products/detail.html?p=${slug}`;
    else if (cat) location.href = `/pages/products.html?cat=${cat}`;
    else location.href = `/pages/products.html`;
  });
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
        <p class="lead">${escapeHtml(p.subtitle || "")} — built for the lowest total cost of ownership, with full U.S.-based technical support.</p>
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
            manufacturer — drop them into this template's data file.
          </p>
        </div>
        <div>
          <span class="overline">Documents</span>
          <div class="pd-docs" style="margin-top:.75rem">
            <a href="#">${icon("file",18)} <span>${escapeHtml(p.model)} Spec Sheet (PDF)</span> ${icon("download",18)}</a>
            <a href="#">${icon("file",18)} <span>Installation &amp; Operation Manual</span> ${icon("download",18)}</a>
            <a href="#">${icon("file",18)} <span>Architect / Engineer Resources (ARCAT)</span> ${icon("arrow",18)}</a>
          </div>
          <p class="hint" style="margin-top:.5rem;color:var(--color-fog);font-family:var(--font-mono);font-size:var(--fs-xs)">Document links are placeholders — wire to real files.</p>
        </div>
      </div>
      <aside class="stack">
        ${specBlock(p, `${p.model} — Technical Data`)}
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
        <p>Yamamoto machines are matched to the demands of ${escapeHtml(ind.name.toLowerCase())} laundry — built for the lowest total cost of ownership, with full U.S.-based technical support. Detailed copy for this page is sourced from the live industry pages.</p>
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
          inCat.map(p => `<option value="${p.slug}">${escapeHtml(p.model)} — ${escapeHtml(p.subtitle || "")}</option>`).join("") +
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
