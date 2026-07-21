/**
 * CUDFIRM shared public-form service.
 *
 * Purpose-specific Contact and Newsletter writes stay in the shared core.
 * Templates declare selectors and messages in their manifest; adapters do not
 * receive a generic table-insert helper and do not know database table names.
 */
(function () {
  "use strict";

  const VERSION = "1.0.0";
  const boundForms = new WeakSet();
  let lastReport = Object.freeze({ bound: [], skipped: [], errors: [] });

  const DEFAULT_MESSAGES = Object.freeze({
    contact: Object.freeze({
      submitting: "Sending…",
      success: "Thanks — your message has been sent.",
      error: "We could not send your message. Please try again.",
      invalid: "Please complete all required fields.",
    }),
    newsletter: Object.freeze({
      submitting: "Subscribing…",
      success: "You are subscribed — thank you.",
      duplicate: "You are already subscribed.",
      error: "We could not subscribe you. Please try again.",
      invalid: "Enter a valid email address.",
    }),
  });

  function api() {
    return window.CMSApi || null;
  }

  function queryWithin(form, selector) {
    if (!selector) return null;
    return form.querySelector(selector) || document.querySelector(selector);
  }

  function ensureStatusElement(form, definition) {
    const configured = queryWithin(form, definition.statusSelector);
    if (configured) return configured;

    const existing = form.querySelector("[data-cudfirm-form-status]");
    if (existing) return existing;

    const element = document.createElement("div");
    element.dataset.cudfirmFormStatus = "";
    element.className = "cudfirm-form-status";
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    form.appendChild(element);
    return element;
  }

  function setStatus(element, message, state) {
    if (!element) return;
    element.textContent = message || "";
    element.dataset.state = state || "";
  }

  function setSubmitting(button, submitting, message) {
    if (!button) return () => {};
    const originalText = button.textContent;
    button.disabled = submitting;
    button.setAttribute("aria-busy", submitting ? "true" : "false");
    if (submitting && message) button.textContent = message;

    return () => {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      button.textContent = originalText;
    };
  }

  function messagesFor(kind, definition) {
    return { ...DEFAULT_MESSAGES[kind], ...(definition.messages || {}) };
  }

  function fieldValue(form, selector) {
    return String(queryWithin(form, selector)?.value || "").trim();
  }

  async function submitContact(input) {
    if (!api()?.submitContactMessage) {
      return Object.freeze({ ok: false, duplicate: false, data: null, error: { code: "api_unavailable", message: "Contact service is unavailable." } });
    }
    return api().submitContactMessage(input);
  }

  async function subscribeNewsletter(email) {
    if (!api()?.subscribeNewsletter) {
      return Object.freeze({ ok: false, duplicate: false, data: null, error: { code: "api_unavailable", message: "Newsletter service is unavailable." } });
    }
    return api().subscribeNewsletter(email);
  }

  function bindContact(form, definition) {
    const fields = definition.fields || {};
    const status = ensureStatusElement(form, definition);
    const button = queryWithin(form, definition.submitSelector || 'button[type="submit"]');
    const messages = messagesFor("contact", definition);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const subject = fieldValue(form, fields.subject);
      const message = fieldValue(form, fields.message);
      const input = {
        name: fieldValue(form, fields.name),
        contactInfo: fieldValue(form, fields.contact || fields.contactInfo),
        message: subject ? `Subject: ${subject}\n\n${message}` : message,
      };

      if (!input.name || !input.contactInfo || !message) {
        setStatus(status, messages.invalid, "invalid");
        return;
      }

      setStatus(status, "", "submitting");
      const restoreButton = setSubmitting(button, true, messages.submitting);
      const result = await submitContact(input);
      restoreButton();

      if (result.ok) {
        setStatus(status, messages.success, "success");
        form.reset();
      } else {
        setStatus(status, messages.error, "error");
      }
    });
  }

  function bindNewsletter(form, definition) {
    const fields = definition.fields || {};
    const status = ensureStatusElement(form, definition);
    const button = queryWithin(form, definition.submitSelector || 'button[type="submit"]');
    const messages = messagesFor("newsletter", definition);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = fieldValue(form, fields.email);

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus(status, messages.invalid, "invalid");
        return;
      }

      setStatus(status, "", "submitting");
      const restoreButton = setSubmitting(button, true, messages.submitting);
      const result = await subscribeNewsletter(email);
      restoreButton();

      if (result.ok) {
        setStatus(status, result.duplicate ? messages.duplicate : messages.success, result.duplicate ? "duplicate" : "success");
        form.reset();
      } else {
        setStatus(status, messages.error, "error");
      }
    });
  }

  function bind(manifest) {
    const report = { bound: [], skipped: [], errors: [] };

    Object.entries(manifest?.forms || {}).forEach(([kind, definition]) => {
      if (definition?.managedBy !== "shared-core") {
        report.skipped.push({ kind, reason: `managed-by-${definition?.managedBy || "unknown"}` });
        return;
      }

      if (!definition.formSelector) {
        report.errors.push({ kind, reason: "missing-form-selector" });
        return;
      }

      const forms = Array.from(document.querySelectorAll(definition.formSelector));
      if (!forms.length) {
        report.errors.push({ kind, reason: "form-not-found" });
        return;
      }

      forms.forEach((form) => {
        if (boundForms.has(form)) return;

        if (kind === "contact") bindContact(form, definition);
        else if (kind === "newsletter") bindNewsletter(form, definition);
        else {
          report.skipped.push({ kind, reason: "unsupported-form-kind" });
          return;
        }

        boundForms.add(form);
        report.bound.push({ kind, selector: definition.formSelector });
      });
    });

    lastReport = Object.freeze({
      bound: Object.freeze([...report.bound]),
      skipped: Object.freeze([...report.skipped]),
      errors: Object.freeze([...report.errors]),
    });

    return lastReport;
  }

  function bindActiveTemplate() {
    const manifest = window.CUDFIRM_RUNTIME?.getManifest?.();
    if (!manifest) return null;
    return bind(manifest);
  }

  window.CUDFIRMPublicForms = Object.freeze({
    VERSION,
    bind,
    bindActiveTemplate,
    submitContact,
    subscribeNewsletter,
    getReport: () => lastReport,
  });

  window.addEventListener("cudfirm:template-ready", bindActiveTemplate);

  if (document.readyState !== "loading") {
    Promise.resolve().then(bindActiveTemplate);
  }
})();
