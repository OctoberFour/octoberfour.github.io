/* hero.js — mobile-only disclosure behavior for the homepage urgency form. */

const HERO_MOBILE_QUERY = "(max-width: 880px)";

export function initHeroDoorDisclosure() {
  const details = document.querySelector("[data-mobile-hero-door]");
  if (!details) return;

  const summary = details.querySelector("summary");
  const media = window.matchMedia(HERO_MOBILE_QUERY);
  let mobileInitialized = false;

  const sync = () => {
    if (media.matches) {
      if (!mobileInitialized) {
        details.open = false;
        mobileInitialized = true;
      }
    } else {
      details.open = true;
    }
  };

  summary?.addEventListener("click", (e) => {
    if (!media.matches) {
      e.preventDefault();
      details.open = true;
    }
  });

  if (media.addEventListener) {
    media.addEventListener("change", sync);
  } else {
    media.addListener(sync);
  }

  sync();
}
