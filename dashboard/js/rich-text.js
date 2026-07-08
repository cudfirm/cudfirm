/**
 * dashboard/js/rich-text.js
 * ------------------------------------------------------------------
 * A small, dependency-free rich text control: a toolbar (Bold,
 * Italic, Underline, Bullet list, Numbered list, Link, Clear
 * formatting) driving a `contenteditable` div. No external library —
 * this project intentionally stays vanilla JS, so this is built on
 * the standard `document.execCommand` API rather than pulling in
 * something like Quill or TipTap.
 *
 * Mount it into any container:
 *   RichText.mount(containerEl, {
 *     value: '<p>Existing HTML…</p>',
 *     onChange: (html) => { ... }
 *   });
 *
 * Produces sanitized-on-read HTML (see sanitize()) — scripts, event
 * handler attributes, and iframes/objects are stripped before the
 * value is ever handed back to a caller, since this HTML is later
 * rendered on the public site.
 * ------------------------------------------------------------------
 */

const RichText = (() => {
  const TOOLBAR = [
    { cmd: "bold", icon: "bi-type-bold", label: "Bold" },
    { cmd: "italic", icon: "bi-type-italic", label: "Italic" },
    { cmd: "underline", icon: "bi-type-underline", label: "Underline" },
    { cmd: "insertUnorderedList", icon: "bi-list-ul", label: "Bullet list" },
    { cmd: "insertOrderedList", icon: "bi-list-ol", label: "Numbered list" },
    { cmd: "createLink", icon: "bi-link-45deg", label: "Insert link", needsValue: true },
    { cmd: "removeFormat", icon: "bi-eraser", label: "Clear formatting" },
  ];

  function sanitize(html) {
    const doc = document.implementation.createHTMLDocument("");
    doc.body.innerHTML = html || "";
    doc.body.querySelectorAll("script, style, iframe, object, embed, form").forEach((el) => el.remove());
    doc.body.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) el.removeAttribute(attr.name);
        if ((name === "href" || name === "src") && /^\s*(javascript|data):/i.test(attr.value)) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return doc.body.innerHTML;
  }

  function mount(container, { value, maxLength, onChange } = {}) {
    const fieldId = `rt_${Math.random().toString(36).slice(2, 8)}`;

    const toolbarHtml = TOOLBAR.map(
      (t) => `<button type="button" class="rt-btn" data-cmd="${t.cmd}" data-needs-value="${!!t.needsValue}" aria-label="${t.label}" title="${t.label}"><i class="bi ${t.icon}" aria-hidden="true"></i></button>`
    ).join("");

    container.innerHTML = `
      <div class="rich-text-field">
        <div class="rt-toolbar" role="toolbar" aria-label="Text formatting">${toolbarHtml}</div>
        <div class="rt-editor form-control" id="${fieldId}" contenteditable="true" role="textbox" aria-multiline="true"></div>
        <div class="form-hint rt-count" id="${fieldId}_count"></div>
      </div>
    `;

    const editor = container.querySelector(`#${fieldId}`);
    const countEl = container.querySelector(`#${fieldId}_count`);
    editor.innerHTML = sanitize(value || "");

    function updateCount() {
      if (!maxLength) {
        countEl.textContent = "";
        return;
      }
      const len = editor.textContent.length;
      countEl.textContent = `${len} / ${maxLength} characters`;
      countEl.classList.toggle("text-danger", len > maxLength);
    }
    updateCount();

    container.querySelectorAll(".rt-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        editor.focus();
        const cmd = btn.dataset.cmd;
        if (btn.dataset.needsValue === "true") {
          const url = window.prompt("Link URL:");
          if (!url) return;
          if (/^\s*(javascript|data):/i.test(url)) {
            DashToast.error("That link type isn't allowed.");
            return;
          }
          document.execCommand(cmd, false, url);
        } else {
          document.execCommand(cmd, false, null);
        }
        if (onChange) onChange(sanitize(editor.innerHTML));
        updateCount();
      });
    });

    editor.addEventListener("input", () => {
      updateCount();
      if (onChange) onChange(sanitize(editor.innerHTML));
    });

    // Plain-text paste only — avoids dragging in styles/markup from
    // Word, Google Docs, etc. that would otherwise bypass sanitize().
    editor.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, text);
    });

    return {
      getValue: () => sanitize(editor.innerHTML),
      setValue: (html) => {
        editor.innerHTML = sanitize(html || "");
        updateCount();
      },
    };
  }

  return { mount, sanitize };
})();
