/* forms.js — progressive form enhancement for Quote, Contact, and Order forms.
   Handles inline validation, honeypot spam trap, success state, and the Order
   form's e-signature agreement lightbox. Submission delivery is intentionally
   NOT wired — see the clearly-marked integration point below. */

export function initForms() {
  document.querySelectorAll("form[data-form]").forEach(enhanceForm);
}

function enhanceForm(form) {
  const successEl = document.querySelector(`[data-form-success="${form.dataset.form}"]`);
  const requiresSignature = form.dataset.signature === "true";

  // Inline validation messaging tied to each field's .error element
  form.querySelectorAll("input, select, textarea").forEach(input => {
    input.addEventListener("invalid", () => showError(input), true);
    input.addEventListener("blur", () => { if (input.value) validateField(input); });
    input.addEventListener("input", () => clearError(input));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Honeypot: a hidden field that only bots fill. Silently "succeed".
    const hp = form.querySelector('input[name="company_url"]');
    if (hp && hp.value) { showSuccess(form, successEl); return; }

    if (!form.checkValidity()) {
      form.querySelectorAll("input, select, textarea").forEach(validateField);
      const firstBad = form.querySelector(":invalid");
      firstBad?.focus();
      firstBad?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    if (requiresSignature && !form.dataset.signed) {
      openSignatureModal(form, () => doSubmit(form, successEl));
      return;
    }
    doSubmit(form, successEl);
  });
}

function doSubmit(form, successEl) {
  // ---------------------------------------------------------------
  // TODO: form endpoint — wire to a form service (Formspree / Basin /
  // Netlify Forms) or a serverless function. A static page cannot email
  // a submission on its own. Until then we confirm receipt in the UI only.
  // Example:
  //   await fetch("https://formspree.io/f/XXXX", { method: "POST",
  //     headers: { Accept: "application/json" }, body: new FormData(form) });
  // ---------------------------------------------------------------
  console.info("[yamamoto] form submission captured (not yet delivered):",
    Object.fromEntries(new FormData(form)));
  showSuccess(form, successEl);
}

function showSuccess(form, successEl) {
  if (successEl) {
    form.style.display = "none";
    successEl.classList.add("is-visible");
    successEl.setAttribute("tabindex", "-1");
    successEl.focus();
    successEl.scrollIntoView({ block: "center", behavior: "smooth" });
  } else {
    form.reset();
  }
}

/* ----------------------------------------------------- Field validation */
function validateField(input) {
  if (input.type === "hidden" || input.disabled) return true;
  if (input.checkValidity()) { clearError(input); return true; }
  showError(input);
  return false;
}
function showError(input) {
  const field = input.closest(".field");
  if (!field) return;
  field.classList.add("has-error");
  const err = field.querySelector(".error");
  if (err) {
    err.textContent = input.validationMessage ||
      (input.validity.valueMissing ? "This field is required." : "Please check this field.");
    const id = err.id || (err.id = "err-" + Math.random().toString(36).slice(2));
    input.setAttribute("aria-describedby", id);
    input.setAttribute("aria-invalid", "true");
  }
}
function clearError(input) {
  const field = input.closest(".field");
  if (!field) return;
  field.classList.remove("has-error");
  input.removeAttribute("aria-invalid");
}

/* ----------------------------------------------------- E-signature modal */
function openSignatureModal(form, onAgree) {
  const modal = document.getElementById("sign-modal");
  if (!modal) { form.dataset.signed = "true"; onAgree(); return; }

  const lastFocus = document.activeElement;
  modal.classList.add("is-open");
  const nameInput = modal.querySelector('input[name="signature_name"]');
  const agreeBtn = modal.querySelector("[data-sign-agree]");
  const checkbox = modal.querySelector('input[name="signature_agree"]');
  nameInput?.focus();

  // Focus trap
  const focusables = modal.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])');
  const first = focusables[0], last = focusables[focusables.length - 1];
  const onKey = (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  const close = () => {
    modal.classList.remove("is-open");
    modal.removeEventListener("keydown", onKey);
    lastFocus?.focus();
  };
  modal.addEventListener("keydown", onKey);
  modal.querySelectorAll("[data-sign-close], .modal__scrim").forEach(b =>
    b.addEventListener("click", close, { once: true }));

  agreeBtn.onclick = () => {
    if (!nameInput.value.trim() || !checkbox.checked) {
      modal.querySelector("[data-sign-error]")?.classList.add("has-error");
      return;
    }
    // NOTE: This is UI + validation only. Legally-binding e-signature capture,
    // IP/device metadata, and order emails are a later backend phase.
    form.dataset.signed = "true";
    close();
    onAgree();
  };
}
