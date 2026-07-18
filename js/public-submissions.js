/**
 * Shared public Contact and Newsletter submission bridge.
 *
 * Templates declare selectors in their manifest and never call Supabase
 * directly. PostgreSQL RLS remains the authorization boundary.
 */
(function () {
  'use strict';

  const boundForms = new WeakSet();

  function client() {
    return typeof supabaseClient !== 'undefined' ? supabaseClient : window.supabaseClient;
  }

  function value(form, selector) {
    if (!selector) return '';
    return String(form.querySelector(selector)?.value || '').trim();
  }

  function feedback(form, selector, message, successful) {
    const element = selector ? form.querySelector(selector) : null;
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('cudfirm-feedback-success', Boolean(successful));
    element.classList.toggle('cudfirm-feedback-error', !successful);
  }

  function setBusy(form, selector, busy) {
    const button = selector ? form.querySelector(selector) : null;
    if (button) button.disabled = Boolean(busy);
    form.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  function duplicateError(error) {
    return error?.code === '23505' || /duplicate|already exists/i.test(String(error?.message || ''));
  }

  async function submitMessage(payload) {
    const db = client();
    if (!db) throw new Error('Public submission service is unavailable.');

    const { error } = await db.from('messages').insert({
      name: payload.name,
      contact_info: payload.contact,
      message: payload.message,
      status: 'unread',
      is_read: false,
      is_archived: false,
      is_important: false,
      replied_at: null,
      archived_at: null,
    });
    if (error) throw error;
    return true;
  }

  async function submitSubscriber(email) {
    const db = client();
    if (!db) throw new Error('Newsletter service is unavailable.');

    const { error } = await db.from('subscribers').insert({
      email,
      status: 'active',
      is_active: true,
      source: 'footer',
      unsubscribed_at: null,
      bounced_at: null,
      archived_at: null,
    });
    if (error && !duplicateError(error)) throw error;
    return true;
  }

  function bindContact(form, definition, contract) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const fields = definition.fields || {};
      const name = value(form, fields.name);
      const contact = value(form, fields.contact);
      const subject = value(form, fields.subject);
      const body = value(form, fields.message);
      const config = contract?.contact?.form || {};

      if (name.length < 1 || name.length > 120 || contact.length < 3 || contact.length > 320 || body.length < 1 || body.length > 5000) {
        feedback(form, definition.feedbackTarget, config.errorMessage || 'Please check the form and try again.', false);
        return;
      }

      const message = subject ? `Subject: ${subject.slice(0, 200)}\n\n${body}` : body;
      setBusy(form, definition.submitButton, true);
      feedback(form, definition.feedbackTarget, config.submittingLabel || 'Sending…', true);

      try {
        await submitMessage({ name, contact, message: message.slice(0, 5000) });
        form.reset();
        feedback(form, definition.feedbackTarget, config.successMessage || 'Your enquiry has been received.', true);
        window.dispatchEvent(new CustomEvent('cudfirm:public-message-submitted'));
      } catch (error) {
        console.warn('[CUDFIRM Public Submissions] Contact submission failed.', error);
        feedback(form, definition.feedbackTarget, config.errorMessage || 'Your enquiry could not be sent.', false);
      } finally {
        setBusy(form, definition.submitButton, false);
      }
    });
  }

  function bindNewsletter(form, definition) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const email = value(form, definition.fields?.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
        feedback(form, definition.feedbackTarget, 'Enter a valid email address.', false);
        return;
      }

      setBusy(form, definition.submitButton, true);
      feedback(form, definition.feedbackTarget, 'Subscribing…', true);
      try {
        await submitSubscriber(email);
        form.reset();
        feedback(form, definition.feedbackTarget, 'Subscription confirmed.', true);
        window.dispatchEvent(new CustomEvent('cudfirm:public-subscriber-submitted'));
      } catch (error) {
        console.warn('[CUDFIRM Public Submissions] Newsletter submission failed.', error);
        feedback(form, definition.feedbackTarget, 'Unable to subscribe right now.', false);
      } finally {
        setBusy(form, definition.submitButton, false);
      }
    });
  }

  function bindManifestForms(manifest, contract) {
    Object.entries(manifest?.forms || {}).forEach(([formName, definition]) => {
      if (definition?.managedBy !== 'shared-core' || !definition.formSelector) return;
      document.querySelectorAll(definition.formSelector).forEach((form) => {
        if (boundForms.has(form)) return;
        if (formName === 'contact') bindContact(form, definition, contract);
        if (formName === 'newsletter') bindNewsletter(form, definition);
        boundForms.add(form);
        form.dataset.cudfirmSubmissionManager = 'shared-core';
      });
    });
  }

  function bindActiveTemplate() {
    const runtime = window.CUDFIRM_RUNTIME;
    if (!runtime) return;
    bindManifestForms(runtime.getManifest?.(), runtime.getData?.());
  }

  window.addEventListener('cudfirm:template-ready', bindActiveTemplate);
  window.addEventListener('cudfirm:template-failed', bindActiveTemplate);

  window.CUDFIRMPublicSubmissions = Object.freeze({
    bindManifestForms,
    bindActiveTemplate,
    submitMessage,
    submitSubscriber,
  });
})();
