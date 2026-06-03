/* alert.js — dismissible announcement strip. Hidden until content exists.
   Reads optional `alert` from site.json: { "html": "...", "id": "v1" }.
   Stays dismissed for the browser session (sessionStorage). */

import { getJSON, icon } from "./util.js";

export async function initAlert() {
  const bar = document.getElementById("alert-bar");
  if (!bar) return;
  const site = await getJSON("/data/site.json");
  const a = site?.alert;
  if (!a || !a.html) return;                       // no content -> stays hidden
  if (sessionStorage.getItem("alert-dismissed") === a.id) return;

  bar.innerHTML = `
    <div class="alert-bar__inner">
      <span class="alert-bar__msg">${a.html}</span>
      <button class="alert-bar__close" aria-label="Dismiss announcement">&times;</button>
    </div>`;
  bar.classList.add("is-active");
  document.documentElement.style.setProperty("--alert-h", bar.offsetHeight + "px");

  bar.querySelector(".alert-bar__close").addEventListener("click", () => {
    bar.classList.remove("is-active");
    document.documentElement.style.setProperty("--alert-h", "0px");
    sessionStorage.setItem("alert-dismissed", a.id || "1");
  });
}
