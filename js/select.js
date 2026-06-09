/* select.js — replaces the native <select> popup (which the OS renders unstyled,
   especially on Safari/macOS) with a custom dark dropdown that matches the site.
   The real <select> stays in the form as the source of truth; we mirror its value
   and dispatch a native "change" so existing handlers (validation,
   capacity repopulation) keep working. Progressive enhancement: no JS = native select. */

const CHEVRON =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

export function initSelects() {
  document.querySelectorAll(".field select").forEach(enhance);
}

function enhance(select) {
  if (select.dataset.cselect) return;
  select.dataset.cselect = "1";

  const wrap = document.createElement("div");
  wrap.className = "cselect";
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add("cselect__native");

  const label = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "cselect__trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  if (label) trigger.setAttribute("aria-label", label.textContent.trim());
  trigger.innerHTML = `<span class="cselect__value"></span><span class="cselect__chev">${CHEVRON}</span>`;
  wrap.appendChild(trigger);

  const panel = document.createElement("div");
  panel.className = "cselect__panel";
  panel.setAttribute("role", "listbox");
  wrap.appendChild(panel);

  const valueEl = trigger.querySelector(".cselect__value");

  const syncTrigger = () => {
    const opt = select.options[select.selectedIndex];
    valueEl.textContent = opt ? opt.textContent : "";
    trigger.disabled = select.disabled;
  };

  const makeOption = (o) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "cselect__option";
    item.setAttribute("role", "option");
    item.textContent = o.textContent;
    item.dataset.value = o.value;
    if (o.disabled) item.disabled = true;
    if (o.value === select.value) item.setAttribute("aria-selected", "true");
    item.addEventListener("click", () => {
      select.value = o.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncTrigger();
      close();
      trigger.focus();
    });
    return item;
  };

  const buildPanel = () => {
    panel.replaceChildren();
    [...select.children].forEach((child) => {
      if (child.tagName === "OPTGROUP") {
        const grp = document.createElement("div");
        grp.className = "cselect__group";
        grp.textContent = child.label;
        panel.appendChild(grp);
        [...child.children].forEach((o) => panel.appendChild(makeOption(o)));
      } else {
        panel.appendChild(makeOption(child));
      }
    });
  };

  const open = () => {
    if (select.disabled) return;
    buildPanel();
    wrap.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    const sel = panel.querySelector('[aria-selected="true"]') ||
                panel.querySelector(".cselect__option:not([disabled])");
    sel?.scrollIntoView({ block: "nearest" });
    sel?.focus();
  };
  const close = () => {
    wrap.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", () => (wrap.classList.contains("is-open") ? close() : open()));
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });
  panel.addEventListener("keydown", (e) => {
    const opts = [...panel.querySelectorAll(".cselect__option:not([disabled])")];
    const i = opts.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (opts[i + 1] || opts[0])?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (opts[i - 1] || opts[opts.length - 1])?.focus(); }
    else if (e.key === "Escape") { e.preventDefault(); close(); trigger.focus(); }
    else if (e.key === "Tab") close();
  });
  document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(); });

  // External changes (capacity repopulated, prefill, etc.) keep the trigger in sync
  select.addEventListener("change", syncTrigger);
  new MutationObserver(syncTrigger).observe(select, { childList: true, attributes: true, attributeFilter: ["disabled"] });
  // A label click focuses the hidden native select — bounce it to the visible trigger
  select.addEventListener("focus", () => trigger.focus());

  syncTrigger();
}
