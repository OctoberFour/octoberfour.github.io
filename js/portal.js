/* portal.js — Dealer Portal LIGHT FRONT-END GATE ONLY.
   This is a demo gate, NOT real security: anything checked in browser JS is
   visible in page source. No real credentials are stored or validated, and no
   real password reset exists. Real authentication is a later backend phase
   (see TECH_APPROACH.md). The boundary below is the integration point. */

import { getJSON, icon, escapeHtml } from "./util.js";

const SESSION_KEY = "portal-demo-session";

export async function initPortal() {
  const root = document.querySelector("[data-portal]");
  if (!root) return;
  const session = readSession();
  if (session) renderPortal(root, session);
  else renderGate(root);
}

function readSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

function renderGate(root) {
  root.innerHTML = `
    <div class="portal-gate">
      <div class="portal-card">
        <span class="overline">Dealer Portal</span>
        <h1 style="font-size:var(--fs-xl);margin:.5rem 0 1rem">Sign In</h1>
        <form data-portal-login class="stack" novalidate>
          <div class="field">
            <label for="p-email">Email <span class="req">*</span></label>
            <input id="p-email" name="email" type="email" required autocomplete="username">
            <span class="error"></span>
          </div>
          <div class="field">
            <label for="p-pass">Password <span class="req">*</span></label>
            <input id="p-pass" name="password" type="password" required autocomplete="current-password">
            <span class="error"></span>
          </div>
          <button class="btn btn--primary btn--block" type="submit">Sign In ${icon("arrow",16)}</button>
        </form>
        <p style="margin-top:1rem;font-size:var(--fs-sm);color:var(--color-fog)">
          Need access? Accounts are created by the Yamamoto team.
          <a href="/pages/contact.html" style="color:#fff;text-decoration:underline">Contact us</a>.
        </p>
        <p class="portal-note">
          DEMO GATE: not secure. No real authentication runs in this phase;
          any email/password opens the demo portal so the layout can be reviewed.
          Real sign-in is a later backend phase.
        </p>
      </div>
    </div>`;

  const form = root.querySelector("[data-portal-login]");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const email = form.email.value.trim();
    const first = (email.split("@")[0] || "Dealer").replace(/[._-]+/g, " ").split(" ")[0];
    const name = first.charAt(0).toUpperCase() + first.slice(1);
    // --- integration point: replace with real auth response handling ---
    const session = { email, firstName: name };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    renderPortal(root, session);
  });
}

async function renderPortal(root, session) {
  const resources = (await getJSON("/data/resources.json")) || [];
  const cats = [...new Set(resources.map(r => r.category))];
  let activeCat = "all";

  root.innerHTML = `
    <div class="page-hero"><div class="grid-bg"></div>
      <div class="container page-hero__inner">
        <span class="overline">Dealer Portal</span>
        <h1 style="margin:.5rem 0">Hello, ${escapeHtml(session.firstName)}</h1>
        <p class="lead">Spec sheets, manuals, parts lists and training, all in one place.</p>
      </div>
    </div>
    <div class="portal-shell container" style="padding-block:0;border:1px solid var(--color-line-dark)">
      <nav class="portal-side" aria-label="Portal">
        <a class="is-active" href="#">${icon("file",16)} Resources</a>
        <a href="/pages/products.html">Product Catalog</a>
        <a href="/pages/quote.html">Request a Quote</a>
        <a href="/pages/contact.html">Support</a>
        <a href="#" data-portal-logout style="margin-top:2rem;color:var(--color-red)">Sign Out</a>
      </nav>
      <div class="portal-main">
        <div class="field" style="max-width:320px">
          <label for="res-cat">Filter by category</label>
          <select id="res-cat" data-res-filter>
            <option value="all">All categories</option>
            ${cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
          </select>
        </div>
        <div class="resource-grid" data-res-grid></div>
      </div>
    </div>`;

  const grid = root.querySelector("[data-res-grid]");
  const render = () => {
    const list = activeCat === "all" ? resources : resources.filter(r => r.category === activeCat);
    grid.innerHTML = list.map(r => `
      <article class="resource-card">
        <span class="doc-type">${icon(r.doc_type === "video" ? "play" : "file", 16)} ${escapeHtml(r.doc_type)}</span>
        <h4>${escapeHtml(r.title)}</h4>
        <p style="color:var(--color-fog);font-size:var(--fs-sm)">${escapeHtml(r.description || "")}</p>
        <a class="btn btn--ghost" href="${r.url_or_file}" style="margin-top:auto">Open ${icon("arrow",16)}</a>
      </article>`).join("") || `<p class="lead" style="padding:1.5rem">No resources in this category.</p>`;
  };
  root.querySelector("[data-res-filter]").addEventListener("change", (e) => { activeCat = e.target.value; render(); });
  root.querySelector("[data-portal-logout]").addEventListener("click", (e) => {
    e.preventDefault(); sessionStorage.removeItem(SESSION_KEY); renderGate(root);
  });
  render();
}
