# Yamamoto North America — Website

A responsive, static marketing + lead-generation site (HTML / CSS / JavaScript, with
GSAP for animation). No build step and no backend — it's plain files a browser can open,
structured so a developer can later plug in a CMS and real form/auth backends.

Built to the brief in `.context/attachments/.../yamamoto.zip` (CLAUDE.md, PROJECT_BRIEF,
DESIGN_SYSTEM, IA_SITEMAP, CONTENT_MODEL, TECH_APPROACH).

## How to view it (plain steps)

Because the pages load shared data (`/data/*.json`), they must be opened through a small
local web server — **not** by double-clicking the file.

1. Open the **Terminal** app.
2. Paste this and press Return:
   ```
   cd "/Users/jasonsanders/conductor/workspaces/yamamoto/sacramento" && python3 -m http.server 8753
   ```
3. In your browser go to **http://localhost:8753**
4. To stop the server later: click the Terminal window and press **Control + C**.

## What's here

| Page | File |
| --- | --- |
| Homepage (split hero) | `index.html` |
| Products (grid + category filter) | `pages/products.html` |
| Product detail (specs, docs, related) | `products/detail.html?p=<model>` |
| Request a Quote | `pages/quote.html` |
| Order Now (with agreement step) | `pages/order.html` |
| Contact | `pages/contact.html` |
| About Us | `pages/about.html` |
| Yamamoto Technology | `pages/technology.html` |
| Industries (index + single) | `pages/industries.html`, `pages/industry.html?i=<slug>` |
| Find a Distributor | `pages/dealer-locator.html` |
| Dealer Portal (demo gate) | `pages/portal.html` |
| Accessibility / Privacy / Sitemap | `pages/accessibility.html`, `pages/privacy.html`, `sitemap.html` |

- `css/` — design tokens, base, components, page styles.
- `js/`  — small vanilla ES modules (shell, alert, motion, catalog, forms, portal).
- `data/` — the single source of truth: products, industries, dealers, testimonials,
  resources, and global site info. **Edit content here** and every page updates.
- `img/logo/` — the supplied logos + a generated favicon.

## Editing content

Everything repeating is data-driven — change `data/products.json` and the homepage lineup,
the products grid, the detail pages, the related products, and the quote/order menus all
update together. No HTML editing needed for catalog changes.

## Icons — Font Awesome Kit

All icons come from a **Font Awesome Kit** (ID `0a6d31be35`, FA 7 **Pro**, **SVG+JS** mode).

- The Kit loads from one script tag in each page's `<head>`:
  `<script src="https://kit.fontawesome.com/0a6d31be35.js" crossorigin="anonymous"></script>`
- Icons use the **thin** weight: `<i class="fa-thin fa-...">` (brand logos use `fa-brands`,
  which have no weights). The mapping from our semantic names to FA classes lives in one
  place — the `FA` table in `js/util.js` (`icon()`) — so every JS-rendered icon updates there.
- **⚠️ Hook class is `ic-fx`, NOT `fa-ic`.** Our icons carry an `ic-fx` class so JS/CSS can
  target them. Do **not** name it with a `fa-` prefix: in SVG+JS mode Font Awesome reads a
  `fa-xxx` class as an icon name and tries to fetch a (non-existent) icon, throwing CORS/404
  errors. In SVG mode FA also drops non-FA classes from the generated `<svg>`, so motion code
  targets FA's own **`.svg-inline--fa`** class.
- **Icon motion (GSAP + DrawSVG):** `js/motion.js` drives the icons with GSAP 3.13
  (`gsap` + `ScrollTrigger` + `DrawSVGPlugin`, loaded in each `<head>`). Icons sit **fully
  visible at rest**; the animation is **hover-only**:
  - **SVG mode (current) →** on hover, `DrawSVGPlugin` blanks the fill and **traces the icon's
    path like a pen drawing it** (`traceIcon()`), then inks the fill back in.
  - **Web Font mode →** glyphs have no `<path>`, so hover falls back to an elastic scale+rotate pop.
  - **No GSAP →** a CSS clip-wipe `@keyframes fa-draw` in `css/components.css` (gated by
    `.icons-gsap` on `<html>`).
  All paths are guarded by `prefers-reduced-motion`.
- **Section frames (scroll-drawn):** `buildSectionFrames()` in `js/motion.js` injects a thin
  technical line frame into each content section (`main .section`, excluding `.lineup`) and a
  scrubbed `ScrollTrigger` timeline traces it on — top → right → bottom → left — as the section
  scrolls through, with red corner ticks fading in. The enerblock-style motif. Styling lives in
  `css/pages.css` (`.section-frame`). Add `data-no-frame` to a section to opt out.
  - Note: `<body>` uses `overflow-x: clip` (not `hidden`) so the viewport stays the scroll
    container — required for `window.scrollY` / ScrollTrigger / `position: sticky` to work.
- **Domains:** Kits are open to any domain by default and **localhost works automatically**.
  Before launch, add the production domain(s) to the Kit's allowlist in the Font Awesome
  account dashboard (account → Kits → this Kit → Settings → Domains). That's the only
  account-side step, and it's optional but recommended.
- The Kit's account also controls which icon set (Pro), version, and Web Font vs SVG
  technology — all configured in the dashboard, not in this code.

## Still to do / left as integration points (on purpose)

- **Forms don't send anywhere yet.** A static page can't email a submission. Each form has
  one clearly marked `// TODO: form endpoint` in `js/forms.js` — wire it to Formspree / Basin
  / Netlify Forms or a serverless function. The forms, validation, and success states are done.
- **Dealer Portal is a demo gate, not real security.** Any email/password opens it so you can
  review the layout. Real sign-in is a later backend phase (see `js/portal.js`).
- **Product photos are the real machine cutouts** pulled from the live site
  (`yamamoto-na.com`), auto-trimmed, resized and saved as transparent WebP in `img/products/`.
  If the manufacturer supplies higher-res cutouts later, replace the files in place.
  Each card/detail image still falls back to a CAD schematic automatically if a file is missing.
- **Homepage hero** uses a real laundry-room banner photo (`img/people/hero-laundry.webp`)
  behind a legibility scrim, with the urgency panel as a frosted-glass overlay. Swap the
  image in place to change it.
- **Technology video** is a click-to-play YouTube embed (`js/video.js`): a poster +
  play button on a `[data-video="<id>"]` element loads the `youtube-nocookie` iframe only on
  click (faster + privacy-friendly). Change the video by editing `data-video` (homepage +
  `pages/technology.html`) and the poster `img/people/tech-video-poster.webp`. **Industry
  photos** are still placeholders.

## Needs confirmation before publishing (do not guess)

- **`{{WARRANTY_CLAIM}}`** — the brief says *3-year all-inclusive*, the live site says *5-year
  parts*. These differ. The real claim is shown as `{{WARRANTY_CLAIM}}` everywhere until confirmed.
- **Dealer regions** — USA / Canada / Caribbean (proposal) vs US / Canada / Mexico (live site).
- **Competitor name** "Millner" vs "Milnor".
- **Testimonials, dealer list, privacy policy** — placeholder content, client to supply.

## Note on the logo

The brief mentioned an SVG logo; the files supplied were **PNG**
(`yamamoto-logo-black.png`, `yamamoto-logo-white.png`). They're used as-is. A true SVG would
scale more crisply if available.
