/* shell.js — builds the shared chrome (header, mega menu, mobile drawer,
   footer, accessibility widget, alert bar) from site + catalog data.
   Injected into [data-shell="header"] / [data-shell="footer"].
   Each page keeps a <noscript> fallback so content/links survive without JS. */

import { getJSON, icon, escapeHtml } from "./util.js";

const NAV = [
  { label: "About", href: "/pages/about.html" },
  { label: "Products", href: "/pages/products.html", mega: true },
  { label: "Technology", href: "/pages/technology.html" },
  { label: "Industries", href: "/pages/industries.html",
    children: [
      ["Hospitality", "/pages/industry.html?i=hospitality-industry"],
      ["Athletic Facilities", "/pages/industry.html?i=athletic-facilities"],
      ["Healthcare", "/pages/industry.html?i=healthcare-facilities"],
      ["Industrial", "/pages/industry.html?i=industrial-facilities"],
      ["Food & Animal Processing", "/pages/industry.html?i=food-and-animal-processing-facilities"],
      ["Cleaners & Dry Cleaning", "/pages/industry.html?i=cleaners-and-the-dry-cleaning-industry"]
    ] },
  { label: "Parts", href: "#", external: true, title: "Parts store (Shopify), coming soon" },
  { label: "Order Now", href: "/pages/order.html", cta: "ghost" },
  { label: "Contact", href: "/pages/contact.html", cta: "primary" }
];

function isCurrent(href) {
  const path = location.pathname.replace(/index\.html$/, "");
  const target = href.split("?")[0].replace(/index\.html$/, "");
  return target !== "/" && target !== "#" && path === target;
}

export async function buildShell() {
  const [site, catalog] = await Promise.all([
    getJSON("/data/site.json"),
    getJSON("/data/products.json")
  ]);
  buildHeader(site, catalog);
  buildFooter(site);
}

