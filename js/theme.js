/* theme.js — light/dark colour theme.
   The default follows the time of day (light during daylight hours, dark in the
   evening). A manual choice via the utility-bar switch overrides and persists. */

const KEY = "yam-theme";
const root = document.documentElement;

const timeDefault = () => {
  const h = new Date().getHours();
  return (h >= 7 && h < 19) ? "light" : "dark";   // daylight 7am–7pm → light
};

const savedTheme = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};

const syncSwitch = (theme) => {
  document.querySelectorAll("[data-set-theme]").forEach((btn) => {
    const on = btn.dataset.setTheme === theme;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
};

const apply = (theme, persist) => {
  // A theme swap must be instant, never animated, or every colour/background
  // transition fires at once (a "flash of animated content"). Suppress all
  // transitions for the single frame of the swap, then restore them.
  const kill = document.createElement("style");
  kill.textContent = "*,*::before,*::after{transition:none !important}";
  document.head.appendChild(kill);
  root.setAttribute("data-theme", theme);
  void root.offsetHeight;   // force a reflow so the new colours commit without easing
  kill.remove();
  if (persist) { try { localStorage.setItem(KEY, theme); } catch { /* ignore */ } }
  syncSwitch(theme);
};

export function initTheme() {
  // The <head> primer may already have set data-theme (avoids a flash). Else
  // fall back to the saved choice, then the time of day.
  const theme = root.getAttribute("data-theme") || savedTheme() || timeDefault();
  apply(theme, false);
  document.querySelectorAll("[data-set-theme]").forEach((btn) => {
    btn.addEventListener("click", () => apply(btn.dataset.setTheme, true));
  });
}
