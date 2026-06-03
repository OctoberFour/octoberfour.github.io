/* video.js — click-to-play YouTube facade. A [data-video] element shows a poster
   + play button; the heavy YouTube iframe is loaded only on click (better
   performance + privacy). Uses youtube-nocookie.com. */

export function initVideo() {
  document.querySelectorAll("[data-video]").forEach((media) => {
    const btn = media.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const id = media.dataset.video;
      const frame = document.createElement("iframe");
      frame.className = "tech__iframe";
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      frame.title = "Yamamoto video";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; web-share; fullscreen";
      frame.setAttribute("allowfullscreen", "");
      media.replaceChildren(frame);     // swap poster + play button for the player
    }, { once: true });
  });
}