/* --------------------------------------------------------------- Header */
function buildHeader(site, catalog) {
  const mount = document.querySelector('[data-shell="header"]');
  if (!mount) return;
  const cats = catalog?.categories || [];
  const counts = {};
  (catalog?.products || []).forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });

  const primaryLinks = NAV.map(item => {
    const cls = ["nav__link"];
    const current = isCurrent(item.href) ? 'aria-current="page"' : "";
    if (item.cta) {
      return `<a class="btn btn--${item.cta === "primary" ? "primary" : "ghost"}" href="${item.href}">${item.label}</a>`;
    }
    const hasMenu = item.mega || item.children;
    return `<a class="${cls.join(" ")}" href="${item.href}" ${current}
      ${hasMenu ? `aria-haspopup="true" aria-expanded="false" data-menu="${item.label}"` : ""}
      ${item.title ? `title="${escapeHtml(item.title)}"` : ""}>
      ${item.label}${hasMenu ? `<span class="caret">${icon("caret", 14)}</span>` : ""}
    </a>`;
  }).join("");

  const ctaButtons = NAV.filter(i => i.cta).map(i =>
    `<a class="btn btn--${i.cta === "primary" ? "primary" : "ghost"}" href="${i.href}">${i.label}</a>`
  ).join("");
  const primaryNoCta = NAV.filter(i => !i.cta).map(item => {
    const current = isCurrent(item.href) ? 'aria-current="page"' : "";
    const hasMenu = item.mega || item.children;
    return `<a class="nav__link" href="${item.href}" ${current}
      ${hasMenu ? `aria-haspopup="true" aria-expanded="false" data-menu="${item.label}"` : ""}>
      ${item.label}${hasMenu ? `<span class="caret">${icon("caret", 14)}</span>` : ""}</a>`;
  }).join("");

  const megaCards = cats.map(c => `
    <a class="mega__card${c.nav_cover ? " mega__card--cover" : ""}" href="/pages/products.html?cat=${c.slug}">
      ${c.nav_image ? `<img class="mega__img" src="${escapeHtml(c.nav_image)}" alt="" loading="lazy" decoding="async">` : ""}
      <span class="mega__scrim" aria-hidden="true"></span>
      <span class="mega__meta">
        <span class="mega__name">${escapeHtml(c.name)}</span>
        <span class="mega__count">${counts[c.slug] ? counts[c.slug] + " models" : "View range"}</span>
      </span>
    </a>`).join("");

  const drawerItems = NAV.filter(i => !i.cta).map(item => {
    if (item.mega) {
      return `<details><summary class="m-link">Products <span class="caret">${icon("caret",16)}</span></summary>
        <div class="m-sub">${cats.map(c => `<a href="/pages/products.html?cat=${c.slug}">${escapeHtml(c.name)}</a>`).join("")}</div></details>`;
    }
    if (item.children) {
      return `<details><summary class="m-link">${item.label} <span class="caret">${icon("caret",16)}</span></summary>
        <div class="m-sub">${item.children.map(([n, h]) => `<a href="${h}">${escapeHtml(n)}</a>`).join("")}</div></details>`;
    }
    return `<a class="m-link" href="${item.href}">${item.label}</a>`;
  }).join("");

  mount.innerHTML = `
    <div class="alert-bar" id="alert-bar" role="region" aria-label="Site announcement"></div>
    <div class="nav-utility">
      <div class="nav-utility__inner">
        <div class="theme-switch" data-theme-switch role="group" aria-label="Colour theme">
          <button class="theme-switch__opt" type="button" data-set-theme="light" aria-label="Light mode" aria-pressed="false"><i class="fa-thin fa-sun" aria-hidden="true"></i></button>
          <button class="theme-switch__opt" type="button" data-set-theme="dark" aria-label="Dark mode" aria-pressed="true"><i class="fa-thin fa-moon" aria-hidden="true"></i></button>
        </div>
        <div class="nav-utility__links">
          <a href="${site?.phone_href || "#"}" class="is-strong">${icon("phone",14)} ${escapeHtml(site?.phone || "")}</a>
          <a href="/pages/dealer-locator.html">${icon("mappin",14)} Find a Distributor</a>
          <a href="/pages/portal.html">${icon("lock",14)} Dealer Portal</a>
          <a href="/pages/quote.html">Request a Quote</a>
        </div>
      </div>
    </div>
    <header class="site-header">
      <nav class="nav" aria-label="Primary">
        <a class="nav__logo" href="/" aria-label="Yamamoto North America, home">
          <img class="logo-img logo-img--dark" src="/img/logo/yamamoto-logo-white.png" alt="Yamamoto North America" width="160" height="32">
          <img class="logo-img logo-img--light" src="/img/logo/yamamoto-logo-black.png" alt="" width="160" height="32" aria-hidden="true">
        </a>
        <div class="nav__primary">${primaryNoCta}</div>
        <div class="nav__cta">${ctaButtons}</div>
        <button class="nav__toggle" aria-expanded="false" aria-controls="mobile-drawer" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </nav>
      <div class="mega" id="mega-Products" role="region" aria-label="Products menu">
        <div class="mega__grid">${megaCards}</div>
      </div>
    </header>
    <div class="mobile-drawer" id="mobile-drawer" aria-label="Mobile menu">
      ${drawerItems}
      <div class="m-cta">
        <a class="btn btn--primary btn--block" href="/pages/quote.html">Request a Quote</a>
        <a class="btn btn--ghost btn--block btn--call" href="${site?.phone_href || "#"}">${icon("phone",16)} ${escapeHtml(site?.phone || "")}</a>
      </div>
    </div>`;

  wireMenus(mount);
}

