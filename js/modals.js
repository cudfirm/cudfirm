/**
 * ================================================
 *  CUDFIRM — MODAL SYSTEM v2
 *  Custom Modal · Disclaimer · Lightbox · Toast
 *
 *  Drop-in replacement — keeps ALL original IDs
 *  and public function names so script4.js needs
 *  zero changes.
 *
 *  Load this AFTER script4.js (defer, last script)
 *  so our definitions override the originals.
 * ================================================
 */

;(function (win, doc) {
  'use strict';

  /* ──────────────────────────────────────────────
     UTILITIES
  ────────────────────────────────────────────── */
  function $id(id) { return doc.getElementById(id); }

  // Body-scroll lock reference counter
  // (multiple modals can be open simultaneously)
  var _scrollDepth = 0;

  function lockBodyScroll() {
    if (++_scrollDepth === 1) {
      doc.body.style.overflow = 'hidden';
    }
  }

  function unlockBodyScroll() {
    _scrollDepth = Math.max(0, _scrollDepth - 1);
    if (_scrollDepth === 0) {
      doc.body.style.overflow = '';
    }
  }

  /**
   * Show an overlay element.
   * Adds .cud-open, sets aria-hidden=false, locks scroll.
   */
  function openOverlay(el) {
    if (!el || el.classList.contains('cud-open')) return;
    el.classList.add('cud-open');
    el.setAttribute('aria-hidden', 'false');
    lockBodyScroll();
    // Move focus to first interactive element inside
    var focusable = el.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      setTimeout(function () { focusable.focus({ preventScroll: true }); }, 40);
    }
  }

  /**
   * Hide an overlay element.
   */
  function closeOverlay(el) {
    if (!el || !el.classList.contains('cud-open')) return;
    el.classList.remove('cud-open');
    el.setAttribute('aria-hidden', 'true');
    unlockBodyScroll();
  }

  /**
   * Focus trap: keep Tab/Shift-Tab inside an overlay.
   */
  function trapFocus(wrap, e) {
    var sel = 'a[href]:not([disabled]), button:not([disabled]), input:not([disabled]), ' +
              'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var all = Array.from(wrap.querySelectorAll(sel));
    if (all.length < 2) return;
    var first = all[0];
    var last  = all[all.length - 1];
    if (e.shiftKey && doc.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && doc.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }


  /* ──────────────────────────────────────────────
     CUSTOM MODAL  (#modal)
     Called from keyboard shortcut, contact form, etc.
  ────────────────────────────────────────────── */

  /**
   * openModal(title, htmlContent)
   * Replaces the GSAP-dependent original.
   */
  function openModal(title, content) {
    var wrap    = $id('modal');
    var titleEl = $id('modalTitle');
    var bodyEl  = $id('modalBody');
    if (!wrap) return;
    if (titleEl) titleEl.textContent = title   || 'Notice';
    if (bodyEl)  bodyEl.innerHTML    = content || '';
    openOverlay(wrap);
  }

  function closeModal() {
    closeOverlay($id('modal'));
  }


  /* ──────────────────────────────────────────────
     DISCLAIMER MODAL  (#disclaimer-modal)
     Bootstrap's Modal.show() is wired by script4.js;
     we also wire our own delegated handler so the
     button works even if Bootstrap init failed.
  ────────────────────────────────────────────── */

  /**
   * Show the disclaimer.
   * Works whether the element is a Bootstrap modal
   * (adds .show) or our custom overlay (adds .cud-open).
   */
  function openDisclaimer() {
    var el = $id('disclaimer-modal');
    if (!el) return;
    // Our custom overlay path
    if (el.classList.contains('cud-overlay')) {
      openOverlay(el);
      return;
    }
    // Bootstrap path — trigger Bootstrap's show() if available
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      try {
        var inst = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
        inst.show();
        return;
      } catch (err) { /* fall through */ }
    }
    // Fallback: toggle manually
    el.classList.add('show');
    el.style.display = 'block';
    el.setAttribute('aria-hidden', 'false');
  }

  function closeDisclaimer() {
    var el = $id('disclaimer-modal');
    if (!el) return;
    if (el.classList.contains('cud-overlay')) {
      closeOverlay(el);
      return;
    }
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      try {
        var inst = bootstrap.Modal.getInstance(el);
        if (inst) { inst.hide(); return; }
      } catch (err) { /* fall through */ }
    }
    el.classList.remove('show');
    el.style.display = '';
    el.setAttribute('aria-hidden', 'true');
  }


  /* ──────────────────────────────────────────────
     LIGHTBOX  (#imageLightbox)
  ────────────────────────────────────────────── */

  function openLightbox(src, caption, link) {
    var wrap     = $id('imageLightbox');
    var img      = $id('lightboxImg');
    var cap      = $id('lightboxCaption');
    var enterBtn = $id('lightboxEnterBtn');
    if (!wrap) return;

    // Set image — clear first to kill lingering load events
    if (img) {
      img.src = '';
      img.alt = caption || 'Preview';
      img.src = src     || '';
    }
    if (cap) cap.textContent = caption || '';

    // Enter / visit button
    var hasLink = link && link.trim() !== '' && link.trim() !== '#';
    if (enterBtn) {
      if (hasLink) {
        enterBtn.href   = link;
        var isExternal  = /^https?:\/\//i.test(link);
        enterBtn.target = isExternal ? '_blank' : '_self';
        enterBtn.rel    = isExternal ? 'noopener noreferrer' : '';
        enterBtn.style.display = '';
      } else {
        enterBtn.href          = '#';
        enterBtn.style.display = 'none';
      }
    }

    openOverlay(wrap);
  }

  function closeLightbox() {
    var wrap = $id('imageLightbox');
    closeOverlay(wrap);
    // Clear image src after hide to cancel pending loads
    setTimeout(function () {
      var img = $id('lightboxImg');
      if (img && wrap && !wrap.classList.contains('cud-open')) {
        img.src = '';
      }
    }, 120);
  }

  // Kept for any inline onclick="closeLightboxOutside(event)" in HTML
  function closeLightboxOutside(e) {
    var t = e.target;
    if (
      t.id === 'imageLightbox'  ||   // direct overlay click (old HTML)
      t.classList.contains('cud-lb-bg') // new backdrop element
    ) {
      closeLightbox();
    }
  }


  /* ──────────────────────────────────────────────
     TOAST  (#toastNotification)
     Keeps original .show / remove pattern so
     script4.js's own showToast also keeps working.
  ────────────────────────────────────────────── */

  var _toastTimer = null;

  function showToast(message, duration) {
    var toast = $id('toastNotification');
    var msg   = $id('toastMessage');
    if (!toast || !msg) return;
    clearTimeout(_toastTimer);
    msg.textContent = message || '';
    toast.classList.add('show');
    _toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, duration || 2500);
  }


  /* ──────────────────────────────────────────────
     EVENT WIRING
  ────────────────────────────────────────────── */

  function initModalSystem() {

    /* ─ Custom modal (#modal) ─────────────────── */
    var modal    = $id('modal');
    var modalXBtn = modal && modal.querySelector('.cud-x, .modal-close');

    if (modal) {
      // Close on X button
      if (modalXBtn) {
        modalXBtn.addEventListener('click', closeModal);
      }
      // Close on overlay background click
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
      // Keyboard: Escape closes, Tab is trapped
      modal.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
        if (e.key === 'Tab')    trapFocus(modal, e);
      });
    }

    /* ─ Disclaimer (#disclaimer-modal) ──────── */
    //
    // Bootstrap already wires the toggle button in script4.js.
    // We add a DELEGATED listener as a safety net (fires if
    // Bootstrap init failed or element was re-rendered).
    //
    doc.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('#disclaimer-toggle-btn')) {
        e.preventDefault();
        openDisclaimer();
      }
    });

    // Wire our own modal events only if it's a cud-overlay element
    var disc = $id('disclaimer-modal');
    if (disc && disc.classList.contains('cud-overlay')) {
      var discX  = disc.querySelector('.cud-x, .modal-close, .btn-close');
      var discOk = disc.querySelector('.cud-btn-secondary, #cud-disc-ok');
      if (discX)  discX.addEventListener('click', closeDisclaimer);
      if (discOk) discOk.addEventListener('click', closeDisclaimer);
      disc.addEventListener('click', function (e) {
        if (e.target === disc) closeDisclaimer();
      });
      disc.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); closeDisclaimer(); }
        if (e.key === 'Tab')    trapFocus(disc, e);
      });
    }

    /* ─ Lightbox (#imageLightbox) ──────────── */
    var lb     = $id('imageLightbox');
    var lbBg   = lb  && lb.querySelector('.cud-lb-bg');
    var lbX    = lb  && lb.querySelector('.cud-lb-x');
    var lbClose = lb && lb.querySelector('#cud-lb-close, .btn-close-capsule');

    if (lb) {
      if (lbX)     lbX.addEventListener('click', closeLightbox);
      if (lbClose) lbClose.addEventListener('click', closeLightbox);
      if (lbBg)    lbBg.addEventListener('click', closeLightbox);

      lb.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
        if (e.key === 'Tab')    trapFocus(lb, e);
      });

      // Touch: swipe down to close
      var _touchStartY = 0;
      lb.addEventListener('touchstart', function (e) {
        _touchStartY = e.touches[0].clientY;
      }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        var deltaY = e.changedTouches[0].clientY - _touchStartY;
        if (deltaY > 70) closeLightbox();   // swipe down > 70px
      }, { passive: true });
    }

    /* ─ Grid-item lightbox (delegated) ────────
       script4.js already adds a delegated listener
       that calls openLightbox(). Since we've overridden
       openLightbox(), no duplicate wiring needed here.
    ────────────────────────────────────────── */

  } // end initModalSystem()


  /* ──────────────────────────────────────────────
     EXPOSE GLOBALS
     These assignments happen when the script loads
     (after script4.js, before DOMContentLoaded fires)
     so they WIN over script4.js's definitions.
  ────────────────────────────────────────────── */
  win.openModal            = openModal;
  win.closeModal           = closeModal;
  win.openDisclaimer       = openDisclaimer;
  win.closeDisclaimer      = closeDisclaimer;
  win.openLightbox         = openLightbox;
  win.closeLightbox        = closeLightbox;
  win.closeLightboxOutside = closeLightboxOutside;
  win.showToast            = showToast;


  /* ──────────────────────────────────────────────
     BOOT — wait for DOM if not yet ready
  ────────────────────────────────────────────── */
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', initModalSystem);
  } else {
    initModalSystem();
  }

}(window, document));
