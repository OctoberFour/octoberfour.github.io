/* main.js — entry point. Builds the shared shell, then initialises each
   feature module only if its DOM hooks exist on the current page. Everything
   is progressive enhancement: if this fails to load, page content remains. */

import { buildShell } from "./shell.js";
import { initTheme } from "./theme.js";
import { initAlert } from "./alert.js";
import { initMotion } from "./motion.js";
import {
  initLineup, initFeatured, initIndustriesGrid, initIndustriesConsole, initTestimonials, initHeroSelector,
  initCategoryPage, initProductDetail, populateFormOptions,
  initIndustryPage, initDealerLocator
} from "./catalog.js";
import { initForms } from "./forms.js";
import { initPortal } from "./portal.js";
import { initVideo } from "./video.js";
import { initSelects } from "./select.js";
import { initHeroDoorDisclosure } from "./hero.js";

async function boot() {
  await buildShell();          // header + footer + a11y widget (needs data)
  initTheme();                 // light/dark switch in the utility bar
  await initAlert();

  // Page features — each no-ops when its hook is absent.
  await Promise.all([
    initHeroSelector(),
    initLineup(),
    initFeatured(),
    initIndustriesGrid(),
    initIndustriesConsole(),
    initTestimonials(),
    initCategoryPage(),
    initProductDetail(),
    initIndustryPage(),
    initDealerLocator(),
    populateFormOptions(),
    initPortal()
  ]);
  initForms();
  initVideo();
  initHeroDoorDisclosure();
  initSelects();   // custom dark dropdowns (after selects are populated)

  // Motion runs last so it observes all rendered content.
  initMotion();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