function wireMenus(root) {
  // Mega menu (Products) — hover + focus + click, keyboard friendly
  const mega = root.querySelector("#mega-Products");
  const trigger = root.querySelector('[data-menu="Products"]');
  let closeTimer;
  const open = () => { clearTimeout(closeTimer); mega.classList.add("is-open"); trigger.setAttribute("aria-expanded", "true"); };
  const close = () => { mega.classList.remove("is-open"); trigger.setAttribute("aria-expanded", "false"); };
  const scheduleClose = () => { closeTimer = setTimeout(close, 160); };

  if (trigger && mega) {
    trigger.addEventListener("mouseenter", open);
    trigger.addEventListener("focus", open);
    trigger.addEventListener("mouseleave", scheduleClose);
    mega.addEventListener("mouseenter", () => clearTimeout(closeTimer));
    mega.addEventListener("mouseleave", scheduleClose);
    // Click toggles (and lets touch users open it without navigating away)
    trigger.addEventListener("click", (e) => {
      if (window.matchMedia("(min-width:1024px)").matches) {
        e.preventDefault();
        mega.classList.contains("is-open") ? close() : open();
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { close(); trigger.focus(); } });
    document.addEventListener("click", (e) => { if (!mega.contains(e.target) && !trigger.contains(e.target)) close(); });
  }

  // Mobile drawer
  const toggle = root.querySelector(".nav__toggle");
  const drawer = root.querySelector("#mobile-drawer");
  if (toggle && drawer) {
    toggle.addEventListener("click", () => {
      const openNow = drawer.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(openNow));
      toggle.setAttribute("aria-label", openNow ? "Close menu" : "Open menu");
      document.body.style.overflow = openNow ? "hidden" : "";
    });
    drawer.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        drawer.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }
}

/* --------------------------------------------------------------- Footer */
function buildFooter(site) {
  const mount = document.querySelector('[data-shell="footer"]');
  if (!mount) return;
  const addr = site?.address || {};
  const social = (site?.social || []).map(s =>
    `<a href="${s.url}" aria-label="${escapeHtml(s.label)}" title="${escapeHtml(s.label)}">${icon(s.icon, 18)}</a>`
  ).join("");

  mount.innerHTML = `
    <footer class="site-footer">
      <div class="footer__top" data-stagger>
        <div class="footer__brand">
          <img class="logo-img logo-img--dark" src="/img/logo/yamamoto-logo-white.png" alt="Yamamoto North America" width="180" height="36">
          <img class="logo-img logo-img--light" src="/img/logo/yamamoto-logo-black.png" alt="" width="180" height="36" aria-hidden="true">
          <p>North America representative for Yamamoto commercial &amp; industrial laundry equipment. Sales, distribution &amp; support.</p>
          <div class="footer__social">${social}</div>
        </div>
        <div class="footer__col">
          <h4>Products</h4>
          <a href="/pages/products.html?cat=commercial-washer-extractors">Commercial Washers</a>
          <a href="/pages/products.html?cat=industrial-washer-extractors">Industrial Washers</a>
          <a href="/pages/products.html?cat=commercial-tumble-dryers">Tumble Dryers</a>
          <a href="/pages/products.html?cat=combination-washer-dryers">Combination W/D</a>
          <a href="/pages/products.html?cat=folders-and-finishing-equipment">Folders &amp; Finishing</a>
        </div>
        <div class="footer__col">
          <h4>Company</h4>
          <a href="/pages/about.html">About Us</a>
          <a href="/pages/technology.html">Yamamoto Technology</a>
          <a href="/pages/industries.html">Industries Served</a>
          <a href="/pages/dealer-locator.html">Find a Distributor</a>
          <a href="/pages/portal.html">Dealer Portal</a>
        </div>
        <div class="footer__col">
          <h4>Get a Machine</h4>
          <a href="/pages/quote.html">Request a Quote</a>
          <a href="/pages/order.html">Order Now</a>
          <a href="/pages/contact.html">Contact Us</a>
          <div class="footer__contact" style="margin-top:1rem">
            <a href="${site?.phone_href || "#"}">${escapeHtml(site?.phone || "")}</a><br>
            ${escapeHtml(addr.line1 || "")}<br>
            ${escapeHtml(addr.po_box || "")}<br>
            ${escapeHtml(addr.city || "")}, ${escapeHtml(addr.state || "")} ${escapeHtml(addr.zip || "")}
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <span>&copy; <span data-year></span> Yamamoto North America. All rights reserved.</span>
        <div class="footer__bottom-right">
          <span class="footer__legal">
            <a href="/pages/accessibility.html">Accessibility Statement</a>
            <a href="/pages/privacy.html">Privacy Policy</a>
            <a href="/sitemap.html">Sitemap</a>
          </span>
          <a class="footer__credit" href="https://cybernautic.com" target="_blank" rel="noopener" aria-label="Website by Cybernautic">
            <img src="/img/logo/cybernautic-logo.svg" alt="Cybernautic" width="118" height="14">
          </a>
        </div>
      </div>
    </footer>`;
  const y = mount.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
}

